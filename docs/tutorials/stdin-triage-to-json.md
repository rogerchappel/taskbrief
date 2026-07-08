# Stdin triage to JSON

This recipe shows the shortest deterministic Taskbrief path: paste or pipe a
rough note into `taskbrief parse` and get machine-readable tasks without an API
key.

## Run

```bash
npm install
npm run build
mkdir -p .demo-output/stdin-triage
cat examples/github-issue-triage.txt | node dist/cli.js parse \
  --workspace examples/repos.yaml \
  --format json \
  --output .demo-output/stdin-triage/tasks.json
```

## Inspect

```bash
node -e 'const fs = require("node:fs"); const data = JSON.parse(fs.readFileSync(".demo-output/stdin-triage/tasks.json", "utf8")); if (!Array.isArray(data.tasks) || data.tasks.length === 0) process.exit(1); console.log(data.tasks.map((task) => task.title).join("\n"));'
```

The output keeps the demo local and deterministic. No LLM request is made
because `--llm` is not present.

## Promotion angle

This is a good clip for maintainers who live in issue comments and terminal
buffers: pipe the rough text, inspect structured JSON, and then decide whether
to hand the bounded tasks to another tool.
