# On-Call Hotfix Social Hooks

Grounded source files:

- `examples/oncall-hotfix-dump.txt`
- `examples/oncall-hotfix-demo.sh`
- `docs/tutorials/oncall-hotfix-queue.md`

## Short hooks

- "A good on-call handoff should become a task queue, not a paste-and-pray agent prompt."
- "Taskbrief can split one incident note into a hotfix, a docs follow-up, and explicit stop conditions."
- "When repo ownership is ambiguous, the safer demo outcome is a blocked task, not a confident guess."
- "The useful part of agent planning is often the line that says: stop if this needs a real credential."

## Demo angle

Show the raw on-call note first, then run `bash examples/oncall-hotfix-demo.sh`.
Open the generated `TASKS.md` and highlight the raw LogVeil hint, allowed
paths, verification commands, customer-token stop condition, and unclear-repo
ownership boundary.

## Limitations to say out loud

- The demo uses deterministic parsing, not an LLM.
- Taskbrief does not dispatch agents.
- Maintainers still approve the implementation plan and any package release.
