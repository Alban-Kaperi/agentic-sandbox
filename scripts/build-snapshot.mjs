import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? "diag";
const read = (f) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), "utf8") : "");
const json = (f) => { try { return JSON.parse(read(f) || "{}"); } catch { return {}; } };

const pods = (json("pods.json").items ?? []).map((p) => {
  const cs = p.status?.containerStatuses ?? [];
  const state = cs[0]?.state ? Object.keys(cs[0].state)[0] : "unknown";
  const reason = cs[0]?.state?.waiting?.reason ?? cs[0]?.state?.terminated?.reason ?? null;
  const name = p.metadata.name;
  return {
    name,
    phase: p.status?.phase,
    ready: cs.every((c) => c.ready),
    restarts: cs.reduce((n, c) => n + (c.restartCount ?? 0), 0),
    state,
    reason,
    image: p.spec?.containers?.[0]?.image,
    describe: read(`describe-${name}.txt`),
    logs: read(`logs-${name}.txt`),
    previousLogs: read(`logs-previous-${name}.txt`),
  };
});

const events = (json("events.json").items ?? [])
  .map((e) => ({ time: e.lastTimestamp ?? e.eventTime, type: e.type, reason: e.reason, object: `${e.involvedObject?.kind}/${e.involvedObject?.name}`, message: e.message }))
  .sort((a, b) => String(a.time).localeCompare(String(b.time)));

const out = { capturedAt: new Date().toISOString(), pods, events, deployment: read("deployment.txt"), files: readdirSync(dir) };
process.stdout.write(JSON.stringify(out, null, 2));
