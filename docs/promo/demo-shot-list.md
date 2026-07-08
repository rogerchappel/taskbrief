# Taskbrief demo shot list

Use these shots for short public clips grounded in checked-in fixtures.

## Voice dump to orchestration

Command:

```bash
bash examples/orchestration-demo.sh
```

Shots:

- `examples/voice-dump.txt` as the messy planning input.
- `.demo-output/orchestration/TASKS.md` as the human-readable queue.
- `.demo-output/orchestration/ORCHESTRATION.md` as sequential waves.
- `.demo-output/orchestration/orchestration.json` as machine-readable handoff.

## GitHub issue triage

Command:

```bash
bash examples/github-issue-triage-demo.sh
```

Shots:

- `examples/github-issue-triage.txt` as maintainer-style prose.
- Generated task output showing repo context and stop conditions.
- A reminder that Taskbrief shapes work but does not dispatch agents.

## Stdin JSON path

Command:

```bash
cat examples/github-issue-triage.txt | node dist/cli.js parse \
  --workspace examples/repos.yaml \
  --format json \
  --output .demo-output/stdin-triage/tasks.json
```

Shots:

- Terminal pipe from fixture text into `taskbrief parse`.
- `tasks.json` loaded in an editor or piped through a JSON viewer.
- No API key in the environment because deterministic parsing is the default.

## Claims to avoid

- Do not claim Taskbrief runs tests, opens PRs, or dispatches agents.
- Do not claim LLM parsing is default.
- Do not show private issue text in public footage.
