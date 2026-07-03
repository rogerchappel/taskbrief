# YAML Queue Export Demo

This demo shows a maintainer-facing queue export for rough cross-repo promotion
work. It uses the checked-in planning note and workspace map, then writes a YAML
task queue that can be reviewed before any agent dispatch happens.

## Run it

```sh
bash examples/yaml-queue-demo.sh
```

The script builds the local CLI, parses `examples/cross-repo-plan.txt` with
`examples/repos.yaml`, and verifies that the YAML output keeps `taskbrief` as
the source plus the expected branchbrief release boundary.

## What it proves

- `taskbrief parse` can read a multi-repo planning note.
- Workspace context can be applied during deterministic parsing.
- YAML output is available for review workflows that prefer readable structured
  files over JSON.

## Expected output

The script prints the temporary `tasks.yaml` path. Review that file before
copying tasks into an agent queue or orchestration system.
