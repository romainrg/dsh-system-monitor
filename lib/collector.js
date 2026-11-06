/**
 * Metrics collector for the dsh-system-monitor bundle.
 *
 * Pure Node, no dependencies. Every external command is optional: a missing
 * binary, a refused permission, or a timeout degrades one section of the
 * snapshot and never the whole read.
 *
 * The monitor keeps two caches so the HTTP route can answer instantly:
 *  - `system` is refreshed on the fast tick (CPU deltas, memory, disk, net).
 *  - `infra`  is refreshed on the slow tick (docker, colima, kubernetes,
 *    devspace), because those commands cost hundreds of milliseconds to
 *    seconds and must never block a render.
 */

import { execFile } from 'node:child_process';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createJiraReader } from './jira.js';
import { collectWorkspace } from './workspace.js';
import { collectNews, fetchImage } from './feed.js';
import { createTodoStore } from './todos.js';

/* ------------------------------------------------------------------ utils */

/** Extra directories a GUI-launched process usually lacks. */
const DEFAULT_PATH_DIRS = [
  '/opt/homebrew/bin',
  '/opt/homebrew/sbin',
  '/usr/local/bin',
  '/opt/local/bin',
  '/usr/bin',
  '/bin',
  '/usr/sbin',
  '/sbin',
];

/** Enriched PATH so docker/kubectl/devspace resolve from a Finder launch. */
function enrichedPath(extra = []) {
  const seen = new Set();
  const dirs = [];
  for (const dir of [...extra, ...(process.env.PATH ?? '').split(':'), ...DEFAULT_PATH_DIRS]) {
    if (!dir || seen.has(dir)) continue;
    seen.add(dir);
    dirs.push(dir);
  }
  return dirs.join(':');
}

const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;
const stripAnsi = (text) => text.replace(ANSI, '');

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

const round = (value, digits = 1) => {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/** "3 days, 7:34" style uptime, localized in the browser not here. */
function readNumber(text) {
  const match = /-?\d+(?:\.\d+)?/.exec(text ?? '');
  return match ? Number(match[0]) : null;
}

/* --------------------------------------------------------------- commands */

/**
 * Run a command without a shell, bounded by a deadline.
 * Always resolves; failures are reported in the result instead of thrown.
 */
function run(command, args = [], { timeoutMs = 8000, env, maxBuffer = 12 * 1024 * 1024 } = {}) {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const settle = (result) => resolve({ ms: Date.now() - startedAt, ...result });
    try {
      execFile(
        command,
        args,
        {
          timeout: timeoutMs,
          maxBuffer,
          windowsHide: true,
          env: env ?? { ...process.env, PATH: enrichedPath() },
        },
        (error, stdout, stderr) => {
          if (error) {
            settle({
              ok: false,
              code: typeof error.code === 'number' ? error.code : null,
              killed: Boolean(error.killed),
              message: error.message,
              stdout: String(stdout ?? ''),
              stderr: String(stderr ?? ''),
            });
            return;
          }
          settle({ ok: true, stdout: String(stdout ?? ''), stderr: String(stderr ?? ''), code: 0 });
        },
      );
    } catch (error) {
      // A refused or impossible spawn throws synchronously on some sandboxes.
      settle({ ok: false, code: null, killed: false, message: error?.message ?? 'spawn failed', stdout: '', stderr: '' });
    }
  });
}

/** Await one probe, turning any fault into `fallback` so a tick always completes. */
async function attempt(probe, fallback = null) {
  try {
    return await probe;
  } catch {
    return fallback;
  }
}

/** Resolve the absolute path of a binary once, through `process.env.PATH`. */
async function which(command, env) {
  const result = await run('/usr/bin/env', ['sh', '-c', `command -v ${JSON.stringify(command)}`], {
    timeoutMs: 4000,
    env,
  });
  const first = result.ok ? result.stdout.trim().split('\n')[0] : '';
  return first || null;
}

/* ------------------------------------------------------------- CPU / host */

/** Snapshot of every logical CPU's cumulative busy/idle counters. */
function readCpuTimes() {
  const cpus = os.cpus();
  const perCore = [];
  let total = 0;
  let idle = 0;
  for (const cpu of cpus) {
    const times = cpu.times;
    const coreTotal = times.user + times.nice + times.sys + times.irq + times.idle;
    const coreIdle = times.idle;
    total += coreTotal;
    idle += coreIdle;
    perCore.push({ total: coreTotal, idle: coreIdle });
  }
  return { total, idle, perCore };
}

/** Percentage busy between two counter snapshots, per core and overall. */
function diffCpu(previous, next) {
  if (!previous || previous.perCore.length !== next.perCore.length) return null;
  const perCore = next.perCore.map((core, index) => {
    const before = previous.perCore[index];
    const totalDelta = core.total - before.total;
    const idleDelta = core.idle - before.idle;
    if (totalDelta <= 0) return 0;
    return clamp(round(((totalDelta - idleDelta) / totalDelta) * 100, 1), 0, 100);
  });
  const totalDelta = next.total - previous.total;
  const idleDelta = next.idle - previous.idle;
  const usage = totalDelta > 0 ? clamp(round(((totalDelta - idleDelta) / totalDelta) * 100, 1), 0, 100) : 0;
  return { usage, perCore };
}

/** Static facts about this machine, read once per monitor life. */
async function readHostMeta() {
  const cpus = os.cpus();
  const meta = {
    hostname: os.hostname().replace(/\.local$/, ''),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    chip: cpus[0]?.model?.trim() ?? 'Unknown',
    cores: cpus.length,
    memoryTotal: os.totalmem(),
    uptime: os.uptime(),
    nodeVersion: process.version,
  };

  if (meta.platform === 'darwin') {
    const [model, name] = await Promise.all([
      run('/usr/sbin/sysctl', ['-n', 'hw.model'], { timeoutMs: 3000 }),
      run('/usr/sbin/scutil', ['--get', 'ComputerName'], { timeoutMs: 3000 }),
    ]);
    if (model.ok) meta.model = model.stdout.trim();
    if (name.ok && name.stdout.trim()) meta.computerName = name.stdout.trim();
    const product = await run('/usr/bin/sw_vers', ['-productVersion'], { timeoutMs: 3000 });
    if (product.ok) meta.osVersion = `macOS ${product.stdout.trim()}`;
  }
  if (!meta.osVersion) meta.osVersion = `${meta.platform} ${meta.release}`;
  return meta;
}

/**
 * Core counts are not equal to performance cores on Apple silicon, but
 * `hw.perflevel0.logicalcpu` reports them when available; keep it optional.
 */
async function readCoreSplit() {
  if (os.platform() !== 'darwin') return null;
  const [perf, eff] = await Promise.all([
    run('/usr/sbin/sysctl', ['-n', 'hw.perflevel0.logicalcpu'], { timeoutMs: 2000 }),
    run('/usr/sbin/sysctl', ['-n', 'hw.perflevel1.logicalcpu'], { timeoutMs: 2000 }),
  ]);
  const performance = perf.ok ? readNumber(perf.stdout) : null;
  const efficiency = eff.ok ? readNumber(eff.stdout) : null;
  if (performance === null && efficiency === null) return null;
  return { performance, efficiency };
}

/* ---------------------------------------------------------------- memory */

/** macOS memory through `vm_stat`, matching Activity Monitor's buckets. */
async function readMemoryDarwin(total) {
  const result = await run('vm_stat', [], { timeoutMs: 4000 });
  if (!result.ok) return null;
  const text = result.stdout;
  const pageSize = readNumber(/page size of (\d+) bytes/.exec(text)?.[1] ?? '4096') ?? 4096;
  const pages = (label) => {
    const match = new RegExp(`${label}:\\s+(\\d+)`).exec(text);
    return match ? Number(match[1]) : 0;
  };
  const wired = pages('Pages wired down') * pageSize;
  const compressed = pages('Pages occupied by compressor') * pageSize;
  const active = pages('Pages active') * pageSize;
  const inactive = pages('Pages inactive') * pageSize;
  const available = (pages('Pages free') + pages('Pages speculative')) * pageSize;

  const used = clamp(wired + compressed + active, 0, total);
  const cached = clamp(inactive, 0, Math.max(0, total - used));
  return {
    total,
    used,
    free: Math.max(0, total - used - cached),
    app: active,
    wired,
    compressed,
    cached,
    freePages: available,
    percent: total > 0 ? clamp(round((used / total) * 100, 1), 0, 100) : 0,
  };
}

