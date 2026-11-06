/**
 * Host-side integration test.
 *
 * Runs the real plugin `apply()` against a stub Cordis context that captures
 * the two registered routes, then exercises them the way the browser does:
 * a snapshot read, a forced refresh, a rejected request, and a wrong method.
 *
 * Run: node tools/host-test.mjs
 */

const TODO_FILE = `/tmp/dsh-monitor-test/todos-${process.pid}.json`;

import { apply, SNAPSHOT_PATH, REFRESH_PATH, ACTION_PATH, TRANSITIONS_PATH, ISSUE_PATH, DOCKER_LOG_PATH, IMAGE_PATH, TODOS_PATH } from '../index.js';

const routes = [];
const disposers = [];
let rejection = undefined;

const ctx = {
  effect(factory, label) {
    const dispose = factory();
    disposers.push({ label, dispose });
    return dispose;
  },
  webServer: {
    register(route) {
      routes.push(route);
      return () => {};
    },
  },
  connection: {
    requestRejection() {
      return rejection;
    },
  },
};

/** A minimal http.IncomingMessage / ServerResponse pair. */
function call(route, { method = 'GET', body } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {};
    const chunks = [];
    const response = {
      statusCode: 200,
      setHeader(name, value) {
        headers[name.toLowerCase()] = value;
      },
      end(payload) {
        chunks.push(payload ?? '');
        const text = chunks.join('');
        let json = null;
        if (String(headers['content-type'] ?? '').includes('application/json')) {
          try {
            json = JSON.parse(text);
          } catch (error) {
            reject(new Error(`invalid JSON: ${error.message}`));
            return;
          }
        }
        resolve({ status: this.statusCode, headers, text, json });
      },
    };
    route.handler({ method, url: route.path, headers: {} }, response).catch(reject);
    void body;
  });
}

