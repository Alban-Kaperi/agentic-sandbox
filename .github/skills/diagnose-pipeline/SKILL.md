---
name: diagnose-pipeline
description: Find the root cause of a failed pipeline run from the job summary, logs, and the cluster-snapshot artifact before touching code. Use when the ci workflow is red or a deploy step failed.
---

# Diagnose a failed pipeline run

Diagnosis first, fix second. Never change code until you can name the failing step and quote the evidence.

## Steps

1. Identify the run: `gh run list --limit 5` then `gh run view <id>`. Note which job failed: `test` or `deploy-kind`.
2. If `test` failed: `gh run view <id> --log-failed`. The failing assertion or type error is the root cause. Go to step 6.
3. If `deploy-kind` failed, read the job summary first: it shows the outcome of rollout, smoke, and browser, then pod status, events, and container logs.
4. Fetch the snapshot for detail: `gh run download <id> -n cluster-snapshot -D diag/`. Then read `diag/snapshot.json` (or use the `cluster-snapshot` MCP tools: `pods_list`, `pods_describe`, `pods_logs`, `events_list`).
5. Classify the failure and look at the matching evidence:
   - `CrashLoopBackOff` or `Error`: container logs, especially `previousLogs`. A startup log with `startup failed: invalid configuration` means the environment contract is broken. Compare `src/config.ts` with `k8s/configmap.yaml`.
   - `ImagePullBackOff` or `ErrImageNeverPull`: image name or tag in `k8s/deployment.yaml` does not match what the pipeline built and loaded.
   - Pod `Running` but not `Ready`, rollout timeout: readiness probe path or port. The app serves `/health` on 3000.
   - Rollout ok, smoke failed: `/health` did not return `status: ok`. Check the port-forward target and the service port.
   - Smoke ok, browser failed: open the `playwright-report` artifact. Locate the failing step and screenshot.
6. Write the finding as: failing step, symptom (quoted), root cause (file and line), fix, and how you will verify it. Only then change code.

## Do not

- Do not retry the pipeline hoping it passes.
- Do not edit the workflow file to skip the failing step.
- Do not raise timeouts as a first response.
