/**
 * Live probe for the collector. Run with: node tools/probe.mjs
 * Prints one snapshot after two fast ticks and one slow tick.
 */
import { createMonitor } from '../lib/collector.js';

const monitor = createMonitor({ fastMs: 2000, slowMs: 15000, historySize: 60 });
await monitor.start();
await new Promise((resolve) => setTimeout(resolve, 4200));
const snapshot = monitor.snapshot();
monitor.stop();

const compact = {
  meta: snapshot.meta,
  binaries: snapshot.binaries,
  cpu: {
    usage: snapshot.system?.cpu?.usage,
    perCore: snapshot.system?.cpu?.perCore,
    load: snapshot.system?.cpu?.load,
    loadPercent: snapshot.system?.cpu?.loadPercent,
    coreSplit: snapshot.system?.cpu?.coreSplit,
  },
  memory: snapshot.system?.memory,
  swap: snapshot.system?.swap,
  disk: snapshot.system?.disk,
  net: snapshot.system?.net,
  battery: snapshot.system?.battery,
  processes: snapshot.system?.processes,
  historyLength: snapshot.history.length,
  historyTail: snapshot.history.slice(-3),
  errors: snapshot.errors,
};
console.log('=== SYSTEM ===');
console.log(JSON.stringify(compact, null, 2));

console.log('\n=== DOCKER ===');
const docker = snapshot.infra?.docker;
console.log(
  JSON.stringify(
    {
      available: docker?.available,
      reason: docker?.reason,
      error: docker?.error,
      clientVersion: docker?.clientVersion,
      summary: docker?.summary,
      top: docker?.top?.map((c) => ({ name: c.name, cpu: c.cpu, memPct: c.memPercent, state: c.state })),
      containerCount: docker?.containers?.length,
      firstContainer: docker?.containers?.[0],
    },
    null,
    2,
  ),
);

console.log('\n=== COLIMA ===');
console.log(JSON.stringify(snapshot.infra?.colima, null, 2));

console.log('\n=== KUBERNETES ===');
const k8s = snapshot.infra?.kubernetes;
console.log(
  JSON.stringify(
    {
      available: k8s?.available,
      connected: k8s?.connected,
      reason: k8s?.reason,
      error: k8s?.error,
      context: k8s?.context,
      contexts: k8s?.contexts,
      serverVersion: k8s?.serverVersion,
      nodes: k8s?.nodes,
      pods: k8s?.pods,
      namespaces: k8s?.namespaces,
      deployments: k8s?.deployments,
      unhealthy: k8s?.unhealthy?.map((p) => `${p.namespace}/${p.name} ${p.phase} ${p.ready}/${p.containers} r${p.restarts}`),
    },
    null,
    2,
  ),
);

console.log('\n=== DEVSPACE ===');
console.log(JSON.stringify(snapshot.infra?.devspace, null, 2));
