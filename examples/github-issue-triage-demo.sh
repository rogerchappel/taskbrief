#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/taskbrief-github-issue-triage"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

echo "== Parse a pasted GitHub issue into a Markdown task queue =="
node "$ROOT_DIR/dist/cli.js" parse \
  "$ROOT_DIR/examples/github-issue-triage.txt" \
  --workspace "$ROOT_DIR/examples/repos.yaml" \
  --output "$OUT_DIR/TASKS.md" \
  --orchestration

test -s "$OUT_DIR/TASKS.md"
test -s "$OUT_DIR/ORCHESTRATION.md"
test -s "$OUT_DIR/orchestration.json"
grep -q "branchbrief" "$OUT_DIR/TASKS.md"
grep -q "Do not publish" "$OUT_DIR/TASKS.md"

sed -n '1,120p' "$OUT_DIR/TASKS.md"

echo
echo "== Orchestration handoff =="
sed -n '1,120p' "$OUT_DIR/ORCHESTRATION.md"
