import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { Readable, Writable } from "node:stream";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createCli } from "../src/cli.js";

describe("taskbrief CLI", () => {
  it("exposes the package name in help output", () => {
    const help = createCli().helpInformation();

    expect(help).toContain("Usage: taskbrief");
    expect(help).toContain("Turn messy brain dumps into agent-ready task queues.");
  });

  it("parses a file brain dump as yaml with workspace metadata", async () => {
    const output = await runCli([
      "parse",
      "tests/fixtures/cli/brain-dump.txt",
      "--workspace",
      "tests/fixtures/workspace-risk/repos.yaml",
      "--format",
      "yaml",
    ]);

    expect(output).toContain('workspace: "rogerchappel-oss"');
    expect(output).toContain('repo: "branchbrief"');
    expect(output).toContain('type: "release"');
  });

  it("reads stdin when parse has no file", async () => {
    const output = await runCli(["parse", "--format", "json", "--type", "transcript"], {
      stdin: "write a blog about task queues",
    });
    const parsed = JSON.parse(output);

    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.tasks[0].repo).toBe("roger-website");
  });

  it("exports CrewCMD json by default when --crewcmd is set", async () => {
    const output = await runCli(["parse", "tests/fixtures/cli/brain-dump.txt", "--crewcmd"]);
    const parsed = JSON.parse(output);

    expect(parsed.tasks[0]).toMatchObject({
      repo: "branchbrief",
      allowedPaths: ["package.json", "README.md", "docs/**", "CHANGELOG.md"],
      requiresHumanApproval: true,
    });
  });

  it("writes parse output to a requested path", async () => {
    const directory = await mkdtemp(join(tmpdir(), "taskbrief-cli-"));
    const outputPath = join(directory, "task.yaml");

    try {
      const stdout = await runCli([
        "parse",
        "tests/fixtures/cli/brain-dump.txt",
        "--format",
        "yaml",
        "--output",
        outputPath,
      ]);
      const fileOutput = await readFile(outputPath, "utf8");

      expect(stdout).toBe("");
      expect(fileOutput).toContain('repo: "branchbrief"');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("creates a deterministic manual task brief", async () => {
    const output = await runCli([
      "new",
      "--repo",
      "taskbrief",
      "--type",
      "docs",
      "--risk",
      "low",
      "--objective",
      "Document CLI parse usage",
      "--format",
      "json",
    ]);
    const parsed = JSON.parse(output);

    expect(parsed.tasks[0]).toMatchObject({
      repo: "taskbrief",
      type: "docs",
      risk: "low",
      objective: "Document CLI parse usage",
    });
  });

  it("fails clearly when parse requests LLM mode", async () => {
    await expect(runCli(["parse", "--llm"], { stdin: "branchbrief docs" })).rejects.toThrow(
      "LLM parsing is not wired yet.",
    );
  });
});

async function runCli(args: string[], options: { stdin?: string } = {}): Promise<string> {
  let output = "";
  const stdout = new Writable({
    write(chunk, _encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });
  const stdin = Readable.from([options.stdin ?? ""]);
  const cli = createCli({ stdin, stdout });

  cli.exitOverride();
  await cli.parseAsync(["node", "taskbrief", ...args]);

  return output;
}
