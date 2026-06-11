# Release readiness queue demo

This recipe turns a rough release-planning note into deterministic task queue
artifacts that are safer to hand to agents or maintainers.

## Run the demo

```bash
npm install
npm run build
bash examples/release-readiness-demo.sh
```

The demo reads `examples/release-readiness-brain-dump.txt`, attaches repository
metadata from `examples/repos.yaml`, and writes temporary output under
`${TMPDIR:-/tmp}/taskbrief-release-readiness-demo`.

## Why this is useful

- The input is intentionally plain text, similar to a voice-note cleanup or
  copied planning scratchpad.
- The Markdown output is readable by maintainers before work starts.
- The CrewCMD JSON output keeps repo, branch, risk, verification, and stop
  condition fields explicit for orchestration tooling.
- No LLM provider or API key is used; deterministic parsing remains the default.

## Commands behind the script

```bash
node dist/cli.js parse examples/release-readiness-brain-dump.txt \
  --workspace examples/repos.yaml \
  --output /tmp/taskbrief-release-readiness-demo/TASKS.md

node dist/cli.js parse examples/release-readiness-brain-dump.txt \
  --workspace examples/repos.yaml \
  --crewcmd \
  --output /tmp/taskbrief-release-readiness-demo/crewcmd-tasks.json
```

Use this demo to show how Taskbrief turns vague release prep into a reviewable
queue without dispatching agents, opening PRs, publishing packages, or touching
production systems.
