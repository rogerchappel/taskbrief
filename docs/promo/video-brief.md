# Taskbrief Video Brief

## Working title

From messy planning dump to agent-ready task queue in one local command.

## Demo promise

Show `taskbrief` converting `examples/voice-dump.txt` into a Markdown task queue
plus deterministic orchestration handoff files. The demo should emphasize that
the default path is local-first, schema-shaped, and does not dispatch agents or
call an LLM.

## 60-second outline

1. Open with the raw voice-dump fixture and point out that it mixes multiple
   repos, priorities, and verification hints.
2. Run `bash examples/orchestration-demo.sh`.
3. Open the temporary `TASKS.md` and show task ids, repo hints, risk labels, and
   verification notes.
4. Open `ORCHESTRATION.md` and `orchestration.json` to show sequential waves and
   concurrent work groups.
5. Close with the safety model: deterministic by default, LLM parsing only with
   explicit `--llm --provider openai`, and no automatic PRs or agent dispatch.

## Capture checklist

- Terminal running `bash examples/orchestration-demo.sh`.
- `examples/voice-dump.txt` as the source material.
- Generated `TASKS.md`, `ORCHESTRATION.md`, and `orchestration.json`.
- README sections: Local-First Policy, Orchestration Handoff, and CrewCMD Export.

## Grounded claims

- Deterministic parsing is the default.
- Stdin, Markdown, YAML, JSON, and CrewCMD export paths are documented in the
  README.
- `--orchestration` writes both human-readable and JSON handoff artifacts.
- LLM parsing is opt-in and requires an explicit provider.
