import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "vitest";
import { parseWorkspaceConfig } from "../../src/workspace/loadWorkspace.js";
import { resolveRepo } from "../../src/workspace/resolveRepo.js";

describe("workspace config", () => {
  const fixture = readFileSync("tests/fixtures/workspace-risk/repos.yaml", "utf8");

  it("loads PRD-shaped repo config", () => {
    const config = parseWorkspaceConfig(fixture);
    const branchbrief = config.repos.branchbrief;

    assert.equal(config.workspace, "rogerchappel-oss");
    assert.ok(branchbrief);
    assert.equal(branchbrief.path, "~/Developer/my-opensource/branchbrief");
    assert.deepEqual(branchbrief.common_verification, [
      "npm test",
      "npm run build",
      "npm run typecheck",
    ]);
    assert.equal(branchbrief.risk_defaults?.release, "medium");
  });

  it("resolves repos by name, alias, and path basename", () => {
    const config = parseWorkspaceConfig(fixture);

    assert.equal(resolveRepo(config, "branchbrief").repoName, "branchbrief");
    assert.equal(resolveRepo(config, "bb").repoName, "branchbrief");
    assert.equal(resolveRepo(config, "product-videogen").repoName, "product-videogen");
  });

  it("marks unknown repos as uncertain", () => {
    const config = parseWorkspaceConfig(fixture);
    const result = resolveRepo(config, "missing-repo");

    assert.equal(result.repoName, "unknown");
    assert.equal(result.uncertain, true);
  });
});
