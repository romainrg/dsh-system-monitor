/**
 * Host half of the system monitor: two raw `webServer` routes serving a
 * cached snapshot of this machine and its container tooling to the Web UI.
 *
 * Why raw routes instead of a Typert Remote: the payload is one read-only
 * document refreshed by a timer, so a plain GET keeps the browser side free of
 * generated descriptors while the reads stay cheap.
 *
 * Security has one home, here. Every route asks the composition's `connection`
 * service for a rejection first (`requestRejection`): its Host/Origin fence
 * defeats DNS rebinding and cross-site calls, and its browser authentication
 * gates every caller before a metric, a container name, or a cluster path is
 * reachable. The routes are read-only; nothing here starts, stops, or writes.
 */

import { ACTIONS, createMonitor } from './lib/collector.js';

/** Route paths; the browser addresses them document-relative. */
export const SNAPSHOT_PATH = '/system-monitor/snapshot';
export const REFRESH_PATH = '/system-monitor/refresh';
export const ACTION_PATH = '/system-monitor/action';
export const TRANSITIONS_PATH = '/system-monitor/transitions';
export const ISSUE_PATH = '/system-monitor/jira/issue';
export const DOCKER_LOG_PATH = '/system-monitor/docker/logs';
export const IMAGE_PATH = '/system-monitor/image';
export const TODOS_PATH = '/system-monitor/todos';

/** Plugin row name, matching `cordis.patch.yml`. */
export const name = 'system-monitor';

/** The route carrier and the trust fence guarding every route. */
export const inject = ['webServer', 'connection'];

/** JSON response, always revalidated: every field is a live measurement. */
function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.setHeader('content-length', Buffer.byteLength(body));
  res.end(body);
}

/** Action bodies are two short strings; anything larger is hostile. */
const MAX_BODY_BYTES = 8 * 1024;

/** Collect a bounded request body as UTF-8 text; null past the ceiling. */
async function readBoundedBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.byteLength;
    if (size > MAX_BODY_BYTES) {
      req.resume();
      return null;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size).toString('utf8');
}

/**
 * Validate one action body at the wire.
 * The action must be on the allowlist and the target must be a short string;
 * whether that string names a real entity is the monitor's decision.
 */
function parseActionBody(text) {
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof body !== 'object' || body === null) return null;
  const { action, target } = body;
  if (typeof action !== 'string' || !ACTIONS.includes(action)) return null;
  if (typeof target !== 'string' || target.length === 0 || target.length > 200) return null;
  // Only Jira transitions carry a value today; it stays a short numeric id.
  if (action === 'jira.transition' && !/^\d{1,12}$/.test(String(body.value ?? ''))) return null;
  return { action, target, value: body.value === undefined ? undefined : String(body.value) };
}

/** 405 with the route's one supported method. */
function sendMethodNotAllowed(res, allow) {
  res.statusCode = 405;
  res.setHeader('allow', allow);
  res.end();
}

/**
 * Read the plugin row's config defensively: a missing or mistyped field falls
 * back to its default instead of failing activation.
 */
/** Ask the to-do route reads its body with the same ceiling as actions. */
const TODO_OPS = new Set(['add', 'toggle', 'update', 'delete', 'clearDone']);

/** Validate one to-do body at the wire; the store validates the rest. */
function parseTodoBody(text) {
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof body !== 'object' || body === null) return null;
  if (!TODO_OPS.has(String(body.op))) return null;
  if (body.op !== 'add' && body.op !== 'clearDone' && typeof body.id !== 'string') return null;
  if (body.text !== undefined && (typeof body.text !== 'string' || body.text.length > 500)) return null;
  if (body.due !== undefined && body.due !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(body.due))) return null;
  if (body.priority !== undefined && !['high', 'normal', 'low'].includes(String(body.priority))) return null;
  return body;
}

function normalizeConfig(raw) {
  const config = raw && typeof raw === 'object' ? raw : {};
  const number = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
  return {
    fastMs: number(config.fastMs, 2000),
    slowMs: number(config.slowMs, 15000),
    historySize: number(config.historySize, 180),
    jiraMs: number(config.jiraMs, 60_000),
    todosFile: typeof config.todosFile === 'string' ? config.todosFile : undefined,
    extraPaths: Array.isArray(config.extraPaths) ? config.extraPaths.filter((entry) => typeof entry === 'string') : [],
    jira: config.jira && typeof config.jira === 'object' ? config.jira : {},
  };
}

