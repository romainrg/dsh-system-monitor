/**
 * Offline render harness.
 *
 * Renders the real `DashboardView` from `client.js` against a live collector
 * snapshot, using a tiny React-compatible serializer. It exists because the
 * dashboard's value is visual: this catches markup and layout mistakes without
 * needing the plugin installed in a profile.
 *
 * Run: node tools/render.mjs
 * Output: tools/preview-dark.html, tools/preview-light.html
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createMonitor } from '../lib/collector.js';

const here = path.dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------- mini React */

const CAMEL_SVG = new Set([
  'viewBox',
  'preserveAspectRatio',
  'gradientUnits',
  'gradientTransform',
  'patternUnits',
  'clipPathUnits',
  'markerWidth',
  'markerHeight',
  'refX',
  'refY',
  'stdDeviation',
]);
const UNITLESS = new Set([
  'opacity',
  'fillOpacity',
  'strokeOpacity',
  'stopOpacity',
  'zIndex',
  'fontWeight',
  'lineHeight',
  'flex',
  'flexGrow',
  'flexShrink',
  'order',
  'zoom',
]);

const kebab = (name) => name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
const escapeText = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function styleToCss(style) {
  return Object.entries(style)
    .filter(([, value]) => value !== null && value !== undefined && value !== false)
    .map(([key, value]) => {
      if (key.startsWith('--')) return `${key}:${value}`;
      const cssValue =
        typeof value === 'number' && !UNITLESS.has(key) ? `${value}px` : String(value);
      return `${kebab(key)}:${cssValue}`;
    })
    .join(';');
}

function attributeName(name) {
  if (name === 'className') return 'class';
  if (name === 'htmlFor') return 'for';
  if (CAMEL_SVG.has(name)) return name;
  return kebab(name);
}

// `<style>` and `<script>` hold raw text: escaping `>` to `&gt;` there would
// silently break child selectors in every preview.
function rawText(node) {
  if (node === null || node === undefined || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(rawText).join('');
  return serialize(node, null);
}

function serialize(node, hooks) {
  if (node === null || node === undefined || node === false || node === true) return '';
  if (typeof node === 'string' || typeof node === 'number') return escapeText(node);
  if (Array.isArray(node)) return node.map((child) => serialize(child, hooks)).join('');
  if (typeof node.type === 'function') {
    if (node.type.prototype && node.type.prototype.isReactComponent) {
      const instance = new node.type(node.props);
      instance.props = node.props;
      instance.state = node.type.getDerivedStateFromError ? {} : {};
      return serialize(instance.render(), hooks);
    }
    return serialize(node.type(node.props ?? {}), hooks);
  }
  if (typeof node.type !== 'string') return '';

  const { type } = node;
  const props = node.props ?? {};
  const attributes = [];
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'key' || key === 'ref') continue;
    if (key.startsWith('on') || typeof value === 'function') continue;
    if (value === null || value === undefined || value === false) continue;
    if (key === 'style') {
      const css = styleToCss(value);
      if (css) attributes.push(`style="${escapeAttr(css)}"`);
      continue;
    }
    attributes.push(`${attributeName(key)}="${escapeAttr(value === true ? '' : value)}"`);
  }
  const open = `<${type}${attributes.length ? ` ${attributes.join(' ')}` : ''}>`;
  const children = props.children ?? [];
  const body = type === 'style' || type === 'script' ? rawText(children) : serialize(children, hooks);
  return `${open}${body}</${type}>`;
}