/** Linux memory through `free -b`. */
async function readMemoryLinux(total) {
  const result = await run('free', ['-b'], { timeoutMs: 4000 });
  if (!result.ok) return null;
  const line = result.stdout.split('\n').find((row) => row.trim().startsWith('Mem:'));
  if (!line) return null;
  const parts = line.trim().split(/\s+/);
  const used = Number(parts[2] ?? 0);
  const cached = Number(parts[5] ?? 0);
  return {
    total,
    used,
    free: Number(parts[3] ?? 0),
    app: Math.max(0, used - cached),
    wired: 0,
    compressed: 0,
    cached,
    freePages: Number(parts[3] ?? 0),
    percent: total > 0 ? clamp(round((used / total) * 100, 1), 0, 100) : 0,
  };
}

/** Swap usage from `sysctl vm.swapusage` or `free`. */
async function readSwap() {
  if (os.platform() === 'darwin') {
    const result = await run('/usr/sbin/sysctl', ['vm.swapusage'], { timeoutMs: 3000 });
    if (!result.ok) return null;
    const toBytes = (label) => {
      const match = new RegExp(`${label} = ([\\d.]+)M`).exec(result.stdout);
      return match ? Number(match[1]) * 1024 * 1024 : null;
    };
    const total = toBytes('total');
    const used = toBytes('used');
    if (total === null || used === null) return null;
    return { total, used, percent: total > 0 ? clamp(round((used / total) * 100, 1), 0, 100) : 0 };
  }
  const result = await run('free', ['-b'], { timeoutMs: 3000 });
  if (!result.ok) return null;
  const line = result.stdout.split('\n').find((row) => row.trim().startsWith('Swap:'));
  if (!line) return null;
  const parts = line.trim().split(/\s+/);
  const total = Number(parts[1] ?? 0);
  const used = Number(parts[2] ?? 0);
  if (!total) return null;
  return { total, used, percent: clamp(round((used / total) * 100, 1), 0, 100) };
}

/* ------------------------------------------------------------------ disk */

/** Parse `df -k` into mounted volumes, skipping synthetic filesystems. */
function parseDf(output) {
  const lines = output.split('\n').slice(1);
  const volumes = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 6) continue;
    const [filesystem, blocks, used, available, capacity] = parts;
    // `Mounted on` is last and may itself contain spaces.
    const mount = parts[parts.length - 1];
    if (!/^\/dev\//.test(filesystem)) continue;
    if (mount.startsWith('/System/Volumes/') && mount !== '/System/Volumes/Data') continue;
    const total = Number(blocks) * 1024;
    const usedBytes = Number(used) * 1024;
    if (!Number.isFinite(total) || total <= 0) continue;
    volumes.push({
      filesystem,
      mount,
      total,
      used: usedBytes,
      available: Number(available) * 1024,
      percent: clamp(readNumber(capacity) ?? 0, 0, 100),
    });
  }
  return volumes;
}

async function readDisk() {
  const result = await run('df', ['-k'], { timeoutMs: 5000 });
  if (!result.ok) return null;
  const volumes = parseDf(result.stdout);
  const primary =
    volumes.find((volume) => volume.mount === '/System/Volumes/Data') ??
    volumes.find((volume) => volume.mount === '/') ??
    volumes[0] ??
    null;
  if (!primary) return null;
  const interesting = volumes.filter(
    (volume) =>
      volume.used > 0 &&
      (volume.mount === '/' ||
        volume.mount === '/System/Volumes/Data' ||
        /^\/(Volumes|private|Users)\b/.test(volume.mount)),
  );
  const seen = new Set();
  const mounts = interesting.filter((volume) => {
    if (seen.has(volume.total + volume.used)) return false;
    seen.add(volume.total + volume.used);
    return true;
  });
  return {
    total: primary.total,
    used: primary.used,
    available: primary.available,
    percent: primary.percent,
    mount: primary.mount,
    mounts: mounts.slice(0, 6),
  };
}

/* --------------------------------------------------------------- network */

/** Interface names worth counting; link-local and tunnel devices are noise. */
const IGNORED_INTERFACE = /^(lo\d*|gif\d*|stf\d*|anpi\d*|llw\d*|awdl\d*|utun\d*|ap\d*|XHC\d*|bridge\d*)$/;

/** `netstat` marks an interface with no link address using a trailing `*`. */
const normalizeInterface = (name) => name.replace(/\*$/, '');

const MAC_ADDRESS = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i;

/**
 * Parse macOS `netstat -ib` link rows into cumulative byte counters.
 * A row is `<name> <mtu> <Link#n> [mac] <ipkts> <ierrs> <ibytes> <opkts>
 * <oerrs> <obytes> <colls>`; the MAC column is present only when the
 * interface has a link address, so it is detected and skipped instead of
 * being counted on.
 */
