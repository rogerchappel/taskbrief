# Taskbrief Social Hooks

Grounded draft copy for public promotion. These hooks should be paired with a
terminal demo that runs `taskbrief parse` against the checked-in examples.

## Short Hooks

- Taskbrief turns a rough voice dump into bounded repo tasks with verification,
  stop conditions, and review metadata.
- The default path is local and deterministic; LLM parsing is explicit opt-in
  with provider and credential disclosure.
- Good demo arc: messy note in, `TASKS.md`, `ORCHESTRATION.md`, and
  `orchestration.json` out.
- Cross-repo planning demo: `bash examples/cross-repo-promo-demo.sh` turns a
  checked-in maintainer note into reviewable task and orchestration artifacts.

## Video Brief

Open with `examples/voice-dump.txt`, then run the tutorial command from
`docs/tutorials/voice-dump-to-orchestration.md`. Show the generated task queue
and call out one blocked/human-gated item so the safety model is visible.

## Issue Triage Clip

```bash
npm run build
bash examples/github-issue-triage-demo.sh
```

Use the checked-in GitHub issue fixture to show normal maintainer prose becoming
`TASKS.md`, `ORCHESTRATION.md`, and `orchestration.json` without publishing,
deploying, or dispatching agents.

## Cross-Repo Clip

```bash
npm run build
bash examples/cross-repo-promo-demo.sh
```

Use this when the story is broader than one issue: a maintainer note becomes a
bounded queue across repos, with no agent dispatch or publishing side effects.

## Stdin JSON Clip

```bash
bash examples/stdin-promo-demo.sh
```

Use this for a compact "copy/paste plan to structured queue" clip. The demo
pipes a checked-in planning note through `taskbrief parse`, writes JSON to
`/tmp/taskbrief-stdin-tasks.json`, and verifies that tasks were produced.
