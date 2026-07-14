# Dependency Upgrade Queue Demo

This recipe turns a two-item dependency-upgrade planning note into a task queue
with verification commands, stop conditions, and orchestration handoff files.

## Run it

```sh
bash examples/dependency-upgrade-demo.sh
```

The script builds the CLI, parses `examples/dependency-upgrade-dump.txt`, writes
Markdown and JSON task queues, and emits `ORCHESTRATION.md` plus
`orchestration.json` under `/tmp/taskbrief-dependency-upgrade-demo`.

## Fixture behavior

- The `repoctx` item is medium risk because dependency parsing can affect CLI
  output and downstream handoffs.
- The `taskbrief` item is low risk because it is docs-only.
- The generated Markdown keeps the branch names, verification commands, and
  stop conditions visible for review before work starts.

Use this when you want a compact public demo of planning a dependency bump
without dispatching agents or touching the target repos.
