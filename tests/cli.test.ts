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

  it("accepts standards-compliant quoted YAML workspace values", async () => {
    const output = await runCli([
      "parse",
      "tests/fixtures/cli/brain-dump.txt",
      "--workspace",
      "tests/fixtures/workspace-yaml-semantics/repos.yaml",
      "--format",
      "json",
    ]);

    expect(JSON.parse(output).workspace).toBe("yaml-semantics");
  });

  it("rejects malformed workspace YAML with a focused error", async () => {
    await expect(
      runCli([
        "parse",
        "tests/fixtures/cli/brain-dump.txt",
        "--workspace",
        "tests/fixtures/workspace-yaml-semantics/malformed.yaml",
      ]),
    ).rejects.toThrow(/Invalid workspace YAML:.*Missing closing "quote/u);
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

  it("emits orchestration handoff artifacts with sequential waves and concurrent tasks", async () => {
    const directory = await mkdtemp(join(tmpdir(), "taskbrief-cli-"));
    const outputPath = join(directory, "TASKS.md");

    try {
      const stdout = await runCli([
        "parse",
        "tests/fixtures/parser/qualitygate-prd.md",
        "--output",
        outputPath,
        "--orchestration",
      ]);
      const markdown = await readFile(join(directory, "ORCHESTRATION.md"), "utf8");
      const json = JSON.parse(await readFile(join(directory, "orchestration.json"), "utf8"));

      expect(stdout).toBe("");
      expect(markdown).toContain("# Orchestration Handoff");
      expect(markdown).toContain("## Sequential Waves");
      expect(json.waves.length).toBeGreaterThan(1);
      expect(json.waves[0]).toMatchObject({ dispatch: "now" });
      expect(json.tasks.some((task: { depends_on: string[] }) => task.depends_on.length > 0)).toBe(true);
      expect(json.tasks.some((task: { can_run_concurrently_with: string[] }) => task.can_run_concurrently_with.length > 0)).toBe(true);
      expect(json.tasks.find((task: { id: string }) => task.id.includes("build-a-cli-command"))?.phase).toBe(
        "implementation",
      );
      expect(json.tasks.find((task: { id: string }) => task.id.includes("final-validation"))?.phase).toBe(
        "final_validation",
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it.each(["ORCHESTRATION.md", "orchestration.json"])(
    "rejects orchestration output collision with %s before writing artifacts",
    async (fileName) => {
      const directory = await mkdtemp(join(tmpdir(), "taskbrief-cli-"));
      const outputPath = join(directory, fileName);

      try {
        await expect(
          runCli([
            "parse",
            "tests/fixtures/cli/brain-dump.txt",
            "--output",
            outputPath,
            "--orchestration",
          ]),
        ).rejects.toThrow(/--output path conflicts with orchestration artifact/u);

        await expect(access(outputPath)).rejects.toThrow();
        await expect(access(join(directory, "ORCHESTRATION.md"))).rejects.toThrow();
        await expect(access(join(directory, "orchestration.json"))).rejects.toThrow();
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    },
  );

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

  it("refines orchestration with LLM when --llm and --orchestration are combined", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    tasks: [
                      {
                        id: "demo-build-core",
                        title: "Build core feature",
                        repo: "demo",
                        type: "feature",
                        risk: "medium",
                        objective: "Implement the core feature first.",
                        context: "Feature work must happen before docs.",
                        allowed_paths: ["src/**"],
                        forbidden_paths: [".env*"],
                        verification: ["npm test"],
                        stop_conditions: ["missing product decision"],
                        expected_commits: ["feat: build core feature"],
                        review_pack_required: true,
                        human_decision_needed: [],
                        agent_prompt: "Build the core feature.",
                      },
                      {
                        id: "demo-write-docs",
                        title: "Write docs",
                        repo: "demo",
                        type: "docs",
                        risk: "low",
                        objective: "Document the feature after implementation.",
                        context: "Docs depend on the implemented behavior.",
                        allowed_paths: ["README.md"],
                        forbidden_paths: [".env*"],
                        verification: ["npm test"],
                        stop_conditions: ["feature not implemented"],
                        expected_commits: ["docs: document core feature"],
                        review_pack_required: true,
                        human_decision_needed: [],
                        agent_prompt: "Document the feature.",
                      },
                    ],
                  }),
                },
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    waves: [
                      { name: "LLM foundation", mode: "sequential", task_ids: ["demo-build-core"] },
                      { name: "LLM docs", mode: "sequential", task_ids: ["demo-write-docs"] },
                    ],
                    notes: ["Docs depend on the implemented feature."],
                  }),
                },
              },
            ],
          }),
        }),
    );

    const directory = await mkdtemp(join(tmpdir(), "taskbrief-cli-"));
    const outputPath = join(directory, "TASKS.md");

    try {
      await runCli(["parse", "--llm", "--provider", "openai", "--output", outputPath, "--orchestration"], {
        stdin: "Build feature then write docs.",
      });
      const json = JSON.parse(await readFile(join(directory, "orchestration.json"), "utf8"));

      expect(json.generated_from).toContain("llm-orchestration (openai:");
      expect(json.refinement_notes).toEqual(["Docs depend on the implemented feature."]);
      expect(json.waves.map((wave: { name: string }) => wave.name)).toEqual(["LLM foundation", "LLM docs"]);
      expect(json.tasks.find((task: { id: string }) => task.id === "demo-write-docs")?.depends_on).toEqual([
        "demo-build-core",
      ]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("does not write output files when LLM orchestration refinement fails", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    tasks: [
                      {
                        id: "demo-build-core",
                        title: "Build core feature",
                        repo: "demo",
                        type: "feature",
                        risk: "medium",
                        objective: "Implement the core feature first.",
                        context: "Feature work must happen before docs.",
                        allowed_paths: ["src/**"],
                        forbidden_paths: [".env*"],
                        verification: ["npm test"],
                        stop_conditions: ["missing product decision"],
                        expected_commits: ["feat: build core feature"],
                        review_pack_required: true,
                        human_decision_needed: [],
                        agent_prompt: "Build the core feature.",
                      },
                      {
                        id: "demo-write-docs",
                        title: "Write docs",
                        repo: "demo",
                        type: "docs",
                        risk: "low",
                        objective: "Document the feature after implementation.",
                        context: "Docs depend on the implemented behavior.",
                        allowed_paths: ["README.md"],
                        forbidden_paths: [".env*"],
                        verification: ["npm test"],
                        stop_conditions: ["feature not implemented"],
                        expected_commits: ["docs: document core feature"],
                        review_pack_required: true,
                        human_decision_needed: [],
                        agent_prompt: "Document the feature.",
                      },
                    ],
                  }),
                },
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    waves: [{ name: "Missing docs", mode: "sequential", task_ids: ["demo-build-core"] }],
                    notes: ["This omits a task and must fail closed."],
                  }),
                },
              },
            ],
          }),
        }),
    );

    const directory = await mkdtemp(join(tmpdir(), "taskbrief-cli-"));
    const outputPath = join(directory, "TASKS.md");

    try {
      await expect(
        runCli(["parse", "--llm", "--provider", "openai", "--output", outputPath, "--orchestration"], {
          stdin: "Build feature then write docs.",
        }),
      ).rejects.toThrow(/LLM orchestration omitted task ids: demo-write-docs/);

      await expect(access(outputPath)).rejects.toThrow();
      await expect(access(join(directory, "ORCHESTRATION.md"))).rejects.toThrow();
      await expect(access(join(directory, "orchestration.json"))).rejects.toThrow();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
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
