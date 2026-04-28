# Task Schema

`taskbrief` produces task objects for Markdown briefs, YAML queues, JSON queues,
and CrewCMD exports. The canonical task schema uses snake_case field names.

## Top-Level Queue

```yaml
version: "0.1"
source: taskbrief
workspace: rogerchappel-oss
tasks: []
```

| Field | Required | Description |
| --- | --- | --- |
| `version` | yes | Schema version for the queue document. |
| `source` | yes | Producer name. Use `taskbrief` for CLI and skill output. |
| `workspace` | no | Workspace name from the workspace config, if provided. |
| `tasks` | yes | Ordered list of task objects. |

## Task Object

| Field | Required | Description |
| --- | --- | --- |
| `id` | yes | Stable kebab-case identifier unique within the queue. |
| `title` | yes | Short human-readable title. |
| `repo` | yes | Repository key from the workspace config, or `unknown`. |
| `branch` | yes | Suggested branch for the agent or human operator. |
| `type` | yes | Task category such as `docs`, `release`, `ci`, `qa`, `tests`, or `refactor`. |
| `risk` | yes | One of `low`, `medium`, or `high`. |
| `objective` | yes | One-sentence outcome for the task. |
| `context` | yes | Relevant background, constraints, and intent from the input. |
| `allowed_paths` | yes | Paths the agent may edit. Use globs when the exact file is unknown. |
| `forbidden_paths` | yes | Paths the agent must not edit. Include repo defaults such as `.env*`. |
| `verification` | yes | Smallest relevant commands or manual checks. |
| `stop_conditions` | yes | Conditions that require stopping and asking a human. |
| `expected_commits` | yes | Conventional Commit subjects expected from the task. |
| `review_pack_required` | yes | Must be `true` for agent-ready work. |
| `human_decision_needed` | yes | Decisions the agent cannot make independently. Use an empty list only when none are known. |
| `agent_prompt` | yes | Copy-ready prompt for the assigned agent. |

## Field Rules

- `id` should be stable across Markdown, YAML, JSON, and CrewCMD outputs.
- `repo` must match a workspace repo key when one is known.
- `branch` should be scoped and descriptive, for example
  `agent/npm-release-readiness`.
- `risk` must not be lower than the workspace risk default for the task type.
- `allowed_paths` should be narrow enough for safe dispatch.
- `forbidden_paths` should include workspace defaults and task-specific hazards.
- `verification` must be concrete. If no command is known, include a manual check
  or stop condition.
- `expected_commits` must use Conventional Commit subjects.
- `review_pack_required` should be `true` unless the output is only a planning
  draft.

## Minimal Example

```yaml
tasks:
  - id: branchbrief-npm-release-readiness
    title: Prepare branchbrief for npm release
    repo: branchbrief
    branch: agent/npm-release-readiness
    type: release
    risk: medium
    objective: Prepare branchbrief for its first npm release without publishing.
    context: Package metadata, bin path, release docs, changelog, and dry-run packaging need review before v0.1.0.
    allowed_paths:
      - package.json
      - README.md
      - docs/**
      - CHANGELOG.md
      - .github/workflows/publish.yml
    forbidden_paths:
      - src/**
      - .env*
      - secrets/**
    verification:
      - npm ci
      - npm test
      - npm run build
      - npm pack --dry-run
    stop_conditions:
      - npm token required
      - package name unavailable
      - publish requested
      - secrets or credentials required
    expected_commits:
      - "chore(package): prepare npm package metadata"
      - "docs(npm): document first release process"
      - "ci(release): add npm publish workflow"
    review_pack_required: true
    human_decision_needed:
      - approve package name
      - approve first publish
    agent_prompt: >
      Prepare branchbrief for release readiness only. Do not publish, request
      tokens, or touch source files unless a maintainer expands the task.
```

See [examples/tasks.yaml](../examples/tasks.yaml) and
[examples/tasks.json](../examples/tasks.json) for complete queue examples.
