# On-Call Hotfix Queue

This recipe turns a short incident handoff into reviewable Taskbrief artifacts
without dispatching an agent or publishing a package.

## Run it

```sh
npm install
bash examples/oncall-hotfix-demo.sh
```

The demo parses `examples/oncall-hotfix-dump.txt` and writes a temporary queue
under `${TMPDIR:-/tmp}/taskbrief-oncall-hotfix`.

Generated files:

- `TASKS.md` for the human-readable implementation and follow-up tasks.
- `ORCHESTRATION.md` for sequencing, dependency, and stop-condition review.
- `orchestration.json` for automation that needs the same wave plan.
- `tasks.json` for deterministic queue assertions.

## What the demo verifies

- The support-token hotfix remains visible in the task queue.
- The real-customer-token stop condition is kept in the review brief.
- Ambiguous ownership is surfaced as `unknown` with an unclear-repo stop
  condition instead of being silently dispatched.
- The follow-up documentation task is not lost.

Use this workflow when an on-call note contains both a narrow fix and a
downstream documentation task. Taskbrief keeps the work split while preserving
the safety boundaries that a maintainer needs before assigning agents. If a
repo hint is too informal for deterministic inference, the generated brief makes
that a human decision instead of guessing.
