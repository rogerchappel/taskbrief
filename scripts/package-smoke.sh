#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cd "$repo_root"
npm run build >/dev/null
npm pack --dry-run >/dev/null
npm pack --pack-destination "$tmp" >/dev/null

package_tgz="$(find "$tmp" -maxdepth 1 -name 'taskbrief-*.tgz' -print -quit)"
test -n "$package_tgz"

mkdir -p "$tmp/app"
cd "$tmp/app"
npm init -y >/dev/null
npm install "$package_tgz" >/dev/null

./node_modules/.bin/taskbrief --help >/dev/null
./node_modules/.bin/taskbrief --version >/dev/null
./node_modules/.bin/taskbrief parse node_modules/taskbrief/examples/voice-dump.txt --format json > "$tmp/tasks.json"
node -e "const fs=require('node:fs'); const data=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (!Array.isArray(data.tasks) || data.tasks.length === 0) process.exit(1);" "$tmp/tasks.json"

test -s node_modules/taskbrief/templates/npm-package/package.json
test -s node_modules/taskbrief/docs/task-schema.md

echo 'taskbrief package smoke passed'
