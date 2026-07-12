#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/taskbrief-oncall-hotfix"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

cd "$ROOT_DIR"
npm run build >/dev/null

node dist/cli.js parse examples/oncall-hotfix-dump.txt \
  --workspace examples/repos.yaml \
  --output "$OUT_DIR/TASKS.md" \
  --orchestration

node dist/cli.js parse examples/oncall-hotfix-dump.txt \
  --workspace examples/repos.yaml \
  --format json > "$OUT_DIR/tasks.json"

test -s "$OUT_DIR/TASKS.md"
test -s "$OUT_DIR/ORCHESTRATION.md"
test -s "$OUT_DIR/orchestration.json"
test -s "$OUT_DIR/tasks.json"

grep -Fq "support token captures" "$OUT_DIR/TASKS.md"
grep -Fq "real customer token" "$OUT_DIR/TASKS.md"
node -e "const fs=require('node:fs'); const data=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (!data.tasks.some((task) => task.repo === 'unknown' && task.stop_conditions.includes('unclear repo ownership'))) process.exit(1);" "$OUT_DIR/tasks.json"
grep -Fq "follow-up docs task" "$OUT_DIR/TASKS.md"

printf 'Task queue: %s\n' "$OUT_DIR/TASKS.md"
printf 'Orchestration handoff: %s\n' "$OUT_DIR/ORCHESTRATION.md"
printf 'JSON queue: %s\n' "$OUT_DIR/tasks.json"
