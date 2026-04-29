import { z } from "zod";

import {
  applyOrchestrationWavePlan,
  type OrchestrationHandoff,
  type OrchestrationWavePlan,
  type TaskbriefQueue,
} from "../orchestration.js";
import { validateLlmParseOptions } from "./disclosure.js";
import { requestLlmOrchestrationRefinement, type FetchLike, type LlmProviderRequest } from "./provider.js";

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

const orchestrationWavePlanSchema = z
  .object({
    waves: z.array(
      z
        .object({
          name: z.string().min(1),
          mode: z.enum(["concurrent", "sequential"]),
          task_ids: z.array(z.string().min(1)).min(1),
        })
        .strict(),
    ).min(1),
    notes: z.array(z.string().min(1)),
  })
  .strict();

export interface RefineOrchestrationWithLlmOptions {
  provider: string;
  model?: string;
  inputSource: {
    type: "file";
    path: string;
  } | {
    type: "stdin";
  };
  environment?: NodeJS.ProcessEnv;
  fetchImpl?: FetchLike;
}

export async function refineOrchestrationWithLlm(
  handoff: OrchestrationHandoff,
  queue: TaskbriefQueue,
  options: RefineOrchestrationWithLlmOptions,
): Promise<OrchestrationHandoff> {
  const environment = options.environment ?? process.env;
  const model = options.model ?? defaultModelForProvider(options.provider);
  const metadata = validateLlmParseOptions(
    {
      provider: options.provider,
      model,
      credentialSource: credentialSourceForProvider(options.provider),
      input: options.inputSource,
      outputFormat: "json",
      network: true,
    },
    environment,
  );

  const apiKeyName = metadata.credentialSource.type === "env" ? metadata.credentialSource.name : undefined;
  if (!apiKeyName) {
    throw new Error(`Unsupported LLM provider "${options.provider}". Currently supported: openai.`);
  }

  const apiKey = environment[apiKeyName];
  if (!apiKey) {
    throw new Error(`${options.provider} credential is missing from ${apiKeyName}`);
  }

  const providerResponse = await requestLlmOrchestrationRefinement(
    {
      provider: metadata.provider,
      model: metadata.model,
      apiKey,
      input: buildPrompt(handoff, queue),
    } satisfies LlmProviderRequest,
    options.fetchImpl,
  );

  const parsedJson = parseJson(providerResponse.content);
  const result = orchestrationWavePlanSchema.safeParse(parsedJson);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message);
    throw new Error(`LLM orchestration output failed schema validation:\n- ${issues.join("\n- ")}`);
  }

  return applyOrchestrationWavePlan(handoff, result.data satisfies OrchestrationWavePlan, {
    generatedFrom: `${handoff.generated_from} + llm-orchestration (${metadata.provider}:${metadata.model})`,
  });
}

function buildPrompt(handoff: OrchestrationHandoff, queue: TaskbriefQueue): string {
  const tasks = queue.tasks ?? [];
  return [
    "Refine this Taskbrief orchestration handoff.",
    "Preserve the exact task ids. Use every task id exactly once.",
    "Prefer fewer waves only when tasks are truly independent; otherwise separate dependencies into sequential waves.",
    "Return JSON only with {\"waves\":[{\"name\":string,\"mode\":\"concurrent\"|\"sequential\",\"task_ids\":[string]}],\"notes\":[string]}.",
    "",
    "Current deterministic handoff:",
    JSON.stringify({ waves: handoff.waves, tasks: handoff.tasks }, null, 2),
    "",
    "Full task context:",
    JSON.stringify(tasks.map((task) => ({
      id: task.id,
      title: task.title,
      type: task.type,
      risk: task.risk,
      objective: task.objective,
      context: task.context,
      allowed_paths: task.allowed_paths,
      forbidden_paths: task.forbidden_paths,
      verification: task.verification,
      stop_conditions: task.stop_conditions,
      human_decision_needed: task.human_decision_needed,
    })), null, 2),
  ].join("\n");
}

function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`LLM returned malformed JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function credentialSourceForProvider(provider: string) {
  if (provider === "openai") {
    return { type: "env", name: "OPENAI_API_KEY" } as const;
  }

  return undefined;
}

function defaultModelForProvider(provider: string): string {
  if (provider === "openai") {
    return DEFAULT_OPENAI_MODEL;
  }

  return DEFAULT_OPENAI_MODEL;
}
