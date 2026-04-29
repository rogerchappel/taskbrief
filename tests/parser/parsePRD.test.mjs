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
  assert.ok(queue.tasks.length > 0, "Should extract tasks from V1 Scope");
  
  // Should have tasks from V1 Scope (5 items in our fixture)
  assert.equal(queue.tasks.length, 5);
  
  // Tasks should be clean, not scorecard fragments
  const titles = queue.tasks.map((t) => t.title);
  assert.ok(!titles.some((t) => /scorecard|status|backend|frontend|in progress/i.test(t)),
    "Should not extract scorecard table content as tasks");
  
  // Tasks should be coherent implementation items from V1 Scope
  assert.ok(titles.some((t) => /cli package/i.test(t)), "Should include CLI task");
  assert.ok(titles.some((t) => /file grouping/i.test(t)), "Should include grouping task");
  assert.ok(titles.some((t) => /conventional commit/i.test(t)), "Should include commit message task");
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
  assert.equal(queue.tasks.length, 0, "Should return empty task list when no V1 Scope");
});
