# Release Review Pack Hooks

Use these drafts with a terminal clip of `bash examples/release-review-pack-demo.sh`.

## Short Posts

1. Release prep notes often mix tasks, stop conditions, verification, and
   deployment boundaries. `taskbrief` turns the messy note into `TASKS.md`,
   orchestration waves, and CrewCMD JSON without dispatching agents.

2. Demo angle: show the raw branchbrief release-readiness note, run
   `bash examples/release-review-pack-demo.sh`, then open `ORCHESTRATION.md`
   where every task is blocked until the publish or deployment boundary is
   approved.

3. The useful review pack is not just a task list. It includes repo hints,
   suggested branches, risk labels, verification commands, stop conditions, and
   a machine-readable wave plan.

## Clip CTA

```sh
bash examples/release-review-pack-demo.sh
```

Show `TASKS.md` first, then `ORCHESTRATION.md`, then `crewcmd-tasks.json`.