const problems = [];
const check = (condition, message) => {
  if (!condition) problems.push(message);
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${message}`);
};

apply(ctx, { fastMs: 1000, slowMs: 10000, historySize: 60, todosFile: TODO_FILE });
check(routes.length === 8, `registered 8 routes (got ${routes.length})`);

const snapshotRoute = routes.find((route) => route.path === SNAPSHOT_PATH);
const refreshRoute = routes.find((route) => route.path === REFRESH_PATH);
check(Boolean(snapshotRoute), `snapshot route at ${SNAPSHOT_PATH}`);
check(Boolean(refreshRoute), `refresh route at ${REFRESH_PATH}`);
check(snapshotRoute.kind === 'exact', 'snapshot route is an exact match');

// Let the monitor prime both tiers before reading.
await new Promise((resolve) => setTimeout(resolve, 6000));

const read = await call(snapshotRoute);
check(read.status === 200, `GET snapshot → 200 (got ${read.status})`);
check(read.headers['cache-control'] === 'no-store', 'snapshot is never cached');

const data = read.json ?? {};
check(data.ok === true, 'payload reports ok');
check(typeof data.meta?.hostname === 'string' && data.meta.hostname.length > 0, `host name: ${data.meta?.hostname}`);
check(Number(data.meta?.cores) > 0, `cores: ${data.meta?.cores}`);
check(Number(data.meta?.memoryTotal) > 0, `memory: ${data.meta?.memoryTotal}`);
check(Number.isFinite(data.system?.cpu?.usage), `cpu usage: ${data.system?.cpu?.usage}`);
check(Array.isArray(data.system?.cpu?.perCore), `per-core samples: ${data.system?.cpu?.perCore?.length}`);
check(Number(data.system?.memory?.percent) > 0, `memory percent: ${data.system?.memory?.percent}`);
check(Number(data.system?.disk?.total) > 0, `disk total: ${data.system?.disk?.total}`);
check(Array.isArray(data.history) && data.history.length > 0, `history length: ${data.history?.length}`);
check(
  data.history.every((point) => typeof point.t === 'number' && typeof point.cpu === 'number'),
  'every history point is numeric',
);
check(
  typeof data.infra?.docker?.available === 'boolean',
  `docker available: ${data.infra?.docker?.available}`,
);
check(
  typeof data.infra?.kubernetes?.available === 'boolean',
  `kubernetes available: ${data.infra?.kubernetes?.available}`,
);
check(typeof data.infra?.devspace?.available === 'boolean', `devspace available: ${data.infra?.devspace?.available}`);
check(typeof data.infra?.colima === 'object' && data.infra.colima !== null, 'colima section present');

// The snapshot must stay small enough to poll twice a second.
const bytes = Buffer.byteLength(read.text);
check(bytes < 400_000, `payload size ${bytes} bytes stays under 400 kB`);

const refreshed = await call(refreshRoute, { method: 'POST' });
check(refreshed.status === 200, `POST refresh → 200 (got ${refreshed.status})`);
check(refreshed.json?.ok === true, 'refresh returns a snapshot');

const notAllowed = await call(snapshotRoute, { method: 'DELETE' });
check(notAllowed.status === 405, `DELETE snapshot → 405 (got ${notAllowed.status})`);
check(notAllowed.headers.allow === 'GET', '405 names the allowed method');

const wrongMethodOnRefresh = await call(refreshRoute, { method: 'GET' });
check(wrongMethodOnRefresh.status === 405, `GET refresh → 405 (got ${wrongMethodOnRefresh.status})`);

// The trust fence must answer before any data is produced.
rejection = 403;
const denied = await call(snapshotRoute);
check(denied.status === 403, `untrusted request → 403 (got ${denied.status})`);
check(denied.text === '', 'a rejected request receives no payload');
rejection = undefined;

// ---- controls -------------------------------------------------------------

const actionRoute = routes.find((route) => route.path === ACTION_PATH);

/** POST one action body; `status` is what the browser would see. */
function post(body, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const headers = { 'content-type': contentType };
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const stream = (async function* () {
      yield Buffer.from(payload);
    })();
    stream.headers = headers;
    stream.method = 'POST';
    const response = {
      statusCode: 200,
      setHeader() {},
      end(text) {
        let json = null;
        try {
          json = JSON.parse(String(text));
        } catch {
          /* not json */
        }
        resolve({ status: this.statusCode, json });
      },
    };
    actionRoute.handler(stream, response).catch(reject);
  });
}

const rejectedAction = await post({ action: 'rm -rf /', target: '/' });
check(rejectedAction.status === 400, `unknown action → 400 (got ${rejectedAction.status})`);

const missingTarget = await post({ action: 'docker.restart', target: 'definitely-not-a-container' });
check(missingTarget.status === 400, `unknown container → 400 (got ${missingTarget.status})`);
check(missingTarget.json?.code === 'invalid-target', 'rejection names invalid-target');

const wrongType = await post({ action: 'docker.restart', target: 'x' }, 'text/plain');
check(wrongType.status === 415, `wrong media type → 415 (got ${wrongType.status})`);

const notObject = await post('[1,2,3]');
check(notObject.status === 400, `array body → 400 (got ${notObject.status})`);

const getAction = await call(actionRoute, { method: 'GET' });
check(getAction.status === 405, `GET action → 405 (got ${getAction.status})`);

// A rejected action must not have signalled anything or run a command.
const sessionsBefore = read.json?.infra?.devspace?.sessions?.length ?? 0;
const badPid = await post({ action: 'devspace.stop', target: '1' });
check(badPid.status === 400, `unknown devspace pid → 400 (got ${badPid.status})`);
check(
  (read.json?.infra?.devspace?.sessions?.length ?? 0) === sessionsBefore,
  'no devspace session was touched',
);

rejection = 403;
const deniedAction = await post({ action: 'docker.restart', target: 'x' });
check(deniedAction.status === 403, `untrusted action → 403 (got ${deniedAction.status})`);
rejection = undefined;

// ---- Jira -----------------------------------------------------------------

const transitionsRoute = routes.find((route) => route.path === TRANSITIONS_PATH);
check(Boolean(transitionsRoute), `transitions route at ${TRANSITIONS_PATH}`);

/** GET the transitions route with a query string. */
function getTransitions(query) {
  return new Promise((resolve, reject) => {
    const response = {
      statusCode: 200,
      setHeader() {},
      end(text) {
        let json = null;
        try {
          json = JSON.parse(String(text));
        } catch {
          /* not json */
        }
        resolve({ status: this.statusCode, json });
      },
    };
    transitionsRoute
      .handler({ method: 'GET', url: `${TRANSITIONS_PATH}?${query}`, headers: {} }, response)
      .catch(reject);
  });
}

const badKey = await getTransitions('key=../../etc/passwd');
check(badKey.status === 400, `malformed issue key → 400 (got ${badKey.status})`);

const unknownIssue = await getTransitions('key=ACME-999999');
check(unknownIssue.status === 400, `unknown issue → 400 (got ${unknownIssue.status})`);
check(unknownIssue.json?.code === 'invalid-target', 'unknown issue names invalid-target');

const transitionWithoutId = await post({ action: 'jira.transition', target: 'ACME-1' });
check(transitionWithoutId.status === 400, `transition without id → 400 (got ${transitionWithoutId.status})`);

const jiraSnapshot = read.json?.jira ?? {};
check(typeof jiraSnapshot.configured === 'boolean', `jira snapshot configured=${jiraSnapshot.configured}`);
check(
  jiraSnapshot.configured === false ? Array.isArray(jiraSnapshot.missing) : true,
  'an unconfigured Jira reports the missing settings',
);
check(
  !JSON.stringify(jiraSnapshot).includes('JIRA_API_TOKEN=') && !('token' in jiraSnapshot),
  'the snapshot never carries a credential',
);

// ---- issue detail ---------------------------------------------------------

const issueRoute = routes.find((route) => route.path === ISSUE_PATH);
check(Boolean(issueRoute), `issue route at ${ISSUE_PATH}`);

const badIssue = await new Promise((resolve, reject) => {
  const response = {
    statusCode: 200,
    setHeader() {},
    end(text) {
      resolve({ status: this.statusCode, json: JSON.parse(String(text)) });
    },
  };
  issueRoute
    .handler({ method: 'GET', url: `${ISSUE_PATH}?key=not-a-key`, headers: {} }, response)
    .catch(reject);
});
check(badIssue.status === 400, `malformed issue key → 400 (got ${badIssue.status})`);

const unknownDetail = await new Promise((resolve, reject) => {
  const response = {
    statusCode: 200,
    setHeader() {},
    end(text) {
      resolve({ status: this.statusCode, json: JSON.parse(String(text)) });
    },
  };
  issueRoute
    .handler({ method: 'GET', url: `${ISSUE_PATH}?key=ACME-4242`, headers: {} }, response)
    .catch(reject);
});
check(unknownDetail.status === 400, `unknown issue detail → 400 (got ${unknownDetail.status})`);

// ---- container logs -------------------------------------------------------

const logRoute = routes.find((route) => route.path === DOCKER_LOG_PATH);
check(Boolean(logRoute), `docker log route at ${DOCKER_LOG_PATH}`);

const badLog = await new Promise((resolve, reject) => {
  const response = { statusCode: 200, setHeader() {}, end(text) { resolve({ status: this.statusCode, json: JSON.parse(String(text)) }); } };
  logRoute.handler({ method: 'GET', url: `${DOCKER_LOG_PATH}?name=../../etc/passwd`, headers: {} }, response).catch(reject);
});
check(badLog.status === 400, `malformed container name → 400 (got ${badLog.status})`);

const unknownLog = await new Promise((resolve, reject) => {
  const response = { statusCode: 200, setHeader() {}, end(text) { resolve({ status: this.statusCode, json: JSON.parse(String(text)) }); } };
  logRoute.handler({ method: 'GET', url: `${DOCKER_LOG_PATH}?name=nope-not-here`, headers: {} }, response).catch(reject);
});
check(unknownLog.status === 400, `unknown container → 400 (got ${unknownLog.status})`);

// ---- image proxy ----------------------------------------------------------

const imageRoute = routes.find((route) => route.path === IMAGE_PATH);
check(Boolean(imageRoute), `image route at ${IMAGE_PATH}`);

/** Ask the proxy for one URL and report only its status. */
function fetchImageRoute(target) {
  return new Promise((resolve, reject) => {
    const response = {
      statusCode: 200,
      headers: {},
      setHeader(name, value) {
        this.headers[String(name).toLowerCase()] = value;
      },
      end(payload) {
        resolve({ status: this.statusCode, headers: this.headers, bytes: payload });
      },
    };
    imageRoute
      .handler({ method: 'GET', url: `${IMAGE_PATH}?url=${encodeURIComponent(target)}`, headers: {} }, response)
      .catch(reject);
  });
}

const localImage = await fetchImageRoute('http://127.0.0.1:53503/secret.png');
check(localImage.status === 403, `loopback image blocked → 403 (got ${localImage.status})`);

const privateImage = await fetchImageRoute('http://192.168.1.1/x.png');
check(privateImage.status === 403, `private address blocked → 403 (got ${privateImage.status})`);

const fileImage = await fetchImageRoute('file:///etc/passwd');
check(fileImage.status === 400, `non-http scheme blocked → 400 (got ${fileImage.status})`);

const newsSnapshot = read.json?.news ?? {};
check(Array.isArray(newsSnapshot.tech), 'the snapshot carries the watch feed');
check(Array.isArray(newsSnapshot.alerts), 'the snapshot carries computed alerts');

// ---- startup shape --------------------------------------------------------

check(read.json?.schemaVersion === 3, `snapshot reports schemaVersion 3 (got ${read.json?.schemaVersion})`);
check(read.json?.news !== undefined, 'the snapshot carries the news section');
check(read.json?.workspace !== undefined, 'the snapshot carries the workspace section');
check(read.json?.jiraProject !== undefined, 'the snapshot carries the project section');

// ---- to-do list -----------------------------------------------------------

const todoRoute = routes.find((route) => route.path === TODOS_PATH);
check(Boolean(todoRoute), `to-do route at ${TODOS_PATH}`);

/** One to-do request, GET or POST. */
function todoCall(method, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
    const stream = (async function* () {
      if (payload) yield Buffer.from(payload);
    })();
    stream.headers = { 'content-type': 'application/json' };
    stream.method = method;
    const response = {
      statusCode: 200,
      setHeader() {},
      end(text) {
        let json = null;
        try {
          json = JSON.parse(String(text));
        } catch {
          /* not json */
        }
        resolve({ status: this.statusCode, json });
      },
    };
    todoRoute.handler(stream, response).catch(reject);
  });
}

const emptyList = await todoCall('GET');
check(emptyList.status === 200 && emptyList.json?.ok === true, `GET to-dos → 200 (got ${emptyList.status})`);
check(emptyList.json?.todos?.length === 0, 'the list starts empty');
check(emptyList.json?.file === TODO_FILE, 'the store honours todosFile');

const added = await todoCall('POST', { op: 'add', text: 'Write the release notes', due: '2026-12-31', priority: 'high' });
check(added.status === 200, `add → 200 (got ${added.status})`);
check(added.json?.todos?.length === 1, 'the item is stored');
check(added.json?.todos?.[0]?.text === 'Write the release notes', 'the text survives the round trip');
check(added.json?.summary?.open === 1 && added.json?.summary?.high === 1, 'the summary follows the list');

const id = added.json?.todos?.[0]?.id;
const toggled = await todoCall('POST', { op: 'toggle', id });
check(toggled.json?.todos?.[0]?.done === true, 'toggle marks it done');
check(toggled.json?.summary?.open === 0, 'the summary follows a toggle');

const badOp = await todoCall('POST', { op: 'drop-database' });
check(badOp.status === 400, `unknown operation → 400 (got ${badOp.status})`);

const badDue = await todoCall('POST', { op: 'add', text: 'x', due: '31/12/2026' });
check(badDue.status === 400, `malformed due date → 400 (got ${badDue.status})`);

const emptyText = await todoCall('POST', { op: 'add', text: '   ' });
check(emptyText.status === 400, `blank text → 400 (got ${emptyText.status})`);

const unknownId = await todoCall('POST', { op: 'toggle', id: 'nope' });
check(unknownId.status === 400, `unknown id → 400 (got ${unknownId.status})`);

const plainType = await todoCall('POST', '{ not json');
check(plainType.status === 400, `unparseable body → 400 (got ${plainType.status})`);

const cleared = await todoCall('POST', { op: 'clearDone' });
check(cleared.json?.todos?.length === 0, 'clearDone empties the list');

rejection = 403;
const deniedTodo = await todoCall('GET');
check(deniedTodo.status === 403, `untrusted to-do read → 403 (got ${deniedTodo.status})`);
rejection = undefined;

// Disposal must stop the sampling loop without throwing.
for (const { dispose } of disposers.reverse()) {
  if (typeof dispose === 'function') dispose();
}
await new Promise((resolve) => setTimeout(resolve, 1500));

console.log(`\n${problems.length === 0 ? 'ALL CHECKS PASSED' : `${problems.length} CHECK(S) FAILED`}`);
if (problems.length > 0) {
  for (const problem of problems) console.error(` - ${problem}`);
  process.exitCode = 1;
}
