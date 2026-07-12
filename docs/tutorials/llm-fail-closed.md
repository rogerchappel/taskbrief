# LLM Fail-Closed Demo

This demo shows the guardrail around Taskbrief's explicit LLM mode. The default
parser is local and deterministic; `--llm` only runs when a provider is selected
and the expected provider credential is present.

## Run it

Build the CLI, then run the fixture script:

```bash
npm run build
bash examples/llm-fail-closed-demo.sh
```

The script unsets `OPENAI_API_KEY`, asks Taskbrief to parse
`examples/voice-dump.txt` with `--llm --provider openai`, and expects the command
to fail before writing an output file.

## What to look for

The script verifies:

- stderr names `OPENAI_API_KEY`
- stderr includes a credential-related failure
- no `tasks.json` output file is written after the failed LLM request

That makes the demo safe to run in local development or CI because it does not
need a real API key and it does not make a network call.

## Manual equivalent

```bash
npm run build
unset OPENAI_API_KEY
node dist/cli.js parse examples/voice-dump.txt --llm --provider openai --format json --output /tmp/taskbrief-llm-tasks.json
test ! -e /tmp/taskbrief-llm-tasks.json
```

Use the normal deterministic parser when you do not want any provider call:

```bash
node dist/cli.js parse examples/voice-dump.txt --format json
```
