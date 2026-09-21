#!/usr/bin/env bash
# Creates one GitHub issue per file in docs/tickets/ (first line = title, second = labels).
# Usage: scripts/seed-issues.sh <owner/repo>
set -euo pipefail
repo="${1:?usage: seed-issues.sh <owner/repo>}"
dir="$(cd "$(dirname "$0")/.." && pwd)/docs/tickets"
for label in feature bug ops "module:vehicles" "module:validation" "module:delete" "module:ui" "module:k8s" "module:status" "module:logging" "module:summary"; do
  gh label create "$label" --repo "$repo" --force --color "$( [ "$label" = bug ] && echo d73a4a || ([ "$label" = ops ] && echo 0e8a16 || echo 1d76db))" >/dev/null 2>&1 || true
done
for f in "$dir"/*.md; do
  title=$(sed -n '1p' "$f")
  labels=$(sed -n '2p' "$f" | tr -d ' ')
  body=$(tail -n +3 "$f")
  gh issue create --repo "$repo" --title "$title" --label "$labels" --body "$body" >/dev/null
  echo "created: $title"
done
