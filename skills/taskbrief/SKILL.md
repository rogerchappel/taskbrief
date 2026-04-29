---
name: taskbrief
description: Convert messy brain dumps, PRDs, voice transcripts, GitHub issues, and planning notes into deterministic agent-ready task briefs or queues. Use this when the user asks to split rough work into repo-scoped tasks, generate docs/TASKS.md from a PRD, prepare work for Codex/OpenClaw/Claude Code/GitHub Copilot, or create Markdown/JSON/YAML task queues.
---
# taskbrief Skill

Use this skill to turn rough planning input into safe, bounded, reviewable task briefs for coding agents or human maintainers.

Default posture: deterministic, local-first, no dispatch. Shape the work. Do not launch agents, mutate repos, create PRs, or call external services unless the user separately asks.

## Current CLI Reality

The `taskbrief` CLI now has usable local parsing support:

```bash
taskbrief parse <file> --format markdown --output docs/TASKS.md
taskbrief parse <file> --format json --output .stackforge/taskbrief/tasks.json
pbpaste | taskbrief parse --format json
taskbrief new
```

Supported parse flags include:

- `--format markdown|json|yaml`
- `--output <path>`
- `--workspace <path>`
- `--type transcript`
- `--crewcmd`
- `--llm` fails closed unless explicit provider support is implemented/configured

Important current limitation: prefer JSON for machine integration until YAML multiline output has round-trip tests. Markdown is fine for human review.

## Trigger Rules

Use this skill when the user asks to:

- split a messy brain dump, voice transcript, TODO list, meeting note, PRD, or GitHub issue into tasks
- generate `docs/TASKS.md` from a PRD or planning note
- prepare agent-ready tasks for Codex, OpenClaw, Claude Code, GitHub Copilot, or another coding agent
- convert cross-repo planning notes into repo-scoped task briefs
- produce a Markdown task brief, JSON queue, YAML queue, or CrewCMD-compatible export
- add branch names, allowed paths, forbidden paths, risk, verification, stop conditions, or review-pack requirements to work items

Do not use this skill when the user only wants:

- a prose summary with no task decomposition
- direct code edits in the current repository
- automatic agent dispatch without explicit user approval
- issue, PR, or project-management object creation without task-brief output
- CLI installation help unrelated to shaping task briefs

## Core Principle

Do not simply rewrite the user's text. Split mixed input into small, reviewable, dispatchable tasks. Each task should be scoped to one repository, one branch, one reviewable intent, and one primary agent prompt.

## Manual Skill Workflow

Use this when the CLI is unavailable, or when the user pasted input directly into chat:

1. Read the full input before producing output.
2. Identify distinct work items and split mixed-risk or mixed-repo items.
3. Resolve likely repositories from the text or workspace config when provided.
4. Mark uncertain repositories as `unknown` instead of inventing paths.
5. Assign branch names using concise, reviewable names such as `agent/npm-release-readiness`.
6. Classify risk with `references/risk-policy.md`.
7. Add allowed and forbidden paths using explicit user context, workspace config, or conservative defaults.
8. Add verification commands based on repo type and task type.
9. Add stop conditions for secrets, credentials, destructive work, production data, publishing, deployment, unclear ownership, and missing verification.
10. Output Markdown by default. Output JSON for machine integration. Output YAML only when requested and after checking formatting.

## CLI Workflow

Use the CLI when operating on local files and the user wants deterministic artifacts:

1. Keep the source input as a file, usually `docs/PRD.md`, `brain-dump.txt`, or similar.
2. For machine integration, prefer JSON:

```bash
taskbrief parse docs/PRD.md --format json --output .stackforge/taskbrief/tasks.json
```

3. For human review, generate Markdown:

```bash
taskbrief parse docs/PRD.md --format markdown --output docs/TASKS.md
```

4. Validate output before reporting success:

```bash
node -e "JSON.parse(require('fs').readFileSync('.stackforge/taskbrief/tasks.json','utf8'))"
test -s docs/TASKS.md
```

5. For StackForge integration, the recommended flow is:

```bash
stackforge init oss-cli my-tool --prd ./PRD.md --taskbrief
```

Expected StackForge behavior: copy PRD to `docs/PRD.md`, run Taskbrief explicitly, generate tasks, and show/validate the planned command during dry-run.

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

## JSON Queue Output

For machine integration, output JSON with a top-level `tasks` array using the schema in `references/task-schema.md`.

Minimum validation:

- JSON parses cleanly
- every task has a unique `id`
- every task has a non-empty `repo`, or `repo: unknown` with a human-decision note
- every task has `review_pack_required: true`
- every task has at least one stop condition
- every task has at least one verification command or explicit manual verification step

## YAML Queue Output

When the user asks for YAML, output an object with a `tasks` array using the same schema. Check multiline blocks carefully, especially `agent_prompt: |` indentation.

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
      <indented prompt>
```

Use `assets/queue-template.yaml` as the queue template.

## CrewCMD Export Rules

Keep CrewCMD out unless the user explicitly asks for CrewCMD output.

When requested:

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
- Do not require CLI installation for manual task shaping.
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
