#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/taskbrief-dependency-upgrade-demo"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

cd "$ROOT_DIR"
npm run build >/dev/null

node dist/cli.js parse examples/dependency-upgrade-dump.txt \
  --workspace examples/repos.yaml \
  --output "$OUT_DIR/TASKS.md" \
  --orchestration

node dist/cli.js parse examples/dependency-upgrade-dump.txt \
  --workspace examples/repos.yaml \
  --format json \
  --output "$OUT_DIR/tasks.json"

test -s "$OUT_DIR/TASKS.md"
test -s "$OUT_DIR/ORCHESTRATION.md"
test -s "$OUT_DIR/orchestration.json"
test -s "$OUT_DIR/tasks.json"
grep -q "yaml-parser-upgrade" "$OUT_DIR/TASKS.md"
grep -q "lockfile changes include unrelated packages" "$OUT_DIR/TASKS.md"
grep -q "workspace-migration-note" "$OUT_DIR/TASKS.md"
node -e "const fs=require('node:fs'); const data=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (data.tasks.length < 2) process.exit(1);" "$OUT_DIR/tasks.json"

echo "Task queue: $OUT_DIR/TASKS.md"
echo "Orchestration handoff: $OUT_DIR/ORCHESTRATION.md"
echo "JSON queue: $OUT_DIR/tasks.json"
