#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

unset OPENAI_API_KEY

if node dist/cli.js parse examples/voice-dump.txt --llm --provider openai --format json --output "$TMP_DIR/tasks.json" 2>"$TMP_DIR/stderr.txt"; then
  echo "Expected explicit OpenAI LLM mode to fail without OPENAI_API_KEY" >&2
  exit 1
fi

if [[ -e "$TMP_DIR/tasks.json" ]]; then
  echo "LLM failure unexpectedly wrote an output file" >&2
  exit 1
fi

grep -q "OPENAI_API_KEY" "$TMP_DIR/stderr.txt"
grep -qi "credential" "$TMP_DIR/stderr.txt"

echo "LLM fail-closed demo passed"
echo "Failure evidence:"
sed -n '1,8p' "$TMP_DIR/stderr.txt"
