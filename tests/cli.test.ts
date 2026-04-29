import { afterEach, describe, expect, it, vi } from "vitest";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { Readable, Writable } from "node:stream";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createCli } from "../src/cli.js";

describe("taskbrief CLI", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

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

  it("accepts schema-valid LLM output and preserves provenance in context", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  tasks: [
                    {
                      title: "Extract taskbrief tasks from messy PRD",
                      repo: "taskbrief",
                      type: "docs",
                      risk: "low",
                      objective: "Turn the PRD into a validated Taskbrief queue.",
                      context: "Messy BYO PRD input with missing structure.",
                      allowed_paths: ["README.md", "docs/**"],
                      forbidden_paths: [".env*", "secrets/**"],
                      verification: ["npm test"],
                      stop_conditions: ["credentials required"],
                      expected_commits: ["docs: extract taskbrief tasks from messy prd"],
                      review_pack_required: true,
                      human_decision_needed: [],
                      agent_prompt: "You are working on taskbrief.",
                    },
                  ],
                }),
              },
            },
          ],
        }),
      }),
    );

    const output = await runCli(["parse", "--llm", "--provider", "openai", "--format", "json"], {
      stdin: "Please extract tasks from this messy PRD.",
    });
    const parsed = JSON.parse(output);

    expect(parsed.tasks[0].context).toContain("Source: llm (openai:");
    expect(parsed.tasks[0].repo).toBe("taskbrief");
  });

  it("fails clearly when LLM env is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");

    await expect(
      runCli(["parse", "--llm", "--provider", "openai", "--format", "json"], {
        stdin: "branchbrief docs",
      }),
    ).rejects.toThrow(/openai credential is missing from OPENAI_API_KEY/);
  });

  it("fails closed when LLM returns malformed JSON", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "{not-json" } }],
        }),
      }),
    );

    await expect(
      runCli(["parse", "--llm", "--provider", "openai", "--format", "json"], {
        stdin: "branchbrief docs",
      }),
    ).rejects.toThrow(/LLM returned malformed JSON/);
  });

  it("fails closed when LLM returns schema-invalid JSON", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  tasks: [
                    {
                      title: "Incomplete task",
                      repo: "taskbrief",
                      type: "docs",
                      risk: "medium",
                      objective: "Missing required arrays and prompt.",
                      context: "Missing fields",
                      forbidden_paths: [".env*"],
                      verification: ["npm test"],
                      stop_conditions: [],
                      expected_commits: [],
                      review_pack_required: true,
                      human_decision_needed: [],
                      agent_prompt: "x",
                    },
                  ],
                }),
              },
            },
          ],
        }),
      }),
    );

    await expect(
      runCli(["parse", "--llm", "--provider", "openai", "--format", "json"], {
        stdin: "branchbrief docs",
      }),
    ).rejects.toThrow(/LLM output failed Taskbrief schema validation/);
  });

  it("does not write an output file when LLM parsing fails", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "not-json" } }],
        }),
      }),
    );

    const directory = await mkdtemp(join(tmpdir(), "taskbrief-cli-"));
    const outputPath = join(directory, "task.json");

    try {
      await expect(
        runCli(["parse", "--llm", "--provider", "openai", "--format", "json", "--output", outputPath], {
          stdin: "branchbrief docs",
        }),
      ).rejects.toThrow(/LLM returned malformed JSON/);

      await expect(access(outputPath)).rejects.toThrow();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
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
