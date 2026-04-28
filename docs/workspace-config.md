# Workspace Config

Workspace config tells `taskbrief` which repositories exist and how to apply
repo-specific safety defaults. It is optional for single-task drafting, but
recommended for cross-repo plans and CrewCMD exports.

## CLI Usage

```bash
taskbrief parse brain-dump.txt --workspace repos.yaml --format yaml
```

## Shape

```yaml
workspace: rogerchappel-oss
defaults:
  requires_pr: true
  review_pack_required: true
  forbidden_by_default:
    - .env*
    - secrets/**
repos:
  branchbrief:
    path: ~/Developer/my-opensource/branchbrief
    type: oss-cli
    default_base: main
    common_verification:
      - npm ci
      - npm test
      - npm run build
    risk_defaults:
      docs: low
      release: medium
      auth: high
```

## Top-Level Fields

| Field | Required | Description |
| --- | --- | --- |
| `workspace` | yes | Human-readable workspace key. |
| `defaults` | no | Defaults applied to every repo unless overridden. |
| `repos` | yes | Map of repo keys to repo config objects. |

## Defaults

| Field | Description |
| --- | --- |
| `requires_pr` | Whether generated work should expect a branch and PR. |
| `review_pack_required` | Whether task output must require a review pack. |
| `forbidden_by_default` | Paths that should be forbidden for every repo. |

## Repo Fields

| Field | Required | Description |
| --- | --- | --- |
| `path` | yes | Local path hint. May use `~`; `taskbrief` should not inspect repo contents by default. |
| `type` | yes | Repo category, such as `oss-cli`, `docs-site`, `product`, or `community-oss`. |
| `default_base` | yes | Default base branch for new task branches. |
| `docs_url` | no | Public docs URL, useful for docs tasks. |
| `production_sensitive` | no | Mark product or production-adjacent repos for stronger gating. |
| `common_verification` | no | Commands commonly used to verify changes in this repo. |
| `forbidden_by_default` | no | Repo-specific forbidden paths. These add to top-level defaults. |
| `risk_defaults` | no | Mapping of task type or keyword to `low`, `medium`, or `high`. |

## Safety Rules

- Workspace config is input metadata, not permission to read every repo.
- Do not load `.env` files from configured repo paths.
- Do not scan arbitrary files unless a user explicitly provides them as input.
- Merge top-level and repo-level forbidden paths.
- Treat `production_sensitive: true` as a signal to require human approval for
  release, QA, auth, billing, data, and deployment work.
- If the input references a repo that is not configured, use `repo: unknown` and
  ask for confirmation.

See [examples/repos.yaml](../examples/repos.yaml) for a complete example.
