#!/usr/bin/env node
// Live scoreboard over all forks of the workshop repository: ticket status per fork plus last pipeline result.
// Usage: node scripts/scoreboard.mjs <owner/repo> [out=scoreboard/index.html]
// During the workshop:  while true; do node scripts/scoreboard.mjs MarDonhauser/agentic-sandbox; sleep 60; done
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repo = process.argv[2];
const out = process.argv[3] ?? "scoreboard/index.html";
if (!repo) { console.error("usage: scoreboard.mjs <owner/repo> [out]"); process.exit(1); }

const gh = (...args) => { try { return JSON.parse(execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }) || "null"); } catch { return null; } };
const ticketsDir = new URL("../docs/tickets/", import.meta.url).pathname;
const TICKETS = readdirSync(ticketsDir).filter((f) => f.endsWith(".md")).sort().map((f) => readFileSync(join(ticketsDir, f), "utf8").split("\n")[0].trim());
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const forks = (gh("api", `repos/${repo}/forks`, "--paginate") ?? []).map((f) => f.full_name).sort();
const rows = forks.map((full) => {
  const issues = gh("issue", "list", "--repo", full, "--state", "all", "--limit", "100", "--json", "number,state,title") ?? [];
  const prs = gh("pr", "list", "--repo", full, "--state", "all", "--limit", "100", "--json", "number,state,title,body,headRefName,mergedAt") ?? [];
  const run = (gh("run", "list", "--repo", full, "--limit", "1", "--json", "conclusion,status,url") ?? [])[0];
  const tickets = TICKETS.map((title, i) => {
    const issue = issues.find((x) => norm(x.title) === norm(title));
    const linked = issue ? prs.filter((p) => new RegExp(`#${issue.number}(?!\\d)`).test(`${p.title} ${p.body ?? ""}`) || p.headRefName.startsWith(`issue-${issue.number}-`)) : [];
    let state = "todo";
    if (!issue) state = "none";
    else if (issue.state === "CLOSED" || linked.some((p) => p.mergedAt)) state = "done";
    else if (linked.some((p) => p.state === "OPEN")) state = "pr";
    return { n: i + 1, state, title };
  });
  return { name: full.split("/")[0], full, tickets, run };
});

const glyph = { todo: "○", pr: "◐", done: "●", none: "·" };
const runText = (r) => !r ? "no run" : r.status !== "completed" ? "running" : (r.conclusion ?? "?");
const runClass = (r) => !r ? "" : r.status !== "completed" ? "running" : r.conclusion === "success" ? "ok" : "fail";

console.log(["fork", ...TICKETS.map((_, i) => `#${i + 1}`), "pipeline"].join("\t"));
for (const r of rows) console.log([r.name, ...r.tickets.map((t) => glyph[t.state]), runText(r.run)].join("\t"));

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="60"><title>Scoreboard</title>
<style>
body{font-family:system-ui,sans-serif;margin:0;padding:24px;background:#f7f8fa;color:#17202a}
h1{font-size:1.5rem;margin:0 0 4px}.sub{color:#5b6672;font-size:.9rem;margin-bottom:16px}
table{border-collapse:collapse;background:#fff;font-size:1.05rem}
th,td{padding:10px 14px;border-bottom:1px solid #e3e6ea;text-align:center}
th{font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:#5b6672}
td.g{text-align:left;font-weight:600}
td.done{color:#1e7b4c}td.pr{color:#b57a00}td.todo{color:#c9ced6}td.none{color:#e3e6ea}
td.ok{background:#e3f3ea;color:#1e7b4c;font-weight:600}td.fail{background:#f8e1e1;color:#a32c2c;font-weight:600}td.running{background:#fff3d6;color:#b57a00}
.legend{margin-top:12px;font-size:.85rem;color:#5b6672}
</style></head><body>
<h1>Ticket to deploy, live</h1>
<div class="sub">${rows.length} forks of ${repo} · updated ${new Date().toLocaleTimeString("de-DE")} · refreshes every 60 s</div>
<table><thead><tr><th style="text-align:left">Fork</th>${TICKETS.map((t, i) => `<th title="${t}">#${i + 1}</th>`).join("")}<th>Pipeline</th></tr></thead>
<tbody>${rows.map((r) => `<tr><td class="g"><a href="https://github.com/${r.full}">${r.name}</a></td>${r.tickets.map((t) => `<td class="${t.state}" title="${t.title}">${glyph[t.state]}</td>`).join("")}<td class="${runClass(r.run)}">${r.run?.url ? `<a href="${r.run.url}">${runText(r.run)}</a>` : runText(r.run)}</td></tr>`).join("")}</tbody></table>
<div class="legend">○ open &nbsp; ◐ pull request open &nbsp; ● done (issue closed or PR merged) &nbsp; · no issue yet &nbsp; · pipeline = last run in the fork</div>
</body></html>`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`\nwritten ${out}`);
