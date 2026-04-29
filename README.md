# taskbrief

Turn messy brain dumps into agent-ready task queues.

`taskbrief` converts rough voice transcripts, planning blobs, GitHub issues, and
cross-repo TODO dumps into structured task briefs for Codex, OpenClaw, CrewCMD,
Claude Code, GitHub Copilot, and human maintainers.

It is the input-side companion to `branchbrief`:

```text
taskbrief   = messy idea/input -> structured agent task queue
branchbrief = completed branch -> structured review brief
CrewCMD     = queue -> worktrees/agents/PRs
```

## Status

This repository now contains the V1 building blocks for deterministic task
shaping, and deterministic local parsing is available through the CLI.

Current merged status:

- Package scaffold, CLI help/version shell, and TypeScript build setup exist.
- Deterministic parser modules can split brain dumps into task queue objects.
- Workspace config parsing, repo inference, risk classification, Markdown,
  YAML, JSON, and CrewCMD renderers are implemented at module level.
- The Codex/OpenClaw skill and reference docs exist.
- `taskbrief parse`, stdin parsing, CLI output flags, and CrewCMD export are
  available for deterministic local parsing. LLM provider calls remain reserved
  behind `--llm` and are not wired yet.

See [docs/PRD.md#25-acceptance-criteria](docs/PRD.md#25-acceptance-criteria)
for the current V1 acceptance checklist.

## When to Use It

Use `taskbrief` when you have:

- voice transcripts that contain multiple tasks
- rough planning notes that need to become agent work
- cross-repo task dumps
- GitHub issue text that needs safer execution boundaries
- TODO lists that need repo, branch, risk, and verification metadata

## When Not to Use It

Do not use `taskbrief` to:

- dispatch agents automatically
- mutate repositories
- create pull requests or GitHub issues by default
- run tests or code
- transcribe audio
- make production, security, billing, auth, or data decisions without human review

## Current Commands

From a checkout:

```bash
npm install
npm run cli -- --help
npm run build
node dist/cli.js --help
```

The current CLI exposes package help/version metadata plus deterministic
`parse` and `new` commands.

## CLI Examples

```bash
taskbrief new
taskbrief parse brain-dump.txt
taskbrief parse brain-dump.txt --workspace repos.yaml
taskbrief parse brain-dump.txt --output tasks.md
taskbrief parse brain-dump.txt --format yaml --output tasks.yaml
taskbrief parse brain-dump.txt --format json --output tasks.json
taskbrief parse brain-dump.txt --crewcmd --output crewcmd-tasks.json
```

stdin is supported when no input file is provided:

```bash
pbpaste | taskbrief parse --workspace repos.yaml --format yaml
```

## Local-First Policy

The default product stance is:

```text
Structured templates locally. LLM parsing by explicit opt-in.
```

By default, `taskbrief` should make no network calls, require no API keys, use no
hidden credentials, and dispatch no agents.

LLM mode must be explicit when implemented:

```bash
taskbrief parse brain-dump.txt --llm --provider openai
taskbrief parse brain-dump.txt --llm --provider anthropic
taskbrief parse brain-dump.txt --llm --provider ollama
```

Before any LLM call, the CLI must disclose provider, model, credential source,
input, output format, and network behavior.

## CrewCMD Export

The module-level CrewCMD exporter produces CrewCMD-compatible queue objects.
CLI access is available through `taskbrief parse --crewcmd`.

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
      "allowedPaths": ["package.json", "README.md", "docs/**"],
      "forbiddenPaths": [".env*", "secrets/**"],
      "verification": ["npm test", "npm run build", "npm pack --dry-run"],
      "stopConditions": ["npm token required", "package publishing requested"],
      "reviewPackRequired": true,
      "requiresHumanApproval": true
    }
  ]
}
```

## Skill Usage

The planned Codex/OpenClaw skill will live at:

```text
skills/taskbrief/SKILL.md
```

The skill should work without CLI installation and use the same task schema as
the CLI.

## Example

Input:

```text
Need to fix branchbrief npm release, deploy docs, add dependabot to agentic
template, check CrewCMD PRs, and product-videogen still needs mobile testing.
Also write a blog about the new workflow.
```

Expected task split:

1. `branchbrief`: npm release readiness
2. `branchbrief`: docs deploy verification
3. `agentic-oss-template`: Dependabot setup
4. `CrewCMD`: PR review pass
5. `product-videogen`: mobile QA checklist and test
6. `roger-website`: blog draft

## Repository Scaffold

This repository includes OSS collaboration scaffolding from
`agentic-oss-template`:

- `AGENTS.md`
- contributor, security, code of conduct, changelog, and roadmap docs
- GitHub issue and pull request templates
- baseline GitHub Actions
- Dependabot configuration
- reusable reference templates under `templates/`

## Roadmap

See [ROADMAP.md](ROADMAP.md) and [docs/PRD.md](docs/PRD.md).

## License

MIT. See [LICENSE](LICENSE).
