import { describe, expect, it } from "vitest";
import { classifyTaskRisk, requiresHumanApproval } from "../../src/risk/classifyTaskRisk.js";
import type { WorkspaceRepoConfig } from "../../src/types.js";

describe("classifyTaskRisk", () => {
  const repo: WorkspaceRepoConfig = {
    path: "~/Developer/my-opensource/branchbrief",
    risk_defaults: {
      docs: "low",
      release: "medium",
      auth: "high",
    },
  };

  it("classifies high-risk keywords and blocks automatic dispatch", () => {
    const classification = classifyTaskRisk("Update auth token handling for customer data.", { repo });

    expect(classification.risk).toBe("high");
    expect(classification.requiresHumanApproval).toBe(true);
    expect(classification.dispatchAllowed).toBe(false);
    expect(requiresHumanApproval(classification)).toBe(true);
  });

  it("classifies medium-risk keywords", () => {
    const classification = classifyTaskRisk("Prepare npm publish release notes.", { repo });

    expect(classification.risk).toBe("medium");
    expect(classification.requiresHumanApproval).toBe(true);
    expect(classification.reviewRequired).toBe(true);
    expect(classification.dispatchAllowed).toBe(true);
  });

  it("uses repo risk defaults from task type", () => {
    const classification = classifyTaskRisk("Refresh release checklist.", {
      repo,
      taskType: "release",
    });

    expect(classification.risk).toBe("medium");
    expect(classification.signals).toContainEqual({
      risk: "medium",
      source: "repo_default",
      value: "release",
    });
  });

  it("keeps docs-only work low risk", () => {
    const classification = classifyTaskRisk("Update README examples for the CLI.", { repo });

    expect(classification.risk).toBe("low");
    expect(classification.requiresHumanApproval).toBe(false);
    expect(classification.dispatchAllowed).toBe(true);
  });
});
