#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/taskbrief-github-issue-triage"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

cd "$ROOT"
npm run build >/dev/null

echo "== Parse a pasted GitHub issue into a Markdown task queue =="
node dist/cli.js parse examples/github-issue-triage.txt \
  --workspace examples/repos.yaml \
  --format markdown \
  --output "$OUT_DIR/TASKS.md" \
  --orchestration

node dist/cli.js parse examples/github-issue-triage.txt \
  --workspace examples/repos.yaml \
  --crewcmd \
  --output "$OUT_DIR/crewcmd-tasks.json"

node -e "const fs=require('node:fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if (!Array.isArray(data.tasks) || data.tasks.length < 3) process.exit(1);" "$OUT_DIR/crewcmd-tasks.json"
test -s "$OUT_DIR/TASKS.md"
test -s "$OUT_DIR/ORCHESTRATION.md"
test -s "$OUT_DIR/orchestration.json"
grep -q "httpstubby" "$OUT_DIR/TASKS.md"
grep -q "docfresh" "$OUT_DIR/TASKS.md"
grep -q "repoctx" "$OUT_DIR/TASKS.md"
grep -q "branchbrief" "$OUT_DIR/TASKS.md"
grep -q "Do not publish" "$OUT_DIR/TASKS.md"

sed -n '1,120p' "$OUT_DIR/TASKS.md"

echo
echo "== Orchestration handoff =="
sed -n '1,120p' "$OUT_DIR/ORCHESTRATION.md"
echo
echo "taskbrief demo wrote $OUT_DIR"
