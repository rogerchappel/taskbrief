#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/taskbrief-support-intake-demo"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

npm --prefix "$ROOT_DIR" run build

node "$ROOT_DIR/dist/cli.js" parse \
  "$ROOT_DIR/examples/support-intake-dump.txt" \
  --workspace "$ROOT_DIR/examples/repos.yaml" \
  --output "$OUT_DIR/TASKS.md" \
  --orchestration

node "$ROOT_DIR/dist/cli.js" parse \
  "$ROOT_DIR/examples/support-intake-dump.txt" \
  --workspace "$ROOT_DIR/examples/repos.yaml" \
  --format json \
  --output "$OUT_DIR/tasks.json"

test -s "$OUT_DIR/TASKS.md"
test -s "$OUT_DIR/ORCHESTRATION.md"
test -s "$OUT_DIR/orchestration.json"
test -s "$OUT_DIR/tasks.json"
grep -q "package-script drift" "$OUT_DIR/TASKS.md"
grep -q "private repository path" "$OUT_DIR/TASKS.md"
grep -q "follow-up promo note" "$OUT_DIR/TASKS.md"

echo "Task queue: $OUT_DIR/TASKS.md"
echo "Orchestration brief: $OUT_DIR/ORCHESTRATION.md"
echo "Orchestration JSON: $OUT_DIR/orchestration.json"
echo "Task JSON: $OUT_DIR/tasks.json"
