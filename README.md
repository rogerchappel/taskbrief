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
  available for deterministic local parsing.
- `taskbrief parse --llm --provider openai` is available as an explicit opt-in
  path for BYO or messy PRDs, with strict schema validation and fail-closed
  output handling.
- `taskbrief parse --orchestration` can emit deterministic orchestration
  handoff artifacts that define sequential waves and concurrent task groups.

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
`parse` and `new` commands, with an opt-in OpenAI-backed `--llm` parse mode and
optional orchestration handoff artifacts.

## CLI Examples

```bash
taskbrief new
taskbrief parse brain-dump.txt
taskbrief parse brain-dump.txt --workspace repos.yaml
taskbrief parse brain-dump.txt --output tasks.md
taskbrief parse brain-dump.txt --format yaml --output tasks.yaml
taskbrief parse brain-dump.txt --format json --output tasks.json
taskbrief parse brain-dump.txt --crewcmd --output crewcmd-tasks.json
taskbrief parse examples/github-issue-triage.txt --crewcmd
taskbrief parse docs/PRD.md --output docs/TASKS.md --orchestration
```

For a runnable issue-triage workflow, see
[GitHub Issue Triage to CrewCMD](docs/tutorials/github-issue-triage-to-crewcmd.md):

```bash
bash examples/github-issue-triage-demo.sh
```

For the shortest deterministic pipe workflow, see
[Stdin triage to JSON](docs/tutorials/stdin-triage-to-json.md). For public
clip planning, use the grounded [demo shot list](docs/promo/demo-shot-list.md).

Runnable fixture demos:

```bash
npm run build
bash examples/release-readiness-demo.sh
bash examples/github-issue-triage-demo.sh
bash examples/cross-repo-promo-demo.sh
bash examples/stdin-promo-demo.sh
bash examples/oncall-hotfix-demo.sh
bash examples/dependency-upgrade-demo.sh
```

The GitHub issue triage demo parses `examples/github-issue-triage.txt`, writes
`TASKS.md`, `ORCHESTRATION.md`, and `orchestration.json`, then checks that the
handoff preserved the branchbrief repo context and publish-related stop
condition.

The cross-repo promo demo parses `examples/cross-repo-plan.txt` and writes the
same task and orchestration artifacts for a broader maintainer planning note.

The stdin promo demo pipes `examples/cross-repo-plan.txt` through the parser,
uses `examples/repos.yaml` for workspace context, and verifies a JSON task queue
at `/tmp/taskbrief-stdin-tasks.json`.

The on-call hotfix demo parses `examples/oncall-hotfix-dump.txt` into a hotfix
task plus a follow-up documentation task while preserving credential, ownership,
and publish stop conditions.

The support intake demo parses `examples/support-intake-dump.txt` into a
DocFresh-flavored README drift task plus a separate promotion follow-up while
preserving private-path and publish stop conditions:

```bash
bash examples/support-intake-demo.sh
```

See [Support Intake Queue](docs/tutorials/support-intake-queue.md) and
[Support Intake Social Hooks](docs/promo/support-intake-hooks.md).

The dependency upgrade demo parses `examples/dependency-upgrade-dump.txt` into
separate repo tasks with branch names, verification commands, and stop
conditions:

```bash
bash examples/dependency-upgrade-demo.sh
```

See [Dependency Upgrade Queue](docs/tutorials/dependency-upgrade-queue.md) and
[Dependency Upgrade Hooks](docs/promo/dependency-upgrade-hooks.md).

To demonstrate the explicit LLM guardrail without using a real provider key:

```bash
npm run build
bash examples/llm-fail-closed-demo.sh
```

See [LLM Fail-Closed Demo](docs/tutorials/llm-fail-closed.md) and
[LLM Fail-Closed Hooks](docs/promo/llm-fail-closed-hooks.md).

The YAML queue demo parses the same cross-repo planning note with workspace
context and writes a reviewable YAML task queue:

```bash
bash examples/yaml-queue-demo.sh
```

See [YAML Queue Export Demo](docs/tutorials/yaml-queue-export.md).

