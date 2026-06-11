#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/taskbrief-release-readiness-demo"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

echo "== Render a Markdown task queue from a messy release brain dump =="
node "$ROOT_DIR/dist/cli.js" parse \
  "$ROOT_DIR/examples/release-readiness-brain-dump.txt" \
  --workspace "$ROOT_DIR/examples/repos.yaml" \
  --output "$OUT_DIR/TASKS.md"

sed -n '1,120p' "$OUT_DIR/TASKS.md"

echo
echo "== Render CrewCMD-compatible JSON for the same input =="
node "$ROOT_DIR/dist/cli.js" parse \
  "$ROOT_DIR/examples/release-readiness-brain-dump.txt" \
  --workspace "$ROOT_DIR/examples/repos.yaml" \
  --crewcmd \
  --output "$OUT_DIR/crewcmd-tasks.json"

sed -n '1,160p' "$OUT_DIR/crewcmd-tasks.json"
