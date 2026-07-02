#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

npm run build

cat examples/cross-repo-plan.txt \
  | node dist/cli.js parse --workspace examples/repos.yaml --format json \
  > /tmp/taskbrief-stdin-tasks.json

node -e "const fs=require('node:fs'); const data=JSON.parse(fs.readFileSync('/tmp/taskbrief-stdin-tasks.json','utf8')); if (!Array.isArray(data.tasks) || data.tasks.length === 0) process.exit(1); console.log(JSON.stringify({tasks: data.tasks.length, format: 'json'}, null, 2));"

echo "Wrote /tmp/taskbrief-stdin-tasks.json"
