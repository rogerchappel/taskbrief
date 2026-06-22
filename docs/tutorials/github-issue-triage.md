# GitHub issue triage demo

This recipe turns a pasted GitHub issue into a bounded task queue plus
orchestration handoff files. It uses the checked-in
`examples/github-issue-triage.txt` fixture and the public workspace config in
`examples/repos.yaml`.

## What the demo proves

- `taskbrief parse` can shape a prose issue into reviewable task artifacts.
- Workspace metadata can attach repo context and verification expectations.
- `--orchestration` writes `TASKS.md`, `ORCHESTRATION.md`, and
  `orchestration.json` without dispatching agents.
- Stop conditions such as npm publishing, credentials, package ownership, and
  production deploys remain visible in the generated handoff.

## Run it from a checkout

```bash
npm install
npm run build
bash examples/github-issue-triage-demo.sh
```

The script writes output under
`${TMPDIR:-/tmp}/taskbrief-github-issue-triage`, checks that the expected files
exist, and prints the first sections for review.

## Manual command

```bash
node dist/cli.js parse examples/github-issue-triage.txt \
  --workspace examples/repos.yaml \
  --output /tmp/taskbrief-github-issue-triage/TASKS.md \
  --orchestration
```

## Promotion angle

Use this demo when showing Taskbrief as an input-side safety layer for agentic
work. The issue starts as normal maintainer prose; the output makes repo,
verification, and human-gated stop conditions explicit before any orchestrator
or agent receives work.
