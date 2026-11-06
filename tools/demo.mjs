/**
 * Fictional snapshot for the README screenshots.
 *
 * Every value here is invented: the host, the projects, the repositories and
 * the people. Screenshots built from it can be published without exposing the
 * machine they were taken on.
 */

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();
const daysFrom = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const initials = (name) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const people = [
  { name: 'Ada Lovelace', color: '#6366f1' },
  { name: 'Grace Hopper', color: '#0ea5e9' },
  { name: 'Alan Turing', color: '#a855f7' },
  { name: 'Katherine Johnson', color: '#f59e0b' },
].map((person) => ({ ...person, initials: initials(person.name), avatar: null }));

const person = (index) => people[index % people.length];

const history = Array.from({ length: 30 }, (_, index) => ({
  t: Date.now() - (30 - index) * 2000,
  cpu: Math.round(28 + Math.sin(index / 3) * 14 + (index % 5) * 2),
  mem: Math.round(62 + Math.sin(index / 5) * 3),
  disk: 74,
  rx: Math.round(180_000 + Math.sin(index / 2) * 120_000),
  tx: Math.round(40_000 + Math.cos(index / 2) * 22_000),
  load: 2.4,
}));

const issues = [
  ['ACME-1284', 'bug', 'Restrict the shared secret store to its own namespace', 'Secret hygiene', 'In progress', 'progress', 'Blocker', 2, 5, 0],
  ['ACME-1301', 'task', 'Rotate the identity provider credentials and drop stale clients', 'Secret hygiene', 'In review', 'review', 'Critical', 0, 3, 1],
  ['ACME-1198', 'story', 'Audit cluster roles before the production switch', 'Go live', 'Blocked', 'todo', 'Critical', -3, 8, 0],
  ['ACME-1312', 'bug', 'Fix the early expiry of the gateway session tokens', 'Unified auth', 'In progress', 'progress', 'Major', 2, 3, 1],
  ['ACME-1277', 'task', 'Trace the webhook pipeline with OpenTelemetry spans', 'Observability', 'To do', 'todo', 'Major', 6, 5, 2],
  ['ACME-1340', 'bug', 'Intermittent readiness failure on the billing service', 'Reliability', 'In progress', 'progress', 'Major', 3, 2, 0],
  ['ACME-1290', 'task', 'Reduce warning noise from the secret operator', 'Observability', 'To do', 'todo', 'Minor', 9, 1, 2],
  ['ACME-1333', 'story', 'Consent screen compliant with the new regulation', 'Go live', 'Done', 'done', 'Minor', -1, 3, 3],
].map(([key, type, summary, epic, status, statusTone, priority, dueIn, points, who]) => ({
  key,
  type,
  summary,
  epic,
  status,
  statusCategory: statusTone === 'done' ? 'done' : statusTone === 'progress' ? 'indeterminate' : 'new',
  statusTone,
  priority,
  assignee: person(who),
  due: daysFrom(dueIn),
  dueDays: dueIn,
  points,
  updated: minutesAgo(40 + dueIn * 7),
  blocked: status === 'Blocked',
  labels: ['platform'],
  url: 'https://example.atlassian.net/browse/' + key,
}));

const containers = [
  {
    id: '9c573ca473f6',
    name: 'gateway',
    image: 'registry.local/gateway:1.14.2',
    state: 'running',
    status: 'Up 3 days',
    health: 'healthy',
    ports: '0.0.0.0:443->443/tcp, 127.0.0.1:8080->8080/tcp',
    cpu: 4.2,
    memPercent: 12.4,
    memUsed: 402_653_184,
    pids: 24,
    netIO: '1.2GB / 470MB',
  },
  {
    id: '1a2b3c4d5e6f',
    name: 'billing',
    image: 'registry.local/billing:2.7.0',
    state: 'running',
    status: 'Up 3 days',
    health: 'healthy',
    ports: '127.0.0.1:9090->9090/tcp',
    cpu: 1.1,
    memPercent: 6.8,
    memUsed: 221_249_536,
    pids: 18,
    netIO: '540MB / 210MB',
  },
  {
    id: '7f8e9d0c1b2a',
    name: 'search',
    image: 'registry.local/search:0.9.3',
    state: 'running',
    status: 'Up 5 hours',
    health: 'none',
    ports: '127.0.0.1:9200->9200/tcp',
    cpu: 0.4,
    memPercent: 22.1,
    memUsed: 734_003_200,
    pids: 41,
    netIO: '88MB / 12MB',
  },
  {
    id: '2b3c4d5e6f70',
    name: 'worker-import',
    image: 'registry.local/worker:2.7.0',
    state: 'exited',
    status: 'Exited (0) 2 days ago',
    health: 'none',
    ports: '',
    cpu: null,
    memPercent: null,
    memUsed: null,
    pids: null,
    netIO: null,
  },
];

