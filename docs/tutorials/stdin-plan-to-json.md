# Stdin Plan to JSON

This tutorial shows the smallest Taskbrief flow for turning copied planning text
into structured JSON without creating an intermediate input file.

## Run the demo

```sh
bash examples/stdin-promo-demo.sh
```

The script builds the CLI, pipes `examples/cross-repo-plan.txt` through
`taskbrief parse`, applies `examples/repos.yaml` as workspace context, writes
JSON to `/tmp/taskbrief-stdin-tasks.json`, and verifies that at least one task
was produced.

## Manual command

```sh
cat examples/cross-repo-plan.txt \
  | node dist/cli.js parse --workspace examples/repos.yaml --format json \
  > /tmp/taskbrief-stdin-tasks.json
```

## What to show in a recording

- The source planning note in `examples/cross-repo-plan.txt`.
- The workspace hints in `examples/repos.yaml`.
- The generated JSON task queue with repo, risk, and verification fields.

## Limits to mention

The default parser is deterministic and local. LLM parsing only happens when
`--llm --provider openai` is explicitly supplied with credentials available in
the environment.
