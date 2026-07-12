# Support Intake Social Hooks

These drafts are grounded in `examples/support-intake-demo.sh` and the
DocFresh-flavored fixture in `examples/support-intake-dump.txt`.

## Short posts

- Support notes often mix a bug, allowed paths, verification commands, and a
  follow-up request. Taskbrief turns that into a local queue before any agent is
  dispatched.
- This demo parses a README drift support handoff into `TASKS.md`,
  `ORCHESTRATION.md`, `orchestration.json`, and JSON task output with stop
  conditions intact.
- A support escalation should not lose the "stop if" lines. Taskbrief preserves
  private-path and publish boundaries in the generated handoff.

## Video angle

Show `examples/support-intake-dump.txt`, run
`bash examples/support-intake-demo.sh`, then scan `TASKS.md` for the package
script drift task, verification commands, and follow-up promo note. Close by
stating that Taskbrief prepares reviewable queues; it does not dispatch agents
or publish packages.
