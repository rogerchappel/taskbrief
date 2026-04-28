# Roadmap

This roadmap describes likely direction, not a binding delivery promise. Items
may change as maintainers learn from users, contributors, and implementation
constraints.

## Now

- Finish repository scaffold customization from `agentic-oss-template`.
- Add the `skills/taskbrief/SKILL.md` package and supporting references.
- Define task schema, workspace config, risk policy, and CrewCMD export docs.
- Scaffold the TypeScript CLI package and test harness.

## Next

- Implement deterministic task creation with `taskbrief new`.
- Implement text parsing for simple brain dumps and cross-repo task splits.
- Add Markdown, YAML, JSON, and CrewCMD output renderers.
- Add risk classification and human-gating behavior.
- Add explicit LLM parsing mode with provider disclosure and no hidden defaults.

## Later

- Add GitHub issue import and export.
- Add interactive review/edit mode.
- Add provider adapters for OpenAI, Anthropic, OpenRouter, and Ollama.
- Add CrewCMD dispatch integration after task generation is proven safe.
- Add a TUI or web review surface if command-line review becomes limiting.

## Not Planned for V1

- Automatic agent dispatch.
- Production data mutation.
- Hidden LLM calls or hidden credential loading.
- Audio transcription.
- Automatic GitHub issue creation.
- Publishing or deployment without explicit human approval.

## Roadmap Review

Review this roadmap before major releases and after meaningful contributor
feedback. Move completed work into `CHANGELOG.md` and remove items that no
longer match the project direction.
