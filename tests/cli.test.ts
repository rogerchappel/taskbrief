import { describe, expect, it } from "vitest";

import { createCli } from "../src/cli.js";

describe("taskbrief CLI", () => {
  it("exposes the package name in help output", () => {
    const help = createCli().helpInformation();

    expect(help).toContain("Usage: taskbrief");
    expect(help).toContain("Turn messy brain dumps into agent-ready task queues.");
  });
});
