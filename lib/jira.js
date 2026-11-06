/**
 * Jira reader and control surface.
 *
 * Targets the REST API v2, which both Jira Cloud and Data Center serve, so one
 * implementation covers the two deployments. Authentication is either Basic
 * (`email` + API token, Cloud) or Bearer (personal access token, Data Center).
 *
 * Nothing here stores a credential: the token comes from the plugin row's
 * config or from the environment, and it never reaches a snapshot, a log line,
 * or the browser.
 */

import os from 'node:os';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** Fields every issue query asks for; the story-point field is discovered. */
const BASE_FIELDS = [
  'summary',
  'status',
  'priority',
  'assignee',
  'duedate',
  'issuetype',
  'labels',
  'updated',
  'parent',
];

const STATUS_TONE = {
  new: 'todo',
  indeterminate: 'progress',
  done: 'done',
};

const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#a855f7', '#f59e0b', '#10b981', '#ec4899', '#14b8a6'];

const BLOCKED_STATUS = /block|bloqu|waiting|attente|en pause|on hold/i;

/**
 * Read `KEY=value` lines from a private env file.
 * This is where the token lives by default: a dedicated 0600 file rather than
 * the profile patch, so it never appears in a configuration view.
 */
function readEnvFile(file) {
  try {
    const text = readFileSync(file, 'utf8');
    const values = {};
    for (const line of text.split('\n')) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      values[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
    return values;
  } catch {
    return {};
  }
}

/** Default location: `$DSH_HOME/jira.env`, falling back to `~/.dsh/jira.env`. */
function defaultTokenFile(env) {
  const home = env.DSH_HOME || path.join(os.homedir(), '.dsh');
  return path.join(home, 'jira.env');
}

/** Read the Jira settings from the plugin row, then from the environment. */
export function resolveJiraSettings(raw) {
  const config = raw && typeof raw === 'object' ? raw : {};
  const env = process.env;
  const text = (value) => (typeof value === 'string' ? value.trim() : '');
  const list = (value) =>
    (Array.isArray(value) ? value : text(value).split(','))
      .map((entry) => text(entry).toUpperCase())
      .filter(Boolean);

  const tokenFile = text(config.tokenFile) || text(env.JIRA_TOKEN_FILE) || defaultTokenFile(env);
  const file = readEnvFile(tokenFile);

  // Several places may hold a token, and a stale environment variable must not
  // shadow the dedicated file. Every candidate is kept, tried in order, and the
  // winner is named in the snapshot.
  const candidates = [];
  const push = (source, value) => {
    const token = text(value);
    if (token && !candidates.some((entry) => entry.token === token)) candidates.push({ source, token });
  };
  push('config', config.token);
  push(`file:${tokenFile}`, file.JIRA_API_TOKEN || file.JIRA_TOKEN);
  push('env:JIRA_API_TOKEN', env.JIRA_API_TOKEN);
  push('env:JIRA_TOKEN', env.JIRA_TOKEN);

  return {
    tokenFile,
    tokenCandidates: candidates,
    baseUrl: (text(config.baseUrl) || text(env.JIRA_URL) || text(file.JIRA_URL)).replace(/\/+$/, ''),
    email: text(config.email) || text(env.JIRA_EMAIL) || text(file.JIRA_EMAIL),
    token: candidates[0]?.token ?? '',
    authType: text(config.authType).toLowerCase() === 'bearer' ? 'bearer' : 'basic',
    projects: list(config.projects ?? env.JIRA_PROJECTS ?? ''),
    project: text(config.project).toUpperCase(),
    jql: text(config.jql),
    boardId: Number(config.boardId) || null,
    maxIssues: Math.min(Math.max(Number(config.maxIssues) || 120, 10), 300),
    timeoutMs: Math.min(Math.max(Number(config.timeoutMs) || 9000, 2000), 30000),
  };
}

/** What is missing before this integration can talk to Jira, if anything. */
function missingSettings(settings) {
  const missing = [];
  if (!settings.baseUrl) missing.push('JIRA_URL');
  if (!settings.token) {
    missing.push(settings.authType === 'bearer' ? 'JIRA_TOKEN' : 'JIRA_API_TOKEN');
  }
  if (settings.authType === 'basic' && !settings.email) missing.push('JIRA_EMAIL');
  return missing;
}

/* ------------------------------------------------------------------ http */

/**
 * One authenticated JSON request. Always resolves; failures carry a short,
 * credential-free message the panel can show as-is.
 */
async function request(settings, path, { method = 'GET', body, timeoutMs, token } = {}) {
  const url = `${settings.baseUrl}${path}`;
  const headers = { accept: 'application/json' };
  const credential = token ?? settings.token;
  if (settings.authType === 'bearer') {
    headers.authorization = `Bearer ${credential}`;
  } else {
    // Buffer keeps the credentials off the interpreter's string heap longer
    // than a template literal, and btoa does not exist in the Host.
    headers.authorization = `Basic ${Buffer.from(`${settings.email}:${credential}`).toString('base64')}`;
  }
  if (body !== undefined) headers['content-type'] = 'application/json';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? settings.timeoutMs);
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      redirect: 'follow',
    });
    const text = await response.text();
    let json = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }
    if (!response.ok) {
      const detail =
        json?.errorMessages?.[0] ??
        json?.message ??
        (typeof json?.errors === 'object' && json?.errors !== null ? Object.values(json.errors)[0] : null) ??
        `HTTP ${response.status}`;
      return { ok: false, status: response.status, error: String(detail).slice(0, 200), json };
    }
    return { ok: true, status: response.status, json };
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      error: aborted ? `Jira did not answer within ${Math.round((timeoutMs ?? settings.timeoutMs) / 1000)} s` : 'Jira is unreachable',
    };
  } finally {
    clearTimeout(timer);
  }
}

