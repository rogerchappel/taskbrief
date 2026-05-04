# Release Orchestration

Taskbrief uses ReleaseBox as a release-readiness gate for tag-based GitHub releases.

## Flow

1. Land release automation on `main`.
2. Run the `Release dry run` workflow manually before tagging.
3. Push a reviewed `vX.Y.Z` tag.
4. Let the `Release` workflow run `npm run release:check`, pack the tarball, and create a GitHub release asset.

## Publishing policy

- GitHub release creation is enabled.
- npm publishing is disabled in `releasebox.config.json` for this rollout.
- Any future npm publish automation needs a separate explicit approval and review.
