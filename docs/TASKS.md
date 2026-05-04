# Release Tasks

ReleaseBox readiness tracks the checks needed before publishing a tagged GitHub release.

## Current release gate

- Run `npm run release:check` locally and in GitHub Actions.
- Keep npm publishing disabled until the package release path is explicitly approved.
- Create GitHub releases from reviewed semantic version tags.

## v0.1.0 acceptance

- TypeScript typecheck passes.
- Vitest test suite passes.
- CLI smoke test prints help and version from the built artifact.
- `npm pack --dry-run` succeeds and shows the expected package contents.
