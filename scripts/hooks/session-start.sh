#!/usr/bin/env bash
# Injects repository state at session start: branch, open plans, last pipeline result.
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
branch=$(git branch --show-current 2>/dev/null)
[ -n "$branch" ] || branch="detached at $(git rev-parse --short HEAD 2>/dev/null)"
plans=$(ls plans/*.md 2>/dev/null | grep -v README | xargs -n1 basename 2>/dev/null | tr '\n' ' ')
run=""
if command -v gh >/dev/null 2>&1; then
  scope=""
  case "$branch" in detached*) ;; *) scope="--branch $branch" ;; esac
  run=$(gh run list --limit 1 $scope --json conclusion,displayTitle,headBranch --jq '.[0] | "\(if .conclusion == "" or .conclusion == null then "running" else .conclusion end) on \(.headBranch): \(.displayTitle)"' 2>/dev/null)
fi
msg="Session context: branch=$branch; plans=[${plans:-none}]; last pipeline run: ${run:-unknown}. Read AGENTS.md before changing code."
msg=$(printf '%s' "$msg" | sed 's/"/\\"/g')
printf '{"additionalContext":"%s"}' "$msg"
