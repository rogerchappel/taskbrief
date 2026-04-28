# Risk Policy

Risk classification controls how aggressively a task can be dispatched. It does
not grant permission to bypass repository policy.

## Levels

### Low Risk

Use low risk when the task is limited to:

- docs
- README updates
- examples
- tests
- issue templates
- changelog or roadmap updates
- non-runtime copy changes

Low-risk tasks still need clear allowed paths, verification, and a review pack
when prepared for an agent.

### Medium Risk

Use medium risk when the task involves:

- releases
- npm package metadata or dry-run packaging
- CI or GitHub Actions
- deployment configuration
- dependency updates
- repo or tool configuration
- mobile QA or release readiness
- database sync planning without production writes
- public CLI behavior
- versioning

Medium-risk tasks should require human review and usually
`requiresHumanApproval: true` in CrewCMD export.

### High Risk

Use high risk when the task mentions or may touch:

- authentication or authorization
- security controls
- payments, Stripe, or billing
- production data
- data deletion or destructive operations
- database migrations
- secrets, tokens, credentials, or environment variables
- public API compatibility
- launch-critical work
- customer data
- webhooks
- production configuration

High-risk tasks must require human approval and should not be automatically
dispatched.

## Stop Conditions

Every task must include stop conditions. Common defaults:

- secrets or credentials required
- production data mutation required
- destructive operation required
- payment, auth, security, or privacy behavior touched
- package publishing requested
- deployment credentials required
- unclear repo ownership
- unclear target branch
- missing verification command

## Classification Rules

- Choose the highest applicable risk level.
- Workspace repo defaults can raise risk but should not lower risk from the
  input text.
- `production_sensitive: true` should raise release, deployment, QA, auth,
  billing, and data work to at least medium risk.
- If the task is ambiguous, keep the task bounded and add a human decision
  instead of guessing.
- High-risk work may still be described as a task brief, but the prompt should
  tell the agent to stop before making risky changes.
