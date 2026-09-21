# Facilitator guide

## Where the participants' repositories live

Decide this first. It depends on how the customer's GitHub accounts are set up.

| Option | When | How |
|---|---|---|
| **A · Import into the customer's GitHub organisation** (recommended) | Always when the customer uses Enterprise Managed Users (EMU): those accounts cannot access repositories outside their enterprise. Also when the cloud agent should run under the customer's policies. | Someone with org rights imports this repository (GitHub "Import repository" or push a mirror), marks it as template, then runs `scripts/create-group-repos.sh <org> <count> <org>/agentic-sandbox`. Actions minutes are the customer's. |
| **B · Group repos under your account** | Customer accounts can join outside repositories, small group, you want full control. | `scripts/create-group-repos.sh <you> <count>`, add participants as collaborators. Actions minutes are yours (2,000/month on a free private plan, a full run takes about 2.5). |
| **C · Forks by participants** | Participants have their own accounts and want to keep the result. | They fork, enable Actions on the fork, and you run `scripts/seed-issues.sh <their>/<fork>` because issues are not forked. Minutes are theirs. |

Ask the customer: "Do your GitHub accounts have `_<shortcode>` suffixes and can they open public repositories on github.com?" Suffixes mean EMU, and the answer decides between A and B.

## Jira

The loop can start in Jira and end with a comment there. Set up once:

1. Create a Jira Cloud site (Free plan, up to 10 users) and a project, note the key (for example `WLTP`).
2. Create an API token for your Atlassian account, then `JIRA_SITE=https://<site>.atlassian.net JIRA_EMAIL=<you> JIRA_TOKEN=<token> JIRA_PROJECT=<KEY> node scripts/seed-jira.mjs` creates the nine tickets.
3. Participants log in once when the Atlassian MCP asks (OAuth). With the 10-user limit, give each group one Jira account.
4. Without Jira the same loop runs on GitHub issues alone; the `work-ticket` skill accepts both.

The Atlassian MCP has no read-only mode. Participants can only do what their Jira account can do, so give the accounts comment and transition rights, nothing else.

## Before the workshop

1. Create one repository per group from this template:
   ```
   scripts/create-group-repos.sh <owner> <count>        # e.g. MarDonhauser 6
   ```
   The script creates `<owner>/agentic-sandbox-group-01..NN` from the template, enables Actions, and seeds the issues.
2. Add the participants of each group as collaborators (write access).
3. Run one pipeline per repo (push an empty commit) so the first kind run is cached and green.
4. Decide tickets vs Jira: issues are seeded from `docs/tickets/`. If the team wants Jira, create a Jira Cloud Free site and paste the same tickets; the Atlassian MCP works against it.
5. Check the Actions minutes budget: private repos in the free plan have 2,000 minutes per month; a full run takes 4 to 6 minutes. Make the repos public or use the customer's organisation if that is tight.
6. Dry run: work ticket 0 and ticket 5 yourself in a group repo with the Copilot CLI and with VS Code.

## Live scoreboard

```
while true; do node scripts/scoreboard.mjs <owner>; sleep 60; done
open scoreboard/index.html     # share this browser tab; it refreshes itself every 60 s
```
One row per group, one column per ticket (open, PR open, done) plus the last pipeline result. Optional: a GitHub Project (v2) on the owner account that collects the issues of all group repos as a Kanban board; needs the `project` scope on the gh token.

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
