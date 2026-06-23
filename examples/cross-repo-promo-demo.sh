#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/taskbrief-cross-repo-promo"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
cd "$ROOT_DIR"

npm run build
node dist/cli.js parse examples/cross-repo-plan.txt \
  --workspace examples/repos.yaml \
  --output "$OUT_DIR/TASKS.md" \
  --orchestration

test -s "$OUT_DIR/TASKS.md"
test -s "$OUT_DIR/ORCHESTRATION.md"
test -s "$OUT_DIR/orchestration.json"
grep -q "Task Brief" "$OUT_DIR/TASKS.md"
grep -q "Orchestration Handoff" "$OUT_DIR/ORCHESTRATION.md"

node -e "const fs=require('node:fs'); const data=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (!Array.isArray(data.waves) || data.waves.length === 0) process.exit(1);" "$OUT_DIR/orchestration.json"

echo "Cross-repo task queue: $OUT_DIR/TASKS.md"
echo "Cross-repo orchestration: $OUT_DIR/ORCHESTRATION.md"
echo "Machine handoff: $OUT_DIR/orchestration.json"
