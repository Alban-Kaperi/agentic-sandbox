#!/usr/bin/env bash
# Injects repository state at session start: branch, open plans, last pipeline result.
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
branch=$(git branch --show-current 2>/dev/null)
plans=$(ls plans/*.md 2>/dev/null | grep -v README | xargs -n1 basename 2>/dev/null | tr '\n' ' ')
run=""
if command -v gh >/dev/null 2>&1; then
  run=$(gh run list --limit 1 --json conclusion,displayTitle,headBranch --jq '.[0] | "\(.conclusion // "running") on \(.headBranch): \(.displayTitle)"' 2>/dev/null)
fi
msg="Session context: branch=$branch; plans=[${plans:-none}]; last pipeline run: ${run:-unknown}. Read AGENTS.md before changing code."
msg=$(printf '%s' "$msg" | sed 's/"/\\"/g')
printf '{"additionalContext":"%s"}' "$msg"
