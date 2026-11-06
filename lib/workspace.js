/**
 * Workspace readers: the things around the machine rather than on it.
 *
 * GitHub is read through the `gh` CLI (already authenticated on this
 * workstation, so the plugin never handles a token). Confluence reuses the
 * Atlassian credentials the Jira reader resolves. Security and listening ports
 * are local commands.
 *
 * Every reader resolves; a failure degrades one panel and never the snapshot.
 */

import { execFile } from 'node:child_process';
import { resolveJiraSettings, atlassianRequest } from './jira.js';

/* ------------------------------------------------------------------ shell */

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

function enrichedPath() {
  const seen = new Set();
  const dirs = [];
  for (const dir of [...(process.env.PATH ?? '').split(':'), ...DEFAULT_PATH_DIRS]) {
    if (!dir || seen.has(dir)) continue;
    seen.add(dir);
    dirs.push(dir);
  }
  return dirs.join(':');
}

/** Run a command without a shell; always resolves. */
function run(command, args = [], { timeoutMs = 10_000, maxBuffer = 8 * 1024 * 1024 } = {}) {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const settle = (result) => resolve({ ms: Date.now() - startedAt, ...result });
    try {
      execFile(
        command,
        args,
        { timeout: timeoutMs, maxBuffer, windowsHide: true, env: { ...process.env, PATH: enrichedPath() } },
        (error, stdout, stderr) => {
          if (error) {
            settle({
              ok: false,
              stdout: String(stdout ?? ''),
              stderr: String(stderr ?? ''),
              message: error.message,
            });
            return;
          }
          settle({ ok: true, stdout: String(stdout ?? ''), stderr: String(stderr ?? '') });
        },
      );
    } catch (error) {
      settle({ ok: false, stdout: '', stderr: '', message: error?.message ?? 'spawn failed' });
    }
  });
}