const podRows = [
  ['platform', 'gateway-7d9f8c6b5-x2k4m', 'Running', 1, 1, 0, 4],
  ['platform', 'billing-6c8b7d9f4-q9v7t', 'Running', 1, 1, 2, 4],
  ['platform', 'search-5f7d6b8c9-h3n2p', 'Running', 2, 2, 0, 4],
  ['platform', 'import-worker-3a4b5c6d7-j8k9l', 'Running', 1, 1, 12, 4],
  ['observability', 'prometheus-server-0', 'Running', 2, 2, 0, 9],
  ['observability', 'grafana-8f9e7d6c5-p4m2n', 'Running', 3, 3, 1, 9],
  ['security', 'secret-operator-4d5e6f7a8-b1c2d', 'Running', 1, 1, 31, 12],
  ['security', 'policy-audit-2c3d4e5f6-g7h8i', 'CrashLoopBackOff', 0, 1, 84, 0],
  ['ingress', 'edge-proxy-6h7i8j9k0-a1b2c', 'Running', 1, 1, 0, 17],
].map(([namespace, name, phase, ready, containers2, restarts, ageDays]) => ({
  namespace,
  name,
  phase,
  ready,
  containers: containers2,
  restarts,
  waiting: phase === 'CrashLoopBackOff' ? 'CrashLoopBackOff' : null,
  node: 'worker-1',
  age: minutesAgo(ageDays * 24 * 60),
}));

const deployments = [
  ['platform', 'gateway', 2, 2],
  ['platform', 'billing', 2, 2],
  ['platform', 'search', 1, 1],
  ['platform', 'import-worker', 1, 1],
  ['platform', 'legacy-sync', 1, 0],
  ['observability', 'prometheus', 1, 1],
  ['observability', 'grafana', 1, 1],
  ['security', 'policy-audit', 1, 0],
  ['ingress', 'edge-proxy', 2, 2],
].map(([namespace, name, desired, ready]) => ({
  namespace,
  name,
  desired,
  ready,
  available: ready,
  updated: desired,
  id: `${namespace}/${name}`,
}));

const tech = [
  ['open-source model reaches a new quality bar on reasoning benchmarks', 'Example AI Weekly', 3.4, 'https://picsum.photos/seed/ai-1/900/500'],
  ['A practical guide to structured concurrency in modern runtimes', 'Example Engineering', 1.2, 'https://picsum.photos/seed/code-2/900/500'],
  ['Why your build cache stopped working, and how to fix it', 'Example Build Blog', 0.8, null],
  ['Designing an observability pipeline that stays affordable', 'Example Ops Journal', 2.1, 'https://picsum.photos/seed/ops-3/900/500'],
  ['The quiet return of server-rendered interfaces', 'Example Web Review', 5.6, null],
  ['A tour of the new container runtime internals', 'Example Runtime Notes', 1.9, 'https://picsum.photos/seed/runtime-4/900/500'],
].map(([title, source, score, image], index) => ({
  id: `demo-tech-${index}`,
  title,
  url: 'https://example.com/article/' + index,
  summary:
    'A short abstract standing in for the real one, long enough to show how the card clips its text on two lines.',
  published: Date.now() - (index + 1) * 3_600_000 * (index + 1),
  image,
  source,
  score: Math.round(score * 120),
  comments: 12 + index * 7,
  tags: index % 2 === 0 ? ['engineering'] : ['ai', 'tooling'],
  kind: 'news',
}));

