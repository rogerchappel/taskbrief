# Voice Dump to Orchestration Handoff

This recipe turns a rough planning transcript into a task queue plus
orchestration handoff files. It uses the checked-in examples so contributors can
replay it without API keys or network access.

## Inputs

- `examples/voice-dump.txt`: a rough multi-repo planning note.
- `examples/repos.yaml`: workspace defaults for repo inference, verification,
  allowed paths, and forbidden paths.

## Run

From a local checkout:

```bash
npm install
npm run build
mkdir -p .demo-output/voice-dump
node dist/cli.js parse examples/voice-dump.txt \
  --workspace examples/repos.yaml \
  --output .demo-output/voice-dump/TASKS.md \
  --orchestration
```

The command writes:

- `.demo-output/voice-dump/TASKS.md`
- `.demo-output/voice-dump/ORCHESTRATION.md`
- `.demo-output/voice-dump/orchestration.json`

## What to Inspect

Review the task queue for:

- repo and branch names inferred from the workspace config
- high-risk items marked for human approval
- verification commands that stay local to each repo
- stop conditions for secrets, production deploys, publishing, or account
  ownership decisions

Then review `ORCHESTRATION.md` for sequential waves. Tasks in the same wave may
be candidates for concurrent execution; later waves should wait for earlier
verification to pass.

## Promotion Angle

This demo is useful on video because it starts with an intentionally messy note
and ends with bounded work items, not agent dispatch. That keeps the story
focused on safer planning: Taskbrief shapes the queue, a human or orchestrator
decides what runs, and Branchbrief can summarize completed branches later.
