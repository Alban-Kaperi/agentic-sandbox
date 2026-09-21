#!/usr/bin/env bash
# Runs after the agent edits a file. Returns a short verdict as additionalContext.
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
[ -d node_modules ] || { printf '{"additionalContext":"Hook: node_modules missing, run npm ci before relying on lint feedback."}'; exit 0; }
out=$(npm run -s lint 2>&1); code=$?
if [ $code -eq 0 ]; then
  msg="Hook: lint (tsc) passed after edit. Run npm test before committing."
else
  short=$(printf '%s' "$out" | grep -E 'error TS' | head -n 8 | sed 's/"/\\"/g' | tr '\n' ' ')
  msg="Hook: lint (tsc) FAILED after edit: $short"
fi
printf '{"additionalContext":"%s"}' "$msg"
