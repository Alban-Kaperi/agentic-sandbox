# Facilitator guide

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

## During the day

| Block | Ticket(s) | What participants do | What you look at |
|---|---|---|---|
| Task 0, no net | #1 | implement without reading AGENTS.md (rename it to `AGENTS.off.md` for this task) | diff quality, missing tests |
| 1 Context | #1 again | restore AGENTS.md, same ticket, compare diffs | difference in tests and error shape |
| 2 Plan | #2, #3 | `plan-ticket` skill, plan in chat, then implement | confirmed / plausible / open in the plan |
| 3 Verification | #4, #6 | hook feedback, `verify-change`, `reviewer` agent, PR | PR template filled, reviewer findings |
| 4 Deploy | #5, #7 | pipeline red on purpose, `diagnose-pipeline`, fix | root cause named before code changed |
| 5 Parallel | #8, #9 | two sessions, two tickets, separate modules | merge without conflict |

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
