# Security Policy

## Supported Versions

`taskbrief` does not currently publish versioned software releases.

Once releases begin, this section should list supported versions and security
fix expectations.

## Reporting a Vulnerability

Please do not report suspected vulnerabilities in public issues, pull requests,
or discussions.

If GitHub private vulnerability reporting is enabled for this repository, use
the repository's **Security** tab to submit a private vulnerability report.

If private vulnerability reporting is not enabled, contact the maintainers
through the public project channels and ask for the appropriate private reporting
path. Do not include exploit details, secrets, personal data, or sensitive
technical details in public messages.

## What to Include

When a private reporting path is available, include:

- A clear description of the issue.
- Affected files, workflows, packages, generated task output, or CLI behavior.
- Steps to reproduce, proof of concept, or attack scenario when safe to share.
- Potential impact.
- Suggested mitigation, if known.

## Response Expectations

Maintainers will review good-faith reports as capacity allows.

This policy does not provide paid support, guaranteed response times, guaranteed
fixes, or service-level agreements.

## Security Scope

In scope:

- Handling of secrets, credentials, or environment variables.
- LLM provider disclosure and credential-source behavior.
- Generated task briefs that could encourage unsafe production, auth, billing,
  security, or data operations.
- GitHub Actions, dependency, release, and publishing guidance in this repo.

Out of scope:

- General support requests.
- Vulnerabilities in unrelated downstream projects.
- Agent behavior after a user manually changes or ignores generated safety
  boundaries.
