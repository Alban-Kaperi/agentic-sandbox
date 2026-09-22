# Facilitator guide

## Where the participants' repositories live

Default: **one repository, every participant forks it.** You maintain one repo, each fork is a private working copy with its own pipeline runs and minutes.

- The repository is public. Public means anyone can fork without collaborator management, Actions are free in the forks (forks of a public repository are public), and the scoreboard can read them.
- Forks start with Actions disabled; every participant enables them once (README step 3).
- Issues are not forked. Every participant runs `scripts/seed-issues.sh <their fork>` once; it creates the nine tickets from `docs/tickets/` as issues in the fork.
- Groups of three can still work together: each person in their own fork on the same ticket, or one fork per group with the others as collaborators.

**Check first:** if the customer's GitHub accounts carry a suffix like `_vw`, they are Enterprise Managed Users and cannot fork or even open repositories outside their enterprise. The symptom is a bare "Something went wrong!" on the Fork button (verified with an `_lhind` account on 2026-09-22). Then import this repository into the customer's organisation (GitHub "Import repository"), and participants fork it there. Check first that the organisation allows GitHub-hosted runners: a managed user's own repository may answer every push with "GitHub Actions hosted runners are disabled for this repository", and the kind cluster needs a hosted runner or a self-hosted one with Docker. If neither is available, participants use a personal github.com account for the fork, the push and the pipeline; Copilot keeps the company login, because the Copilot CLI login and the `gh` login are independent. `scripts/create-group-repos.sh` remains for the case that you prefer repos from a template instead of forks.

## Before the workshop

1. Make the repository public, send the fork link and the README setup steps to the participants a week ahead.
2. Ask everyone to complete the setup (fork, Actions enabled, first pipeline green) before the day. The scoreboard shows who did.
3. Tickets are GitHub issues, seeded from `docs/tickets/` with `scripts/seed-issues.sh`. Edit the files there if you want other tickets.
4. Actions cost: nothing for public repositories and their forks. Only if the repository is imported into a private organisation do the runs count against that organisation's included minutes (a full run takes 3 to 5 minutes).
5. Dry run: work ticket 1 and ticket 5 yourself in your own fork with the Copilot CLI and with VS Code.

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
- The one-flag demo: `--read-only` on the GitHub MCP server, tool list before and after
- Then hand over to the participant who built his own harness: one ticket, the whole loop, live
- Token flow: `aws sso login`, `credential_process`, the agent never sees a credential