/** Just enough of React for the dashboard's component graph. */
function createReact() {
  let hookSlots = [];
  let cursor = 0;

  const reset = () => {
    cursor = 0;
  };

  const React = {
    createElement(type, props, ...children) {
      const merged = { ...(props ?? {}) };
      const flat = children.flat(Infinity).filter((child) => child !== undefined && child !== null);
      if (flat.length > 0) merged.children = flat.length === 1 ? flat[0] : flat;
      return { type, props: merged };
    },
    useState(initial) {
      const slot = cursor++;
      if (hookSlots[slot] === undefined) {
        hookSlots[slot] = { value: typeof initial === 'function' ? initial() : initial };
      }
      return [hookSlots[slot].value, () => {}];
    },
    useRef(value) {
      const slot = cursor++;
      if (hookSlots[slot] === undefined) hookSlots[slot] = { current: value ?? null };
      return hookSlots[slot];
    },
    useMemo(factory) {
      cursor += 1;
      return factory();
    },
    useCallback(factory) {
      cursor += 1;
      return factory;
    },
    useEffect() {
      cursor += 1;
    },
    useLayoutEffect() {
      cursor += 1;
    },
    Component: class Component {
      constructor(props) {
        this.props = props;
        this.state = {};
      }
      setState(next) {
        this.state = { ...this.state, ...(typeof next === 'function' ? next(this.state) : next) };
      }
    },
  };
  React.Component.prototype.isReactComponent = {};

  return {
    React,
    render(element) {
      hookSlots = [];
      reset();
      return serialize(element, null);
    },
  };
}

/* ------------------------------------------------------------- html shell */

/**
 * The page fetches card images through the Host's proxy; a static preview has
 * no Host, so the src is rewritten to the origin URL for screenshots only.
 */
function localiseImages(html) {
  return html.replace(/src="system-monitor\/image\?url=([^"&]+)"/g, (_, encoded) => {
    try {
      return `src="${decodeURIComponent(encoded)}"`;
    } catch {
      return 'src=""';
    }
  });
}

