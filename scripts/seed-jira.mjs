#!/usr/bin/env node
// Creates one Jira issue per file in docs/tickets/ on a Jira Cloud site (Free plan works).
// Env: JIRA_SITE=https://<name>.atlassian.net  JIRA_EMAIL=you@example.com  JIRA_TOKEN=<api token>  JIRA_PROJECT=<KEY>
// Usage: node scripts/seed-jira.mjs
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const { JIRA_SITE, JIRA_EMAIL, JIRA_TOKEN, JIRA_PROJECT } = process.env;
if (!JIRA_SITE || !JIRA_EMAIL || !JIRA_TOKEN || !JIRA_PROJECT) {
  console.error("set JIRA_SITE, JIRA_EMAIL, JIRA_TOKEN, JIRA_PROJECT"); process.exit(1);
}
const auth = "Basic " + Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString("base64");
const dir = new URL("../docs/tickets/", import.meta.url);
const paragraph = (text) => ({ type: "paragraph", content: text ? [{ type: "text", text }] : [] });
const toAdf = (md) => ({
  type: "doc", version: 1,
  content: md.split("\n").map((l) => l.replace(/^#+\s*/, "").replace(/^- /, "• ")).map(paragraph),
});

for (const f of readdirSync(dir).filter((n) => n.endsWith(".md")).sort()) {
  const lines = readFileSync(join(dir.pathname, f), "utf8").split("\n");
  const summary = lines[0].trim();
  const labels = lines[1].split(",").map((s) => s.trim().replace(/[^a-z0-9:_-]/gi, "-")).filter(Boolean);
  const body = lines.slice(2).join("\n").trim();
  const res = await fetch(`${JIRA_SITE}/rest/api/3/issue`, {
    method: "POST",
    headers: { authorization: auth, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ fields: { project: { key: JIRA_PROJECT }, issuetype: { name: "Task" }, summary, labels, description: toAdf(body) } }),
  });
  const data = await res.json();
  if (!res.ok) { console.error(`failed: ${summary}`, JSON.stringify(data)); process.exit(1); }
  console.log(`created ${data.key}: ${summary}`);
}
