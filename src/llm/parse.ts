import { buildTaskQueue } from "../parser/taskQueue.js";
import { validateLlmParseOptions } from "./disclosure.js";
import { requestLlmTaskExtraction, type FetchLike, type LlmProviderRequest } from "./provider.js";
import { taskbriefTaskQueueSchema } from "./taskSchema.js";

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

export interface ParseWithLlmOptions {
  workspace?: string;
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

export async function parseWithLlm(input: string, options: ParseWithLlmOptions) {
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

  const providerResponse = await requestLlmTaskExtraction(
    {
      provider: metadata.provider,
      model: metadata.model,
      apiKey,
      input: buildPrompt(input),
    } satisfies LlmProviderRequest,
    options.fetchImpl,
  );

  const parsedJson = parseJson(providerResponse.content);
  const result = taskbriefTaskQueueSchema.safeParse(parsedJson);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message);
    throw new Error(`LLM output failed Taskbrief schema validation:\n- ${issues.join("\n- ")}`);
  }

  const tasksWithProvenance = result.data.tasks.map((task) => ({
    ...task,
    context: appendProvenance(task.context, metadata.provider, metadata.model),
  }));

  return buildTaskQueue(tasksWithProvenance, {
    workspace: options.workspace,
  });
}

function buildPrompt(input: string): string {
  return [
    "Convert the following product requirements or planning text into a Taskbrief task queue.",
    "Return JSON only. Use the exact top-level shape {\"tasks\":[...]}.",
    "Every task must use snake_case field names and include all required fields.",
    "If the text is ambiguous, make the smallest safe assumptions and keep the context explicit.",
    "",
    input,
  ].join("\n");
}

function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`LLM returned malformed JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function appendProvenance(context: string, provider: string, model: string): string {
  return [`Source: llm (${provider}:${model})`, "", context].join("\n");
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