function shell({ body, theme, title }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  html,body{margin:0;padding:0;height:100%}
  body{background:${theme === 'dark' ? '#080a10' : '#f6f7fb'};font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif}
  #stage{height:100vh}
</style>
</head>
<body${theme === 'dark' ? ' data-ds-dark-theme' : ''}>
<div id="stage">${body}</div>
</body>
</html>`;
}

/* --------------------------------------------------------------------- run */

// DSM_RENDER_DEMO=1 renders from fictional data: no live read, no personal
// project or host in the screenshots that ship with the package.
const useDemo = process.env.DSM_RENDER_DEMO === '1';
let snapshot;
if (useDemo) {
  const { demoSnapshot } = await import('./demo.mjs');
  snapshot = demoSnapshot();
} else {
  const monitor = createMonitor({ fastMs: 1000, slowMs: 15000, historySize: 180 });
  await monitor.start();
  await new Promise((resolve) => setTimeout(resolve, 26000));
  snapshot = monitor.snapshot();
  monitor.stop();
}

// The chart needs a curve with some movement; six live samples is enough to
// prove the path builder, so the history is padded with the collected points.
const { React, render } = createReact();
const source = await readFile(path.join(here, '..', 'client.js'), 'utf8');

let definition = null;
globalThis.__DSM_TEST__ = true;
const fakeWindow = {
  __ModuleLoader__: {
    load(value) {
      definition = value;
    },
  },
};
// eslint-disable-next-line no-new-func
new Function('window', source)(fakeWindow);
if (!definition) throw new Error('client.js did not register with the module loader');

const module = definition.factory((name) => {
  if (name === 'react') return React;
  throw new Error(`unexpected require: ${name}`);
});
if (typeof module.__view !== 'function') throw new Error('client.js exposes no view');

// Run the real apply() against a stub context so the harness renders with the
// same dictionaries the plugin registers at runtime.
let dictionaries = null;
const stubContext = {
  effect(callback) {
    return typeof callback === 'function' ? callback() : () => {};
  },
  locale: {
    register(_namespace, value) {
      dictionaries = value;
      return () => {};
    },
    bind: () => (key) => key,
  },
  slots: {
    inject: (_owner, callback) => callback(),
    register: () => () => {},
  },
};
module.apply(stubContext);
if (!dictionaries?.fr) throw new Error('apply() registered no French dictionary');

const translate = (key) => dictionaries.fr[key] ?? `[[${key}]]`;

/**
 * A Jira fixture mirroring the shape the Host returns, so the tab can be
 * rendered without a token. `dueDays` is relative to today.
 */
const day = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};
const person = (name, initials, color) => ({ name, initials, color });
const jiraFixture = {
  configured: true,
  connected: true,
  asOf: Date.now(),
  baseUrl: 'https://example.atlassian.net',
  email: 'demo@example.com',
  account: { name: 'Grace Hopper', accountId: 'fixture' },
  projects: [{ key: 'ACME', name: 'ACME Platform' }],
  project: { key: 'ACME', name: 'ACME Platform' },
  sprint: {
    id: 24,
    name: 'Platform Sprint 24',
    state: 'active',
    startDate: '2026-11-03T00:00:00.000Z',
    endDate: '2026-11-16T00:00:00.000Z',
    daysLeft: 4,
  },
  jql: 'project = ACME AND resolution = Unresolved',
  counts: { todo: 41, progress: 23, review: 9, done: 68, total: 141, blocked: 7, overdue: 3, unassigned: 2, points: 210 },
  progress: 48,
  priorities: [
    { label: 'Blocker', value: 3 },
    { label: 'Critique', value: 12 },
    { label: 'Majeur', value: 46 },
    { label: 'Mineur', value: 87 },
  ],
  issues: [
    ['ACME-1284', 'bug', 'Restreindre les secrets ExternalSecret au namespace cowork', 'Secret hygiene', 'En cours', 'progress', 'Blocker', 2, 5, 'Ada Lovelace', 'AL', '#6366f1'],
    ['ACME-1301', 'task', 'Rotation des credentials Zitadel et purge des anciens clients', 'Secret hygiene', 'En revue', 'review', 'Critique', 0, 3, 'Grace Hopper', 'GH', '#0ea5e9'],
    ['ACME-1198', 'story', 'Audit des rôles AKS stg avant bascule production', 'Go live', 'Bloqué', 'todo', 'Critique', -3, 8, 'Ada Lovelace', 'AL', '#6366f1'],
    ['ACME-1312', 'bug', "Corriger l'expiration anticipée des tokens de connect", 'Unified auth', 'En cours', 'progress', 'Majeur', 2, 3, 'Grace Hopper', 'GH', '#0ea5e9'],
    ['ACME-1277', 'task', 'Instrumenter les webhooks connect avec des traces OTel', 'Observability', 'À faire', 'todo', 'Majeur', 6, 5, 'Alan Turing', 'AT', '#a855f7'],
    ['ACME-1340', 'bug', 'Sonde readiness de ticketing-service en échec intermittent', 'Reliability', 'En cours', 'progress', 'Majeur', 3, 2, 'Ada Lovelace', 'AL', '#6366f1'],
    ['ACME-1290', 'task', 'Réduire le bruit des événements Warning sur externalsecret', 'Observability', 'À faire', 'todo', 'Mineur', 9, 1, 'Alan Turing', 'AT', '#a855f7'],
    ['ACME-1333', 'story', 'Écran de consentement Connect conforme DORA', 'Go live', 'Terminé', 'done', 'Mineur', -1, 3, 'Grace Hopper', 'GH', '#0ea5e9'],
  ].map(([key, type, summary, epic, status, statusTone, priority, dueIn, points, who, initials, color]) => ({
    key,
    type,
    summary,
    epic,
    status,
    statusCategory: statusTone === 'done' ? 'done' : statusTone === 'progress' ? 'indeterminate' : 'new',
    statusTone,
    priority,
    assignee: person(who, initials, color),
    due: day(dueIn),
    dueDays: dueIn,
    points,
    updated: new Date(Date.now() - dueIn * 3600_000).toISOString(),
    blocked: status === 'Bloqué',
    labels: ['ACME'],
    url: `https://example.atlassian.net/browse/${key}`,
  })),
  truncated: true,
};

// DSM_RENDER_STALE=1 fakes an older Host, to check the stale-plugin banner.
const baseSnapshot = process.env.DSM_RENDER_STALE === '1' ? { ...snapshot, schemaVersion: 0 } : snapshot;

const renderView = (view, extra) =>
  render(
    React.createElement(module.__view, {
      data: extra?.data ?? baseSnapshot,
      status: 'ready',
      error: null,
      at: Date.now(),
      refreshing: false,
      hidden: false,
      t: translate,
      language: 'fr',
      ...extra,
    }),
  );

