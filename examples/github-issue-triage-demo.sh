#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/taskbrief-github-issue-triage"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

cd "$ROOT"
npm run build >/dev/null

node dist/cli.js parse examples/github-issue-triage.txt \
  --workspace examples/repos.yaml \
  --format markdown \
  --output "$OUT_DIR/task-brief.md"

node dist/cli.js parse examples/github-issue-triage.txt \
  --workspace examples/repos.yaml \
  --crewcmd \
  --output "$OUT_DIR/crewcmd-tasks.json"

node -e "const fs=require('node:fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if (!Array.isArray(data.tasks) || data.tasks.length < 3) process.exit(1);" "$OUT_DIR/crewcmd-tasks.json"
grep -q "httpstubby" "$OUT_DIR/task-brief.md"
grep -q "docfresh" "$OUT_DIR/task-brief.md"
grep -q "repoctx" "$OUT_DIR/task-brief.md"

echo "taskbrief demo wrote $OUT_DIR"
