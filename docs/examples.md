# Examples

This page shows copy-ready examples for the planned `taskbrief` CLI. The V1
implementation is still in progress, but the examples define the intended input
and output contracts.

## Parse a Voice Dump

```bash
taskbrief parse examples/voice-dump.txt \
  --workspace examples/repos.yaml \
  --output tasks.md
```

Voice transcription happens upstream. `taskbrief` consumes plain text and turns
it into bounded task briefs with repo, branch, risk, allowed paths, forbidden
paths, verification, stop conditions, and review-pack requirements.

## Parse a Cross-Repo Plan

```bash
taskbrief parse examples/cross-repo-plan.txt \
  --workspace examples/repos.yaml \
  --format yaml \
  --output examples/tasks.yaml
```

Use this when the input contains multiple repositories or mixed risk levels. The
workspace config supplies repo defaults, common verification commands, and
forbidden paths.

## JSON Queue Output

```bash
taskbrief parse examples/cross-repo-plan.txt \
  --workspace examples/repos.yaml \
  --format json \
  --output examples/tasks.json
```

JSON output uses snake_case task fields matching the canonical task schema.

## CrewCMD Export

```bash
taskbrief parse examples/cross-repo-plan.txt \
  --workspace examples/repos.yaml \
  --crewcmd \
  --output examples/crewcmd-tasks.json
```

CrewCMD export uses camelCase fields where orchestration tools commonly expect
them, keeps one task per branch, and includes `requiresHumanApproval` for tasks
that should not be dispatched without review.

## stdin

```bash
pbpaste | taskbrief parse \
  --workspace examples/repos.yaml \
  --format yaml
```

stdin support should behave the same as file input, except the disclosure and
review output should identify the input as `stdin`.

## Explicit LLM Mode

```bash
taskbrief parse examples/voice-dump.txt \
  --workspace examples/repos.yaml \
  --llm \
  --provider openai \
  --model gpt-5-mini \
  --format yaml
```

LLM mode must be explicit. Before any network call, the CLI must disclose the
provider, model, credential source, input, output format, and whether network
access will be used. The disclosure must never print secret values.

Expected disclosure shape:

```text
LLM mode enabled.
Provider: openai
Model: gpt-5-mini
Credential source: OPENAI_API_KEY
Input: examples/voice-dump.txt
Output format: yaml
Network: yes
```

## Included Example Files

- [voice-dump.txt](../examples/voice-dump.txt)
- [cross-repo-plan.txt](../examples/cross-repo-plan.txt)
- [task-brief.md](../examples/task-brief.md)
- [tasks.yaml](../examples/tasks.yaml)
- [tasks.json](../examples/tasks.json)
- [crewcmd-tasks.json](../examples/crewcmd-tasks.json)
- [repos.yaml](../examples/repos.yaml)