function parseNetstatLink(output) {
  const interfaces = new Map();
  for (const line of output.split('\n')) {
    const tokens = line.trim().split(/\s+/);
    const linkIndex = tokens.findIndex((token) => /^<Link#\d+>$/.test(token));
    if (linkIndex < 0) continue;
    const name = normalizeInterface(tokens[0]);
    if (IGNORED_INTERFACE.test(name)) continue;
    const counters = tokens.slice(linkIndex + 1);
    if (counters.length > 0 && MAC_ADDRESS.test(counters[0])) counters.shift();
    const rx = Number(counters[2]);
    const tx = Number(counters[5]);
    if (!Number.isFinite(rx) || !Number.isFinite(tx)) continue;
    if (rx === 0 && tx === 0) continue;
    const existing = interfaces.get(name);
    if (existing) {
      existing.rx = Math.max(existing.rx, rx);
      existing.tx = Math.max(existing.tx, tx);
    } else {
      interfaces.set(name, { name, rx, tx });
    }
  }
  return [...interfaces.values()];
}

/** Parse `/proc/net/dev` on Linux. */
function parseProcNetDev(text) {
  const interfaces = [];
  for (const line of text.split('\n')) {
    const match = /^\s*([\w.-]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    const name = normalizeInterface(match[1]);
    if (IGNORED_INTERFACE.test(name)) continue;
    const fields = match[2].trim().split(/\s+/).map(Number);
    interfaces.push({ name, rx: fields[0] ?? 0, tx: fields[8] ?? 0 });
  }
  return interfaces;
}

async function readNetCounters() {
  if (os.platform() === 'darwin') {
    const result = await run('netstat', ['-ibn'], { timeoutMs: 5000 });
    return result.ok ? parseNetstatLink(result.stdout) : null;
  }
  try {
    const text = await fs.readFile('/proc/net/dev', 'utf8');
    return parseProcNetDev(text);
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------- battery */

async function readBattery() {
  if (os.platform() !== 'darwin') return null;
  const result = await run('pmset', ['-g', 'batt'], { timeoutMs: 3000 });
  if (!result.ok) return null;
  const text = result.stdout;
  const percentMatch = /(\d+)%/.exec(text);
  if (!percentMatch) return null;
  const state = /; (charging|finishing charge|discharging|charged|AC attached)/i.exec(text)?.[1] ?? null;
  const remaining = /(\d+:\d+) remaining/.exec(text)?.[1] ?? null;
  return {
    percent: Number(percentMatch[1]),
    state: state ? state.toLowerCase() : null,
    charging: /AC Power/.test(text) && !/discharging/i.test(text),
    remaining,
  };
}

/* ------------------------------------------------------------- processes */

/**
 * Top processes by CPU. Needs `/bin/ps`, which a sandboxed shell may refuse;
 * the plugin runs unsandboxed, and a refusal simply yields an empty list.
 */
async function readProcesses(limit = 8) {
  const format = 'pcpu,pmem,rss,etime,pid,comm';
  let result = await run('ps', ['-Ao', format, '-r'], { timeoutMs: 5000 });
  if (!result.ok) result = await run('ps', ['-Ao', format], { timeoutMs: 5000 });
  if (!result.ok) return null;
  const rows = [];
  for (const line of result.stdout.split('\n')) {
    const match = /^\s*([\d.]+)\s+([\d.]+)\s+(\d+)\s+(\S+)\s+(\d+)\s+(.+)$/.exec(line);
    if (!match) continue;
    const cpu = Number(match[1]);
    const mem = Number(match[2]);
    const rss = Number(match[3]) * 1024;
    const elapsed = match[4];
    const pid = Number(match[5]);
    let command = match[6].trim();
    // `/Applications/Foo.app/Contents/MacOS/Foo` reads better as `Foo`.
    const base = command.split('/').pop() ?? command;
    command = base.replace(/\.app$/, '') || command;
    if (!command || cpu <= 0) continue;
    rows.push({ name: command.slice(0, 42), cpu: round(cpu, 1), mem: round(mem, 1), rss, pid, elapsed });
    if (rows.length >= limit * 3) break;
  }
  return rows.slice(0, limit);
}

/* ---------------------------------------------------------------- docker */

/**
 * "287MB", "653.5MiB" or "1.2GB" → bytes.
 * Docker reports IEC-style units (`MiB`), which a decimal-only table misses.
 */
const DOCKER_UNITS = {
  b: 1,
  kb: 1e3,
  mb: 1e6,
  gb: 1e9,
  tb: 1e12,
  kib: 1024,
  mib: 1024 ** 2,
  gib: 1024 ** 3,
  tib: 1024 ** 4,
};

function parseDockerSize(text) {
  const match = /([\d.]+)\s*([kmgt]?i?b)/i.exec(text ?? '');
  if (!match) return null;
  const factor = DOCKER_UNITS[match[2].toLowerCase()];
  if (factor === undefined) return null;
  return Math.round(Number(match[1]) * factor);
}

/** "12.5%" → 12.5 */
const parsePercent = (text) => {
  const match = /([\d.]+)%/.exec(text ?? '');
  return match ? Number(match[1]) : null;
};

function parseJsonLines(stdout) {
  const rows = [];
  for (const line of stdout.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;
    try {
      rows.push(JSON.parse(trimmed));
    } catch {
      /* a torn line is not worth failing the section */
    }
  }
  return rows;
}

async function collectDocker(binaries) {
  const docker = binaries.docker;
  if (!docker) return { available: false, reason: 'docker-not-found' };

  const [info, ps, stats, version, images, volumes, networks, compose] = await Promise.all([
    run(docker, ['info', '--format', '{{json .}}'], { timeoutMs: 8000 }),
    run(docker, ['ps', '-a', '--format', '{{json .}}'], { timeoutMs: 8000 }),
    run(docker, ['stats', '--no-stream', '--format', '{{json .}}'], { timeoutMs: 12000 }),
    run(docker, ['version', '--format', '{{json .Client.Version}}'], { timeoutMs: 5000 }),
    run(docker, ['image', 'ls', '--format', '{{json .}}'], { timeoutMs: 8000 }),
    run(docker, ['volume', 'ls', '--format', '{{json .}}'], { timeoutMs: 8000 }),
    run(docker, ['network', 'ls', '--format', '{{json .}}'], { timeoutMs: 8000 }),
    run(docker, ['compose', 'ls', '--format', 'json'], { timeoutMs: 8000 }),
  ]);

  if (!info.ok) {
    return {
      available: false,
      reason: 'daemon-unreachable',
      error: info.stderr.trim() || info.message,
    };
  }

  let infoJson = {};
  try {
    infoJson = JSON.parse(info.stdout);
  } catch {
    /* keep an empty object: the rest of the section still counts containers */
  }

  const statsByName = new Map();
  for (const row of stats.ok ? parseJsonLines(stats.stdout) : []) {
    if (typeof row.Name !== 'string') continue;
    statsByName.set(row.Name, row);
  }

  const containers = (ps.ok ? parseJsonLines(ps.stdout) : []).map((row) => {
    const stat = statsByName.get(row.Names);
    const [memUsed, memLimit] = String(stat?.MemUsage ?? '').split('/').map((part) => part.trim());
    return {
      id: String(row.ID ?? '').slice(0, 12),
      name: String(row.Names ?? 'unknown'),
      image: String(row.Image ?? ''),
      state: String(row.State ?? 'unknown').toLowerCase(),
      status: String(row.Status ?? ''),
      health: String(row.HealthStatus ?? 'none'),
      ports: String(row.Ports ?? ''),
      createdAt: String(row.CreatedAt ?? ''),
      cpu: stat ? clamp(parsePercent(stat.CPUPerc) ?? 0, 0, 100000) : null,
      memPercent: stat ? parsePercent(stat.MemPerc) ?? null : null,
      memUsed: memUsed ? parseDockerSize(memUsed) : null,
      memLimit: memLimit ? parseDockerSize(memLimit) : null,
      netIO: stat?.NetIO ?? null,
      blockIO: stat?.BlockIO ?? null,
      pids: stat ? Number(stat.PIDs) || 0 : null,
    };
  });

  const running = containers.filter((container) => container.state === 'running');
  const summary = {
    total: Number(infoJson.Containers ?? containers.length),
    running: Number(infoJson.ContainersRunning ?? running.length),
    paused: Number(infoJson.ContainersPaused ?? 0),
    stopped: Number(infoJson.ContainersStopped ?? 0),
    images: Number(infoJson.Images ?? 0),
    serverVersion: String(infoJson.ServerVersion ?? ''),
    driver: String(infoJson.Driver ?? ''),
    os: String(infoJson.OperatingSystem ?? ''),
    architecture: String(infoJson.Architecture ?? ''),
    cpus: Number(infoJson.NCPU ?? 0),
    memoryTotal: Number(infoJson.MemTotal ?? 0),
  };

  const byCpu = [...running]
    .filter((container) => typeof container.cpu === 'number')
    .sort((left, right) => right.cpu - left.cpu)
    .slice(0, 8);

  summary.cpuTotal = round(running.reduce((sum, container) => sum + (container.cpu ?? 0), 0), 1);
  summary.memUsed = running.reduce((sum, container) => sum + (container.memUsed ?? 0), 0);
  summary.healthIssues = running.filter((container) => container.health === 'unhealthy').length;

  /** `docker compose ls --format json` is an array of projects. */
  const composeProjects = (() => {
    if (!compose.ok) return [];
    try {
      const value = JSON.parse(compose.stdout.trim() || '[]');
      return (Array.isArray(value) ? value : []).slice(0, 20).map((entry) => ({
        name: String(entry.Name ?? entry.name ?? ''),
        status: String(entry.Status ?? entry.status ?? ''),
        config: String(entry.ConfigFiles ?? entry.configFiles ?? ''),
      }));
    } catch {
      return [];
    }
  })();

  return {
    available: true,
    clientVersion: version.ok ? version.stdout.trim().replace(/"/g, '') : null,
    images: (images.ok ? parseJsonLines(images.stdout) : []).slice(0, 40).map((row) => ({
      repository: String(row.Repository ?? ''),
      tag: String(row.Tag ?? ''),
      id: String(row.ID ?? '').slice(0, 12),
      size: String(row.Size ?? ''),
      created: String(row.CreatedSince ?? ''),
    })),
    volumes: (volumes.ok ? parseJsonLines(volumes.stdout) : []).slice(0, 40).map((row) => ({
      name: String(row.Name ?? ''),
      driver: String(row.Driver ?? ''),
      mountpoint: String(row.Mountpoint ?? ''),
    })),
    networks: (networks.ok ? parseJsonLines(networks.stdout) : []).slice(0, 30).map((row) => ({
      name: String(row.Name ?? ''),
      driver: String(row.Driver ?? ''),
      scope: String(row.Scope ?? ''),
    })),
    compose: composeProjects,
    summary,
    containers: [...running, ...containers.filter((container) => container.state !== 'running')].slice(0, 40),
    top: byCpu.length > 0 ? byCpu : running.slice(0, 8),
    imagesListed: 0,
  };
}

/* ---------------------------------------------------------------- colima */

function parseColimaList(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return [];
  const decode = (value) => {
    const raw = JSON.parse(value);
    return Array.isArray(raw) ? raw : [raw];
  };
  try {
    return decode(trimmed);
  } catch {
    // Some versions print one JSON object per line.
    const rows = [];
    for (const line of trimmed.split('\n')) {
      try {
        rows.push(JSON.parse(line));
      } catch {
        /* ignore */
      }
    }
    return rows;
  }
}

async function collectColima(binaries) {
  const colima = binaries.colima;
  if (!colima) return { available: false, reason: 'colima-not-found' };

  const [list, status, version] = await Promise.all([
    run(colima, ['list', '--json'], { timeoutMs: 8000 }),
    // `status` fails while the VM is stopped, which is information, not an error.
    run(colima, ['status', '--json'], { timeoutMs: 8000 }),
    run(colima, ['version'], { timeoutMs: 5000 }),
  ]);

  if (!list.ok) {
    return { available: false, reason: 'unreachable', error: list.stderr.trim() || list.message };
  }

  const profiles = parseColimaList(list.stdout).map((row) => ({
    name: String(row.name ?? 'default'),
    status: String(row.status ?? 'unknown').toLowerCase(),
    arch: String(row.arch ?? ''),
    cpus: Number(row.cpus ?? 0),
    memory: Number(row.memory ?? 0),
    disk: Number(row.disk ?? 0),
    runtime: String(row.runtime ?? ''),
  }));

  const versionText = version.ok
    ? (/colima version (\S+)/.exec(version.stdout)?.[1] ?? stripAnsi(version.stdout).split('\n')[0].trim())
    : null;

  /** `colima status --json` adds the driver, mount type and socket paths. */
  const detail = (() => {
    if (!status.ok) return null;
    try {
      const raw = JSON.parse(status.stdout.trim());
      return {
        driver: String(raw.driver ?? ''),
        mountType: String(raw.mount_type ?? ''),
        dockerSocket: String(raw.docker_socket ?? ''),
        containerdSocket: String(raw.containerd_socket ?? ''),
        kubernetes: Boolean(raw.kubernetes),
        cpu: Number(raw.cpu ?? 0),
        memory: Number(raw.memory ?? 0),
        disk: Number(raw.disk ?? 0),
      };
    } catch {
      return null;
    }
  })();

  const running = profiles.find((profile) => profile.status === 'running') ?? null;
  return {
    available: true,
    version: versionText,
    running: running !== null,
    profile: running?.name ?? profiles[0]?.name ?? null,
    profiles,
    detail,
    socket: detail?.dockerSocket ?? (running ? path.join(os.homedir(), '.colima', running.name, 'docker.sock') : null),
  };
}

/* ------------------------------------------------------------ kubernetes */

/** Ready/Labels for one node's `status.conditions`. */
function nodeReady(node) {
  const conditions = node?.status?.conditions ?? [];
  const ready = conditions.find((condition) => condition.type === 'Ready');
  const pressure =
    conditions.find((condition) => condition.type === 'MemoryPressure' && condition.status === 'True') ??
    conditions.find((condition) => condition.type === 'DiskPressure' && condition.status === 'True') ??
    null;
  return { ready: ready?.status === 'True', pressure: pressure?.type ?? null };
}

function containerRestarts(pod) {
  const statuses = [...(pod?.status?.containerStatuses ?? []), ...(pod?.status?.initContainerStatuses ?? [])];
  return statuses.reduce((sum, status) => sum + (Number(status.restartCount) || 0), 0);
}

function containerReady(pod) {
  const statuses = pod?.status?.containerStatuses ?? [];
  if (statuses.length === 0) return null;
  const ready = statuses.filter((status) => status.ready).length;
  return { ready, total: statuses.length };
}

/** Kubernetes resource quantities: `16314516Ki`, `4`, `2Gi`. */
function parseQuantity(value) {
  if (value === null || value === undefined) return null;
  const match = /^([\d.]+)([KMGTPE]i?)?$/.exec(String(value).trim());
  if (!match) return null;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return null;
  const unit = match[2];
  if (!unit) return base;
  const exponent = { K: 1, M: 2, G: 3, T: 4, P: 5, E: 6 }[unit[0]] ?? 0;
  return Math.round(base * (unit.endsWith('i') ? 1024 : 1000) ** exponent);
}

/** Kubernetes CPU quantities: "100m", "1", "2.5". */
function parseCpu(value) {
  if (value === null || value === undefined) return 0;
  const text = String(value).trim();
  const milli = /^([\d.]+)m$/.exec(text);
  if (milli) return Number(milli[1]) / 1000;
  const cores = Number(text);
  return Number.isFinite(cores) ? cores : 0;
}

async function collectKubernetes(binaries) {
  const kubectl = binaries.kubectl;
  if (!kubectl) return { available: false, reason: 'kubectl-not-found' };

  const [context, contexts] = await Promise.all([
    run(kubectl, ['config', 'current-context'], { timeoutMs: 5000 }),
    run(kubectl, ['config', 'get-contexts', '-o', 'name'], { timeoutMs: 5000 }),
  ]);

  const currentContext = context.ok ? context.stdout.trim() || null : null;
  const allContexts = contexts.ok
    ? contexts.stdout
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  if (!currentContext) {
    return {
      available: true,
      connected: false,
      reason: 'no-context',
      context: null,
      contexts: allContexts,
    };
  }

  const timeoutArgs = ['--request-timeout=6s'];
  const [versionResult, nodesResult, podsResult, deploymentsResult, eventsResult, namespacesResult] =
    await Promise.all([
    run(kubectl, ['version', '-o', 'json', ...timeoutArgs], { timeoutMs: 8000 }),
    run(kubectl, ['get', 'nodes', '-o', 'json', ...timeoutArgs], { timeoutMs: 10000 }),
    run(kubectl, ['get', 'pods', '-A', '-o', 'json', ...timeoutArgs], { timeoutMs: 14000 }),
    run(kubectl, ['get', 'deployments', '-A', '-o', 'json', ...timeoutArgs], { timeoutMs: 14000 }),
    run(
      kubectl,
      [
        'get',
        'events',
        '-A',
        '--field-selector',
        'type=Warning',
        '-o',
        'json',
        ...timeoutArgs,
      ],
      { timeoutMs: 12000, maxBuffer: 24 * 1024 * 1024 },
    ),
    run(kubectl, ['get', 'namespaces', '-o', 'json', ...timeoutArgs], { timeoutMs: 10000 }),
    ]);

  const serverVersion = (() => {
    if (!versionResult.ok) return null;
    try {
      const parsed = JSON.parse(versionResult.stdout);
      return parsed.serverVersion?.gitVersion ?? parsed.clientVersion?.gitVersion ?? null;
    } catch {
      return null;
    }
  })();

  if (!nodesResult.ok) {
    return {
      available: true,
      connected: false,
      reason: 'unreachable',
      error: (nodesResult.stderr || nodesResult.message).trim().split('\n').slice(0, 2).join(' '),
      context: currentContext,
      contexts: allContexts,
      serverVersion,
    };
  }

  let nodes = [];
  try {
    nodes = (JSON.parse(nodesResult.stdout).items ?? []).map((node) => {
      const flags = nodeReady(node);
      return {
        name: String(node.metadata?.name ?? ''),
        ready: flags.ready,
        pressure: flags.pressure,
        version: String(node.status?.nodeInfo?.kubeletVersion ?? ''),
        os: String(node.status?.nodeInfo?.osImage ?? ''),
        roles: Object.keys(node.metadata?.labels ?? {})
          .filter((label) => label.startsWith('node-role.kubernetes.io/'))
          .map((label) => label.replace('node-role.kubernetes.io/', ''))
          .join(','),
        cpu: parseQuantity(node.status?.capacity?.cpu),
        memory: parseQuantity(node.status?.capacity?.memory),
        pods: parseQuantity(node.status?.capacity?.pods),
        allocatableMemory: parseQuantity(node.status?.allocatable?.memory),
        address: String(
          (node.status?.addresses ?? []).find((entry) => entry.type === 'InternalIP')?.address ?? '',
        ),
        containerRuntime: String(node.status?.nodeInfo?.containerRuntimeVersion ?? ''),
        kernel: String(node.status?.nodeInfo?.kernelVersion ?? ''),
        created: node.metadata?.creationTimestamp ?? null,
      };
    });
  } catch {
    nodes = [];
  }

  let pods = [];
  if (podsResult.ok) {
    try {
      pods = (JSON.parse(podsResult.stdout).items ?? []).map((pod) => {
        const ready = containerReady(pod);
        const restarts = containerRestarts(pod);
        const waiting =
          (pod.status?.containerStatuses ?? []).find((status) => status.state?.waiting?.reason)?.state?.waiting
            ?.reason ?? null;
        return {
          namespace: String(pod.metadata?.namespace ?? ''),
          name: String(pod.metadata?.name ?? ''),
          phase: String(pod.status?.phase ?? 'Unknown'),
          ready: ready?.ready ?? 0,
          containers: ready?.total ?? 0,
          restarts,
          waiting: waiting ? String(waiting) : null,
          age: pod.metadata?.creationTimestamp ?? null,
          node: String(pod.spec?.nodeName ?? ''),
          owner: String(pod.metadata?.ownerReferences?.[0]?.name ?? ''),
        };
      });
    } catch {
      pods = [];
    }
  }

  let deployments = [];
  if (deploymentsResult.ok) {
    try {
      deployments = (JSON.parse(deploymentsResult.stdout).items ?? []).map((deployment) => ({
        namespace: String(deployment.metadata?.namespace ?? ''),
        name: String(deployment.metadata?.name ?? ''),
        desired: Number(deployment.spec?.replicas ?? 0),
        ready: Number(deployment.status?.readyReplicas ?? 0),
        available: Number(deployment.status?.availableReplicas ?? 0),
        updated: Number(deployment.status?.updatedReplicas ?? 0),
      }));
    } catch {
      deployments = [];
    }
  }

  /** Requests declared by pod specs, summed per namespace. */
  const requests = new Map();
  if (podsResult.ok) {
    try {
      for (const pod of JSON.parse(podsResult.stdout).items ?? []) {
        const namespace = String(pod.metadata?.namespace ?? '');
        let cpu = 0;
        let memory = 0;
        for (const container of pod.spec?.containers ?? []) {
          cpu += parseCpu(container.resources?.requests?.cpu);
          memory += parseQuantity(container.resources?.requests?.memory) ?? 0;
        }
        const entry = requests.get(namespace) ?? { namespace, cpu: 0, memory: 0, pods: 0 };
        entry.cpu += cpu;
        entry.memory += memory;
        entry.pods += 1;
        requests.set(namespace, entry);
      }
    } catch {
      /* requests stay empty */
    }
  }

  const namespaceRows = (() => {
    if (!namespacesResult.ok) return [];
    try {
      return (JSON.parse(namespacesResult.stdout).items ?? []).slice(0, 40).map((namespace) => ({
        name: String(namespace.metadata?.name ?? ''),
        phase: String(namespace.status?.phase ?? ''),
        created: namespace.metadata?.creationTimestamp ?? null,
      }));
    } catch {
      return [];
    }
  })();

  const phaseCount = pods.reduce((accumulator, pod) => {
    const key = pod.phase.toLowerCase();
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  const unhealthy = pods
    .filter(
      (pod) =>
        !['running', 'succeeded'].includes(pod.phase.toLowerCase()) ||
        pod.restarts >= 5 ||
        (pod.containers > 0 && pod.ready < pod.containers),
    )
    .sort((left, right) => right.restarts - left.restarts)
    .slice(0, 6);

  const namespaces = [...new Set(pods.map((pod) => pod.namespace))].filter(Boolean);

  /** Recent Warning events: the reason behind a degraded row. */
  const events = (() => {
    if (!eventsResult.ok) return [];
    try {
      const items = JSON.parse(eventsResult.stdout).items ?? [];
      return items
        .map((event) => ({
          namespace: String(event.metadata?.namespace ?? ''),
          reason: String(event.reason ?? ''),
          message: String(event.message ?? '').replace(/\s+/g, ' ').slice(0, 180),
          object: `${String(event.involvedObject?.kind ?? '').toLowerCase()}/${String(
            event.involvedObject?.name ?? '',
          )}`,
          count: Number(event.count ?? 1),
          at: String(event.lastTimestamp ?? event.eventTime ?? ''),
        }))
        .sort((left, right) => Date.parse(right.at) - Date.parse(left.at))
        .slice(0, 10);
    } catch {
      return [];
    }
  })();

  /** Pods blocked in a waiting state, which restarts alone do not reveal. */
  const blocked = pods
    .filter((pod) => pod.waiting !== null)
    .sort((left, right) => right.restarts - left.restarts)
    .slice(0, 6)
    .map((pod) => ({ namespace: pod.namespace, name: pod.name, reason: pod.waiting, restarts: pod.restarts }));

  return {
    available: true,
    connected: true,
    context: currentContext,
    contexts: allContexts,
    serverVersion,
    nodes,
    nodesReady: nodes.filter((node) => node.ready).length,
    nodesTotal: nodes.length,
    pods: {
      total: pods.length,
      running: phaseCount.running ?? 0,
      pending: phaseCount.pending ?? 0,
      failed: phaseCount.failed ?? 0,
      succeeded: phaseCount.succeeded ?? 0,
      unknown: phaseCount.unknown ?? 0,
      restarts: pods.reduce((sum, pod) => sum + pod.restarts, 0),
    },
    namespaces: namespaces.length,
    namespaceList: namespaces.slice(0, 12),
    deployments: {
      total: deployments.length,
      active: deployments.filter((deployment) => deployment.desired > 0).length,
      degraded: deployments.filter((deployment) => deployment.desired > 0 && deployment.ready < deployment.desired)
        .length,
      totalReplicas: deployments.reduce((sum, deployment) => sum + deployment.desired, 0),
      readyReplicas: deployments.reduce((sum, deployment) => sum + deployment.ready, 0),
      // Every running deployment, worst first: the panel lists them and the
      // action route validates a rollout restart against this same list.
      list: deployments
        .filter((deployment) => deployment.desired > 0)
        .sort((left, right) => left.ready / left.desired - right.ready / right.desired)
        .slice(0, 80)
        .map((deployment) => ({
          ...deployment,
          id: `${deployment.namespace}/${deployment.name}`,
        })),
    },
    events,
    blocked,
    unhealthy,
    // Compact rows for the Kubernetes tab; the summary above stays for the
    // overview card.
    podRows: pods
      .slice()
      .sort((left, right) => right.restarts - left.restarts)
      .slice(0, 90)
      .map((pod) => ({
        namespace: pod.namespace,
        name: pod.name,
        phase: pod.phase,
        ready: pod.ready,
        containers: pod.containers,
        restarts: pod.restarts,
        waiting: pod.waiting,
        node: pod.node,
        age: pod.age,
      })),
    namespaceRows,
    namespaceRequests: [...requests.values()]
      .sort((left, right) => right.cpu - left.cpu)
      .slice(0, 20),
  };
}

/** Working directory of a pid, so a `devspace dev` row names its project. */
async function readProcessCwd(pid) {
  const result = await run('lsof', ['-p', String(pid), '-a', '-d', 'cwd', '-Fn'], { timeoutMs: 4000 });
  if (!result.ok) return null;
  const line = result.stdout
    .split('\n')
    .find((row) => row.startsWith('n/'));
  return line ? line.slice(1) : null;
}

/* -------------------------------------------------------------- devspace */

/** Parse the padded `devspace list plugins` table. */
function parseDevspaceTable(stdout) {
  const rows = [];
  for (const line of stripAnsi(stdout).split('\n')) {
    if (!line.includes('|')) continue;
    const cells = line
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean);
    if (cells.length < 2) continue;
    if (/^-+$/.test(cells[0].replace(/[+]/g, ''))) continue;
    if (/^NAME$/i.test(cells[0])) continue;
    rows.push(cells);
  }
  return rows;
}

async function collectDevspace(binaries) {
  const devspace = binaries.devspace;
  if (!devspace) return { available: false, reason: 'devspace-not-found' };

  const [version, plugins, processes] = await Promise.all([
    run(devspace, ['version'], { timeoutMs: 5000 }),
    run(devspace, ['list', 'plugins'], { timeoutMs: 6000 }),
    run('/usr/bin/pgrep', ['-fl', 'devspace'], { timeoutMs: 4000 }),
  ]);

  const versionText = version.ok
    ? (/DevSpace version\s*:?\s*v?([\d.]+)/i.exec(stripAnsi(version.stdout))?.[1] ?? null)
    : null;

  const pluginRows = plugins.ok
    ? parseDevspaceTable(plugins.stdout).map((cells) => ({
        name: cells[0],
        version: cells[1] ?? '',
        commands: Number(cells[2]) || 0,
        vars: Number(cells[3]) || 0,
      }))
    : [];

  const rawSessions = (processes.ok ? processes.stdout : '')
    .split('\n')
    .map((line) => /^(\d+)\s+(.*)$/.exec(line.trim()))
    .filter(Boolean)
    .map((match) => ({ pid: Number(match[1]), command: match[2].trim() }))
    .filter((entry) => /devspace\s+(dev|sync|run-pipeline|analyze)\b/.test(entry.command));

  const sessions = await Promise.all(
    rawSessions.slice(0, 6).map(async (entry) => {
      const cwd = await readProcessCwd(entry.pid);
      const mode = /devspace\s+(\S+)/.exec(entry.command)?.[1] ?? 'dev';
      const deps = [...entry.command.matchAll(/--dependency\s+(\S+)/g)].map((match) => match[1]);
      return {
        pid: entry.pid,
        mode,
        command: entry.command,
        cwd,
        project: cwd ? path.basename(cwd) : null,
        dependencies: deps,
      };
    }),
  );

  return {
    available: true,
    version: versionText,
    sessions,
    plugins: pluginRows,
  };
}

/* ------------------------------------------------------- infra collection */

/** Locate the CLI binaries once; a missing tool stays missing for the life. */
async function resolveBinaries(config) {
  const env = { ...process.env, PATH: enrichedPath(config.extraPaths ?? []) };
  const names = ['docker', 'colima', 'kubectl', 'devspace'];
  const entries = await Promise.all(names.map(async (name) => [name, await which(name, env)]));
  return Object.fromEntries(entries);
}

/* ------------------------------------------------------------------ controls */

/**
 * The complete control surface. `timeoutMs` bounds the command; nothing here
 * runs through a shell and every target is re-validated against the last
 * snapshot before a command is built.
 */
const CONTROLS = {
  'docker.start': { timeoutMs: 45_000 },
  'docker.stop': { timeoutMs: 45_000 },
  'docker.restart': { timeoutMs: 90_000 },
  'colima.start': { timeoutMs: 180_000 },
  'colima.stop': { timeoutMs: 120_000 },
  'kube.context': { timeoutMs: 20_000 },
  'kube.restart': { timeoutMs: 45_000 },
  'devspace.stop': { timeoutMs: 10_000 },
  'jira.transition': { timeoutMs: 20_000 },
  'kube.deletePod': { timeoutMs: 30_000 },
  'docker.remove': { timeoutMs: 45_000 },
  'process.kill': { timeoutMs: 5_000 },
};

/** Action ids the HTTP route will accept, in the order the UI offers them. */
export const ACTIONS = Object.freeze(Object.keys(CONTROLS));

/* ------------------------------------------------------------------ monitor */

/**
 * Build a monitor with two refresh tiers and a ring buffer of system samples.
 * @param {object} [options] - refresh cadence and history size.
 * @returns {object} start, stop, snapshot, and refresh helpers.
 */
export function createMonitor(options = {}) {
  const config = {
    fastMs: clamp(Number(options.fastMs) || 2000, 1000, 60000),
    slowMs: clamp(Number(options.slowMs) || 15000, 5000, 600000),
    historySize: clamp(Number(options.historySize) || 180, 30, 720),
    jiraMs: clamp(Number(options.jiraMs) || 60_000, 15_000, 900_000),
    workspaceMs: clamp(Number(options.workspaceMs) || 120_000, 30_000, 1_800_000),
    newsMs: clamp(Number(options.newsMs) || 600_000, 120_000, 3_600_000),
    extraPaths: Array.isArray(options.extraPaths) ? options.extraPaths : [],
  };

  // Jira lives on the network, so it gets its own cadence: a slow or failing
  // instance must never delay docker, colima, kubectl or devspace.
  const jira = createJiraReader(options.jira ?? {});

  // The to-do list is the plugin's only user-owned data; it lives in one file
  // outside the workspace so an update never touches it.
  const todos = createTodoStore({ file: options.todosFile || undefined });

  const state = {
    startedAt: Date.now(),
    meta: null,
    coreSplit: null,
    binaries: null,
    system: null,
    history: [],
    infra: { docker: null, colima: null, kubernetes: null, devspace: null, asOf: 0, refreshing: false },
    previous: { cpu: null, net: null, at: 0, disk: null },
    jira: { data: null, error: null, asOf: 0, running: false, project: null },
    workspace: { data: null, error: null, asOf: 0, running: false },
    news: { data: null, error: null, asOf: 0, running: false },
    todos: { summary: { total: 0, open: 0, done: 0, overdue: 0, dueToday: 0, high: 0, updatedAt: 0 } },
    timers: { fast: null, slow: null, jira: null, workspace: null, news: null },
    fastRunning: false,
    slowRunning: false,
    stopped: true,
    lastFastError: null,
    lastSlowError: null,
  };

  /** One fast tick: CPU delta, memory, disk, network rate, processes, battery. */
  async function sampleFast() {
    if (state.fastRunning) return;
    state.fastRunning = true;
    try {
      const now = Date.now();
      const cpuTimes = readCpuTimes();
      const cpu = state.previous.cpu ? diffCpu(state.previous.cpu, cpuTimes) : null;
      const load = os.loadavg().map((value) => round(value, 2));
      const elapsedSeconds = state.previous.at ? Math.max(0.25, (now - state.previous.at) / 1000) : 0;

      const [memoryRaw, swap, disk, netCounters, processes, battery] = await Promise.all([
        attempt(os.platform() === 'darwin' ? readMemoryDarwin(os.totalmem()) : readMemoryLinux(os.totalmem())),
        attempt(readSwap()),
        attempt(readDisk()),
        attempt(readNetCounters(), []),
        attempt(readProcesses(40), []),
        attempt(readBattery()),
      ]);

      const net = (() => {
        const previous = state.previous.net;
        if (!netCounters || netCounters.length === 0) return null;
        const totalRx = netCounters.reduce((sum, entry) => sum + entry.rx, 0);
        const totalTx = netCounters.reduce((sum, entry) => sum + entry.tx, 0);
        let rxRate = 0;
        let txRate = 0;
        if (previous && elapsedSeconds > 0) {
          rxRate = Math.max(0, (totalRx - previous.totalRx) / elapsedSeconds);
          txRate = Math.max(0, (totalTx - previous.totalTx) / elapsedSeconds);
        }
        return {
          rxTotal: totalRx,
          txTotal: totalTx,
          rxRate: round(rxRate, 0),
          txRate: round(txRate, 0),
          interfaces: netCounters
            .slice()
            .sort((left, right) => right.rx + right.tx - (left.rx + left.tx))
            .slice(0, 4)
            .map((entry) => ({
              name: entry.name,
              rx: entry.rx,
              tx: entry.tx,
              rxRate:
                previous && elapsedSeconds > 0 && previous.byName?.has(entry.name)
                  ? round(Math.max(0, (entry.rx - previous.byName.get(entry.name).rx) / elapsedSeconds), 0)
                  : 0,
              txRate:
                previous && elapsedSeconds > 0 && previous.byName?.has(entry.name)
                  ? round(Math.max(0, (entry.tx - previous.byName.get(entry.name).tx) / elapsedSeconds), 0)
                  : 0,
            })),
        };
      })();

      const totalMemory = os.totalmem();
      const memory = memoryRaw ?? {
        total: totalMemory,
        used: totalMemory - os.freemem(),
        free: os.freemem(),
        app: totalMemory - os.freemem(),
        wired: 0,
        compressed: 0,
        cached: 0,
        freePages: os.freemem(),
        percent: round(((totalMemory - os.freemem()) / totalMemory) * 100, 1),
      };

      state.system = {
        ts: now,
        uptime: os.uptime(),
        cpu: {
          usage: cpu?.usage ?? null,
          perCore: cpu?.perCore ?? [],
          cores: cpuTimes.perCore.length,
          load,
          loadPercent: round((load[0] / Math.max(1, cpuTimes.perCore.length)) * 100, 1),
          coreSplit: state.coreSplit,
        },
        memory,
        swap,
        disk,
        net,
        battery,
        processes: Array.isArray(processes) ? processes : [],
        processesAvailable: Array.isArray(processes),
      };

      // The first tick has no CPU delta yet; keeping it would floor the chart.
      // Cheap after the first read, and it keeps the tab badge honest.
      state.todos.summary = await todos.summary().catch(() => state.todos.summary);

      if (state.system.cpu.usage !== null) {
        state.history.push({
          t: now,
          cpu: state.system.cpu.usage,
          mem: memory.percent,
          disk: disk?.percent ?? 0,
          rx: net?.rxRate ?? 0,
          tx: net?.txRate ?? 0,
          load: load[0] ?? 0,
        });
        if (state.history.length > config.historySize) {
          state.history.splice(0, state.history.length - config.historySize);
        }
      }

      state.previous = {
        cpu: cpuTimes,
        at: now,
        net: netCounters
          ? {
              totalRx: netCounters.reduce((sum, entry) => sum + entry.rx, 0),
              totalTx: netCounters.reduce((sum, entry) => sum + entry.tx, 0),
              byName: new Map(netCounters.map((entry) => [entry.name, { rx: entry.rx, tx: entry.tx }])),
            }
          : null,
      };
      state.lastFastError = null;
    } catch (error) {
      state.lastFastError = error instanceof Error ? error.message : String(error);
    } finally {
      state.fastRunning = false;
    }
  }

  /** One slow tick: docker, colima, kubernetes, devspace, all in parallel. */
  async function sampleSlow() {
    if (state.slowRunning) return;
    state.slowRunning = true;
    state.infra.refreshing = true;
    try {
      if (!state.binaries) {
        state.binaries = await resolveBinaries(config);
        state.meta = await readHostMeta();
        state.coreSplit = await readCoreSplit();
      }
      const binaries = state.binaries;
      const [docker, colima, kubernetes, devspace] = await Promise.all([
        collectDocker(binaries).catch((error) => ({
          available: false,
          reason: 'error',
          error: error instanceof Error ? error.message : String(error),
        })),
        collectColima(binaries).catch((error) => ({
          available: false,
          reason: 'error',
          error: error instanceof Error ? error.message : String(error),
        })),
        collectKubernetes(binaries).catch((error) => ({
          available: false,
          reason: 'error',
          error: error instanceof Error ? error.message : String(error),
        })),
        collectDevspace(binaries).catch((error) => ({
          available: false,
          reason: 'error',
          error: error instanceof Error ? error.message : String(error),
        })),
      ]);
      state.infra = { docker, colima, kubernetes, devspace, asOf: Date.now(), refreshing: false };
      state.lastSlowError = null;
    } catch (error) {
      state.lastSlowError = error instanceof Error ? error.message : String(error);
      state.infra.refreshing = false;
    } finally {
      state.slowRunning = false;
    }
  }

  /** One Jira read; the previous good snapshot survives a failure. */
  async function sampleJira() {
    if (state.jira.running) return;
    state.jira.running = true;
    try {
      state.jira.data = await jira.collect();
      state.jira.project = state.jira.data?.connected
        ? await jira.projectKpis(state.jira.data)
        : null;
      state.jira.error = null;
      state.jira.asOf = Date.now();
    } catch (error) {
      state.jira.error = error instanceof Error ? error.message : String(error);
    } finally {
      state.jira.running = false;
    }
  }

  /** One workspace read: GitHub, Confluence, security, listening ports. */
  async function sampleWorkspace() {
    if (state.workspace.running) return;
    state.workspace.running = true;
    try {
      state.workspace.data = await collectWorkspace();
      state.workspace.error = null;
      state.workspace.asOf = Date.now();
    } catch (error) {
      state.workspace.error = error instanceof Error ? error.message : String(error);
    } finally {
      state.workspace.running = false;
    }
  }

  /** One news read: the watch feeds and their computed alerts. */
  async function sampleNews() {
    if (state.news.running) return;
    state.news.running = true;
    try {
      state.news.data = await collectNews();
      state.news.error = null;
      state.news.asOf = Date.now();
    } catch (error) {
      state.news.error = error instanceof Error ? error.message : String(error);
    } finally {
      state.news.running = false;
    }
  }

  /**
   * A self re-arming interval that never overlaps its previous run: the next
   * tick is scheduled only once the current one settles. Timers are unref'd so
   * the monitor never keeps the Host process alive on its own.
   */
  function scheduleUntracked(callback, delayMs, key) {
    const timer = setTimeout(function loop() {
      callback().finally(() => {
        if (!state.stopped) state.timers[key] = scheduleUntracked(callback, delayMs, key);
      });
    }, delayMs);
    if (typeof timer.unref === 'function') timer.unref();
    return timer;
  }

  return {
    config,

    /**
     * Run one control against the machine.
     *
     * Only the actions below exist, and `target` must name an entity the last
     * snapshot already reported: no string from the browser reaches a command
     * line unvalidated, and nothing runs through a shell.
     *
     * @param request - `{ action, target }` as validated by the route.
     * @returns the finished command's output.
     */
    async perform({ action, target, value }) {
      const spec = CONTROLS[action];
      if (!spec) {
        const error = new Error(`unknown action: ${String(action)}`);
        error.code = 'unknown-action';
        throw error;
      }
      const infra = state.infra;
      const binary = (name) => {
        const resolved = state.binaries?.[name];
        if (!resolved) {
          const error = new Error(`${name} is not installed`);
          error.code = 'unavailable';
          throw error;
        }
        return resolved;
      };
      const invalid = (message) => {
        const error = new Error(message);
        error.code = 'invalid-target';
        return error;
      };

      if (action === 'docker.remove') {
        const container = (infra.docker?.containers ?? []).find((entry) => entry.name === target);
        if (!container) throw invalid(`no such container: ${String(target)}`);
        const result = await run(binary('docker'), ['rm', '-f', container.name], { timeoutMs: spec.timeoutMs });
        if (!result.ok) throw new Error(result.stderr.trim() || result.message);
        return { action, target: container.name, output: result.stdout.trim() };
      }

      if (action.startsWith('docker.')) {
        const container = (infra.docker?.containers ?? []).find(
          (entry) => entry.name === target || entry.id === target,
        );
        if (!container) throw invalid(`no such container: ${String(target)}`);
        const verb = action.slice('docker.'.length);
        if (verb === 'stop' && container.state !== 'running') throw invalid(`${target} is not running`);
        if (verb === 'start' && container.state === 'running') throw invalid(`${target} is already running`);
        const result = await run(binary('docker'), [verb, container.name], { timeoutMs: spec.timeoutMs });
        if (!result.ok) throw new Error(result.stderr.trim() || result.message);
        return { action, target: container.name, output: result.stdout.trim() };
      }

      if (action.startsWith('colima.')) {
        const profile = (infra.colima?.profiles ?? []).find((entry) => entry.name === target);
        if (!profile) throw invalid(`no such colima profile: ${String(target)}`);
        const verb = action.slice('colima.'.length);
        if (verb === 'stop' && profile.status !== 'running') throw invalid(`${target} is not running`);
        if (verb === 'start' && profile.status === 'running') throw invalid(`${target} is already running`);
        const result = await run(binary('colima'), [verb, profile.name], { timeoutMs: spec.timeoutMs });
        if (!result.ok) throw new Error(result.stderr.trim() || result.message);
        return { action, target: profile.name, output: result.stdout.trim() };
      }

      if (action === 'kube.context') {
        const contexts = infra.kubernetes?.contexts ?? [];
        if (!contexts.includes(target)) throw invalid(`no such context: ${String(target)}`);
        const result = await run(binary('kubectl'), ['config', 'use-context', target], { timeoutMs: spec.timeoutMs });
        if (!result.ok) throw new Error(result.stderr.trim() || result.message);
        return { action, target, output: result.stdout.trim() };
      }

      if (action === 'kube.restart') {
        const deployment = (infra.kubernetes?.deployments?.list ?? []).find((entry) => entry.id === target);
        if (!deployment) throw invalid(`no such deployment: ${String(target)}`);
        const result = await run(
          binary('kubectl'),
          [
            'rollout',
            'restart',
            `deployment/${deployment.name}`,
            '-n',
            deployment.namespace,
            '--request-timeout=15s',
          ],
          { timeoutMs: spec.timeoutMs },
        );
        if (!result.ok) throw new Error(result.stderr.trim() || result.message);
        return { action, target, output: result.stdout.trim() };
      }

      if (action === 'kube.deletePod') {
        const pod = (infra.kubernetes?.podRows ?? []).find(
          (entry) => `${entry.namespace}/${entry.name}` === target,
        );
        if (!pod) throw invalid(`no such pod: ${String(target)}`);
        const result = await run(
          binary('kubectl'),
          ['delete', 'pod', pod.name, '-n', pod.namespace, '--wait=false', '--request-timeout=15s'],
          { timeoutMs: spec.timeoutMs },
        );
        if (!result.ok) throw new Error((result.stderr || result.message).trim());
        return { action, target, output: result.stdout.trim() };
      }

      if (action === 'process.kill') {
        const process_ = (state.system?.processes ?? []).find((entry) => String(entry.pid) === String(target));
        if (!process_) throw invalid(`no such process: ${String(target)}`);
        if (process_.pid <= 1) throw invalid('refusing to signal a system process');
        process.kill(process_.pid, 'SIGTERM');
        return { action, target: String(process_.pid), output: `SIGTERM ${process_.pid}` };
      }

      if (action === 'jira.transition') {
        const known = (state.jira.data?.issues ?? []).find((issue) => issue.key === target);
        if (!known) throw invalid(`no such issue in the last snapshot: ${String(target)}`);
        const value = String(request.value ?? '');
        if (!/^\d{1,12}$/.test(value)) throw invalid('a transition id is required');
        const result = await jira.transition(known.key, value);
        return { action, target: known.key, output: `transition ${result.transition}` };
      }

      // devspace: the session list is the authority on which pids may be signalled.
      const session = (infra.devspace?.sessions ?? []).find((entry) => String(entry.pid) === String(target));
      if (!session) throw invalid(`no such devspace session: ${String(target)}`);
      process.kill(session.pid, 'SIGTERM');
      return { action, target: String(session.pid), output: `SIGTERM sent to ${session.pid}` };
    },

    /** Prime both tiers immediately, then arm the two intervals. */
    async start() {
      state.stopped = false;
      // Two fast ticks: the first only establishes counters for the deltas.
      await sampleFast();
      if (state.stopped) return;
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (state.stopped) return;
      await sampleFast();
      if (state.stopped) return;
      // The network tiers are independent and slow (Jira, GitHub, feeds); the
      // panel must not wait for them to show the machine.
      void sampleSlow();
      void sampleJira();
      void sampleWorkspace();
      void sampleNews();
      state.timers.fast = scheduleUntracked(sampleFast, config.fastMs, 'fast');
      state.timers.slow = scheduleUntracked(sampleSlow, config.slowMs, 'slow');
      state.timers.jira = scheduleUntracked(sampleJira, config.jiraMs, 'jira');
      state.timers.workspace = scheduleUntracked(sampleWorkspace, config.workspaceMs, 'workspace');
      state.timers.news = scheduleUntracked(sampleNews, config.newsMs, 'news');
    },
    stop() {
      state.stopped = true;
      for (const key of ['fast', 'slow', 'jira', 'workspace', 'news']) {
        const timer = state.timers[key];
        if (timer) clearTimeout(timer);
        state.timers[key] = null;
      }
    },
    /** The compact payload the HTTP route serializes. */
    snapshot() {
      const meta = state.meta ?? {
        hostname: os.hostname().replace(/\.local$/, ''),
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        chip: os.cpus()[0]?.model ?? '',
        cores: os.cpus().length,
        memoryTotal: os.totalmem(),
        uptime: os.uptime(),
      };
      return {
        ok: true,
        // Bumped whenever the snapshot shape changes, so the browser can tell
        // a stale Host from a broken section.
        schemaVersion: 3,
        generatedAt: Date.now(),
        startedAt: state.startedAt,
        config: { fastMs: config.fastMs, slowMs: config.slowMs, historySize: config.historySize },
        meta: { ...meta, uptime: os.uptime() },
        binaries: state.binaries ?? {},
        system: state.system,
        history: state.history,
        infra: state.infra,
        jira:
          state.jira.data ?? {
            configured: jira.configured,
            reason: jira.configured ? 'pending' : 'missing-settings',
            missing: jira.missing,
            baseUrl: jira.settings.baseUrl || null,
            email: jira.settings.email || null,
            issues: [],
            projects: [],
          },
        jiraProject: state.jira.project ?? { available: false, pending: true },
        todos: state.todos.summary,
        news:
          state.news.data ?? {
            pending: true,
            tech: [],
            cyber: { advisories: [], certAlerts: [], certAdvisories: [], attacks: [] },
            alerts: [],
            asOf: 0,
          },
        workspace:
          state.workspace.data ?? {
            pending: true,
            github: { available: false, reason: 'pending' },
            confluence: { available: false, reason: 'pending' },
            security: null,
            ports: { available: false, ports: [] },
          },
        errors: {
          fast: state.lastFastError,
          slow: state.lastSlowError,
          jira: state.jira.error,
          workspace: state.workspace.error,
          news: state.news.error,
        },
      };
    },
    /** Transitions currently offered on one issue, for the row menu. */
    async jiraTransitions(key) {
      const known = (state.jira.data?.issues ?? []).find((issue) => issue.key === key);
      if (!known) {
        const error = new Error(`no such issue in the last snapshot: ${String(key)}`);
        error.code = 'invalid-target';
        throw error;
      }
      return jira.transitions(known.key);
    },

    /** The whole to-do list, for the tab. */
    async listTodos() {
      return this.listTodosWithSummary();
    },

    /** The to-do list plus its counts. */
    async listTodosWithSummary() {
      const list = await todos.list();
      const summary = await todos.summary();
      state.todos.summary = summary;
      return { todos: list, summary, file: todos.file };
    },

    /** Apply one validated to-do mutation and return the new list. */
    async mutateTodos(request) {
      await todos.apply(request);
      return this.listTodosWithSummary();
    },

    /** One proxied image for the watch cards. */
    async image(url) {
      return fetchImage(url);
    },

    /** The last lines a container wrote, for the container drawer. */
    async dockerLogs(name, lines = 200) {
      const container = (state.infra.docker?.containers ?? []).find((entry) => entry.name === name);
      if (!container) {
        const error = new Error(`no such container: ${String(name)}`);
        error.code = 'invalid-target';
        throw error;
      }
      const docker = state.binaries?.docker;
      if (!docker) throw new Error('docker is not installed');
      const count = Math.min(Math.max(Number(lines) || 200, 20), 500);
      const result = await run(docker, ['logs', '--tail', String(count), '--timestamps', container.name], {
        timeoutMs: 15000,
        maxBuffer: 4 * 1024 * 1024,
      });
      // `docker logs` writes to stderr for some drivers; both are the log.
      const text = `${result.stdout}${result.stderr}`.trim();
      return { name: container.name, lines: count, text: text.slice(-40000) };
    },

    /** Full detail for one issue, fetched when the drawer opens. */
    async jiraIssue(key) {
      const known = (state.jira.data?.issues ?? []).find((issue) => issue.key === key);
      if (!known) {
        const error = new Error(`no such issue in the last snapshot: ${String(key)}`);
        error.code = 'invalid-target';
        throw error;
      }
      return jira.issueDetail(known.key);
    },

    /** Force one infra refresh. */
    async refreshInfra() {
      await sampleSlow();
      return this.snapshot();
    },

    /** Force every tier at once, behind the panel's refresh button. */
    async refreshAll() {
      await Promise.all([sampleSlow(), sampleJira(), sampleWorkspace(), sampleNews()]);
      return this.snapshot();
    },
  };
}
