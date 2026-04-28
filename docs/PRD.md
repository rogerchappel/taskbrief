# PRD: taskbrief

## Product Name

**taskbrief**

## Tagline

Turn messy brain dumps into agent-ready task queues.

## One-Line Pitch

`taskbrief` converts rough voice transcripts, planning blobs, GitHub issues, and cross-repo TODO dumps into structured task briefs for Codex, OpenClaw, CrewCMD, Claude Code, GitHub Copilot, and human maintainers.

It is the input-side companion to `branchbrief`.

```text
taskbrief   = messy idea/input -> structured agent task queue
branchbrief = completed branch -> structured review brief
CrewCMD     = queue -> worktrees/agents/PRs
```

## 1. Objective

Build an open-source tool and reusable agent skill that turns messy, poorly formatted planning input into safe, bounded, dispatchable agent tasks.

The core use case:

> Roger brain-dumps work from voice or text across multiple repos. `taskbrief` splits that blob into clear agent-ready tasks with repo assignment, branch names, risk levels, allowed paths, forbidden paths, verification commands, stop conditions, and review-pack requirements.

This should reduce the manual effort required to prepare tasks for agents.

## 2. Product Principle

`taskbrief` is not "just a better prompt."

It is a **task compiler** for agentic development workflows.

It converts:

```text
messy input
-> structured tasks
-> human review queue
-> CrewCMD/Codex/OpenClaw dispatch
```

The default product stance:

```text
Structured templates locally. LLM parsing by explicit opt-in.
```

## 3. Target Users

### Primary User

Roger Chappel, operating multiple OSS, product, and company repos with Codex, OpenClaw, CrewCMD, and other agents.

### Secondary Users

- AI-assisted developers
- OSS maintainers
- technical founders
- agent workflow builders
- teams dispatching work to coding agents
- people using voice notes or rough planning docs to drive development

## 4. Core Problem

Agent throughput is limited by task shaping.

Raw input is often:

- cross-repo
- voice-transcribed
- poorly formatted
- ambiguous
- mixed-risk
- incomplete
- full of implied context
- not safe to dispatch directly

Example raw input:

```text
Need to fix branchbrief npm release, deploy docs, add dependabot to agentic template, check CrewCMD PRs, and product-videogen still needs mobile testing. Also write a blog about the new workflow.
```

A human currently has to split that into tasks manually.

`taskbrief` should produce:

- separate tasks
- assigned repos
- branch names
- risk levels
- allowed paths
- forbidden paths
- verification commands
- stop conditions
- human decision requirements
- CrewCMD-compatible queue output

## 5. Relationship to Other Projects

### agentic-team-playbook

Defines the operating philosophy.

### branchbrief

Summarises completed branch work for review.

### agentic-oss-template

Provides reusable repo infrastructure.

### CrewCMD

Orchestrates agents, worktrees, branches, PRs, and review flows.

### taskbrief

Creates the input tasks that feed CrewCMD and agents.

```text
voice note / issue / planning blob
-> taskbrief
-> CrewCMD
-> agent branch
-> branchbrief
-> human review
```

## 6. Non-Goals

V1 should not:

- dispatch agents automatically
- mutate repos
- create PRs
- create GitHub issues by default
- run code
- run tests
- transcribe audio
- require an LLM for all usage
- require API keys by default
- auto-launch CrewCMD
- make production decisions
- mark high-risk tasks as safe
- hide uncertainty

Voice transcription happens upstream. `taskbrief` consumes the transcript.

## 7. V1 Scope

V1 should include:

1. CLI package
2. Codex/OpenClaw-compatible `SKILL.md`
3. task schema
4. workspace config format
5. Markdown task brief output
6. YAML/JSON queue output
7. CrewCMD export format
8. risk classification from text and repo config
9. explicit LLM parsing mode
10. examples using voice dumps and cross-repo plans
11. docs site/source docs
12. no automatic dispatch

## 8. V2 Scope

V2 should add:

