# LLM Fail-Closed Hooks

Grounded in `examples/llm-fail-closed-demo.sh` and
`docs/tutorials/llm-fail-closed.md`.

## Short hooks

- Local parsing stays the default. LLM parsing in Taskbrief has to be explicit,
  provider-scoped, and credential-backed.
- A useful AI workflow demo is sometimes the failure path: no key, no output
  file, no hidden network call.
- `taskbrief parse --llm --provider openai` fails closed when `OPENAI_API_KEY`
  is missing, so accidental provider use is visible before a task queue is
  written.

## Clip outline

1. Show `taskbrief parse examples/voice-dump.txt --format json` producing a
   deterministic local queue.
2. Run `bash examples/llm-fail-closed-demo.sh`.
3. Zoom in on the stderr line naming `OPENAI_API_KEY`.
4. Show the script checking that no `tasks.json` file was created.
5. Close on the product rule: default local parsing, explicit opt-in LLM mode.
