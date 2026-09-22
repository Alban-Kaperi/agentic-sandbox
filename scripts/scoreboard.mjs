#!/usr/bin/env node
// Room dashboard over all forks of the workshop repository.
// Usage: node scripts/scoreboard.mjs <owner/repo> [out=scoreboard/index.html]
// Loop during the workshop:  while true; do node scripts/scoreboard.mjs MarDonhauser/agentic-sandbox; sleep 60; done
// Rooms, current tickets and the deadline are edited inside the page and kept in the browser (localStorage).
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
const data = forks.map((full) => {
  const issues = gh("issue", "list", "--repo", full, "--state", "all", "--limit", "100", "--json", "number,state,title") ?? [];
  const prs = gh("pr", "list", "--repo", full, "--state", "all", "--limit", "100", "--json", "number,state,title,body,headRefName,mergedAt,url") ?? [];
  const run = (gh("run", "list", "--repo", full, "--limit", "1", "--json", "conclusion,status,url,headBranch") ?? [])[0] ?? null;
  const tickets = TICKETS.map((title, i) => {
    const issue = issues.find((x) => norm(x.title) === norm(title));
    const linked = issue ? prs.filter((p) => new RegExp(`#${issue.number}(?!\\d)`).test(`${p.title} ${p.body ?? ""}`) || p.headRefName.startsWith(`issue-${issue.number}-`)) : [];
    let state = "todo";
    if (!issue) state = "none";
    else if (issue.state === "CLOSED" || linked.some((p) => p.mergedAt)) state = "done";
    else if (linked.some((p) => p.state === "OPEN")) state = "pr";
    return { n: i + 1, state, pr: linked.find((p) => p.state === "OPEN")?.url ?? linked[0]?.url ?? null };
  });
  return { owner: full.split("/")[0], full, tickets, run: run && { conclusion: run.conclusion, status: run.status, url: run.url, branch: run.headBranch } };
});

const glyph = { todo: "○", pr: "◐", done: "●", none: "·" };
console.log(["fork", ...TICKETS.map((_, i) => `#${i + 1}`), "pipeline"].join("\t"));
for (const r of data) console.log([r.owner, ...r.tickets.map((t) => glyph[t.state]), !r.run ? "no run" : r.run.status !== "completed" ? "running" : r.run.conclusion].join("\t"));

