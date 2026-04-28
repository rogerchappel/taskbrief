---
name: taskbrief
description: Convert messy brain dumps, voice transcripts, GitHub issues, and planning notes into structured agent-ready task briefs or CrewCMD dispatch queues. Use this when the user asks to split rough work across repos, prepare tasks for Codex/OpenClaw/CrewCMD, or turn a poorly formatted note into bounded agent tasks.
---
# taskbrief Skill

Use this skill to turn rough planning input into safe, bounded, reviewable task briefs for Codex, OpenClaw, CrewCMD, or human maintainers. This skill does not require the `taskbrief` CLI to be installed.

## Trigger Rules

Use this skill when the user asks to:

- split a messy brain dump, voice transcript, TODO list, meeting note, or GitHub issue into tasks
- prepare agent-ready tasks for Codex, OpenClaw, CrewCMD, Claude Code, GitHub Copilot, or another coding agent
- convert cross-repo planning notes into repo-scoped task briefs
- produce a Markdown task brief, YAML queue, JSON queue, or CrewCMD export
- add branch names, allowed paths, forbidden paths, risk, verification, stop conditions, or review-pack requirements to work items

Do not use this skill when the user only wants:

- a prose summary with no task decomposition
- direct code edits in the current repository
- an issue, PR, or project-management object created without task-brief output
- CLI installation help unrelated to shaping task briefs
- automatic agent dispatch without explicit user approval

## Core Principle

Do not simply rewrite the user's text. Split mixed input into small, reviewable, dispatchable tasks. Each task should be scoped to one repository, one branch, one reviewable intent, and one primary agent prompt.

## Workflow

1. Read the full input before producing output.
2. Identify distinct work items and split mixed-risk or mixed-repo items.
3. Resolve likely repositories from the text or workspace config when provided.
4. Mark uncertain repositories as `unknown` instead of inventing paths.
5. Assign branch names using concise, reviewable names such as `agent/npm-release-readiness`.
6. Classify risk with `references/risk-policy.md`.
7. Add allowed and forbidden paths using explicit user context, workspace config, or conservative defaults.
8. Add verification commands based on repo type and task type.
9. Add stop conditions for secrets, credentials, destructive work, production data, publishing, deployment, unclear ownership, and missing verification.
10. Output Markdown task briefs by default. Output YAML, JSON, or CrewCMD format when requested.

## Required Task Fields

Every task must include the schema in `references/task-schema.md`:

- `id`
- `title`
- `repo`
- `branch`
- `type`
- `risk`
- `objective`
- `context`
- `allowed_paths`
- `forbidden_paths`
- `verification`
- `stop_conditions`
- `expected_commits`
- `review_pack_required`
- `human_decision_needed`
- `agent_prompt`

## Markdown Output

For each task, use this structure:

```md
# Task Brief: <short title>

## Objective

## Repository

## Suggested Branch

## Task Type

## Risk Level

## Context

## Allowed Paths

## Forbidden Paths

## Expected Commits

## Verification

## Stop Conditions

## Review Pack Required

## Human Decision Needed

## Agent Prompt
```

Use `assets/task-brief-template.md` when a reusable template is useful.

## YAML And JSON Queue Output

When the user asks for YAML, JSON, a queue, or multiple machine-readable tasks, output an object with a `tasks` array using the schema in `references/task-schema.md`.

YAML shape:

```yaml
tasks:
  - id:
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
    review_pack_required: true
    human_decision_needed:
    agent_prompt: |
```

Use `assets/queue-template.yaml` as the queue template.

## CrewCMD Export Rules

When the user asks for CrewCMD output, a CrewCMD queue, or dispatch preparation:

- produce the queue structure in `references/crewcmd-export.md`
- use `source: taskbrief`
- keep one task per branch and one branch per agent
- include `allowedPaths`, `forbiddenPaths`, `verification`, and `stopConditions`
- set `reviewPackRequired: true`
- set `requiresHumanApproval: true` for medium and high risk tasks
- do not auto-launch CrewCMD or dispatch agents unless the user explicitly asks

## Safety Rules

- Do not hide uncertainty.
- Do not invent repository paths, ownership, commands, or branch policies.
- Do not mark high-risk production, payment, auth, data, migration, security, secret, or destructive work as safe.
- Do not dispatch tasks automatically.
- Do not run code, mutate repositories, open issues, create PRs, or change files as part of this skill unless the user separately asks for those actions.
- Do not require CLI installation.
- If a task needs credentials, secrets, publishing, production data, destructive commands, migrations, auth, payments, or security changes, add a stop condition and human approval requirement.

## Examples

Input:

```text
Need to fix branchbrief npm release, deploy docs, add dependabot to agentic template, check CrewCMD PRs, and product-videogen still needs mobile testing.
```

Good split:

1. `branchbrief`: prepare npm release readiness
2. `branchbrief`: verify docs deploy path
3. `agentic-oss-template`: add Dependabot config
4. `CrewCMD`: review existing PRs
5. `product-videogen`: run mobile QA checklist

Do not combine these into one task because they have different repositories, branches, verification, and risk profiles.

Example voice input lives in `assets/voice-dump-example.txt`.