const snapshot = {
  ok: true,
  schemaVersion: 3,
  generatedAt: Date.now(),
  startedAt: Date.now() - 86_400_000,
  config: { fastMs: 2000, slowMs: 15000, historySize: 180 },
  meta: {
    hostname: 'studio-mac',
    computerName: 'Studio',
    platform: 'darwin',
    release: '25.0.0',
    arch: 'arm64',
    chip: 'Apple M3 Pro',
    cores: 12,
    memoryTotal: 36 * 1024 ** 3,
    uptime: 86_400 * 3 + 7_200,
    nodeVersion: 'v24.0.0',
  },
  binaries: { docker: '/usr/local/bin/docker', colima: '/usr/local/bin/colima', kubectl: '/usr/local/bin/kubectl', devspace: '/usr/local/bin/devspace' },
  system: {
    ts: Date.now(),
    uptime: 86_400 * 3 + 7_200,
    cpu: { usage: 34.7, perCore: [42, 38, 51, 22, 18, 44, 39, 61, 55, 12, 8, 30], cores: 12, load: [3.1, 2.8, 2.4], loadPercent: 26, coreSplit: { performance: 8, efficiency: 4 } },
    memory: { total: 36 * 1024 ** 3, used: 21 * 1024 ** 3, free: 12 * 1024 ** 3, app: 8 * 1024 ** 3, wired: 3 * 1024 ** 3, compressed: 10 * 1024 ** 3, cached: 3 * 1024 ** 3, freePages: 4 * 1024 ** 3, percent: 58.3 },
    swap: { total: 4 * 1024 ** 3, used: 1.2 * 1024 ** 3, percent: 30 },
    disk: { total: 994 * 1024 ** 3, used: 735 * 1024 ** 3, available: 259 * 1024 ** 3, percent: 74, mount: '/System/Volumes/Data', mounts: [
      { filesystem: '/dev/disk3s1', mount: '/', total: 994 * 1024 ** 3, used: 12 * 1024 ** 3, available: 259 * 1024 ** 3, percent: 12 },
      { filesystem: '/dev/disk3s5', mount: '/System/Volumes/Data', total: 994 * 1024 ** 3, used: 735 * 1024 ** 3, available: 259 * 1024 ** 3, percent: 74 },
    ] },
    net: { rxTotal: 48 * 1024 ** 3, txTotal: 9 * 1024 ** 3, rxRate: 284_000, txRate: 61_000, interfaces: [{ name: 'en0', rx: 48 * 1024 ** 3, tx: 9 * 1024 ** 3, rxRate: 284_000, txRate: 61_000 }] },
    battery: { percent: 82, state: 'discharging', charging: false, remaining: '3:12' },
    processes: [
      { name: 'Docker', cpu: 42.3, mem: 2.1, rss: 786_432_000, pid: 412, elapsed: '03:12:44' },
      { name: 'Google Chrome', cpu: 28.7, mem: 8.4, rss: 3_221_225_472, pid: 902, elapsed: '01:44:03' },
      { name: 'node', cpu: 21.4, mem: 1.7, rss: 651_968_512, pid: 1284, elapsed: '00:52:18' },
      { name: 'WindowServer', cpu: 12.1, mem: 1.1, rss: 421_986_304, pid: 221, elapsed: '03:22:51' },
      { name: 'kubectl', cpu: 8.4, mem: 0.3, rss: 115_343_360, pid: 3310, elapsed: '00:04:12' },
      { name: 'com.docker.backend', cpu: 6.2, mem: 1.9, rss: 712_507_392, pid: 508, elapsed: '03:12:40' },
      { name: 'gh', cpu: 3.1, mem: 0.2, rss: 78_643_200, pid: 4102, elapsed: '00:00:48' },
      { name: 'loginwindow', cpu: 0.8, mem: 0.1, rss: 34_603_008, pid: 180, elapsed: '03:23:02' },
    ],
    processesAvailable: true,
  },
  history,
  infra: {
    docker: {
      available: true,
      clientVersion: '27.4.1',
      summary: { total: 12, running: 3, paused: 0, stopped: 9, images: 34, serverVersion: '27.4.1', driver: 'overlayfs', os: 'Linux', architecture: 'aarch64', cpus: 6, memoryTotal: 8 * 1024 ** 3, cpuTotal: 5.7, memUsed: 1_357_906_432, healthIssues: 0 },
      containers,
      top: containers.filter((entry) => entry.state === 'running'),
      images: [
        { repository: 'registry.local/gateway', tag: '1.14.2', id: 'a1b2c3d4e5f6', size: '412MB', created: '2 weeks ago' },
        { repository: 'registry.local/billing', tag: '2.7.0', id: 'b2c3d4e5f6a1', size: '289MB', created: '2 weeks ago' },
        { repository: 'registry.local/search', tag: '0.9.3', id: 'c3d4e5f6a1b2', size: '1.1GB', created: '5 weeks ago' },
        { repository: 'postgres', tag: '17-alpine', id: 'd4e5f6a1b2c3', size: '243MB', created: '3 months ago' },
      ],
      volumes: [
        { name: 'search-data', driver: 'local', mountpoint: '/var/lib/docker/volumes/search-data/_data' },
        { name: 'billing-db', driver: 'local', mountpoint: '/var/lib/docker/volumes/billing-db/_data' },
        { name: 'gateway-cache', driver: 'local', mountpoint: '/var/lib/docker/volumes/gateway-cache/_data' },
      ],
      networks: [
        { name: 'bridge', driver: 'bridge', scope: 'local' },
        { name: 'platform_default', driver: 'bridge', scope: 'local' },
      ],
      compose: [{ name: 'platform', status: 'running(3)', config: 'compose.yaml' }],
    },
    colima: {
      available: true,
      version: '0.8.4',
      running: true,
      profile: 'default',
      profiles: [{ name: 'default', status: 'running', arch: 'aarch64', cpus: 6, memory: 8 * 1024 ** 3, disk: 120 * 1024 ** 3, runtime: 'docker' }],
      detail: { driver: 'macOS Virtualization.Framework', mountType: 'virtiofs', dockerSocket: 'unix:///Users/demo/.colima/default/docker.sock', containerdSocket: 'unix:///Users/demo/.colima/default/containerd.sock', kubernetes: true, cpu: 6, memory: 8 * 1024 ** 3, disk: 120 * 1024 ** 3 },
      socket: 'unix:///Users/demo/.colima/default/docker.sock',
    },
    kubernetes: {
      available: true,
      connected: true,
      context: 'kind-dev',
      contexts: ['kind-dev', 'staging', 'production'],
      serverVersion: 'v1.31.2',
      nodes: [{ name: 'worker-1', ready: true, pressure: null, version: 'v1.31.2', os: 'Debian GNU/Linux 12', roles: 'control-plane', cpu: 6, memory: 8 * 1024 ** 3, pods: 110, allocatableMemory: 8 * 1024 ** 3, address: '10.0.0.12', containerRuntime: 'containerd://2.0.0', kernel: '6.8.0', created: minutesAgo(60 * 24 * 40) }],
      nodesReady: 1,
      nodesTotal: 1,
      pods: { total: 9, running: 8, pending: 0, failed: 0, succeeded: 0, unknown: 0, restarts: 130 },
      namespaces: 4,
      namespaceList: ['platform', 'observability', 'security', 'ingress'],
      deployments: { total: 9, active: 9, degraded: 2, totalReplicas: 12, readyReplicas: 10, list: deployments },
      events: [
        { namespace: 'security', reason: 'BackOff', message: 'Back-off restarting failed container policy-audit', object: 'pod/policy-audit-2c3d4e5f6-g7h8i', count: 84, at: minutesAgo(4) },
        { namespace: 'platform', reason: 'Unhealthy', message: 'Readiness probe failed: connection refused', object: 'pod/import-worker-3a4b5c6d7-j8k9l', count: 12, at: minutesAgo(9) },
      ],
      blocked: [{ namespace: 'security', name: 'policy-audit-2c3d4e5f6-g7h8i', reason: 'CrashLoopBackOff', restarts: 84 }],
      unhealthy: [],
      podRows,
      namespaceRows: ['platform', 'observability', 'security', 'ingress'].map((name) => ({ name, phase: 'Active', created: minutesAgo(60 * 24 * 40) })),
      namespaceRequests: [
        { namespace: 'observability', cpu: 1.4, memory: 1_610_612_736, pods: 2 },
        { namespace: 'platform', cpu: 1.1, memory: 2_147_483_648, pods: 4 },
        { namespace: 'security', cpu: 0.3, memory: 536_870_912, pods: 2 },
        { namespace: 'ingress', cpu: 0.2, memory: 268_435_456, pods: 1 },
      ],
    },
    devspace: {
      available: true,
      version: '6.3.21',
      sessions: [{ pid: 4242, mode: 'dev', command: 'devspace dev', cwd: '/Users/demo/work/platform', project: 'platform', dependencies: ['gateway', 'billing'] }],
      plugins: [{ name: 'example', version: 'v0.1.0', commands: 3, vars: 4 }],
    },
    asOf: Date.now(),
    refreshing: false,
  },
  jira: {
    configured: true,
    connected: true,
    asOf: Date.now(),
    baseUrl: 'https://example.atlassian.net',
    email: 'demo@example.com',
    tokenSource: 'file:~/.dsh/jira.env',
    account: { name: 'Ada Lovelace', accountId: 'demo' },
    projects: [{ key: 'ACME', name: 'ACME Platform' }, { key: 'OPS', name: 'Operations' }],
    project: { key: 'ACME', name: 'ACME Platform' },
    sprint: { id: 24, name: 'Platform Sprint 24', state: 'active', startDate: daysFrom(-6), endDate: daysFrom(7), daysLeft: 7 },
    jql: 'project = ACME AND resolution = Unresolved',
    issues,
    counts: { todo: 41, progress: 23, review: 9, done: 68, total: 141, blocked: 6, overdue: 3, unassigned: 12, points: 210 },
    progress: 48,
    priorities: [{ label: 'Blocker', value: 3 }, { label: 'Critical', value: 12 }, { label: 'Major', value: 46 }, { label: 'Minor', value: 80 }],
    truncated: true,
  },
  jiraProject: {
    available: true,
    projectKey: 'ACME',
    projectName: 'ACME Platform',
    baseUrl: 'https://example.atlassian.net',
    counts: { open: 141, created7: 19, created30: 72, resolved7: 11, resolved30: 54, overdue: 3, unassigned: 12 },
    byAssignee: [
      { label: 'Ada Lovelace', value: 22 },
      { label: 'Grace Hopper', value: 17 },
      { label: 'Alan Turing', value: 9 },
      { label: 'Katherine Johnson', value: 4 },
    ],
    byEpic: [
      { label: 'Secret hygiene', value: 21 },
      { label: 'Go live', value: 14 },
      { label: 'Observability', value: 9 },
      { label: 'Unified auth', value: 6 },
      { label: 'Reliability', value: 4 },
    ],
    byPriority: [{ label: 'Major', value: 46 }, { label: 'Minor', value: 40 }, { label: 'Critical', value: 12 }, { label: 'Blocker', value: 3 }],
    byStatus: [{ label: 'To do', value: 41 }, { label: 'In progress', value: 23 }, { label: 'In review', value: 9 }, { label: 'Done', value: 68 }],
    sampleSize: 8,
    asOf: Date.now(),
  },
  workspace: {
    github: {
      available: true,
      account: 'demo-user',
      pullRequests: [
        { number: 577, title: 'chore(deps): update the scanner action to v4', repo: 'acme/platform', updated: minutesAgo(70), draft: false, review: 'APPROVED', labels: ['dependencies'], url: 'https://github.com/acme/platform/pull/577' },
        { number: 574, title: 'feat: run containers with a read-only root filesystem', repo: 'acme/platform', updated: minutesAgo(260), draft: false, review: '', labels: ['platform'], url: 'https://github.com/acme/platform/pull/574' },
      ],
      reviews: [
        { number: 412, title: 'fix: retry throttled graph calls transparently', repo: 'acme/billing', updated: minutesAgo(116), draft: false, review: '', labels: [], url: 'https://github.com/acme/billing/pull/412' },
        { number: 409, title: 'feat: add debug logging to the tool bridge', repo: 'acme/billing', updated: minutesAgo(144), draft: false, review: '', labels: [], url: 'https://github.com/acme/billing/pull/409' },
        { number: 388, title: 'chore: bump the runtime image', repo: 'acme/infra', updated: minutesAgo(400), draft: true, review: '', labels: [], url: 'https://github.com/acme/infra/pull/388' },
      ],
      issues: [{ number: 91, title: 'Gateway drops keep-alive on renegotiation', repo: 'acme/platform', updated: minutesAgo(900), draft: false, review: '', labels: ['bug'], url: 'https://github.com/acme/platform/issues/91' }],
      notifications: [
        { id: 'n1', title: 'Security Audit workflow run failed for main branch', reason: 'ci_activity', repo: 'acme/platform', type: 'CheckSuite', updated: minutesAgo(60), unread: true, url: 'https://github.com/acme/platform/actions' },
        { id: 'n2', title: 'Coverage and analysis workflow run failed', reason: 'ci_activity', repo: 'acme/platform', type: 'CheckSuite', updated: minutesAgo(140), unread: true, url: 'https://github.com/acme/platform/actions' },
        { id: 'n3', title: 'Mistral delete requested on a shared mailbox', reason: 'mention', repo: 'acme/ops', type: 'PullRequest', updated: minutesAgo(300), unread: true, url: 'https://github.com/acme/ops/pull/210' },
      ],
      unreadCount: 3,
    },
    confluence: {
      available: true,
      baseUrl: 'https://example.atlassian.net',
      recent: [
        { id: 'c1', title: 'Platform daily — 2026-11-05', space: 'Operations', spaceKey: 'OPS', updated: minutesAgo(45), by: 'Grace Hopper', url: 'https://example.atlassian.net/wiki/spaces/OPS/pages/1' },
        { id: 'c2', title: 'Access rights (staging)', space: 'Platform', spaceKey: 'PLAT', updated: minutesAgo(90), by: 'Ada Lovelace', url: 'https://example.atlassian.net/wiki/spaces/PLAT/pages/2' },
        { id: 'c3', title: 'Cloud posture — recommendations', space: 'Security', spaceKey: 'SEC', updated: minutesAgo(180), by: 'Alan Turing', url: 'https://example.atlassian.net/wiki/spaces/SEC/pages/3' },
        { id: 'c4', title: 'Release checklist v2', space: 'Platform', spaceKey: 'PLAT', updated: minutesAgo(320), by: 'Katherine Johnson', url: 'https://example.atlassian.net/wiki/spaces/PLAT/pages/4' },
      ],
      mine: [
        { id: 'c5', title: 'Secret rotation runbook', space: 'Platform', spaceKey: 'PLAT', updated: minutesAgo(200), by: 'Ada Lovelace', url: 'https://example.atlassian.net/wiki/spaces/PLAT/pages/5' },
        { id: 'c6', title: 'Integration notes — identity provider', space: 'Platform', spaceKey: 'PLAT', updated: minutesAgo(600), by: 'Ada Lovelace', url: 'https://example.atlassian.net/wiki/spaces/PLAT/pages/6' },
      ],
      spaces: [
        { key: 'PLAT', name: 'Platform', type: 'global', url: 'https://example.atlassian.net/wiki/spaces/PLAT' },
        { key: 'OPS', name: 'Operations', type: 'global', url: 'https://example.atlassian.net/wiki/spaces/OPS' },
        { key: 'SEC', name: 'Security', type: 'global', url: 'https://example.atlassian.net/wiki/spaces/SEC' },
      ],
      spaceCount: 3,
    },
    security: { available: true, fileVault: 'on', firewall: 'on', sip: 'on', gatekeeper: 'on', lastUpdate: '2026-11-04 21:12:00 +0000' },
    ports: {
      available: true,
      total: 4,
      exposed: 2,
      ports: [
        { port: 443, host: 'toutes', exposed: true, processes: [{ command: 'gateway', pid: 1201 }] },
        { port: 8080, host: '127.0.0.1', exposed: false, processes: [{ command: 'node', pid: 1284 }] },
        { port: 5432, host: '127.0.0.1', exposed: false, processes: [{ command: 'postgres', pid: 1402 }] },
        { port: 3000, host: 'toutes', exposed: true, processes: [{ command: 'node', pid: 3310 }] },
      ],
    },
    asOf: Date.now(),
  },
  news: {
    tech,
    cyber: {
      advisories: [
        { id: 'ghsa-1', ghsa: 'GHSA-1111-2222-3333', cve: 'CVE-2026-1001', severity: 'critical', summary: 'Sandbox escape in a template engine', published: Date.now() - 3_600_000, url: 'https://github.com/advisories/GHSA-1111-2222-3333', package: 'template-engine', cvss: 9.8 },
        { id: 'ghsa-2', ghsa: 'GHSA-4444-5555-6666', cve: 'CVE-2026-1002', severity: 'high', summary: 'Prototype pollution through merge helper', published: Date.now() - 7_200_000, url: 'https://github.com/advisories/GHSA-4444-5555-6666', package: 'merge-utils', cvss: 7.5 },
        { id: 'ghsa-3', ghsa: 'GHSA-7777-8888-9999', cve: 'CVE-2026-1003', severity: 'moderate', summary: 'Improper input validation in a CLI parser', published: Date.now() - 12_600_000, url: 'https://github.com/advisories/GHSA-7777-8888-9999', package: 'cli-parser', cvss: 5.3 },
      ],
      certAlerts: [
        { id: 'cert-1', title: 'Multiple vulnerabilities in an edge appliance', url: 'https://www.cert.ssi.gouv.fr/alerte/1', published: Date.now() - 5_400_000, severity: 'critical', kind: 'advisory', source: 'CERT-FR', summary: '' },
        { id: 'cert-2', title: 'Vulnerability in an authentication gateway', url: 'https://www.cert.ssi.gouv.fr/alerte/2', published: Date.now() - 90_000_000, severity: 'critical', kind: 'advisory', source: 'CERT-FR', summary: '' },
      ],
      certAdvisories: [
        { id: 'cert-3', title: 'Multiple vulnerabilities in a web framework', url: 'https://www.cert.ssi.gouv.fr/avis/3', published: Date.now() - 8_000_000, severity: 'high', kind: 'advisory', source: 'CERT-FR', summary: '' },
        { id: 'cert-4', title: 'Vulnerability in a mail server', url: 'https://www.cert.ssi.gouv.fr/avis/4', published: Date.now() - 9_000_000, severity: 'high', kind: 'advisory', source: 'CERT-FR', summary: '' },
        { id: 'cert-5', title: 'Vulnerability in a container runtime', url: 'https://www.cert.ssi.gouv.fr/avis/5', published: Date.now() - 11_000_000, severity: 'high', kind: 'advisory', source: 'CERT-FR', summary: '' },
      ],
      attacks: [
        { id: 'bc-1', title: 'Hackers exploit a zero-click flaw in mobile messaging', url: 'https://example.com/attack/1', published: Date.now() - 3_600_000, summary: '' },
        { id: 'bc-2', title: 'Backdoor planted through a compromised update pipeline', url: 'https://example.com/attack/2', published: Date.now() - 14_400_000, summary: '' },
        { id: 'bc-3', title: 'Credential phishing wave targets developer accounts', url: 'https://example.com/attack/3', published: Date.now() - 32_400_000, summary: '' },
      ],
    },
    alerts: [
      { id: 'ghsa-1', title: 'CVE-2026-1001 · Sandbox escape in a template engine', url: 'https://github.com/advisories/GHSA-1111-2222-3333', source: 'GitHub Advisory', tone: 'critical', at: Date.now() - 3_600_000 },
      { id: 'cert-1', title: 'Multiple vulnerabilities in an edge appliance', url: 'https://www.cert.ssi.gouv.fr/alerte/1', source: 'CERT-FR', tone: 'critical', at: Date.now() - 5_400_000 },
    ],
    asOf: Date.now(),
  },
  todos: { total: 6, open: 4, done: 2, overdue: 1, dueToday: 2, high: 2, updatedAt: Date.now() - 600_000 },
  errors: { fast: null, slow: null, jira: null, workspace: null, news: null },
};

