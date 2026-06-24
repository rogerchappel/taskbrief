# GitHub Issue Triage to CrewCMD

This recipe turns a rough multi-repo GitHub issue triage note into two
reviewable artifacts:

- a Markdown task brief for humans and coding agents
- a CrewCMD-compatible JSON queue for downstream orchestration

It uses the deterministic parser path. No LLM provider or API key is required.

## Input

The fixture at `examples/github-issue-triage.txt` contains three repo-scoped
requests:

- add a checkout fixture tutorial for `httpstubby`
- draft a CI-oriented release note for `docfresh`
- create a local workspace demo for `repoctx`

Each paragraph is intentionally written like a real issue comment: useful but
not already structured as a task queue.

## Run It

```sh
npm install
bash examples/github-issue-triage-demo.sh
```

The script writes outputs to:

```text
${TMPDIR:-/tmp}/taskbrief-github-issue-triage/
```

It verifies that the CrewCMD export contains at least three tasks and that the
Markdown brief still includes the expected repo names.

## Manual Commands

```sh
npm run build
node dist/cli.js parse examples/github-issue-triage.txt \
  --workspace examples/repos.yaml \
  --format markdown \
  --output /tmp/taskbrief-github-issue-triage/task-brief.md

node dist/cli.js parse examples/github-issue-triage.txt \
  --workspace examples/repos.yaml \
  --crewcmd \
  --output /tmp/taskbrief-github-issue-triage/crewcmd-tasks.json
```

## Promotion Notes

This is a good demo for maintainers who collect work from GitHub issues,
planning threads, and chat dumps. The point is not automatic dispatch; it is
making the queue explicit before an agent or human starts editing repos.
