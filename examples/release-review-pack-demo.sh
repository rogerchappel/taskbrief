#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/taskbrief-release-review-pack"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

cd "$ROOT_DIR"
npm run build >/dev/null

node dist/cli.js parse examples/release-readiness-brain-dump.txt \
  --workspace examples/repos.yaml \
  --output "$OUT_DIR/TASKS.md" \
  --orchestration

node dist/cli.js parse examples/release-readiness-brain-dump.txt \
  --workspace examples/repos.yaml \
  --crewcmd \
  --output "$OUT_DIR/crewcmd-tasks.json"

test -s "$OUT_DIR/TASKS.md"
test -s "$OUT_DIR/ORCHESTRATION.md"
test -s "$OUT_DIR/orchestration.json"
test -s "$OUT_DIR/crewcmd-tasks.json"

grep -Fq "package publishing requested" "$OUT_DIR/TASKS.md"
grep -Fq "approve publish boundary" "$OUT_DIR/ORCHESTRATION.md"
grep -Fq '"repo": "branchbrief"' "$OUT_DIR/orchestration.json"
grep -Fq '"source": "taskbrief"' "$OUT_DIR/crewcmd-tasks.json"

echo "Task queue: $OUT_DIR/TASKS.md"
echo "Orchestration handoff: $OUT_DIR/ORCHESTRATION.md"
echo "Orchestration JSON: $OUT_DIR/orchestration.json"
echo "CrewCMD queue: $OUT_DIR/crewcmd-tasks.json"