/* ----------------------------------------------------------------- utils */

const STATUS_TONES = ['todo', 'progress', 'review', 'done'];

function initialsOf(name) {
  const parts = String(name ?? '')
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function colorOf(seed) {
  let hash = 0;
  for (const char of String(seed ?? '')) hash = (hash * 31 + char.codePointAt(0)) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Days between today and an ISO date, local to the host. */
function daysUntil(isoDate) {
  if (!isoDate) return null;
  const target = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/* ---------------------------------------------------------------- reader */

/**
 * Build a reader bound to one Jira instance.
 * @param rawSettings - plugin row config; the environment fills the gaps.
 */
export function createJiraReader(rawSettings) {
  const settings = resolveJiraSettings(rawSettings);
  const missing = missingSettings(settings);
  /** Discovered once per process: the story-point field id varies per site. */
  let storyPointsField;
  let storyPointsChecked = false;

  const configured = missing.length === 0;

  async function discoverStoryPoints() {
    if (storyPointsChecked) return storyPointsField;
    storyPointsChecked = true;
    const result = await request(settings, '/rest/api/2/field');
    if (!result.ok || !Array.isArray(result.json)) return undefined;
    const match = result.json.find(
      (field) =>
        field?.custom === true &&
        /^(story points?|story point estimate|estimation)$/i.test(String(field.name ?? '').trim()),
    );
    storyPointsField = match?.id;
    return storyPointsField;
  }

  /**
   * Resolve which project to display: the configured one, then the first of
   * `projects`, then whatever the account can see. No project is special.
   */
  function pickProject(projects) {
    if (settings.project) {
      return (
        projects.find((entry) => entry.key === settings.project) ?? {
          key: settings.project,
          name: settings.project,
        }
      );
    }
    for (const key of settings.projects) {
      const found = projects.find((entry) => entry.key === key);
      if (found) return found;
    }
    return projects[0] ?? null;
  }

  /** The active sprint, when a board id is configured. */
  async function readSprint() {
    if (!settings.boardId) return null;
    const result = await request(
      settings,
      `/rest/agile/1.0/board/${settings.boardId}/sprint?state=active&maxResults=5`,
    );
    if (!result.ok) return null;
    const sprint = result.json?.values?.[0];
    if (!sprint) return null;
    const daysLeft =
      sprint.endDate === undefined
        ? null
        : Math.max(0, Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / 86_400_000));
    return {
      id: Number(sprint.id),
      name: String(sprint.name ?? ''),
      state: String(sprint.state ?? 'active'),
      startDate: sprint.startDate ?? null,
      endDate: sprint.endDate ?? null,
      daysLeft,
    };
  }

  return {
    settings,
    configured,
    missing,

    /** One complete read of the tracked project. */
    async collect() {
      if (!configured) {
        return {
          configured: false,
          reason: 'missing-settings',
          missing,
          baseUrl: settings.baseUrl || null,
          email: settings.email || null,
          authType: settings.authType,
          projects: [],
          issues: [],
        };
      }

      // Authenticate with the first candidate that works, so a stale variable
      // in the host environment cannot shadow a valid token file.
      let me = null;
      let tokenSource = null;
      const tried = [];
      for (const candidate of settings.tokenCandidates) {
        const attempt = await request(settings, '/rest/api/2/myself', { token: candidate.token });
        tried.push({ source: candidate.source, status: attempt.ok ? 200 : attempt.status });
        if (attempt.ok) {
          me = attempt;
          tokenSource = candidate.source;
          settings.token = candidate.token;
          break;
        }
        me = attempt;
      }

      if (!me || !me.ok) {
        const rejected = me?.status === 401 || me?.status === 403;
        return {
          configured: true,
          connected: false,
          reason: rejected ? 'auth-failed' : 'unreachable',
          error: me?.error ?? 'no token available',
          tokenSource: null,
          tried,
          baseUrl: settings.baseUrl,
          email: settings.email,
          projects: [],
          issues: [],
        };
      }

      const projectList = await request(settings, '/rest/api/2/project');

      const projects = Array.isArray(projectList.json)
        ? projectList.json
            .map((entry) => ({ key: String(entry.key ?? ''), name: String(entry.name ?? '') }))
            .filter((entry) => entry.key)
            .sort((left, right) => left.key.localeCompare(right.key))
        : [];

      const project = pickProject(projects);
      const storyField = await discoverStoryPoints();
      const fields = storyField ? [...BASE_FIELDS, storyField] : BASE_FIELDS;

      const jql =
        settings.jql ||
        (project
          ? `project = "${project.key}" AND resolution = Unresolved ORDER BY priority DESC, updated DESC`
          : 'resolution = Unresolved ORDER BY updated DESC');

      // Cloud removed the classic search endpoint; `/search/jql` is the
      // replacement and Data Center does not serve it, so try new then old.
      const params = new URLSearchParams({
        jql,
        maxResults: String(settings.maxIssues),
        fields: fields.join(','),
      });
      const search = await (async () => {
        const modern = await request(settings, `/rest/api/3/search/jql?${params.toString()}`);
        if (modern.ok) {
          return {
            ok: true,
            issues: Array.isArray(modern.json?.issues) ? modern.json.issues : [],
            truncated: Boolean(modern.json?.nextPageToken),
            total: null,
          };
        }
        const classic = await request(settings, `/rest/api/2/search?${params.toString()}`);
        if (classic.ok) {
          const issues = Array.isArray(classic.json?.issues) ? classic.json.issues : [];
          return {
            ok: true,
            issues,
            truncated: Number(classic.json?.total ?? 0) > issues.length,
            total: Number(classic.json?.total ?? 0),
          };
        }
        return { ok: false, error: modern.error || classic.error };
      })();

      const sprint = await readSprint();

      if (!search.ok) {
        return {
          configured: true,
          connected: false,
          reason: 'query-failed',
          error: search.error,
          baseUrl: settings.baseUrl,
          email: settings.email,
          tokenSource,
          account: { name: String(me.json?.displayName ?? ''), accountId: String(me.json?.accountId ?? '') },
          projects,
          project,
          sprint,
          jql,
          issues: [],
        };
      }

      const raw = search.issues ?? [];
      const issues = raw.map((issue) => {
        const value = issue.fields ?? {};
        const categoryKey = String(value.status?.statusCategory?.key ?? 'new');
        const tone = STATUS_TONE[categoryKey] ?? (categoryKey === 'done' ? 'done' : 'todo');
        const dueDays = daysUntil(value.duedate);
        const assigneeName = String(value.assignee?.displayName ?? '');
        return {
          key: String(issue.key ?? ''),
          summary: String(value.summary ?? ''),
          type: String(value.issuetype?.name ?? '').toLowerCase(),
          epic: String(value.parent?.fields?.summary ?? ''),
          status: String(value.status?.name ?? ''),
          statusCategory: categoryKey,
          statusTone: tone === 'progress' && /review|review|relecture/i.test(String(value.status?.name ?? ''))
            ? 'review'
            : tone,
          priority: String(value.priority?.name ?? ''),
          assignee: assigneeName
            ? { name: assigneeName, initials: initialsOf(assigneeName), color: colorOf(assigneeName) }
            : null,
          due: value.duedate ? String(value.duedate) : null,
          dueDays,
          points: storyField ? Number(value[storyField]) || 0 : 0,
          updated: String(value.updated ?? ''),
          blocked: BLOCKED_STATUS.test(String(value.status?.name ?? '')),
          labels: Array.isArray(value.labels) ? value.labels.slice(0, 4).map(String) : [],
          url: `${settings.baseUrl}/browse/${String(issue.key ?? '')}`,
        };
      });

      const counts = { todo: 0, progress: 0, review: 0, done: 0 };
      let blocked = 0;
      let overdue = 0;
      let unassigned = 0;
      let points = 0;
      const priorityTally = new Map();

      for (const issue of issues) {
        counts[issue.statusTone] = (counts[issue.statusTone] ?? 0) + 1;
        if (issue.blocked) blocked += 1;
        // A finished ticket cannot be late, whatever its due date says.
        if (issue.dueDays !== null && issue.dueDays < 0 && issue.statusTone !== 'done') overdue += 1;
        if (!issue.assignee) unassigned += 1;
        points += issue.points;
        const label = issue.priority || 'Aucune';
        priorityTally.set(label, (priorityTally.get(label) ?? 0) + 1);
      }

      const total = issues.length;
      const done = counts.done;
      return {
        configured: true,
        connected: true,
        reason: null,
        asOf: Date.now(),
        baseUrl: settings.baseUrl,
        email: settings.email,
        tokenSource,
        account: {
          name: String(me.json?.displayName ?? ''),
          accountId: String(me.json?.accountId ?? ''),
        },
        projects,
        project,
        sprint,
        jql,
        issues,
        counts: { ...counts, total, blocked, overdue, unassigned, points },
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        priorities: [...priorityTally.entries()]
          .map(([label, value]) => ({ label, value }))
          .sort((left, right) => right.value - left.value)
          .slice(0, 5),
        truncated: search.truncated === true,
        totalKnown: search.total,
      };
    },

    /**
     * Project-level KPIs for the tracked project.
     *
     * Flow numbers come from `approximate-count`, the only endpoint Cloud
     * offers for a cheap total; breakdowns come from the sample the board
     * already loaded, so this costs eight POSTs and no extra issue fetch.
     */
    async projectKpis(sample) {
      if (!configured) return { available: false, reason: 'missing-settings' };
      const projectKey = sample?.project?.key ?? pickProject([])?.key ?? settings.project;
      if (!projectKey) return { available: false, reason: 'no-project' };

      const prefix = `project = "${projectKey}"`;
      const count = async (jql) => {
        const result = await request(settings, '/rest/api/3/search/approximate-count', {
          method: 'POST',
          body: { jql },
        });
        return result.ok ? Number(result.json?.count ?? 0) : null;
      };

      const [open, created7, created30, resolved7, resolved30, overdue, unassigned] = await Promise.all([
        count(`${prefix} AND resolution = Unresolved`),
        count(`${prefix} AND created >= -7d`),
        count(`${prefix} AND created >= -30d`),
        count(`${prefix} AND resolved >= -7d`),
        count(`${prefix} AND resolved >= -30d`),
        count(`${prefix} AND duedate < now() AND resolution = Unresolved`),
        count(`${prefix} AND assignee is EMPTY AND resolution = Unresolved`),
      ]);

      const issues = Array.isArray(sample?.issues) ? sample.issues : [];
      const tally = (keyOf) => {
        const map = new Map();
        for (const issue of issues) {
          const key = keyOf(issue);
          if (!key) continue;
          map.set(key, (map.get(key) ?? 0) + 1);
        }
        return [...map.entries()]
          .map(([label, value]) => ({ label, value }))
          .sort((left, right) => right.value - left.value);
      };

      return {
        available: open !== null,
        projectKey,
        projectName: sample?.project?.name ?? projectKey,
        baseUrl: settings.baseUrl,
        counts: { open, created7, created30, resolved7, resolved30, overdue, unassigned },
        byAssignee: tally((issue) => issue.assignee?.name ?? null).slice(0, 10),
        byEpic: tally((issue) => issue.epic || null).slice(0, 8),
        byPriority: tally((issue) => issue.priority || null),
        byStatus: tally((issue) => issue.status || null).slice(0, 10),
        sampleSize: issues.length,
        asOf: Date.now(),
      };
    },

    /**
     * One issue in detail: description, reporter, subtask progress and the
     * latest comments. Fetched on demand, never for the whole board.
     */
    async issueDetail(key) {
      if (!configured) throw new Error('Jira is not configured');
      const params = new URLSearchParams({
        fields: 'summary,description,comment,status,priority,assignee,reporter,duedate,labels,parent,issuetype,created,updated,subtasks',
      });
      const result = await request(
        settings,
        `/rest/api/2/issue/${encodeURIComponent(key)}?${params.toString()}`,
      );
      if (!result.ok) throw new Error(result.error);
      const value = result.json?.fields ?? {};
      const comments = Array.isArray(value.comment?.comments) ? value.comment.comments : [];
      const subtasks = Array.isArray(value.subtasks) ? value.subtasks : [];
      const done = subtasks.filter((task) => task?.fields?.status?.statusCategory?.key === 'done').length;
      const text = (input) => {
        if (typeof input === 'string') return input.slice(0, 2000);
        if (input && typeof input === 'object') return summarizeAdf(input);
        return '';
      };
      const assigneeName = String(value.assignee?.displayName ?? '');
      const reporterName = String(value.reporter?.displayName ?? '');
      return {
        key: String(result.json?.key ?? key),
        summary: String(value.summary ?? ''),
        type: String(value.issuetype?.name ?? '').toLowerCase(),
        status: String(value.status?.name ?? ''),
        statusCategory: String(value.status?.statusCategory?.key ?? 'new'),
        priority: String(value.priority?.name ?? ''),
        assignee: assigneeName
          ? { name: assigneeName, initials: initialsOf(assigneeName), color: colorOf(assigneeName) }
          : null,
        reporter: reporterName
          ? { name: reporterName, initials: initialsOf(reporterName), color: colorOf(reporterName) }
          : null,
        due: value.duedate ? String(value.duedate) : null,
        dueDays: daysUntil(value.duedate ? String(value.duedate) : null),
        labels: Array.isArray(value.labels) ? value.labels.slice(0, 6).map(String) : [],
        epic: String(value.parent?.fields?.summary ?? ''),
        description: text(value.description),
        subtasks: { total: subtasks.length, done },
        comments: comments
          .slice(-6)
          .map((comment) => ({
            author: String(comment.author?.displayName ?? ''),
            initials: initialsOf(String(comment.author?.displayName ?? '')),
            color: colorOf(String(comment.author?.displayName ?? '')),
            at: String(comment.created ?? ''),
            body: text(comment.body).slice(0, 600),
          })),
        url: `${settings.baseUrl}/browse/${key}`,
      };
    },

    /** The transitions currently offered on one issue. */
    async transitions(key) {
      if (!configured) return [];
      const result = await request(settings, `/rest/api/2/issue/${encodeURIComponent(key)}/transitions`);
      if (!result.ok || !Array.isArray(result.json?.transitions)) return [];
      return result.json.transitions.map((transition) => ({
        id: String(transition.id),
        name: String(transition.name ?? ''),
        to: String(transition.to?.name ?? ''),
        tone: STATUS_TONE[String(transition.to?.statusCategory?.key ?? 'new')] ?? 'todo',
      }));
    },

    /**
     * Move one issue through a transition.
     * The transition id is checked against what Jira currently offers, so an
     * id the browser invented cannot reach the API.
     */
    async transition(key, transitionId) {
      if (!configured) throw new Error('Jira is not configured');
      const offered = await this.transitions(key);
      if (!offered.some((transition) => transition.id === String(transitionId))) {
        const error = new Error(`transition ${String(transitionId)} is not available on ${key}`);
        error.code = 'invalid-target';
        throw error;
      }
      const result = await request(settings, `/rest/api/2/issue/${encodeURIComponent(key)}/transitions`, {
        method: 'POST',
        body: { transition: { id: String(transitionId) } },
      });
      if (!result.ok) throw new Error(result.error);
      return { key, transition: String(transitionId) };
    },
  };
}

/** Reused by the Confluence reader: same site, same credentials. */
export { request as atlassianRequest };

/** Exposed for the render harness and the panel's setup card. */
export const JIRA_ENV_HELP = {
  url: 'JIRA_URL',
  email: 'JIRA_EMAIL',
  token: 'JIRA_API_TOKEN',
  projects: 'JIRA_PROJECTS',
  home: os.homedir(),
};

/** Flatten an Atlassian Document Format node into readable text. */
function summarizeAdf(root) {
  const parts = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'text' && typeof node.text === 'string') parts.push(node.text);
    if (node.type === 'hardBreak') parts.push('\n');
    if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'bulletList') parts.push('\n');
    if (Array.isArray(node.content)) node.content.forEach(walk);
  };
  walk(root);
  return parts.join('').replace(/\n{3,}/g, '\n\n').trim().slice(0, 2000);
}
