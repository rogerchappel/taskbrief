#!/usr/bin/env node
import { Command } from "commander";
import { readFile, writeFile } from "node:fs/promises";
import { stdin as processStdin, stdout as processStdout } from "node:process";

import { getRuntimeInfo } from "./index.js";
// @ts-expect-error Existing JavaScript modules do not publish local declarations yet.
import { exportCrewCmd } from "./crewcmd/index.js";
// @ts-expect-error Existing JavaScript modules do not publish local declarations yet.
import { renderJson, renderMarkdown, renderYaml } from "./output/index.js";
// @ts-expect-error Existing JavaScript modules do not publish local declarations yet.
import { normalizeTask, parseBrainDump } from "./parser/index.js";
import { loadWorkspaceConfig } from "./workspace/loadWorkspace.js";

const FORMATS = ["markdown", "yaml", "json"] as const;
type OutputFormat = (typeof FORMATS)[number];

interface CliIo {
  stdin?: NodeJS.ReadableStream;
  stdout?: NodeJS.WritableStream;
}

interface ParseOptions {
  workspace?: string;
  format?: OutputFormat;
  crewcmd?: boolean;
  output?: string;
  type?: string;
  llm?: boolean;
}

interface NewOptions {
  repo?: string;
  type?: string;
  risk?: string;
  objective?: string;
  format?: OutputFormat;
  output?: string;
}

export function createCli(io: CliIo = {}): Command {
  const runtime = getRuntimeInfo();
  const stdin = io.stdin ?? processStdin;
  const stdout = io.stdout ?? processStdout;

  const program = new Command()
    .name(runtime.name)
    .description("Turn messy brain dumps into agent-ready task queues.")
    .version(runtime.version)
    .showHelpAfterError()
    .showSuggestionAfterError();

  program
    .command("parse")
    .description("Parse a brain dump into task briefs.")
    .argument("[file]", "Brain dump file. Reads stdin when omitted.")
    .option("--workspace <path>", "Workspace config file to attach workspace metadata.")
    .option("--format <format>", "Output format: markdown, yaml, or json.", "markdown")
    .option("--crewcmd", "Export CrewCMD-compatible task queue.")
    .option("--output <path>", "Write output to a file instead of stdout.")
    .option("--type <type>", "Input type metadata. Accepted values: text, transcript.", "text")
    .option("--llm", "Reserved for explicit LLM-backed parsing.")
    .action(async (file: string | undefined, options: ParseOptions, command: Command) => {
      if (options.llm) {
        throw new Error("LLM parsing is not wired yet. Run without --llm for deterministic local parsing.");
      }
      validateInputType(options.type);
      const format =
        options.crewcmd && command.getOptionValueSource("format") === "default"
          ? "json"
          : validateFormat(options.format);
      const input = file ? await readFile(file, "utf8") : await readStream(stdin);
      const workspace = options.workspace ? loadWorkspaceConfig(options.workspace).workspace : undefined;
      const queue = parseBrainDump(input, { workspace });
      const exportQueue = options.crewcmd ? exportCrewCmd(queue, { workspace: queue.workspace }) : queue;

      await writeRenderedOutput(renderQueue(exportQueue, format), options.output, stdout);
    });

  program
    .command("new")
    .description("Create a deterministic manual task brief.")
    .requiredOption("--objective <text>", "Task objective.")
    .option("--repo <repo>", "Target repository.", "unknown")
    .option("--type <type>", "Task type.", "task")
    .option("--risk <risk>", "Risk level: low, medium, or high.", "medium")
    .option("--format <format>", "Output format: markdown, yaml, or json.", "markdown")
    .option("--output <path>", "Write output to a file instead of stdout.")
    .action(async (options: NewOptions) => {
      const format = validateFormat(options.format);
      const risk = validateRisk(options.risk);
      const task = normalizeTask({
        text: options.objective,
        repo: options.repo,
        type: options.type,
        risk,
        objective: options.objective,
      });
      const queue = {
        version: "0.1",
        source: "taskbrief",
        workspace: "default",
        tasks: [task],
      };

      await writeRenderedOutput(renderQueue(queue, format), options.output, stdout);
    });

  return program;
}

export async function runCli(argv = process.argv): Promise<void> {
  await createCli().parseAsync(argv);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

function validateFormat(value: string | undefined): OutputFormat {
  if (FORMATS.includes(value as OutputFormat)) {
    return value as OutputFormat;
  }

  throw new Error(`Invalid format "${value}". Expected one of: ${FORMATS.join(", ")}.`);
}

function validateInputType(value: string | undefined): void {
  if (value === undefined || value === "text" || value === "transcript") return;
  throw new Error(`Invalid input type "${value}". Expected one of: text, transcript.`);
}

function validateRisk(value: string | undefined): "low" | "medium" | "high" {
  if (value === "low" || value === "medium" || value === "high") return value;
  throw new Error(`Invalid risk "${value}". Expected one of: low, medium, high.`);
}

function renderQueue(queue: unknown, format: OutputFormat): string {
  if (format === "json") return renderJson(queue);
  if (format === "yaml") return renderYaml(queue);
  return renderMarkdown(queue);
}

async function writeRenderedOutput(
  output: string,
  outputPath: string | undefined,
  stdout: NodeJS.WritableStream,
): Promise<void> {
  if (outputPath) {
    await writeFile(outputPath, output, "utf8");
    return;
  }

  stdout.write(output);
}

async function readStream(stream: NodeJS.ReadableStream): Promise<string> {
  stream.setEncoding("utf8");
  let input = "";

  for await (const chunk of stream) {
    input += chunk;
  }

  return input;
}
