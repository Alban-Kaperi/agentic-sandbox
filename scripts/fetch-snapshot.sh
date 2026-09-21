#!/usr/bin/env bash
# Downloads the cluster-snapshot artifact of the latest (or given) run into diag/.
# Usage: scripts/fetch-snapshot.sh [run-id]
set -euo pipefail
run="${1:-$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')}"
rm -rf diag && mkdir -p diag
gh run download "$run" -n cluster-snapshot -D diag/
echo "snapshot for run $run in diag/ ($(ls diag | wc -l | tr -d ' ') files)"
