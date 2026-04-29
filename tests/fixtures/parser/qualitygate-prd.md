# PRD: QualityGate

## Scorecard

| Criterion | Points | Notes |
|---|---:|---|
| Demand signal | 18/20 | Strong signal. |

## V1 Scope

1. Build a CLI command that runs repository quality checks
2. Detect package manager scripts from package.json
3. Run safe checks only by default
4. Write markdown and JSON reports
5. Exit non-zero when required checks fail

## Agent Prompt

Implement deterministic repository quality gates.
Include config support for selecting checks and thresholds.
Include pass and fail fixtures for parser and CLI tests.
Include JSON schema tests for generated reports.
Include README usage documentation.
Include a GitHub Actions example workflow.
Do not add scorecard scoring or CrewCmd integration.

## Verification

- [ ] CLI run succeeds against a passing fixture
- [ ] CLI exits non-zero against a failing fixture
- [ ] Package/script detection is covered by tests
- [ ] Safe checks are the default
- [ ] Markdown and JSON reports validate against schema tests
- [ ] README documents config, fixtures, and GitHub Actions usage
- [ ] Final validation confirms release readiness
