import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

import { parsePRD } from "../../src/parser/index.js";

test("extracts clean tasks from V1 Scope in oss-ideas style PRD", async () => {
  const input = await readFile(
    new URL("../fixtures/parser/oss-ideas-prd.md", import.meta.url),
    "utf8",
  );
  const queue = parsePRD(input, { workspace: "test-workspace" });

  assert.ok(queue, "PRD should be detected and parsed");
  assert.equal(queue.workspace, "test-workspace");
  assert.equal(queue.tasks[0].repo, "atomcommit");
  assert.ok(queue.tasks.length > 0, "Should extract tasks from V1 Scope");
  
  // Should have tasks from V1 Scope plus explicit implementation plan items
  assert.ok(queue.tasks.length >= 5);
  
  // Tasks should be clean, not scorecard fragments
  const titles = queue.tasks.map((t) => t.title);
  assert.ok(!titles.some((t) => /scorecard|status|backend|frontend|in progress/i.test(t)),
    "Should not extract scorecard table content as tasks");
  
  // Tasks should be coherent implementation items from V1 Scope
  assert.ok(titles.some((t) => /cli package/i.test(t)), "Should include CLI task");
  assert.ok(titles.some((t) => /file grouping/i.test(t)), "Should include grouping task");
  assert.ok(titles.some((t) => /conventional commit/i.test(t)), "Should include commit message task");
});


test("detects oss-ideas PRDs without PRD-prefixed headings", () => {
  const input = `# repoport

Status: ready

## Scorecard

| Criterion | Points | Notes |
|---|---:|---|
| Demand signal | 18/20 | Strong signal. |

## Pitch

A repo fleet dashboard.

## V1 Scope

- Scan local projects folder
- Match remotes to GitHub repos
- Show dirty/stale branch state
`;

  const queue = parsePRD(input);

  assert.ok(queue, "oss-ideas style document should be parsed as a PRD");
  assert.equal(queue.tasks.length, 3);
  assert.equal(queue.tasks[0].repo, "repoport");

  const titles = queue.tasks.map((task) => task.title).join("\n");
  assert.match(titles, /scan local projects folder/i);
  assert.doesNotMatch(titles, /scorecard|demand signal|criterion/i);
});

test("returns null for non-PRD text", () => {
  const result = parsePRD("Just a random brain dump with no PRD structure");
  assert.equal(result, null, "Should return null for non-PRD input");
});

test("ignores V2+ scope sections", async () => {
  const input = await readFile(
    new URL("../fixtures/parser/oss-ideas-prd.md", import.meta.url),
    "utf8",
  );
  const queue = parsePRD(input);

  assert.ok(queue);
  const titles = queue.tasks.map((t) => t.title).join(" ").toLowerCase();
  
  // Should not include V2 scope items
  assert.ok(!titles.includes("git hook"), "Should not extract V2 scope items");
  assert.ok(!titles.includes("ide plugin"), "Should not extract V2 scope items");
});

test("handles PRD without V1 Scope gracefully", () => {
  const input = `# PRD: Test

## Objective

Build something cool.

## Architecture

Details here.
`;
  const queue = parsePRD(input);
  
  assert.ok(queue);
  assert.equal(queue.tasks.length, 0, "Should return empty task list when no implementation requirements are present");
});

test("extracts deterministic closing-loop tasks from agent prompt and verification sections", async () => {
  const input = await readFile(
    new URL("../fixtures/parser/qualitygate-prd.md", import.meta.url),
    "utf8",
  );

  const queue = parsePRD(input);
  assert.ok(queue);

  const titles = queue.tasks.map((task) => task.title).join("\n");
  const contexts = queue.tasks.map((task) => task.context).join("\n");
  const allText = `${titles}\n${contexts}`;

  assert.ok(queue.tasks.length > 5, "Should add closing-loop tasks beyond V1 Scope");
  assert.match(allText, /cli command|cli run/i);
  assert.match(allText, /package manager scripts|package\/script/i);
  assert.match(allText, /safe checks/i);
  assert.match(allText, /markdown and json reports/i);
  assert.match(allText, /exit(?:s)? non-zero/i);
  assert.match(allText, /config support/i);
  assert.match(allText, /pass and fail fixtures|passing fixture/i);
  assert.match(allText, /json schema tests/i);
  assert.match(allText, /readme/i);
  assert.match(allText, /github actions/i);
  assert.match(allText, /final validation|release readiness/i);
  assert.match(contexts, /Wave: 2/i, "Closing-loop implementation tasks should carry wave metadata");
  assert.match(contexts, /Depends on: Wave 1 core implementation tasks/i);
  assert.doesNotMatch(allText, /scorecard|CrewCmd/i, "Should not extract scorecard or CrewCmd junk");
});
