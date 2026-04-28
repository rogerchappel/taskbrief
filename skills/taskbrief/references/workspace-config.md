# Workspace Config

Workspace config tells taskbrief which repositories exist and how to reason about them. Use it when the user provides repo metadata, aliases, verification commands, or risk defaults.

## Example

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
```

## Field Meanings

- `workspace`: logical workspace name for queue output.
- `repos`: map of known repository names to metadata.
- `path`: local path for human context; do not read it unless the user asks.
- `type`: repo category, such as `oss-cli`, `docs-site`, `community-oss`, or `product`.
- `default_base`: normal base branch.
- `docs_url`: documentation URL when relevant.
- `requires_pr`: whether work should normally go through a PR.
- `common_verification`: default checks for tasks in this repo.
- `forbidden_by_default`: paths that should usually be forbidden.
- `risk_defaults`: task keyword or type to risk-level defaults.

## Use Rules

- Prefer explicit workspace config over guesses from the task text.
- Do not invent paths for unknown repositories.
- If a repo alias is unclear, set `repo: unknown` and add a human decision.
- Apply `forbidden_by_default` to each generated task unless the user gives narrower rules.
- Use `common_verification` as a starting point, then narrow verification to the smallest relevant checks.
- Treat `production_sensitive: true` repos conservatively and require human approval for ambiguous work.
