# Social Hooks: GitHub Issue Triage

## Short Posts

1. Turn a messy multi-repo issue comment into a Markdown task brief and a
   CrewCMD JSON queue with one local command: `bash examples/github-issue-triage-demo.sh`.
2. `taskbrief` is the boring pre-flight step before agent work: rough input in,
   explicit repo-scoped tasks out.
3. New demo: parse a triage note for `httpstubby`, `docfresh`, and `repoctx`
   without an API key, then verify the exported task queue.

## Thread Outline

1. The problem: real work arrives as issue comments, not clean tickets.
2. The command: `taskbrief parse examples/github-issue-triage.txt --crewcmd`.
3. The artifacts: Markdown for review, JSON for orchestration.
4. The guardrail: this demo structures work; it does not mutate repos or open
   pull requests by itself.