const payload = JSON.stringify({ repo, capturedAt: new Date().toISOString(), tickets: TICKETS, forks: data }).replace(/</g, "\\u003c");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="60"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rooms</title>
<style>
:root{color-scheme:light}
body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;margin:0;padding:20px 24px;background:#f7f8fa;color:#17202a}
h1{font-size:1.4rem;margin:0}
.top{display:flex;flex-wrap:wrap;align-items:center;gap:12px 28px;margin-bottom:14px}
.sub{color:#5b6672;font-size:.85rem}
.clock{font-variant-numeric:tabular-nums;font-weight:800;font-size:2.6rem;letter-spacing:-.02em;color:#1e4fa3;line-height:1}
.clock.over{color:#a32c2c}
.clock small{display:block;font-size:.75rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#5b6672}
.ctl{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:end;margin:0 0 14px;font-size:.88rem}
.ctl label{display:flex;flex-direction:column;gap:3px;color:#5b6672;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase}
.ctl input,.ctl textarea{font:inherit;font-size:.95rem;padding:6px 8px;border:1px solid #c9ced6;border-radius:4px;background:#fff;color:#17202a}
.ctl input{width:9em}
.ctl textarea{width:34em;max-width:90vw;height:4.5em;font-family:ui-monospace,Menlo,monospace;font-size:.85rem}
.ctl button{font:600 .8rem system-ui;padding:7px 12px;border:0;border-radius:4px;background:#1e4fa3;color:#fff;cursor:pointer}
details{font-size:.85rem;color:#5b6672;margin-bottom:10px}
table{border-collapse:collapse;background:#fff;font-size:1rem;width:100%;max-width:1100px}
th,td{padding:9px 12px;border-bottom:1px solid #e3e6ea;text-align:center;vertical-align:middle}
th{font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:#5b6672;background:#fafbfc}
td.room{text-align:left;font-weight:700;font-size:1.05rem;white-space:nowrap}
td.members{text-align:left;font-size:.82rem;color:#5b6672}
td.members a{color:#1e4fa3;text-decoration:none}
td.t{font-size:1.15rem}
td.done{color:#1e7b4c}td.pr{color:#b57a00}td.todo{color:#c9ced6}td.none{color:#e3e6ea}
th.cur,td.cur{background:#fff3d6}
td.pipe a{text-decoration:none;font-weight:600}
td.pipe.ok a{color:#1e7b4c}td.pipe.fail a{color:#a32c2c}td.pipe.running a{color:#b57a00}
td.status{font-weight:700}
td.status.ready{color:#1e7b4c}td.status.working{color:#b57a00}td.status.idle{color:#c9ced6}
tr.ready td.room::before{content:"✓ ";color:#1e7b4c}
.legend{margin-top:10px;font-size:.8rem;color:#5b6672}
.unassigned td.room{font-weight:500;color:#5b6672}
</style></head><body>
<div class="top">
  <div><h1>Ticket to deploy, live</h1><div class="sub" id="sub"></div></div>
  <div class="clock" id="clock"><span id="clockv">--:--</span><small id="clockl">deadline</small></div>
</div>
<div class="ctl">
  <label>Current tickets<input id="task" placeholder="2,3"></label>
  <label>Deadline (HH:MM)<input id="until" placeholder="11:00"></label>
  <label>Rooms, one per line: <span style="text-transform:none">Room 1: alice, bob, carol</span><textarea id="rooms" placeholder="Room 1: alice, bob, carol&#10;Room 2: dave, erin"></textarea></label>
  <button id="apply">Apply</button>
</div>
<details><summary>How this works</summary>Fork owners (GitHub logins) map to rooms. A room is <b>ready</b> when every current ticket has a pull request or is closed in at least one of its forks. Settings stay in this browser. The data refreshes every 60 s from the script loop; the countdown runs live.</details>
<table id="tbl"></table>
<div class="legend">○ open &nbsp; ◐ pull request open &nbsp; ● done &nbsp; · no issue yet &nbsp; · yellow column = current ticket &nbsp; · pipeline = last run in the fork</div>
<script>
const DATA=${payload};
const $=(id)=>document.getElementById(id);
const store={get(k,d){try{return localStorage.getItem(k)??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
$("task").value=store.get("sb.task","");$("until").value=store.get("sb.until","");$("rooms").value=store.get("sb.rooms","");
$("apply").onclick=()=>{store.set("sb.task",$("task").value);store.set("sb.until",$("until").value);store.set("sb.rooms",$("rooms").value);render();};
function parseRooms(txt){const map=new Map();txt.split("\\n").forEach(l=>{const m=l.match(/^\\s*([^:]+?)\\s*:\\s*(.+)$/);if(!m)return;m[2].split(/[,\\s]+/).filter(Boolean).forEach(o=>map.set(o.toLowerCase().replace(/^https?:\\/\\/github\\.com\\//,"").split("/")[0],m[1].trim()));});return map;}
function currentTickets(){return $("task").value.split(/[^0-9]+/).filter(Boolean).map(Number);}
function render(){
  const rooms=parseRooms($("rooms").value), cur=currentTickets(), n=DATA.tickets.length;
  const byRoom=new Map();
  DATA.forks.forEach(f=>{const r=rooms.get(f.owner.toLowerCase())??"Unassigned";if(!byRoom.has(r))byRoom.set(r,[]);byRoom.get(r).push(f);});
  const order=[...new Set([...rooms.values()])].filter(r=>byRoom.has(r)).concat(byRoom.has("Unassigned")?["Unassigned"]:[]);
  const glyph={todo:"○",pr:"◐",done:"●",none:"·"};
  let h="<thead><tr><th style='text-align:left'>Room</th><th style='text-align:left'>Forks</th>";
  for(let i=1;i<=n;i++)h+="<th class='"+(cur.includes(i)?"cur":"")+"' title='"+DATA.tickets[i-1].replace(/'/g,"&#39;")+"'>#"+i+"</th>";
  h+="<th>Pipeline</th><th>Status</th></tr></thead><tbody>";
  order.forEach(room=>{
    const fs=byRoom.get(room);
    const agg=Array.from({length:n},(_,i)=>{const st=fs.map(f=>f.tickets[i].state);return st.includes("done")?"done":st.includes("pr")?"pr":st.includes("todo")?"todo":"none";});
    const run=fs.map(f=>f.run).filter(Boolean).sort((a,b)=>(b.status==="completed")-(a.status==="completed"))[0]||null;
    const ready=cur.length>0&&cur.every(i=>["done","pr"].includes(agg[i-1]));
    const working=cur.length>0&&!ready;
    h+="<tr class='"+(ready?"ready":"")+(room==="Unassigned"?" unassigned":"")+"'><td class='room'>"+room+"</td><td class='members'>"+fs.map(f=>"<a href='https://github.com/"+f.full+"'>"+f.owner+"</a>").join(", ")+"</td>";
    agg.forEach((st,i)=>{const pr=fs.map(f=>f.tickets[i].pr).find(Boolean);h+="<td class='t "+st+(cur.includes(i+1)?" cur":"")+"'>"+(pr?"<a href='"+pr+"' style='color:inherit;text-decoration:none'>"+glyph[st]+"</a>":glyph[st])+"</td>";});
    const rc=!run?"":run.status!=="completed"?"running":run.conclusion==="success"?"ok":"fail";
    h+="<td class='pipe "+rc+"'>"+(run?"<a href='"+run.url+"'>"+(run.status!=="completed"?"running":run.conclusion)+"</a>":"no run")+"</td>";
    h+="<td class='status "+(ready?"ready":working?"working":"idle")+"'>"+(ready?"ready":working?"working":"–")+"</td></tr>";
  });
  if(!order.length)h+="<tr><td colspan='"+(n+4)+"' style='text-align:left;color:#5b6672'>No forks yet. Forks appear here once participants fork "+DATA.repo+".</td></tr>";
  $("tbl").innerHTML=h+"</tbody>";
  const readyCount=order.filter(r=>r!=="Unassigned"&&byRoom.get(r)&&cur.length&&cur.every(i=>["done","pr"].includes((()=>{const st=byRoom.get(r).map(f=>f.tickets[i-1].state);return st.includes("done")?"done":st.includes("pr")?"pr":"todo"})()))).length;
  const roomCount=order.filter(r=>r!=="Unassigned").length;
  $("sub").textContent=DATA.forks.length+" forks of "+DATA.repo+" · data "+new Date(DATA.capturedAt).toLocaleTimeString("de-DE")+(cur.length?" · "+readyCount+" of "+roomCount+" rooms ready for #"+cur.join(", #"):"");
}
function tick(){
  const v=$("until").value.match(/^(\\d{1,2}):(\\d{2})$/);
  if(!v){$("clockv").textContent="--:--";$("clock").classList.remove("over");return;}
  const now=new Date(),t=new Date(now);t.setHours(+v[1],+v[2],0,0);
  let d=Math.round((t-now)/1000);const over=d<0;d=Math.abs(d);
  $("clockv").textContent=(over?"+":"")+String(Math.floor(d/60)).padStart(2,"0")+":"+String(d%60).padStart(2,"0");
  $("clockl").textContent=over?"over deadline":"until "+$("until").value;
  $("clock").classList.toggle("over",over);
}
render();tick();setInterval(tick,1000);
</script>
</body></html>`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`\nwritten ${out}`);
