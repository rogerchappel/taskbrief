# CrewCMD Export

`taskbrief` can prepare a CrewCMD-compatible queue when the CLI is called with
`--crewcmd`.

```bash
taskbrief parse examples/cross-repo-plan.txt \
  --workspace examples/repos.yaml \
  --crewcmd \
  --output examples/crewcmd-tasks.json
```

CrewCMD export is a planning artifact. It must not dispatch agents, create
worktrees, push branches, merge PRs, or mutate repositories by itself.

## Top-Level Shape

```json
{
  "version": "0.1",
  "source": "taskbrief",
  "workspace": "rogerchappel-oss",
  "tasks": []
}
```

## Task Field Mapping

CrewCMD export uses camelCase for orchestration-facing fields while preserving
the same task intent as the canonical schema.

| Canonical field | CrewCMD field |
| --- | --- |
| `id` | `id` |
| `repo` | `repo` |
| `branch` | `branch` |
| workspace `default_base` | `base` |
| `type` | `type` |
| `risk` | `risk` |
| `objective` | `objective` |
| `allowed_paths` | `allowedPaths` |
| `forbidden_paths` | `forbiddenPaths` |
| `verification` | `verification` |
| `stop_conditions` | `stopConditions` |
| `expected_commits` | `expectedCommits` |
| `review_pack_required` | `reviewPackRequired` |
| `human_decision_needed` non-empty or medium/high risk | `requiresHumanApproval` |
| `agent_prompt` | `agentPrompt` |

## Export Rules

- Emit one task per branch.
- Include `base` from the workspace repo config when available.
- Preserve `allowedPaths`, `forbiddenPaths`, `verification`, and
  `stopConditions`; these are dispatch safety boundaries.
- Set `requiresHumanApproval: true` for medium and high risk tasks.
- Set `requiresHumanApproval: true` when `human_decision_needed` is non-empty.
- Never include secret values, API keys, tokens, or environment variable values.
- Do not include repo source contents unless the user explicitly provided those
  contents as task input.

## Example

See [examples/crewcmd-tasks.json](../examples/crewcmd-tasks.json).
