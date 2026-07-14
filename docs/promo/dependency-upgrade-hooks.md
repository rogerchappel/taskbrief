# Dependency Upgrade Queue Hooks

## Short posts

- A dependency bump is not just "update the lockfile"; reviewers need branch,
  verification, and stop-condition context before work starts.
- This `taskbrief` demo turns a short upgrade note into `TASKS.md`,
  `ORCHESTRATION.md`, `orchestration.json`, and JSON queue output.
- The fixture keeps the limits visible: stop on unrelated lockfile churn,
  unexpected export changes, or advice that depends on unpublished behavior.

## Clip outline

1. Show `examples/dependency-upgrade-dump.txt`.
2. Run `bash examples/dependency-upgrade-demo.sh`.
3. Open `TASKS.md` and highlight the repo, branch, verification commands, and
   stop conditions.
4. Close on Taskbrief's role: shaping work for humans and agents, not
   automatically applying the upgrade.
