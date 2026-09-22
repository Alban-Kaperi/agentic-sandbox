---
name: diagnose-pipeline
description: Find the root cause of a failed pipeline run from the job summary, logs, and the cluster-snapshot artifact before touching code. Use when the ci workflow is red or a deploy step failed.
---

# Diagnose a failed pipeline run

Diagnosis first, fix second. Never change code until you can name the failing step and quote the evidence.

## Steps

1. Identify the run: `gh run list --branch "$(git branch --show-current)" --limit 5` then `gh run view <id>`. Note which job failed: `test` or `deploy-kind`.
2. If `test` failed: `gh run view <id> --log-failed`. The failing assertion or type error is the root cause. Go to step 6.
3. If `deploy-kind` failed: `gh run view <id> --log-failed`. The only red step is the final gate; its log prints the outcome of rollout, stability, smoke, and browser, then pod status, events, and container logs. The rollout, stability, smoke and browser steps show a green tick even when they failed, because the job continues past them to collect diagnostics; read the `outcomes:` line, not the ticks. The same content is the job summary on the run page in the browser.
4. Fetch the snapshot for detail: `gh run download <id> -n cluster-snapshot -D diag/` (or `scripts/fetch-snapshot.sh <id>`). Then read `diag/snapshot.json` or use the `cluster-snapshot` MCP tools: `pods_list`, `pods_describe`, `pods_logs`, `events_list`, `deploy_summary`.
5. Classify the failure and look at the matching evidence:
   - `CrashLoopBackOff` or `Error`: container logs. `logs` holds the output of the last terminated container; `previousLogs` the one before that, if still available. A startup log with `startup failed: invalid configuration` means the environment contract is broken. Compare `src/config.ts` with `k8s/configmap.yaml`.
   - `ImagePullBackOff` or `ErrImageNeverPull`: image name or tag in `k8s/deployment.yaml` does not match what the pipeline built and loaded.
   - Rollout ok but stability failed: the container started and then exited or restarted. Same evidence as CrashLoopBackOff.
   - Pod `Running` but not `Ready`, rollout timeout: readiness probe path or port. The app serves `/health` on 3000.
   - Rollout ok, smoke failed: `/health` did not return `status: ok`. Check the port-forward target and the service port.
   - Smoke ok, browser failed: read the browser step's log first. A `strict mode violation` names two elements that match one locator: a new element on the page collides with a locator an existing spec uses (`getByPlaceholder`, `getByRole('status')`). The fix is in the page, not in the test. For anything else open the `playwright-report` artifact, locate the failing step and screenshot.
6. Write the finding as: failing step, symptom (quoted), root cause (file and line), fix, and how you will verify it. Only then change code.

## Do not

- Do not retry the pipeline hoping it passes.
- Do not edit the workflow file to skip the failing step.
- Do not raise timeouts as a first response.
