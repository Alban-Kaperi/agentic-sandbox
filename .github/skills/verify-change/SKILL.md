---
name: verify-change
description: Verify a change end to end before opening or updating a pull request: lint, unit tests, build, environment contract, browser check. Use before every PR and after every review round.
---

# Verify a change

Run every step and report the result of each. Do not summarise a failing step as "mostly fine".

1. `npm run verify` (lint, unit tests, build). Paste failures verbatim.
2. Environment contract: list every variable read in `src/config.ts` and confirm each required one exists in `k8s/configmap.yaml` and in the README table.
3. If `public/index.html` or a route used by the page changed: start the server (`npm run dev`) and run `npm run e2e` (needs the browser once: `npx playwright install chromium`). Or click through with the Playwright MCP: open `/`, add a run, confirm it appears. The two specs run in parallel against one shared store, so never assert a fixed total row count.
4. If `k8s/` changed: you cannot verify locally. Say so, push, and read the pipeline summary.
5. Diff review: `git diff --stat` and `git diff`. Confirm no test was weakened, no unrelated file changed, no secret added.
6. Write the verification block for the PR:

```
## Verification
- verify (lint, unit, build): pass | fail (details)
- env contract (`src/config.ts` vs `k8s/configmap.yaml`): ok | gap (which variable)
- browser check: pass | fail | not applicable
- pipeline (run id): pending, filled in once the run finished
- not checked: <what you could not run and why>
```