/** Connection's trust fence: answer an untrusted request; true when rejected. */
function makeRejection(ctx) {
  return (req, res) => {
    // Typed locally: the connection package is browser-side, the service is not.
    const connection = Reflect.get(ctx, 'connection') ?? null;
    if (!connection || typeof connection.requestRejection !== 'function') return false;
    const rejection = connection.requestRejection(req);
    if (rejection === undefined) return false;
    res.statusCode = rejection;
    res.end();
    return true;
  };
}

/**
 * Mount the monitor and its routes.
 * @param ctx - Host plugin context carrying `webServer` and `connection`.
 * @param rawConfig - the plugin row's config, normalized here.
 */
export function apply(ctx, rawConfig) {
  const config = normalizeConfig(rawConfig);
  const monitor = createMonitor(config);
  const rejected = makeRejection(ctx);

  ctx.effect(
    () => {
      monitor.start().catch((error) => {
        ctx.logger?.warn?.('system-monitor: initial sample failed', error);
      });
      return () => monitor.stop();
    },
    'system-monitor: sampling loop',
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: SNAPSHOT_PATH,
        handler: async (req, res) => {
          if (rejected(req, res)) return;
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            sendMethodNotAllowed(res, 'GET');
            return;
          }
          try {
            sendJson(res, 200, monitor.snapshot());
          } catch (error) {
            sendJson(res, 500, {
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        },
      }),
    `system-monitor: GET ${SNAPSHOT_PATH}`,
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: TODOS_PATH,
        handler: async (req, res) => {
          if (rejected(req, res)) return;
          if (req.method === 'GET') {
            try {
              sendJson(res, 200, { ok: true, ...(await monitor.listTodosWithSummary()) });
            } catch (error) {
              sendJson(res, 500, { ok: false, code: 'store-failed', message: String(error?.message ?? error) });
            }
            return;
          }
          if (req.method !== 'POST') {
            sendMethodNotAllowed(res, 'GET, POST');
            return;
          }
          const mediaType = String(req.headers['content-type'] ?? '')
            .split(';', 1)[0]
            .trim()
            .toLowerCase();
          if (mediaType !== 'application/json') {
            sendJson(res, 415, { ok: false, code: 'media-type', message: 'application/json required' });
            return;
          }
          const text = await readBoundedBody(req);
          if (text === null) {
            sendJson(res, 413, { ok: false, code: 'too-large', message: 'body exceeds 8 KiB' });
            return;
          }
          const request = parseTodoBody(text);
          if (request === null) {
            sendJson(res, 400, { ok: false, code: 'invalid-request', message: 'unknown operation or field' });
            return;
          }
          try {
            sendJson(res, 200, { ok: true, ...(await monitor.mutateTodos(request)) });
          } catch (error) {
            const code = /no such to-do|needs some text|due date|full|unknown operation/i.test(
              String(error?.message ?? ''),
            )
              ? 'invalid-request'
              : 'store-failed';
            sendJson(res, code === 'invalid-request' ? 400 : 500, {
              ok: false,
              code,
              message: String(error?.message ?? error),
            });
          }
        },
      }),
    `system-monitor: GET/POST ${TODOS_PATH}`,
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: IMAGE_PATH,
        handler: async (req, res) => {
          if (rejected(req, res)) return;
          if (req.method !== 'GET') {
            sendMethodNotAllowed(res, 'GET');
            return;
          }
          const url = new URL(String(req.url ?? ''), 'http://localhost');
          const target = String(url.searchParams.get('url') ?? '');
          if (!target || target.length > 2048) {
            sendJson(res, 400, { ok: false, code: 'invalid-target', message: 'an image url is required' });
            return;
          }
          const image = await monitor.image(target);
          if (!image.ok) {
            sendJson(res, image.status || 502, { ok: false, code: 'image-unavailable' });
            return;
          }
          res.statusCode = 200;
          res.setHeader('content-type', image.type);
          res.setHeader('cache-control', 'private, max-age=900');
          res.setHeader('content-length', String(image.bytes.length));
          res.end(image.bytes);
        },
      }),
    `system-monitor: GET ${IMAGE_PATH}`,
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: DOCKER_LOG_PATH,
        handler: async (req, res) => {
          if (rejected(req, res)) return;
          if (req.method !== 'GET') {
            sendMethodNotAllowed(res, 'GET');
            return;
          }
          const url = new URL(String(req.url ?? ''), 'http://localhost');
          const name = String(url.searchParams.get('name') ?? '');
          const lines = Number(url.searchParams.get('lines') ?? 200);
          if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(name)) {
            sendJson(res, 400, { ok: false, code: 'invalid-target', message: 'a container name is required' });
            return;
          }
          try {
            sendJson(res, 200, { ok: true, log: await monitor.dockerLogs(name, lines) });
          } catch (error) {
            const code = typeof error?.code === 'string' ? error.code : 'command-failed';
            sendJson(res, code === 'invalid-target' ? 400 : 502, {
              ok: false,
              code,
              message: error instanceof Error ? error.message : String(error),
            });
          }
        },
      }),
    `system-monitor: GET ${DOCKER_LOG_PATH}`,
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: ISSUE_PATH,
        handler: async (req, res) => {
          if (rejected(req, res)) return;
          if (req.method !== 'GET') {
            sendMethodNotAllowed(res, 'GET');
            return;
          }
          const url = new URL(String(req.url ?? ''), 'http://localhost');
          const key = String(url.searchParams.get('key') ?? '').toUpperCase();
          if (!/^[A-Z][A-Z0-9_]{1,31}-\d{1,10}$/.test(key)) {
            sendJson(res, 400, { ok: false, code: 'invalid-target', message: 'a Jira issue key is required' });
            return;
          }
          try {
            sendJson(res, 200, { ok: true, issue: await monitor.jiraIssue(key) });
          } catch (error) {
            const code = typeof error?.code === 'string' ? error.code : 'query-failed';
            sendJson(res, code === 'invalid-target' ? 400 : 502, {
              ok: false,
              code,
              message: error instanceof Error ? error.message : String(error),
            });
          }
        },
      }),
    `system-monitor: GET ${ISSUE_PATH}`,
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: TRANSITIONS_PATH,
        handler: async (req, res) => {
          if (rejected(req, res)) return;
          if (req.method !== 'GET') {
            sendMethodNotAllowed(res, 'GET');
            return;
          }
          const url = new URL(String(req.url ?? ''), 'http://localhost');
          const key = String(url.searchParams.get('key') ?? '').toUpperCase();
          if (!/^[A-Z][A-Z0-9_]{1,31}-\d{1,10}$/.test(key)) {
            sendJson(res, 400, { ok: false, code: 'invalid-target', message: 'a Jira issue key is required' });
            return;
          }
          try {
            sendJson(res, 200, { ok: true, transitions: await monitor.jiraTransitions(key) });
          } catch (error) {
            const code = typeof error?.code === 'string' ? error.code : 'query-failed';
            sendJson(res, code === 'invalid-target' ? 400 : 502, {
              ok: false,
              code,
              message: error instanceof Error ? error.message : String(error),
            });
          }
        },
      }),
    `system-monitor: GET ${TRANSITIONS_PATH}`,
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: ACTION_PATH,
        handler: async (req, res) => {
          if (rejected(req, res)) return;
          if (req.method !== 'POST') {
            sendMethodNotAllowed(res, 'POST');
            return;
          }
          const mediaType = String(req.headers['content-type'] ?? '')
            .split(';', 1)[0]
            .trim()
            .toLowerCase();
          if (mediaType !== 'application/json') {
            sendJson(res, 415, { ok: false, code: 'media-type', message: 'application/json required' });
            return;
          }
          const text = await readBoundedBody(req);
          if (text === null) {
            sendJson(res, 413, { ok: false, code: 'too-large', message: 'body exceeds 8 KiB' });
            return;
          }
          const request = parseActionBody(text);
          if (request === null) {
            sendJson(res, 400, { ok: false, code: 'invalid-request', message: 'unknown action or target' });
            return;
          }
          try {
            const result = await monitor.perform(request);
            // Publish the consequence immediately instead of waiting a tick.
            const snapshot = await monitor.refreshInfra();
            sendJson(res, 200, { ok: true, result, snapshot });
          } catch (error) {
            const code = typeof error?.code === 'string' ? error.code : 'command-failed';
            const status = code === 'invalid-target' || code === 'unknown-action' ? 400 : 502;
            sendJson(res, status, {
              ok: false,
              code,
              message: error instanceof Error ? error.message : String(error),
            });
          }
        },
      }),
    `system-monitor: POST ${ACTION_PATH}`,
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: REFRESH_PATH,
        handler: async (req, res) => {
          if (rejected(req, res)) return;
          if (req.method !== 'POST') {
            sendMethodNotAllowed(res, 'POST');
            return;
          }
          try {
            sendJson(res, 200, await monitor.refreshAll());
          } catch (error) {
            sendJson(res, 500, {
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        },
      }),
    `system-monitor: POST ${REFRESH_PATH}`,
  );
}
