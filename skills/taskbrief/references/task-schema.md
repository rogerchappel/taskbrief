# taskbrief Task Schema

Every generated task must include these fields. Use snake_case for standard taskbrief YAML/JSON output.

```yaml
id:
title:
repo:
branch:
type:
risk:
objective:
context:
allowed_paths:
forbidden_paths:
verification:
stop_conditions:
expected_commits:
review_pack_required:
human_decision_needed:
agent_prompt:
```

## Field Rules

- `id`: stable slug for the task, usually `<repo>-<short-purpose>`.
- `title`: short human-readable title.
- `repo`: target repository name or `unknown` when unclear.
- `branch`: suggested branch name, usually `agent/<short-purpose>` or another repo-appropriate prefix.
- `type`: task category such as `docs`, `test`, `fix`, `feat`, `ci`, `release`, `qa`, `review`, `chore`, or `refactor`.
- `risk`: `low`, `medium`, or `high`.
- `objective`: one-sentence outcome for the agent.
- `context`: the relevant background and constraints from the source input.
- `allowed_paths`: paths or globs the agent may touch.
- `forbidden_paths`: paths or globs the agent must not touch.
- `verification`: commands or manual checks expected before completion.
- `stop_conditions`: conditions that require the agent to stop and ask a human.
- `expected_commits`: Conventional Commit messages or commit intents.
- `review_pack_required`: always `true` for agent-ready work.
- `human_decision_needed`: decisions, approvals, credentials, or confirmations needed from a human.
- `agent_prompt`: copy-ready prompt containing scope, branch, verification, safety rules, and deliverables.

## Normalization Rules

- Split mixed-repository or mixed-risk work into separate tasks.
- Prefer one reviewable intent per task.
- Keep high-risk work isolated from low-risk docs or test work.
- Use empty arrays only when there is genuinely no known value; otherwise record uncertainty in `context` and `human_decision_needed`.
- Do not invent repository-specific commands. Use workspace config, user input, or clearly mark verification as unknown.

## Example

```yaml
tasks:
  - id: branchbrief-npm-release-readiness
    title: Prepare branchbrief for npm release
    repo: branchbrief
    branch: agent/npm-release-readiness
    type: release
    risk: medium
    objective: Prepare branchbrief for first npm release without publishing.
    context: The package needs metadata, bin path, release docs, and Trusted Publishing workflow reviewed before v0.1.0.
    allowed_paths:
      - package.json
      - README.md
      - docs/**
      - .github/workflows/publish.yml
      - CHANGELOG.md
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
      - chore(package): prepare npm package metadata
      - docs(npm): document first release process
      - ci(release): add npm publish workflow
    review_pack_required: true
    human_decision_needed:
      - approve package name
      - approve first publish
    agent_prompt: |
      You are preparing branchbrief for its first npm release without publishing.
      Work only on the allowed paths, stop for credentials or publish requests,
      run the listed verification, and return a review pack.
```
