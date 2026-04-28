# Agent Operating Instructions

This file defines how AI agents and human maintainers should work in this repository.

## Core Principle

Move quickly, but keep every change reviewable, reversible, verifiable, and safe.

## Branch Policy

- Work on a branch for all repository changes.
- Branch from the latest `main` before editing.
- Do not work directly on `main` unless a maintainer explicitly says this repository is being treated as personal scratch space.
- Do not merge without explicit human approval.
- Do not rewrite shared history unless explicitly instructed.

## Atomic Commits

- Use Conventional Commits.
- One commit should represent one reviewable intent.
- Keep unrelated docs, code, tests, generated files, dependency changes, and CI changes in separate commits.
- Prefer one clean commit over several artificial commits.
- Prefer several clean commits over one mixed commit.

Allowed commit types:

- `feat:` user-visible capability
- `fix:` bug fix
- `test:` tests only
- `docs:` documentation only
- `refactor:` internal change with no behavior change
- `ci:` CI, build, or release workflow
- `chore:` repository hygiene
- `perf:` performance improvement
- `types:` type-only change

## Expected Workflow

Before editing, report:

1. Task objective
2. Expected blast radius
3. Files likely to change
4. Commit plan
5. Verification plan
6. Risk level: low, medium, or high

Then:

1. Create or confirm a branch.
2. Make the smallest coherent change.
3. Review `git status`.
4. Review `git diff`.
5. Stage only files related to the current intent.
6. Run the smallest relevant verification.
7. Commit atomically.
8. Continue only when the next change is a separate reviewable intent.
9. Return a review pack.

## Verification

Every task must include verification.

Use the smallest relevant check first:

- targeted unit test
- targeted integration test
- typecheck
- lint
- build
- smoke command
- manual documentation review

If verification cannot be run, say why and provide the exact command a maintainer should run.

## Review Pack

Every completed task must return:

```md
## Review Pack
Repo:
Branch:
PR:
Task:
Status: done / blocked / needs review
Summary:
Commits:
Files changed:
Verification:
Risk level:
Rollback plan:
Human decision needed:
Next recommended task:
```

## Safety Rules

Stop and ask before touching:

- authentication or authorization
- security controls
- payments or billing
- production data
- data deletion or destructive commands
- database migrations
- secrets or environment variables
- public API compatibility
- licensing
- telemetry, analytics, or privacy behavior
- production configuration
- major dependency upgrades

Never commit secrets. Never mutate production data unless explicitly instructed. Prefer dry runs, idempotent operations, and clear rollback notes for any data-affecting work.

## Agent Conduct

- Prefer existing repository patterns over new abstractions.
- Keep edits scoped to the task.
- Do not modify GitHub Actions, package scaffolds, or generated repository structure unless the task explicitly asks for it.
- Do not revert user or maintainer changes unless explicitly instructed.
- Surface blockers early with options and a recommendation.
