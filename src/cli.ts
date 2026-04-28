#!/usr/bin/env node
import { Command } from "commander";

import { getRuntimeInfo } from "./index.js";

export function createCli(): Command {
  const runtime = getRuntimeInfo();

  return new Command()
    .name(runtime.name)
    .description("Turn messy brain dumps into agent-ready task queues.")
    .version(runtime.version)
    .showHelpAfterError()
    .showSuggestionAfterError();
}

export async function runCli(argv = process.argv): Promise<void> {
  await createCli().parseAsync(argv);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runCli();
}