- GitHub issue import
- GitHub issue export
- CrewCMD dispatch integration
- interactive review/edit mode
- repo detection from local workspace
- reusable task templates
- richer workspace policies
- local history of generated task queues
- skill packaging and install docs
- optional provider adapters for OpenAI, Anthropic, OpenRouter, Ollama

## 9. V3 Scope

V3 should add:

- direct CrewCMD dispatch
- GitHub project/issue sync
- voice assistant integration
- multi-day planning queues
- task dependency graphs
- automatic branch/worktree allocation
- org-level policy packs
- reusable repo profiles
- web UI or TUI for reviewing generated queues
- integration with `branchbrief` reports to close the loop

## 10. Required Repository Structure

```text
taskbrief/
  README.md
  LICENSE
  AGENTS.md
  CONTRIBUTING.md
  SECURITY.md
  CODE_OF_CONDUCT.md
  CHANGELOG.md
  ROADMAP.md
  docs/
    PRD.md
    task-schema.md
    workspace-config.md
    crewcmd-export.md
    skill-integration.md
    llm-policy.md
    risk-policy.md
    examples.md
    release-process.md
  skills/
    taskbrief/
      SKILL.md
      references/
        task-schema.md
        risk-policy.md
        crewcmd-export.md
        workspace-config.md
      assets/
        task-brief-template.md
        queue-template.yaml
        voice-dump-example.txt
  src/
    cli.ts
    index.ts
    types.ts
    parser/
    output/
    risk/
    workspace/
    llm/
    crewcmd/
  examples/
    voice-dump.txt
    cross-repo-plan.txt
    task-brief.md
    tasks.yaml
    tasks.json
    crewcmd-tasks.json
    repos.yaml
  tests/
    parser/
    output/
    risk/
    workspace/
    fixtures/
  .github/
    workflows/
      ci.yml
      branchbrief.yml
    ISSUE_TEMPLATE/
      bug_report.md
      feature_request.md
      agent_task.md
    pull_request_template.md
    dependabot.yml
```

## 11. CLI Requirements

### Primary Commands

```bash
taskbrief new
taskbrief parse brain-dump.txt
taskbrief parse brain-dump.txt --workspace repos.yaml
taskbrief parse brain-dump.txt --output tasks.md
taskbrief parse brain-dump.txt --format yaml --output tasks.yaml
taskbrief parse brain-dump.txt --format json --output tasks.json
taskbrief parse brain-dump.txt --crewcmd --output crewcmd-tasks.json
```

### stdin Support

```bash
pbpaste | taskbrief parse --workspace repos.yaml --format yaml
```

### Voice Transcript Support

Voice transcription happens elsewhere. `taskbrief` consumes text:

```bash
taskbrief parse voice-note.txt --type transcript --workspace repos.yaml
```

### LLM Mode

LLM parsing must be explicit:

```bash
taskbrief parse brain-dump.txt --llm --provider openai
taskbrief parse brain-dump.txt --llm --provider anthropic
taskbrief parse brain-dump.txt --llm --provider ollama
```

### Non-LLM Mode

V1 should also support deterministic/manual task creation:

```bash
taskbrief new --repo branchbrief --type docs --risk low --objective "Document Copilot support"
```

## 12. LLM Policy

`taskbrief` may use an LLM because task shaping is language-heavy, but it must never do so silently.

### Default

By default:

- no network calls
- no API keys required
- no hidden LLM use
- no hidden credential use
- no automatic dispatch

### Required Disclosure

Before any LLM call, print:

```text
LLM mode enabled.
Provider: <provider>
Model: <model>
Credential source: <ENV_KEY or local/no auth>
Input: <file/stdin>
Output format: <markdown|yaml|json|crewcmd>
Network: <yes/no>
```

### Credential Sources

Supported providers:

```text
OpenAI:     OPENAI_API_KEY
Anthropic:  ANTHROPIC_API_KEY
OpenRouter: OPENROUTER_API_KEY
Ollama:     no key by default
```

Rules:

