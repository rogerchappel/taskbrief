#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/taskbrief-voice-dump-review-pack"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

echo "== Render Markdown tasks from the sample voice dump =="
node "$ROOT_DIR/dist/cli.js" parse \
  "$ROOT_DIR/examples/voice-dump.txt" \
  --workspace "$ROOT_DIR/examples/repos.yaml" \
  --output "$OUT_DIR/tasks.md"
sed -n '1,120p' "$OUT_DIR/tasks.md"

echo
echo "== Render CrewCMD JSON for orchestration review =="
node "$ROOT_DIR/dist/cli.js" parse \
  "$ROOT_DIR/examples/voice-dump.txt" \
  --workspace "$ROOT_DIR/examples/repos.yaml" \
  --crewcmd \
  --output "$OUT_DIR/crewcmd-tasks.json"
sed -n '1,160p' "$OUT_DIR/crewcmd-tasks.json"

echo
echo "Review pack written to $OUT_DIR"
