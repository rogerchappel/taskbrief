#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/taskbrief-yaml-queue"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

cd "$ROOT_DIR"
npm run build >/dev/null

node dist/cli.js parse examples/cross-repo-plan.txt \
  --workspace examples/repos.yaml \
  --format yaml \
  --output "$OUT_DIR/tasks.yaml"

test -s "$OUT_DIR/tasks.yaml"
grep -Fq 'source: "taskbrief"' "$OUT_DIR/tasks.yaml"
grep -Fq "branchbrief" "$OUT_DIR/tasks.yaml"
grep -Fq "package publishing requested" "$OUT_DIR/tasks.yaml"

echo "YAML task queue: $OUT_DIR/tasks.yaml"
