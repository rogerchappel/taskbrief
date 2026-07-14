# Video Brief: Voice Dump to Review Pack

## Positioning

Show `taskbrief` turning a messy plain-text voice dump into a bounded task queue
and CrewCMD-compatible review artifact.

## Grounded demo beats

1. Open `examples/voice-dump.txt` and show that it asks for release readiness,
   docs deployment review, template work, PR review summaries, product QA, and a
   blog draft.
2. Open `examples/repos.yaml` and note the repo-specific verification commands,
   forbidden paths, and risk defaults.
3. Run `npm run build`.
4. Run `bash examples/voice-dump-review-pack-demo.sh`.
5. Show the generated Markdown task file.
6. Show the generated CrewCMD JSON file.
7. Highlight that high-risk areas such as secrets, production data, auth, and
   billing are modeled as stop conditions or human-gated work.

## Demo script

```sh
npm run build
bash examples/voice-dump-review-pack-demo.sh
```

## What to say plainly

- Voice transcription happens upstream; `taskbrief` consumes plain text.
- The workspace file supplies repo context and verification defaults.
- The demo does not merge PRs, publish packages, deploy, or touch secrets.
