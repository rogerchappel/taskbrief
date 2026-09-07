#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUITE_TMP="$(mktemp -d "${TMPDIR:-/tmp}/taskbrief-example-suite.XXXXXX")"
trap 'rm -rf "$SUITE_TMP"' EXIT

cd "$ROOT_DIR"

documented_demos=()
while IFS= read -r demo; do
  documented_demos+=("$demo")
done < <(
  grep -oE 'bash examples/[[:alnum:]-]+-demo\.sh' README.md \
    | awk '{print $2}' \
    | sort -u
)

runnable_demos=()
while IFS= read -r demo; do
  runnable_demos+=("$demo")
done < <(find examples -maxdepth 1 -type f -name '*-demo.sh' -print | sort)

if ! diff -u \
  <(printf '%s\n' "${documented_demos[@]}") \
  <(printf '%s\n' "${runnable_demos[@]}"); then
  echo "README demo commands and runnable example scripts differ" >&2
  exit 1
fi

npm run build >/dev/null

for demo in "${runnable_demos[@]}"; do
  demo_name="$(basename "$demo" .sh)"
  demo_tmp="$SUITE_TMP/$demo_name"
  mkdir -p "$demo_tmp"
  printf '==> %s\n' "$demo"
  TMPDIR="$demo_tmp" bash "$demo"
done

printf 'Verified %d documented runnable demos\n' "${#runnable_demos[@]}"