const stripAnsi = (text) => String(text ?? '').replace(/\u001b\[[0-9;]*[A-Za-z]/g, '');

/* ----------------------------------------------------------------- github */

/**
 * `gh` reports the signed-in account and the queue around it. It returns JSON
 * with `--json`, so nothing here parses a table.
 */
async function collectGithub() {
  const auth = await run('gh', ['auth', 'status'], { timeoutMs: 8000 });
  if (!auth.ok) {
    return { available: false, reason: 'not-authenticated' };
  }
  const account = /Logged in to \S+ account (\S+)/.exec(auth.stdout)?.[1] ?? '';

  const [prs, reviews, issues, notifications] = await Promise.all([
    run(
      'gh',
      [
        'pr',
        'list',
        '--author',
        '@me',
        '--state',
        'open',
        '--limit',
        '30',
        '--json',
        'number,title,repository,updatedAt,isDraft,reviewDecision,url',
      ],
      { timeoutMs: 15000 },
    ),
    run(
      'gh',
      [
        'search',
        'prs',
        '--review-requested',
        '@me',
        '--state',
        'open',
        '--limit',
        '30',
        '--json',
        'number,title,repository,updatedAt,url',
      ],
      { timeoutMs: 15000 },
    ),
    run(
      'gh',
      [
        'issue',
        'list',
        '--assignee',
        '@me',
        '--state',
        'open',
        '--limit',
        '30',
        '--json',
        'number,title,repository,updatedAt,labels,url',
      ],
      { timeoutMs: 15000 },
    ),
    run('gh', ['api', 'notifications', '--paginate'], { timeoutMs: 15000 }),
  ]);

  const parse = (result) => {
    if (!result.ok) return [];
    try {
      const value = JSON.parse(result.stdout);
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  const toRow = (entry) => ({
    number: Number(entry.number ?? 0),
    title: String(entry.title ?? ''),
    repo: String(entry.repository?.nameWithOwner ?? entry.repository?.name ?? ''),
    updated: String(entry.updatedAt ?? ''),
    draft: Boolean(entry.isDraft),
    review: String(entry.reviewDecision ?? ''),
    labels: Array.isArray(entry.labels)
      ? entry.labels.map((label) => String(label.name ?? '')).filter(Boolean).slice(0, 3)
      : [],
    url: String(entry.url ?? ''),
  });

  const notificationRows = parse(notifications).map((entry) => ({
    id: String(entry.id ?? ''),
    title: String(entry.subject?.title ?? ''),
    reason: String(entry.reason ?? ''),
    repo: String(entry.repository?.full_name ?? ''),
    type: String(entry.subject?.type ?? ''),
    updated: String(entry.updated_at ?? ''),
    unread: Boolean(entry.unread),
    url: String(entry.subject?.url ?? ''),
  }));

  return {
    available: true,
    account,
    pullRequests: parse(prs).map(toRow),
    reviews: parse(reviews).map(toRow),
    issues: parse(issues).map(toRow),
    notifications: notificationRows.filter((entry) => entry.unread).slice(0, 20),
    unreadCount: notificationRows.filter((entry) => entry.unread).length,
  };
}

/* ------------------------------------------------------------- confluence */

/** Recent Confluence pages, through the Atlassian credentials Jira uses. */
async function collectConfluence() {
  const settings = resolveJiraSettings({});
  if (!settings.baseUrl || !settings.token) {
    return { available: false, reason: 'missing-credentials' };
  }

  const cql = encodeURIComponent('type = page ORDER BY lastmodified DESC');
  const [recent, mine, spaces] = await Promise.all([
    atlassianRequest(settings, `/wiki/rest/api/content/search?cql=${cql}&limit=25&expand=version,space`),
    atlassianRequest(
      settings,
      `/wiki/rest/api/content/search?cql=${encodeURIComponent(
        'contributor = currentUser() ORDER BY lastmodified DESC',
      )}&limit=10&expand=version,space`,
    ),
    atlassianRequest(settings, '/wiki/rest/api/space?limit=50'),
  ]);

  if (!recent.ok) {
    return {
      available: false,
      reason: recent.status === 401 || recent.status === 403 ? 'auth-failed' : 'unreachable',
      error: recent.error,
      baseUrl: settings.baseUrl,
    };
  }

  const toRow = (entry) => ({
    id: String(entry.id ?? ''),
    title: String(entry.title ?? ''),
    space: String(entry.space?.name ?? ''),
    spaceKey: String(entry.space?.key ?? ''),
    updated: String(entry.version?.when ?? ''),
    by: String(entry.version?.by?.displayName ?? ''),
    url: `${settings.baseUrl}/wiki${String(entry._links?.webui ?? '')}`,
  });

  const recentRows = Array.isArray(recent.json?.results) ? recent.json.results.map(toRow) : [];
  const mineRows = Array.isArray(mine.json?.results) ? mine.json.results.map(toRow) : [];
  const spaceRows = Array.isArray(spaces.json?.results)
    ? spaces.json.results.map((space) => ({
        key: String(space.key ?? ''),
        name: String(space.name ?? ''),
        type: String(space.type ?? ''),
        url: `${settings.baseUrl}/wiki${String(space._links?.webui ?? '')}`,
      }))
    : [];

  return {
    available: true,
    baseUrl: settings.baseUrl,
    recent: recentRows,
    mine: mineRows,
    spaces: spaceRows,
    spaceCount: spaceRows.length,
  };
}

/* --------------------------------------------------------------- security */

/**
 * The four host-security facts that matter on a developer laptop.
 * All are local, cheap, and read-only.
 */
async function collectSecurity() {
  // These are macOS checks; elsewhere the tab reports nothing rather than lying.
  if (process.platform !== 'darwin') return { available: false, reason: 'unsupported-platform' };
  const [fileVault, firewall, sip, gatekeeper, updates] = await Promise.all([
    run('/usr/bin/fdesetup', ['status'], { timeoutMs: 6000 }),
    run('/usr/libexec/ApplicationFirewall/socketfilterfw', ['--getglobalstate'], { timeoutMs: 6000 }),
    run('/usr/bin/csrutil', ['status'], { timeoutMs: 6000 }),
    run('/usr/sbin/spctl', ['--status'], { timeoutMs: 6000 }),
    run('/usr/bin/defaults', ['read', '/Library/Preferences/com.apple.SoftwareUpdate', 'LastSuccessfulDate'], {
      timeoutMs: 6000,
    }),
  ]);

  const text = (result) => stripAnsi(result.ok ? result.stdout : result.stderr).trim();
  return {
    available: true,
    fileVault: /FileVault is On/i.test(text(fileVault))
      ? 'on'
      : /FileVault is Off/i.test(text(fileVault))
        ? 'off'
        : 'unknown',
    firewall: /enabled/i.test(text(firewall)) ? 'on' : /disabled/i.test(text(firewall)) ? 'off' : 'unknown',
    sip: /enabled/i.test(text(sip)) ? 'on' : /disabled/i.test(text(sip)) ? 'off' : 'unknown',
    gatekeeper: /assessments enabled/i.test(text(gatekeeper))
      ? 'on'
      : /assessments disabled/i.test(text(gatekeeper))
        ? 'off'
        : 'unknown',
    lastUpdate: text(updates) || null,
  };
}

/* ------------------------------------------------------------------ ports */

/**
 * Listening TCP sockets, grouped by port. `lsof` needs no root for the
 * current user's processes, which is what makes this cheap enough to poll.
 */
async function collectPorts() {
  const result = await run('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], { timeoutMs: 12000 });
  if (!result.ok) return { available: false, ports: [] };

  const rows = [];
  for (const line of result.stdout.split('\n').slice(1)) {
    // COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME (LISTEN) — the socket
    // address is the token before the state marker, whatever the column count.
    const tokens = line.trim().split(/\s+/);
    if (tokens.length < 4 || tokens[tokens.length - 1] !== '(LISTEN)') continue;
    const [command, pid, address] = [tokens[0], tokens[1], tokens[tokens.length - 2]];
    if (!address) continue;
    const separator = address.lastIndexOf(':');
    if (separator < 0) continue;
    const host = address.slice(0, separator);
    const port = Number(address.slice(separator + 1));
    if (!Number.isFinite(port)) continue;
    rows.push({
      command: String(command),
      pid: Number(pid),
      port,
      host: host === '*' ? 'toutes' : host,
      exposed: host === '*' || host === '0.0.0.0' || host === '::',
    });
  }

  // One row per port, listing every process bound to it.
  const byPort = new Map();
  for (const row of rows) {
    const existing = byPort.get(row.port);
    if (existing) {
      if (!existing.processes.some((entry) => entry.pid === row.pid)) {
        existing.processes.push({ command: row.command, pid: row.pid });
      }
      existing.exposed = existing.exposed || row.exposed;
    } else {
      byPort.set(row.port, {
        port: row.port,
        host: row.host,
        exposed: row.exposed,
        processes: [{ command: row.command, pid: row.pid }],
      });
    }
  }

  const ports = [...byPort.values()].sort((left, right) => left.port - right.port);
  return {
    available: true,
    ports: ports.slice(0, 60),
    total: ports.length,
    exposed: ports.filter((entry) => entry.exposed).length,
  };
}

/* --------------------------------------------------------------- exported */

/** Read everything the workspace tabs show, each bounded and independent. */
export async function collectWorkspace() {
  const [github, confluence, security, listening] = await Promise.all([
    collectGithub().catch(() => ({ available: false, reason: 'error' })),
    collectConfluence().catch(() => ({ available: false, reason: 'error' })),
    collectSecurity().catch(() => ({ available: false })),
    collectPorts().catch(() => ({ available: false, ports: [] })),
  ]);
  return { github, confluence, security, ports: listening, asOf: Date.now() };
}
