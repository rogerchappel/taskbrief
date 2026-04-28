# Skill Integration

The planned `taskbrief` skill lets Codex, OpenClaw, and compatible agent
systems produce task briefs without requiring the CLI to be installed.

## Trigger

Use the skill when a user asks to turn rough input into:

- agent-ready task briefs
- a YAML or JSON task queue
- a CrewCMD dispatch queue
- cross-repo task planning
- safer tasks from a voice transcript or planning blob

Do not use it to dispatch agents, mutate repositories, create PRs, or make
security, billing, production, or data decisions.

## Expected Skill Files

```text
skills/taskbrief/
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

## Skill Requirements

`SKILL.md` should:

- include YAML front matter with `name` and `description`
- define when to trigger and when not to trigger
- use the same task schema as the CLI
- define Markdown, YAML, JSON, and CrewCMD output expectations
- classify risk using [risk-policy.md](risk-policy.md)
- require allowed paths, forbidden paths, verification, stop conditions, and
  review-pack requirements
- preserve uncertainty instead of inventing repo details
- never dispatch work unless the user explicitly asks for dispatch outside the
  V1 taskbrief flow

## Workflow

1. Read the complete input.
2. Identify distinct tasks.
3. Split mixed work by repo, branch, and risk level.
4. Apply workspace defaults if a workspace config is provided.
5. Classify risk.
6. Add allowed and forbidden paths.
7. Add verification and stop conditions.
8. Emit Markdown, YAML, JSON, or CrewCMD output as requested.
9. Require review packs for agent-ready tasks.

## CLI Alignment

Skill output should match CLI output so a user can move between workflows:

```bash
taskbrief parse rough-plan.txt --workspace repos.yaml --format yaml
```

and:

```text
Use taskbrief to convert this rough plan into YAML tasks using the attached workspace config.
```

Both should produce the canonical fields from [task-schema.md](task-schema.md).
