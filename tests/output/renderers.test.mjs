import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { exportCrewCmd } from "../../src/crewcmd/index.js";
import { parseBrainDump } from "../../src/parser/index.js";
import { renderJson, renderMarkdown, renderYaml } from "../../src/output/index.js";

test("renders markdown task briefs with required sections", () => {
  const queue = parseBrainDump("branchbrief needs npm release readiness", { workspace: "rogerchappel-oss" });
  const markdown = renderMarkdown(queue);

  assert.match(markdown, /^# Task Brief: Prepare branchbrief for npm release/m);
  assert.match(markdown, /## Objective\n\nPrepare branchbrief for npm release readiness without publishing\./);
  assert.match(markdown, /## Suggested Branch\n\nagent\/prepare-branchbrief-for-npm-release/);
  assert.match(markdown, /## Review Pack Required\n\nYes\./);
  assert.match(markdown, /## Agent Prompt/);
});

test("renders stable json queue output", () => {
  const queue = parseBrainDump("write a blog about task queues", { workspace: "rogerchappel-oss" });
  const parsed = JSON.parse(renderJson(queue));

  assert.equal(parsed.version, "0.1");
  assert.equal(parsed.source, "taskbrief");
  assert.equal(parsed.tasks[0].repo, "roger-website");
  assert.deepEqual(Object.keys(parsed.tasks[0]).slice(0, 5), ["id", "title", "repo", "branch", "type"]);
});

test("renders yaml queue output without external dependencies", () => {
  const queue = parseBrainDump("product-videogen mobile testing on iPhone and tablet", {
    workspace: "rogerchappel-oss",
  });
  const yaml = renderYaml(queue);

  assert.match(yaml, /^version: "0.1"/);
  assert.match(yaml, /workspace: "rogerchappel-oss"/);
  assert.match(yaml, /repo: "product-videogen"/);
  assert.match(yaml, /- "manual iPhone smoke test"/);
});

test("exports CrewCMD camelCase queue with human approval gating", async () => {
  const queue = parseBrainDump("branchbrief needs npm release readiness", { workspace: "rogerchappel-oss" });
  const crewcmd = exportCrewCmd({ ...queue, tasks: [queue.tasks[0]] });
  const expected = JSON.parse(
    await readFile(new URL("../fixtures/output/expected-crewcmd.json", import.meta.url), "utf8"),
  );

  assert.deepEqual(crewcmd, expected);
});