For a release review pack that writes `TASKS.md`, `ORCHESTRATION.md`,
`orchestration.json`, and CrewCMD JSON from the release-readiness fixture:

```bash
bash examples/release-review-pack-demo.sh
```

See [Release Review Pack Demo](docs/tutorials/release-review-pack.md).

## Verification

Run the local gate before opening a PR:

```bash
npm test
npm run release:check
```

`release:check` runs the typecheck, tests, CLI smoke, package dry-run, and
release-readiness validation that exercise the documented examples above.

stdin is supported when no input file is provided:

```bash
pbpaste | taskbrief parse --workspace repos.yaml --format yaml
```

## Local-First Policy

The default product stance is:

```text
Structured templates locally. LLM parsing by explicit opt-in.
```

By default, `taskbrief` makes no network calls, requires no API keys, uses no
hidden credentials, and dispatches no agents.

Deterministic parsing stays the default:

```bash
taskbrief parse brain-dump.txt
taskbrief parse docs/PRD.md --format json --output tasks.json
```

Use LLM mode only when you explicitly want help extracting tasks from a BYO or
messy PRD that the deterministic parser cannot shape reliably. The OpenAI
provider reads `OPENAI_API_KEY` from the process environment, so it can come from
your shell, CI secrets, or an inline command prefix:

```bash
taskbrief parse messy-prd.md --llm --provider openai
OPENAI_API_KEY=... taskbrief parse messy-prd.md --llm --provider openai
OPENAI_API_KEY=... taskbrief parse messy-prd.md --llm --provider openai --model gpt-4.1-mini
```

If `--model` is omitted, the OpenAI provider currently defaults to
`gpt-4.1-mini`.

LLM mode is fail-closed:

- no LLM call happens unless `--llm` is present
- `--provider` is required
- missing provider credentials fail with a non-zero exit and write no output
- malformed JSON fails with a non-zero exit and write no output
- schema-invalid JSON fails with a non-zero exit and write no output
- valid LLM tasks are re-normalized through Taskbrief's deterministic formatting path
- task context includes provenance like `Source: llm (openai:gpt-4.1-mini)`

Current provider support:

- `openai` via `OPENAI_API_KEY`

## Orchestration Handoff

`--orchestration` is deterministic by default and does not require `--llm`. It
operates on the task queue produced by either the default parser or explicit LLM
mode. When combined with `--llm`, Taskbrief also asks the configured provider to
refine the dependency waves, then validates the refined plan before writing any
files.

When enabled, Taskbrief writes two handoff artifacts next to `--output`:

- `ORCHESTRATION.md` for humans and orchestrator prompts
- `orchestration.json` for tools

```bash
taskbrief parse docs/PRD.md --output docs/TASKS.md --orchestration
taskbrief parse messy-prd.md --llm --provider openai --output docs/TASKS.md --orchestration
```

The handoff explicitly separates sequential dependency waves from concurrent
work inside a wave:

- Wave 1 tasks are dispatchable first and may run concurrently when listed
  together.
- Later waves depend on all earlier waves completing and passing verification.
- High-risk or human-decision tasks are marked blocked until resolved.
- Final validation tasks are held for the closeout wave.

LLM-refined orchestration is also fail-closed: malformed JSON, schema-invalid
wave plans, duplicate task ids, unknown task ids, or omitted task ids all fail
with a non-zero exit before `TASKS.md`, `ORCHESTRATION.md`, or
`orchestration.json` are written.

Use this output for StackForge or an external orchestrator instead of dispatching
every task at once.

For a fixture-backed local demo that creates all three orchestration artifacts
and verifies their basic shape, run:

```bash
bash examples/orchestration-demo.sh
```

The demo uses `examples/voice-dump.txt` and `examples/repos.yaml`, writes to a
temporary directory, and checks that `TASKS.md`, `ORCHESTRATION.md`, and
`orchestration.json` were produced.

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

## Limitations

taskbrief is a local-first helper for preparing reviewable evidence. It does not replace human review, live system validation, or project-specific policy checks, and generated output should be inspected before use in release or operational decisions.