- never print secret values
- never scan arbitrary env vars
- never load `.env` unless explicitly requested
- missing keys must produce clear errors
- do not dispatch agents after parsing unless explicitly requested

### Data Handling

The LLM may receive the brain dump text and workspace config.

It must not receive secrets, `.env` files, source code, or repo contents unless explicitly added by the user.

## 13. Workspace Config

Workspace config is essential. It tells `taskbrief` what repos exist and how to reason about them.

Example:

```yaml
workspace: rogerchappel-oss
repos:
  branchbrief:
    path: ~/Developer/my-opensource/branchbrief
    type: oss-cli
    default_base: main
    docs_url: https://branchbrief.rogerchappel.com
    requires_pr: true
    common_verification:
      - npm test
      - npm run build
      - npm run typecheck
    forbidden_by_default:
      - .env*
      - secrets/**
    risk_defaults:
      docs: low
      tests: low
      ci: medium
      release: medium
      npm: medium
      auth: high
      payments: high
      production_data: high
  agentic-team-playbook:
    path: ~/Developer/my-opensource/agentic-team-playbook
    type: docs-site
    default_base: main
    common_verification:
      - npm run build
    risk_defaults:
      docs: low
      deploy: medium
  CrewCMD:
    path: ~/Developer/my-opensource/CrewCMD
    type: community-oss
    default_base: main
    requires_pr: true
    common_verification:
      - npm test
      - npm run build
    forbidden_by_default:
      - .env*
      - secrets/**
      - production/**
  product-videogen:
    path: ~/Developer/work/product-videogen
    type: product
    default_base: main
    production_sensitive: true
    requires_pr: true
    common_verification:
      - npm test
      - npm run build
    forbidden_by_default:
      - billing/**
      - auth/**
      - production/**
      - .env*
```

## 14. Task Schema

Every generated task must include:

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

### Example

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
      You are preparing branchbrief for its first npm release...
```

## 15. Markdown Task Brief Output

For each task, Markdown output should look like:

```md
# Task Brief: Prepare branchbrief for npm release

## Objective

Prepare branchbrief for first npm release without publishing.

## Repository

branchbrief

## Suggested Branch

agent/npm-release-readiness

## Task Type

release

## Risk Level

Medium

## Context

The package needs metadata, bin path, release docs, and Trusted Publishing workflow reviewed before v0.1.0.

## Allowed Paths

