# GitHub Actions

This template includes minimal GitHub Actions that are safe for a new repository
before it has application code.

## Included workflows

- `CI` installs the locked Node dependencies and runs `npm run release:check` on
  every pull request and push to `main`. That required gate covers typechecking,
  the full test suite, the production build and CLI smoke checks, and an
  installed-tarball smoke check. It also validates core repository files,
  checks that markdown files are not empty, and scans generated-repository
  templates for stale template language.
- `Docs` validates the docs directory and markdown file presence.
- `branchbrief` creates a `branchbrief.md` artifact for pull requests.
- `Release dry run` validates ReleaseBox configuration and previews release
  notes when release metadata changes. It relies on `CI` for package-quality
  checks instead of running `release:check` a second time.

The workflows do not require repository secrets. They use read-only repository
permissions unless a generated repository intentionally adds write behavior.

## Local template validation

Run the local repository hygiene check before changing template structure:

```sh
bash scripts/validate-template.sh
```

The script verifies required root files, docs, and template folders, then scans
for unresolved double-brace placeholder markers outside approved template and
reference paths. It is dependency-free and mirrors the lightweight checks this
template expects maintainers and agents to run locally.

## Customizing generated-repository CI for Node/npm

When the project becomes a Node package or app, add the relevant scripts to
`package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "build": "tsup"
  }
}
```

The reusable workflow in `templates/github/workflows/ci.yml` calls these
commands with `--if-present`, so generated repositories can add them one at a
time after copying or adopting that workflow.

If a project requires a specific Node version, add `actions/setup-node` before
the optional Node checks:

```yaml
- name: Set up Node
  uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
```

Keep new workflow permissions explicit and avoid adding secrets unless the
workflow cannot work without them.
