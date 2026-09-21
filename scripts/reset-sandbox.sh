#!/usr/bin/env bash
# Resets a group repository: closes issues, deletes non-main branches, re-seeds issues.
# Usage: scripts/reset-sandbox.sh <owner/repo>
set -euo pipefail
repo="${1:?usage: reset-sandbox.sh <owner/repo>}"
here="$(cd "$(dirname "$0")" && pwd)"
for n in $(gh issue list --repo "$repo" --state open --json number --jq '.[].number'); do
  gh issue close "$n" --repo "$repo" --comment "reset" >/dev/null && echo "closed #$n"
done
for n in $(gh pr list --repo "$repo" --state open --json number --jq '.[].number'); do
  gh pr close "$n" --repo "$repo" --delete-branch >/dev/null && echo "closed PR #$n"
done
for b in $(gh api "repos/$repo/branches" --paginate --jq '.[].name' | grep -v '^main$'); do
  gh api -X DELETE "repos/$repo/git/refs/heads/$b" >/dev/null && echo "deleted branch $b"
done
"$here/seed-issues.sh" "$repo"