- package.json
- README.md
- docs/**
- .github/workflows/publish.yml
- CHANGELOG.md

## Forbidden Paths

- src/**
- .env*
- secrets/**

## Expected Commits

- chore(package): prepare npm package metadata
- docs(npm): document first release process
- ci(release): add npm publish workflow

## Verification

- npm ci
- npm test
- npm run build
- npm pack --dry-run

## Stop Conditions

- npm token required
- package name unavailable
- publish requested
- secrets or credentials required

## Review Pack Required

Yes.

## Human Decision Needed

- approve package name
- approve first publish

## Agent Prompt

<copy-ready prompt>
```

## 16. CrewCMD Export

When `--crewcmd` is passed, output a CrewCMD-compatible queue.

Example:

```json
{
  "version": "0.1",
  "source": "taskbrief",
  "workspace": "rogerchappel-oss",
  "tasks": [
    {
      "id": "branchbrief-npm-release-readiness",
      "repo": "branchbrief",
      "branch": "agent/npm-release-readiness",
      "type": "release",
      "risk": "medium",
      "objective": "Prepare branchbrief for first npm release without publishing.",
      "allowedPaths": [
        "package.json",
        "README.md",
        "docs/**",
        ".github/workflows/publish.yml",
        "CHANGELOG.md"
      ],
      "forbiddenPaths": [
        "src/**",
        ".env*",
        "secrets/**"
      ],
      "verification": [
        "npm ci",
        "npm test",
        "npm run build",
        "npm pack --dry-run"
      ],
      "stopConditions": [
        "npm token required",
        "package name unavailable",
        "publish requested"
      ],
      "reviewPackRequired": true,
      "requiresHumanApproval": true
    }
  ]
}
```

## 17. Risk Classification

### High Risk

Mark high risk if task mentions:

- production data
- payments
- Stripe
- billing
- auth
- security
- migrations
- secrets
- environment variables
- destructive action
- data deletion
- public API compatibility
- launch-critical work
- customer data
- credentials
- webhooks
- tokens

### Medium Risk

Mark medium risk if task mentions:

- release
- npm publish
- CI
- deployment
- dependency updates
- config
- mobile testing
- database sync
- public CLI behavior
- GitHub Actions
- Cloudflare Pages
- package metadata
- versioning

### Low Risk

Mark low risk if limited to:

- docs
- README
- examples
- tests
- issue templates
- changelog
- roadmap
- non-runtime content
- copy updates

### Human Gating

Medium risk tasks should usually require review.

High risk tasks must require human approval and should not be dispatched automatically.

## 18. Stop Conditions

Every task should have stop conditions.

Common stop conditions:

```text
- secrets or credentials required
- production data mutation required
- destructive operation required
- payment/auth/security code touched
- package publishing requested
- deployment credentials required
- unclear repo ownership
- unclear target branch
- missing verification command
```

## 19. Skill Integration

`SKILL.md` is a first-class artifact.

The repo must include:

```text
skills/
  taskbrief/
    SKILL.md
    references/
      task-schema.md
      risk-policy.md
      crewcmd-export.md
      workspace-config.md
    assets/
      task-brief-template.md
      queue-template.yaml
      voice-dump-example.txt
```

### Skill Requirements

The skill must:

- have YAML front matter
- include `name`
- include `description`
- describe when it should trigger
- describe when it should not trigger
- define Markdown task brief output
- define YAML/JSON queue output
- define CrewCMD export expectations
- define safety rules
- include examples
- not require CLI installation
- use same schema as CLI

### `skills/taskbrief/SKILL.md` Draft

````md
---
name: taskbrief
description: Convert messy brain dumps, voice transcripts, GitHub issues, and planning notes into structured agent-ready task briefs or CrewCMD dispatch queues. Use this when the user asks to split rough work across repos, prepare tasks for Codex/OpenClaw/CrewCMD, or turn a poorly formatted note into bounded agent tasks.
---
# taskbrief Skill

Use this skill to convert messy planning input into structured, safe, agent-ready task briefs.

This skill is for:

- voice transcripts
- rough planning blobs
- cross-repo task dumps
- GitHub issue text
- meeting notes
- TODO lists
- "I need to do all this today" messages

The output should help a human or orchestration tool dispatch work to agents safely.

## Core Principle

Do not simply rewrite the user's text.

Split the input into bounded, reviewable, dispatchable tasks.

Each task should include:

- objective
- repo
- branch name
- task type
- risk level
- allowed paths
- forbidden paths
- verification commands
- stop conditions
- review pack requirement
- human decision needed

## Default Workflow

1. Read the full input.
2. Identify distinct tasks.
3. Group tasks by repository.
4. Split mixed tasks into smaller agent-safe units.
5. Classify risk.
6. Add allowed and forbidden paths when possible.
7. Add verification commands based on repo type.
8. Mark production, payment, auth, data, migration, or secrets work as human-gated.
9. Output Markdown for humans and YAML/JSON when requested.
10. Do not dispatch agents unless the user explicitly asks.

## Risk Rules

High risk if the task mentions:

- production data
- payments
- Stripe
- billing
- auth
- security
- migrations
- secrets
- environment variables
- destructive actions
- data deletion
- public API compatibility
- launch-critical work

Medium risk if the task mentions:

- release
- npm publish
- CI
- deployment
- dependency updates
- config
- mobile app testing
- database sync
- public CLI behavior

Low risk if the task is limited to:

- docs
- README
- examples
- tests
- issue templates
- changelog
- roadmap
- non-runtime content

## Required Markdown Output

For each task:

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

## Required Queue Output

When the user asks for CrewCMD, YAML, JSON, or a dispatch queue, output a list of task objects with this shape:

```yaml
tasks:
  - id:
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
```

## Safety Rules

- Do not hide uncertainty.
- Do not invent repo paths if unknown.
- If the target repo is unclear, mark it as `repo: unknown` and ask for confirmation.
- Do not mark high-risk production/payment/auth/data work as safe.
- Do not dispatch tasks automatically.
- Do not run code.
- Do not mutate repositories.
- Do not create issues unless explicitly asked.

## CrewCMD Export Rules

When preparing CrewCMD tasks:

- prefer small tasks
- one task per branch
- one branch per agent
- include allowed paths
- include forbidden paths
- include verification
- include stop conditions
- require review packs
- require human approval for medium/high risk work

## Good Task Split Example

Input:
"Need to fix branchbrief npm release, deploy docs, add dependabot to agentic template, check CrewCMD PRs, and product-videogen still needs mobile testing."

Output tasks:

1. `branchbrief`: prepare npm release
2. `branchbrief`: verify docs deploy
3. `agentic-oss-template`: add Dependabot config
4. `CrewCMD`: review existing PRs
5. `product-videogen`: run mobile QA checklist

Do not combine these into one task.
````

## 20. CLI Architecture

Suggested stack:

- TypeScript
- Node.js
- commander or cac
- zod
- yaml
- vitest
- tsup

Suggested file structure:

```text
src/
  cli.ts
  index.ts
  types.ts
  parser/
    parseBrainDump.ts
    splitTasks.ts
    normalizeTask.ts
  workspace/
    loadWorkspace.ts
    resolveRepo.ts
    schema.ts
  risk/
    classifyTaskRisk.ts
    riskRules.ts
  output/
    markdown.ts
    yaml.ts
    json.ts
    crewcmd.ts
  llm/
    providers/
      openai.ts
      anthropic.ts
      openrouter.ts
      ollama.ts
    prompt.ts
    parseWithLlm.ts
    disclosure.ts
  skill/
    validateSkill.ts
  errors/
    TaskBriefError.ts
```

## 21. Testing Requirements

V1 tests should cover:

- parsing a simple single-repo task
- splitting a cross-repo brain dump
- classifying low/medium/high risk
- resolving repo aliases from workspace config
- producing Markdown task briefs
- producing YAML/JSON task queues
- producing CrewCMD export
- ensuring high-risk tasks require human approval
- ensuring unknown repos are marked uncertain
- validating `SKILL.md` exists and has front matter
- no LLM call unless `--llm` is passed

## 22. Example Input

```text
Okay we need to get branchbrief ready for npm, deploy the docs site, set up dependabot on agentic-oss-template, review the CrewCMD PRs, and product-videogen still needs mobile testing on iPhone and tablet. Also write a blog about turning brain dumps into task queues.
```

Expected task split:

1. `branchbrief`: npm release readiness
2. `branchbrief`: docs deploy verification
3. `agentic-oss-template`: Dependabot setup
4. `CrewCMD`: PR review pass
5. `product-videogen`: mobile QA checklist and test
6. `roger-website`: blog draft

## 23. Example Output

```yaml
tasks:
  - id: branchbrief-npm-release-readiness
    repo: branchbrief
    branch: agent/npm-release-readiness
    type: release
    risk: medium
    objective: Prepare branchbrief for first npm release without publishing.
    allowed_paths:
      - package.json
      - README.md
      - docs/**
      - .github/workflows/publish.yml
    forbidden_paths:
      - src/**
      - .env*
    verification:
      - npm ci
      - npm test
      - npm run build
      - npm pack --dry-run
    stop_conditions:
      - npm token required
      - package publishing requested
    review_pack_required: true
    human_decision_needed:
      - approve package name
      - approve publish method
  - id: product-videogen-mobile-qa
    repo: product-videogen
    branch: agent/mobile-qa-checklist
    type: qa
    risk: medium
    objective: Create and run mobile QA checklist for tablet and iPhone video generation workflow.
    allowed_paths:
      - docs/**
      - tests/**
    forbidden_paths:
      - billing/**
      - auth/**
      - production/**
      - .env*
    verification:
      - manual iPhone smoke test
      - manual tablet smoke test
    stop_conditions:
      - production credentials required
      - app store configuration required
    review_pack_required: true
    human_decision_needed:
      - confirm QA pass/fail on physical devices
```

## 24. Docs Requirements

Create:

```text
docs/PRD.md
docs/task-schema.md
docs/workspace-config.md
docs/crewcmd-export.md
docs/skill-integration.md
docs/llm-policy.md
docs/risk-policy.md
docs/examples.md
```

### README Must Include

- what taskbrief is
- when to use it
- when not to use it
- CLI examples
- skill usage
- CrewCMD export example
- local-first / LLM-explicit policy
- relationship to branchbrief
- example brain dump input/output
- install instructions
- roadmap

## 25. Acceptance Criteria

Checklist state reflects the current merged `main` branch, not unmerged
implementation PRs. A checked item means the capability exists in the repository
at module, docs, skill, or CLI level as applicable. End-user CLI parsing remains
incomplete until `taskbrief parse` is wired into the CLI.

V1 is complete when:

- [x] CLI exists
- [ ] `taskbrief parse <file>` works
- [ ] stdin input works
- [x] workspace config loads
- [x] repo assignment works when repo names are clear
- [x] unclear repos are marked uncertain
- [x] task splitting works on a cross-repo blob
- [x] risk classification works
- [x] Markdown output works
- [x] YAML output works
- [x] JSON output works
- [x] CrewCMD export works
- [ ] LLM mode is explicit
- [x] no LLM call happens by default
- [x] high-risk tasks require human approval
- [x] stop conditions are included
- [x] `skills/taskbrief/SKILL.md` exists
- [x] skill has valid front matter
- [x] skill includes task schema and safety rules
- [x] examples exist
- [x] docs exist
- [ ] tests pass
- [x] README explains usage clearly

## 26. Suggested Initial Commits

```text
chore(repo): scaffold taskbrief package
docs(prd): define taskbrief product scope
docs(skill): add taskbrief skill specification
feat(workspace): load repo workspace config
feat(risk): classify task risk from text
feat(output): render markdown task briefs
feat(output): render yaml and json task queues
feat(output): export crewcmd task queues
feat(cli): parse brain dumps into task briefs
docs(examples): add voice dump and task queue examples
test(parser): cover cross-repo task splitting
test(skill): validate taskbrief skill metadata
```

## 27. Agent Work Plan

### Agent 1: Repo Scaffold

- package setup
- TypeScript
- tests
- README skeleton
- AGENTS.md
- docs skeleton

### Agent 2: Skill Package

- `skills/taskbrief/SKILL.md`
- references
- assets
- examples
- skill validation test

### Agent 3: Workspace Config

- load `repos.yaml`
- validate schema
- resolve repo aliases
- tests

### Agent 4: Risk Classifier

- risk rules
- text keyword classification
- repo config risk defaults
- tests

### Agent 5: Output Renderers

- Markdown
- YAML
- JSON
- CrewCMD export

### Agent 6: CLI Integration

- commands
- flags
- stdin/file input
- output writing
- no-LLM default
- graceful errors

### Agent 7: LLM Adapter

- explicit LLM mode
- provider disclosure
- metadata/input safety
- mock tests
- optional provider implementations

## 28. Final Review Pack Required

Every agent must return:

```md
## Review Pack
Repo:
Branch:
PR:
Task:
Status:
Summary:
Commits:
Files changed:
Verification:
Risk level:
Rollback plan:
Human decision needed:
Next recommended task:
```

## 29. Final Product Promise

`taskbrief` helps turn messy human intent into safe agent execution plans.

It does not replace judgment.

It makes delegation reliable.
