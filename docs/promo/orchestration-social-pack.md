# Taskbrief Orchestration Social Pack

## Short Posts

- Messy planning note in, bounded agent handoff out. `taskbrief parse
  docs/PRD.md --output docs/TASKS.md --orchestration` writes both human
  Markdown and machine JSON without dispatching agents.
- The useful part of an agent queue is not just the task list. It is the stop
  conditions, verification hints, repo boundaries, and dependency waves.
- `taskbrief` keeps the default path deterministic and local. LLM parsing is an
  explicit `--llm --provider openai` choice, not a hidden dependency.

## Demo Angle

Run `bash examples/orchestration-demo.sh`, then show the source
`examples/voice-dump.txt` beside the generated `TASKS.md`,
`ORCHESTRATION.md`, and `orchestration.json`.

## Grounded Claims

- `--orchestration` writes `ORCHESTRATION.md` and `orchestration.json` next to
  the task output.
- The default parser is deterministic and local-first.
- LLM parsing requires explicit `--llm` and `--provider openai` flags.
- The demo verifies that the generated Markdown and JSON handoff files exist.
