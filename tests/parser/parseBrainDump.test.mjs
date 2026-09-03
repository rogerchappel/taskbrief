import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

import { classifyRisk, parseBrainDump, splitTasks } from "../../src/parser/index.js";

test("splits an obvious cross-repo brain dump into deterministic task briefs", async () => {
  const input = await readFile(new URL("../fixtures/parser/cross-repo-brain-dump.txt", import.meta.url), "utf8");
  const queue = parseBrainDump(input, { workspace: "rogerchappel-oss" });

  assert.equal(queue.workspace, "rogerchappel-oss");
  assert.deepEqual(
    queue.tasks.map((task) => task.repo),
    ["branchbrief", "branchbrief", "agentic-oss-template", "CrewCMD", "product-videogen", "roger-website"],
  );
  assert.deepEqual(
    queue.tasks.map((task) => task.type),
    ["release", "deploy", "ci", "review", "qa", "docs"],
  );
  assert.equal(queue.tasks[0].id, "branchbrief-prepare-branchbrief-for-npm-release");
  assert.equal(queue.tasks[0].branch, "agent/prepare-branchbrief-for-npm-release");
  assert.ok(queue.tasks.every((task) => task.review_pack_required));
  assert.ok(queue.tasks.every((task) => task.stop_conditions.length > 0));
});

test("keeps unknown repos explicit instead of inventing ownership", () => {
  const queue = parseBrainDump("clean up the reporting dashboard copy");

  assert.equal(queue.tasks.length, 1);
  assert.equal(queue.tasks[0].repo, "unknown");
  assert.ok(queue.tasks[0].human_decision_needed.includes("confirm target repository"));
  assert.ok(queue.tasks[0].stop_conditions.includes("unclear repo ownership"));
});

test("classifies risk deterministically from task text", () => {
  assert.equal(classifyRisk("update docs and README"), "low");
  assert.equal(classifyRisk("prepare npm release and package metadata"), "medium");
  assert.equal(classifyRisk("change billing auth and production data migration"), "high");
});

test("does not over-split simple single-repo work", () => {
  const tasks = splitTasks("branchbrief needs README examples and changelog cleanup");

  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].repo, "branchbrief");
});

test("keeps labeled detail blocks with their prose objective", async () => {
  const input = await readFile(new URL("../../examples/release-readiness-brain-dump.txt", import.meta.url), "utf8");
  const queue = parseBrainDump(input);

  assert.equal(queue.tasks.length, 2);
  assert.deepEqual(queue.tasks.map((task) => task.type), ["release", "deploy"]);
  assert.equal(queue.tasks[0].id, "branchbrief-prepare-branchbrief-for-npm-release");
  assert.match(queue.tasks[0].context, /Tasks: - audit package metadata/);
  assert.match(queue.tasks[0].context, /npm pack --dry-run/);
  assert.equal(queue.tasks[1].id, "branchbrief-verify-branchbrief-docs-deploy");
});