const markup = renderView(module.__view, null);

const icon = render(React.createElement(module.__icon, { size: 18, active: true }));

for (const theme of ['dark', 'light']) {
  const html = shell({ body: markup, theme, title: `System monitor — ${theme}` });
  await writeFile(path.join(here, `preview-${theme}.html`), html);
}

// DSM_RENDER_LIVE=1 renders the tab from the real instance instead of the fixture.
let jiraData = jiraFixture;
if (process.env.DSM_RENDER_LIVE === '1') {
  const { createJiraReader } = await import('../lib/jira.js');
  const live = await createJiraReader({}).collect();
  if (live.configured && live.connected && live.issues.length > 0) {
    jiraData = live;
    console.log(`live Jira: ${live.issues.length} issues on ${live.project?.key}`);
  } else {
    console.log(`live Jira unavailable (${live.reason ?? 'unknown'}), using the fixture`);
  }
}

const jiraMarkup = renderView(module.__view, {
  data: { ...snapshot, jira: jiraData },
  tab: 'jira',
});
for (const theme of ['dark', 'light']) {
  const html = shell({ body: jiraMarkup, theme, title: `Jira — ${theme}` });
  await writeFile(path.join(here, `preview-jira-${theme}.html`), html);
}

const issueDetail = {
  key: 'ACME-1284',
  summary: 'Restreindre les secrets ExternalSecret au namespace cowork',
  type: 'bug',
  status: 'En cours',
  statusCategory: 'indeterminate',
  statusTone: 'progress',
  priority: 'Blocker',
  assignee: person('Ada Lovelace', 'AL', '#6366f1'),
  reporter: person('Grace Hopper', 'GH', '#0ea5e9'),
  due: day(2),
  dueDays: 2,
  labels: ['ACME', 'security', 'cowork'],
  epic: 'Secret hygiene',
  description:
    "Six ExternalSecrets de l'espace cowork utilisent encore le secretstore partagé, qui donne accès à l'ensemble du Key Vault.\nLes restreindre à leur périmètre et vérifier que la rotation des credentials Zitadel continue de fonctionner après la bascule.",
  subtasks: { total: 5, done: 3 },
  comments: [
    {
      author: 'Grace Hopper',
      initials: 'GH',
      color: '#0ea5e9',
      at: new Date(Date.now() - 41 * 60_000).toISOString(),
      body: "Le store partagé est encore référencé par connect-ingress-tls. Je le retire dans cette PR, on pourra fermer les deux tickets ensemble.",
    },
    {
      author: 'Ada Lovelace',
      initials: 'AL',
      color: '#6366f1',
      at: new Date(Date.now() - 12 * 60_000).toISOString(),
      body: 'Pris en compte, je passe en En cours après le déploiement de la stg.',
    },
  ],
  url: 'https://example.atlassian.net/browse/ACME-1284',
};

// One preview per tab, from the same live snapshot.
const demo = useDemo ? await import('./demo.mjs') : null;

for (const tab of ['k8s', 'docker', 'processes', 'network', 'security', 'github', 'confluence', 'project', 'todos', 'veille', 'cyber', 'jira']) {
  const markupForTab = renderView(module.__view, {
    data: baseSnapshot,
    tab,
    ...(tab === 'todos' && demo ? { initialTodos: demo.demoTodos } : {}),
  });
  await writeFile(
    path.join(here, `preview-tab-${tab}.html`),
    shell({ body: localiseImages(markupForTab), theme: 'dark', title: tab }),
  );
}

const drawerMarkup = renderView(module.__view, {
  data: { ...snapshot, jira: jiraFixture },
  tab: 'jira',
  initialIssue: { key: 'ACME-1284', detail: { status: 'ready', data: issueDetail } },
});
for (const theme of ['dark', 'light']) {
  const html = shell({ body: drawerMarkup, theme, title: `Jira issue — ${theme}` });
  await writeFile(path.join(here, `preview-jira-issue-${theme}.html`), html);
}

console.log(`rendered ${markup.length} bytes of markup`);
console.log(`history samples: ${snapshot.history.length}`);
console.log(`icon: ${icon.length} bytes`);
