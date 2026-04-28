# taskbrief Risk Policy

Classify every task as `low`, `medium`, or `high`. When in doubt, choose the higher risk and explain the uncertainty in the task context.

## High Risk

Mark a task `high` if it mentions or implies:

- production data
- customer data
- payments
- Stripe
- billing
- auth or authorization
- security controls
- migrations
- secrets
- environment variables
- credentials
- tokens
- webhooks
- destructive actions
- data deletion
- public API compatibility
- launch-critical work

High-risk tasks must:

- require human approval
- include explicit stop conditions
- avoid automatic dispatch
- be isolated from unrelated docs, tests, or cleanup
- forbid `.env*`, `secrets/**`, production data paths, and unrelated runtime paths unless a human explicitly scopes them

## Medium Risk

Mark a task `medium` if it mentions or implies:

- release work
- npm publishing or package metadata
- CI
- deployment
- GitHub Actions
- Cloudflare Pages
- dependency updates
- configuration
- mobile testing
- database sync
- public CLI behavior
- versioning

Medium-risk tasks should usually:

- require human review
- include conservative allowed and forbidden paths
- include dry-run verification where relevant
- stop before publishing, deploying, changing secrets, or mutating production data

## Low Risk

Mark a task `low` only when it is limited to:

- docs
- README updates
- examples
- tests
- issue templates
- changelog
- roadmap
- non-runtime content
- copy updates

Low-risk tasks still need verification and a review pack.

## Common Stop Conditions

```text
- secrets or credentials required
- production data mutation required
- destructive operation required
- payment/auth/security code touched
- package publishing requested
- deployment credentials required
- unclear repo ownership
- unclear target branch
- missing verification command
```
