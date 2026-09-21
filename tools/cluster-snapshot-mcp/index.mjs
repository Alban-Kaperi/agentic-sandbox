#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const snapshotPath = resolve(process.env.SNAPSHOT_PATH ?? "diag/snapshot.json");

function load() {
  if (!existsSync(snapshotPath)) {
    throw new Error(`No snapshot at ${snapshotPath}. Run scripts/fetch-snapshot.sh [run-id] first.`);
  }
  return JSON.parse(readFileSync(snapshotPath, "utf8"));
}
const text = (s) => ({ content: [{ type: "text", text: s }] });
const fail = (e) => ({ content: [{ type: "text", text: String(e.message ?? e) }], isError: true });

const server = new McpServer({ name: "cluster-snapshot", version: "1.0.0" });

server.tool("pods_list", "List pods from the last pipeline deploy: phase, ready, restarts, state, reason, image.", {}, async () => {
  try {
    const { pods, capturedAt } = load();
    const rows = pods.map((p) => `${p.name}\tphase=${p.phase}\tready=${p.ready}\trestarts=${p.restarts}\tstate=${p.state}${p.reason ? ` (${p.reason})` : ""}\timage=${p.image}`);
    return text(`snapshot ${capturedAt}\n${rows.join("\n") || "(no pods)"}`);
  } catch (e) { return fail(e); }
});

server.tool("pods_describe", "kubectl describe output of one pod.", { name: z.string() }, async ({ name }) => {
  try {
    const p = load().pods.find((x) => x.name === name);
    return p ? text(p.describe || "(empty)") : fail(new Error(`pod ${name} not in snapshot`));
  } catch (e) { return fail(e); }
});

server.tool("pods_logs", "Container logs of one pod. previous=true returns logs of the last crashed container.", { name: z.string(), previous: z.boolean().optional(), tail: z.number().int().positive().optional() }, async ({ name, previous, tail }) => {
  try {
    const p = load().pods.find((x) => x.name === name);
    if (!p) return fail(new Error(`pod ${name} not in snapshot`));
    const raw = (previous ? p.previousLogs : p.logs) || "(empty)";
    const lines = raw.split("\n");
    return text(tail ? lines.slice(-tail).join("\n") : raw);
  } catch (e) { return fail(e); }
});

server.tool("events_list", "Cluster events of the deploy, oldest first. Filter by substring in reason or message.", { filter: z.string().optional() }, async ({ filter }) => {
  try {
    let ev = load().events;
    if (filter) ev = ev.filter((e) => `${e.reason} ${e.message}`.toLowerCase().includes(filter.toLowerCase()));
    return text(ev.map((e) => `${e.time}\t${e.type}\t${e.reason}\t${e.object}\t${e.message}`).join("\n") || "(no events)");
  } catch (e) { return fail(e); }
});

server.tool("deploy_summary", "Deployment description and a one-line verdict per pod.", {}, async () => {
  try {
    const s = load();
    const verdict = s.pods.map((p) => `${p.name}: ${p.ready ? "READY" : `NOT READY (${p.state}${p.reason ? `: ${p.reason}` : ""}, restarts=${p.restarts})`}`);
    return text(`${verdict.join("\n")}\n\n${s.deployment}`);
  } catch (e) { return fail(e); }
});

await server.connect(new StdioServerTransport());
