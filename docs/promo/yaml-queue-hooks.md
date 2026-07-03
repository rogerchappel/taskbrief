# YAML Queue Export Social Hooks

Grounding: `examples/yaml-queue-demo.sh` parses
`examples/cross-repo-plan.txt` with `examples/repos.yaml` and verifies the YAML
queue mentions `branchbrief`, `source: "taskbrief"`, and the package-publishing
stop condition.

## Hooks

1. Rough cross-repo promo notes can become a reviewable YAML queue before anyone
   dispatches an agent.

2. Demo beat: run `bash examples/yaml-queue-demo.sh`, open the printed
   `tasks.yaml`, and show how repo context is preserved in a structured file.

3. `taskbrief` keeps the default path deterministic and local: planning note in,
   YAML/Markdown/JSON/CrewCMD queue out.

## Clip beats

1. Show the cross-repo planning note.
2. Show the workspace repo map.
3. Run the YAML queue demo.
4. Open the generated YAML and point to source and repo fields.
