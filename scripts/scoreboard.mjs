#!/usr/bin/env node
// Builds a live scoreboard over all group repositories: ticket status per group plus last pipeline result.
// Usage: node scripts/scoreboard.mjs <owner> [prefix=agentic-sandbox-group-] [out=scoreboard/index.html]
// Run it in a loop during the workshop:  while true; do node scripts/scoreboard.mjs MarDonhauser; sleep 60; done
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const owner = process.argv[2];
const prefix = process.argv[3] ?? "agentic-sandbox-group-";
const out = process.argv[4] ?? "scoreboard/index.html";
if (!owner) { console.error("usage: scoreboard.mjs <owner> [prefix] [out]"); process.exit(1); }

const gh = (...args) => JSON.parse(execFileSync("gh", args, { encoding: "utf8" }) || "null");
const repos = gh("repo", "list", owner, "--limit", "100", "--json", "name").map((r) => r.name).filter((n) => n.startsWith(prefix)).sort();

const TICKETS = 9;
const groups = repos.map((name) => {
  const full = `${owner}/${name}`;
  const issues = gh("issue", "list", "--repo", full, "--state", "all", "--limit", "50", "--json", "number,state,title");
  const prs = gh("pr", "list", "--repo", full, "--state", "all", "--limit", "50", "--json", "number,state,title,body,headRefName,mergedAt");
  const runs = gh("run", "list", "--repo", full, "--limit", "1", "--json", "conclusion,status,headBranch,url");
  const run = runs[0];
  const byNum = new Map(issues.map((i) => [i.number, i]));
  const tickets = [];
  for (let n = 1; n <= TICKETS; n++) {
    const issue = byNum.get(n);
    const linked = prs.filter((p) => new RegExp(`(?:#|issue-|ticket-|/)${n}(?!\\d)`).test(`${p.title} ${p.body ?? ""} ${p.headRefName}`));
    const merged = linked.some((p) => p.mergedAt);
    const open = linked.some((p) => p.state === "OPEN");
    let state = "todo";
    if (!issue) state = "n/a";
    else if (issue.state === "CLOSED" || merged) state = "done";
    else if (open) state = "pr";
    tickets.push({ n, state, title: issue?.title ?? "" });
  }
  return { name: name.replace(prefix, "group "), full, tickets, run };
});

const glyph = { todo: "○", pr: "◐", done: "●", "n/a": "–" };
const runCell = (r) => !r ? "no run" : r.status !== "completed" ? "running" : (r.conclusion ?? "?");
const runClass = (r) => !r ? "" : r.status !== "completed" ? "running" : r.conclusion === "success" ? "ok" : "fail";

console.log(["group", ...Array.from({ length: TICKETS }, (_, i) => `#${i + 1}`), "pipeline"].join("\t"));
for (const g of groups) console.log([g.name, ...g.tickets.map((t) => glyph[t.state]), runCell(g.run)].join("\t"));

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="60"><title>Scoreboard</title>
<style>
body{font-family:system-ui,sans-serif;margin:0;padding:24px;background:#f7f8fa;color:#17202a}
h1{font-size:1.5rem;margin:0 0 4px}.sub{color:#5b6672;font-size:.9rem;margin-bottom:16px}
table{border-collapse:collapse;background:#fff;font-size:1.05rem}
th,td{padding:10px 14px;border-bottom:1px solid #e3e6ea;text-align:center}
th{font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:#5b6672}
td.g{text-align:left;font-weight:600}
td.done{color:#1e7b4c}td.pr{color:#b57a00}td.todo{color:#c9ced6}
td.ok{background:#e3f3ea;color:#1e7b4c;font-weight:600}td.fail{background:#f8e1e1;color:#a32c2c;font-weight:600}td.running{background:#fff3d6;color:#b57a00}
.legend{margin-top:12px;font-size:.85rem;color:#5b6672}
</style></head><body>
<h1>Ticket to deploy, live</h1>
<div class="sub">${groups.length} groups · updated ${new Date().toLocaleTimeString("de-DE")} · refreshes every 60 s</div>
<table><thead><tr><th style="text-align:left">Group</th>${Array.from({ length: TICKETS }, (_, i) => `<th title="${groups[0]?.tickets[i]?.title ?? ""}">#${i + 1}</th>`).join("")}<th>Pipeline</th></tr></thead>
<tbody>${groups.map((g) => `<tr><td class="g"><a href="https://github.com/${g.full}">${g.name}</a></td>${g.tickets.map((t) => `<td class="${t.state}" title="${t.title}">${glyph[t.state]}</td>`).join("")}<td class="${runClass(g.run)}">${g.run?.url ? `<a href="${g.run.url}">${runCell(g.run)}</a>` : runCell(g.run)}</td></tr>`).join("")}</tbody></table>
<div class="legend">○ open &nbsp; ◐ pull request open &nbsp; ● done (issue closed or PR merged) &nbsp; · pipeline = last run on any branch</div>
</body></html>`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`\nwritten ${out}`);
