#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/taskbrief-stdin-promo"
cd "$ROOT"

npm run build

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

cat examples/cross-repo-plan.txt \
  | node dist/cli.js parse --workspace examples/repos.yaml --format json \
  > "$OUT_DIR/tasks.json"

node -e "const fs=require('node:fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if (!Array.isArray(data.tasks) || data.tasks.length === 0) process.exit(1); console.log(JSON.stringify({tasks: data.tasks.length, format: 'json'}, null, 2));" "$OUT_DIR/tasks.json"

echo "Wrote $OUT_DIR/tasks.json"
