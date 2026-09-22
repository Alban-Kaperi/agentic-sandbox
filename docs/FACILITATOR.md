# Facilitator guide

## Where the participants' repositories live

Default: **one repository, every participant forks it.** You maintain one repo, each fork is a private working copy with its own pipeline runs and minutes.

- Make the repository public: `gh repo edit <owner>/agentic-sandbox --visibility public --accept-visibility-change-consequences`. Public means anyone can fork without collaborator management, Actions minutes are unlimited in the forks, and the scoreboard can read them.
- Forks start with Actions disabled; every participant enables them once (README step 3).
- Issues are not forked. Either Jira is the ticket source (the `work-ticket` skill creates issues in the fork), or participants run `scripts/seed-issues.sh <their fork>`.
- Groups of three can still work together: each person in their own fork on the same ticket, or one fork per group with the others as collaborators.

**Check first:** if the customer's GitHub accounts carry a suffix like `_vw`, they are Enterprise Managed Users and cannot fork or even open repositories outside their enterprise. Then import this repository into the customer's organisation (GitHub "Import repository"), and participants fork it there. `scripts/create-group-repos.sh` remains for the case that you prefer repos from a template instead of forks.

## Jira

The loop can start in Jira and end with a comment there. Set up once:

1. Create a Jira Cloud site (Free plan, up to 10 users) and a project, note the key (for example `WLTP`).
2. Create an API token for your Atlassian account, then `JIRA_SITE=https://<site>.atlassian.net JIRA_EMAIL=<you> JIRA_TOKEN=<token> JIRA_PROJECT=<KEY> node scripts/seed-jira.mjs` creates the nine tickets.
3. Participants log in once when the Atlassian MCP asks (OAuth). With the 10-user limit, give each group one Jira account.
4. Without Jira the same loop runs on GitHub issues alone; the `work-ticket` skill accepts both.

The Atlassian MCP has no read-only mode. Participants can only do what their Jira account can do, so give the accounts comment and transition rights, nothing else.

## Before the workshop

1. Make the repository public, send the fork link and the README setup steps to the participants a week ahead.
2. Ask everyone to complete the setup (fork, Actions enabled, first pipeline green) before the day. The scoreboard shows who did.
3. Decide tickets vs Jira: issues are seeded from `docs/tickets/`. If the team wants Jira, create a Jira Cloud Free site and paste the same tickets; the Atlassian MCP works against it.
5. Check the Actions minutes budget: private repos in the free plan have 2,000 minutes per month; a full run takes 4 to 6 minutes. Make the repos public or use the customer's organisation if that is tight.
6. Dry run: work ticket 0 and ticket 5 yourself in a group repo with the Copilot CLI and with VS Code.

## Live scoreboard

```
while true; do node scripts/scoreboard.mjs <owner>/agentic-sandbox; sleep 60; done
open scoreboard/index.html     # share this browser tab; it refreshes itself every 60 s
```
The page is a room dashboard. At the top you type the rooms once (`Room 1: alice, bob, carol`, one per line, GitHub logins or fork URLs), the current tickets (`2,3`) and the deadline (`11:00`); all three stay in the browser. Each room shows its forks, one column per ticket (yellow = current), the last pipeline result, and a status: **ready** when every current ticket has a PR or is closed in one of its forks, otherwise **working**. The countdown runs live; the data refreshes every 60 s from the loop. Needs the forks to be readable by your token, which public forks are.

Timer rule: the deadline decides, not the last room. Teams breakout rooms get the same duration; they close automatically. Rooms that finish early take the stretch goal on the task card (ticket #9, the work-ticket skill on #8, or reviewing another room's PR).

## During the day

| Block | Ticket(s) | What participants do | What you look at |
|---|---|---|---|
| Warm-up | #1 | implement the way they work today (no reading of AGENTS.md required), post branch link | diff quality, tests present?, setup problems |
| 1 Instructions | #1 again | new branch, same ticket with the baseline, compare own before/after | tests, error shape, README updated |
| 2 Plan | #2, #3 | `plan-ticket` skill, plan in chat, then implement, PR with template | confirmed / plausible / open in the plan |
| 3 Verification | #4, #6 | hook feedback, `verify-change`, `reviewer` agent, PR | PR template filled, reviewer findings |
| 4 Deploy | #5, then #7 | pipeline red on purpose, `diagnose-pipeline`, fix | root cause named before code changed |
| Reserve | #8, #9 | for fast groups, or two sessions in parallel | merge without conflict |

The traps:
- **#5 metrics**: enabling `METRICS_ENABLED=true` without `METRICS_PORT` makes the pod exit at startup with a clear log line. The pipeline shows `CrashLoopBackOff` and the previous logs. Agents that read `src/config.ts` first avoid it; agents that only edit the ConfigMap hit it.
- **#7 probes**: a readiness probe on `/healthz` (does not exist) keeps the pod from becoming Ready; the rollout times out. The events say `Readiness probe failed: HTTP probe failed with statuscode: 404`.

## Reset between runs

```
scripts/reset-sandbox.sh <owner>/<repo>
```
Closes all issues, deletes all branches except `main`, resets `main` to the template state, and re-seeds the issues.

## What to show from your own stack (recorded, not live)

- A multi-session cockpit with status and next-step per session
- Read-only cluster diagnosis through an MCP server against a real cluster
- The one-flag demo: `READ_ONLY_MODE=true` on the Atlassian MCP, tool list before and after
- Token flow: `aws sso login`, `credential_process`, the agent never sees a credential
