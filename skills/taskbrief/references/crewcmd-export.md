# CrewCMD Export

When the user asks for CrewCMD output, produce a CrewCMD-compatible queue without dispatching agents automatically.

## Export Shape

Use camelCase field names for CrewCMD compatibility.

```json
{
  "version": "0.1",
  "source": "taskbrief",
  "workspace": "<workspace-name>",
  "tasks": [
    {
      "id": "<task-id>",
      "repo": "<repo>",
      "branch": "<branch>",
      "type": "<task-type>",
      "risk": "low|medium|high",
      "objective": "<objective>",
      "allowedPaths": [],
      "forbiddenPaths": [],
      "verification": [],
      "stopConditions": [],
      "reviewPackRequired": true,
      "requiresHumanApproval": false
    }
  ]
}
```

## Rules

- Set `source` to `taskbrief`.
- Use workspace config for the `workspace` value when provided; otherwise use `unknown`.
- Keep one task per branch and one branch per agent.
- Include `allowedPaths`, `forbiddenPaths`, `verification`, and `stopConditions`.
- Set `reviewPackRequired` to `true`.
- Set `requiresHumanApproval` to `true` for all medium and high risk tasks.
- Set `requiresHumanApproval` to `true` for low-risk tasks when the repo, branch, allowed paths, or verification are unclear.
- Do not auto-launch CrewCMD.
- Do not mark a task dispatchable if it requires secrets, credentials, publishing, production data mutation, destructive commands, migrations, auth, payments, or security changes.

## Example

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
