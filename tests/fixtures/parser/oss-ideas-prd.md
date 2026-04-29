# PRD: Atomcommit

## Product Name

**atomcommit**

## Tagline

Atomic commit helper for git.

## One-Line Pitch

`atomcommit` helps developers create atomic, well-scoped git commits by analyzing staged changes and suggesting logical commit boundaries.

## 1. Objective

Build a CLI tool that analyzes git diff output and suggests atomic commit groupings.

## 7. V1 Scope

V1 should include:

1. CLI package with git diff parsing
2. File grouping by feature/fix scope
3. Interactive commit selection mode
4. Conventional commit message suggestions
5. Documentation and examples

## 8. V2 Scope

V2 should add:

- Git hook integration
- IDE plugins
- Team policy enforcement

## 9. Team Status Scorecard

| Area | Status | Notes |
|------|--------|-------|
| Backend | In Progress | Core logic done |
| Frontend | Not Started | Needs design |
| Docs | In Progress | README draft ready |
| Testing | Planned | Integration tests needed |

## 26. Suggested Initial Commits

```text
chore(repo): scaffold atomcommit package
feat(diff): parse git diff output
feat(group): suggest file groupings by scope
feat(commit): generate conventional commit messages
docs(readme): document atomcommit usage
test(parser): cover git diff parsing edge cases
```

## 27. Agent Work Plan

### Agent 1: Core Parser

- git diff parser
- file change detection
- hunk analysis

### Agent 2: Grouping Logic

- scope detection
- file relationship analysis
- atomic boundary rules

### Agent 3: CLI Interface

- command scaffolding
- interactive mode
- output formatting
