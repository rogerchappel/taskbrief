# Taskbrief CrewCMD Export Video Brief

## Working Title

Turn a GitHub issue into a CrewCMD-ready queue.

## Demo Promise

Show `taskbrief` parsing a checked-in GitHub issue fixture and emitting a
CrewCMD-compatible queue object for downstream orchestration.

## 45-Second Outline

1. Open `examples/github-issue-triage.txt` and point out the repo context,
   publish concern, and verification hints.
2. Run `bash examples/github-issue-triage-demo.sh`.
3. Show the generated `TASKS.md` for human review.
4. Show `orchestration.json` for dependency waves.
5. Re-run the core command with `--crewcmd` to show queue-shaped JSON output.

## Capture Command

```sh
npm run build
node dist/cli.js parse examples/github-issue-triage.txt --workspace examples/repos.yaml --crewcmd
```

## Grounded Claims

- `taskbrief parse` accepts local text fixtures.
- `--workspace` adds repo context from `examples/repos.yaml`.
- `--crewcmd` emits CrewCMD-compatible queue objects.
- The GitHub issue triage demo verifies generated task and orchestration files.
