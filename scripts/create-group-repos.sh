#!/usr/bin/env bash
# Creates N group repositories from the template and seeds their issues.
# Usage: scripts/create-group-repos.sh <owner> <count> [template=MarDonhauser/agentic-sandbox] [--public]
set -euo pipefail
owner="${1:?owner}"; count="${2:?count}"; template="${3:-MarDonhauser/agentic-sandbox}"; vis="${4:---private}"
here="$(cd "$(dirname "$0")" && pwd)"
for i in $(seq -f "%02g" 1 "$count"); do
  repo="$owner/agentic-sandbox-group-$i"
  if gh repo view "$repo" >/dev/null 2>&1; then echo "exists: $repo"; else
    gh repo create "$repo" --template "$template" "$vis" --description "Agentic engineering workshop, group $i" >/dev/null
    echo "created: $repo"
    sleep 5
  fi
  gh api -X PUT "repos/$repo/actions/permissions" -f enabled=true -f allowed_actions=all >/dev/null 2>&1 || true
  "$here/seed-issues.sh" "$repo"
done
