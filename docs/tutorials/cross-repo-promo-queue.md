# Cross-Repo Promo Queue

This tutorial uses the checked-in `examples/cross-repo-plan.txt` fixture to
show how a maintainer can turn a public planning note into a bounded task queue
with orchestration handoff artifacts.

## Run the Demo

```sh
npm install
bash examples/cross-repo-promo-demo.sh
```

The script writes:

- `TASKS.md`
- `ORCHESTRATION.md`
- `orchestration.json`

## What to Show

Open the source fixture first, then show how the generated task queue names the
repo context, allowed paths, forbidden paths, verification, and stop conditions.
Finish with `ORCHESTRATION.md` so viewers see sequential waves instead of an
unbounded agent dispatch.

## Safety Notes

The demo is deterministic and local by default. It does not dispatch agents,
open pull requests, deploy docs, publish packages, or call an LLM provider.
