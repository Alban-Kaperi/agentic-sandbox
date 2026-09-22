#!/usr/bin/env bash
# Downloads the cluster-snapshot artifact of the given run, or of the latest run on the current branch, into diag/.
# Usage: scripts/fetch-snapshot.sh [run-id]
set -euo pipefail
branch="$(git branch --show-current 2>/dev/null || true)"
run="${1:-$(gh run list --limit 1 ${branch:+--branch "$branch"} --json databaseId --jq '.[0].databaseId')}"
rm -rf diag && mkdir -p diag
gh run download "$run" -n cluster-snapshot -D diag/
echo "snapshot for run $run in diag/ ($(ls diag | wc -l | tr -d ' ') files)"
