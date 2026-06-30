# Release Review Pack Demo

This recipe turns the existing release-readiness fixture into a maintainer
review pack before any agent is dispatched.

## Run it

```sh
npm install
bash examples/release-review-pack-demo.sh
```

The script builds Taskbrief, parses
`examples/release-readiness-brain-dump.txt`, and writes a temporary review pack
under `${TMPDIR:-/tmp}/taskbrief-release-review-pack`.

Generated files:

- `TASKS.md` for the human-readable task queue.
- `ORCHESTRATION.md` for dependency waves and blocked dispatch decisions.
- `orchestration.json` for tooling that needs the same wave plan.
- `crewcmd-tasks.json` for CrewCMD-compatible queue import.

## What the demo verifies

- The branchbrief repository hint is preserved in orchestration JSON.
- The publish boundary is still explicit before dispatch.
- The package-publishing stop condition remains visible in the task queue.
- Both Markdown and JSON handoff files are non-empty.

Use this demo for release-readiness content where the important story is not
"dispatch agents now"; it is "turn a messy release note into reviewable queues,
boundaries, and blocked decisions."
