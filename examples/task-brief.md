# Task Brief: Prepare branchbrief for npm release

## Objective

Prepare branchbrief for its first npm release without publishing.

## Repository

branchbrief

## Suggested Branch

agent/npm-release-readiness

## Task Type

release

## Risk Level

Medium

## Context

The package needs metadata, bin path, release docs, changelog, and dry-run
packaging reviewed before v0.1.0. Publishing is out of scope.

## Allowed Paths

- package.json
- README.md
- docs/**
- CHANGELOG.md
- .github/workflows/publish.yml

## Forbidden Paths

- src/**
- .env*
- secrets/**

## Expected Commits

- chore(package): prepare npm package metadata
- docs(npm): document first release process
- ci(release): add npm publish workflow

## Verification

- npm ci
- npm test
- npm run build
- npm pack --dry-run

## Stop Conditions

- npm token required
- package name unavailable
- publish requested
- secrets or credentials required

## Review Pack Required

Yes.

## Human Decision Needed

- approve package name
- approve first publish

## Agent Prompt

You are preparing branchbrief for its first npm release. Work only on release
readiness and documentation. Do not publish the package, request tokens, or
touch source files unless a maintainer explicitly expands the task. Return a
review pack with changed files, verification, rollback notes, and any decisions
needed before publish.