/** The to-do tab's list, for the demo screenshot. */
export const demoTodos = [
  { id: 'd1', text: 'Prepare the sprint review deck', done: false, createdAt: Date.now() - 5_400_000, doneAt: null, due: daysFrom(0), priority: 'high' },
  { id: 'd2', text: 'Answer the CERT-FR alert about the edge appliance', done: false, createdAt: Date.now() - 9_000_000, doneAt: null, due: daysFrom(-1), priority: 'high' },
  { id: 'd3', text: 'Rotate the staging identity provider credentials', done: false, createdAt: Date.now() - 90_000_000, doneAt: null, due: daysFrom(2), priority: 'normal' },
  { id: 'd4', text: 'Write up the rollout checklist for v2', done: false, createdAt: Date.now() - 200_000_000, doneAt: null, due: null, priority: 'low' },
  { id: 'd5', text: 'Clean up the unused Docker volumes', done: true, createdAt: Date.now() - 400_000_000, doneAt: Date.now() - 100_000_000, due: null, priority: 'normal' },
  { id: 'd6', text: 'Review the dependency bump pull request', done: true, createdAt: Date.now() - 600_000_000, doneAt: Date.now() - 300_000_000, due: daysFrom(-3), priority: 'normal' },
];

/** A fresh copy, so a caller can mutate one without touching the fixture. */
export function demoSnapshot() {
  return structuredClone(snapshot);
}
