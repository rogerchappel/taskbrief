# Support Intake Queue

This recipe turns a support handoff into a reviewable task queue with explicit
paths, verification commands, and stop conditions.

## Run it

```sh
npm install
bash examples/support-intake-demo.sh
```

The demo parses `examples/support-intake-dump.txt` with
`examples/repos.yaml`, then writes a temporary queue under
`${TMPDIR:-/tmp}/taskbrief-support-intake-demo`.

Generated files:

- `TASKS.md` for the maintainer-readable implementation task and follow-up.
- `ORCHESTRATION.md` for sequencing and stop-condition review.
- `orchestration.json` for automation that needs the same handoff shape.
- `tasks.json` for deterministic assertions and fixture review.

## What the demo verifies

- The package-script drift request remains visible in the queue.
- The private-repository-path stop condition is preserved.
- The follow-up promo note is kept separate from the implementation work.
- The output is generated locally without dispatching agents or publishing.

Use this pattern when a support note mixes a narrow repository fix with a
documentation or promotion follow-up. Taskbrief keeps the work reviewable before
any agent receives it.
