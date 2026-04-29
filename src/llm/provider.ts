export interface LlmProviderRequest {
  provider: string;
  model: string;
  input: string;
  apiKey: string;
}

export interface LlmProviderResponse {
  content: string;
}

export type FetchLike = typeof fetch;

export class LlmProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmProviderError";
  }
}

export async function requestLlmTaskExtraction(
  request: LlmProviderRequest,
  fetchImpl: FetchLike = fetch,
): Promise<LlmProviderResponse> {
  return requestOpenAiJson(
    request,
    [
      "You convert messy PRDs into Taskbrief task queues.",
      "Return only JSON with the exact shape {\"tasks\":[...]} using snake_case keys. Do not wrap in markdown fences.",
      "No extra keys are allowed.",
      "Every task must include these fields with these exact JSON types:",
      "- title: string",
      "- repo: string",
      "- type: string",
      "- risk: one of \"low\", \"medium\", or \"high\"",
      "- objective: string",
      "- context: string",
      "- allowed_paths: array of strings",
      "- forbidden_paths: array of strings",
      "- verification: array of strings",
      "- stop_conditions: array of strings",
      "- expected_commits: array of strings",
      "- review_pack_required: boolean",
      "- human_decision_needed: array of strings; use [] when no decision is needed",
      "- agent_prompt: string",
      "Optional fields id and branch may be strings when useful.",
      "Never use scalar strings, booleans, or numbers for array fields.",
    ].join("\n"),
    fetchImpl,
  );
}

export async function requestLlmOrchestrationRefinement(
  request: LlmProviderRequest,
  fetchImpl: FetchLike = fetch,
): Promise<LlmProviderResponse> {
  return requestOpenAiJson(
    request,
    [
      "You refine Taskbrief orchestration plans.",
      "Return only JSON with the exact shape {\"waves\":[...],\"notes\":[...]} using snake_case keys. Do not wrap in markdown fences.",
      "No extra keys are allowed.",
      "Every wave must include these fields with these exact JSON types:",
      "- name: string",
      "- mode: one of \"concurrent\" or \"sequential\"",
      "- task_ids: array of strings",
      "Rules:",
      "- Use each provided task id exactly once across all waves.",
      "- Put dependencies in earlier waves and dependent tasks in later waves.",
      "- Put tasks in the same wave only when they can safely run concurrently.",
      "- Keep high-risk or human-decision tasks in the appropriate wave; the caller will mark them blocked.",
      "- Do not invent, rename, omit, or duplicate task ids.",
      "- notes must be an array of strings explaining the dependency choices.",
    ].join("\n"),
    fetchImpl,
  );
}

async function requestOpenAiJson(
  request: LlmProviderRequest,
  systemPrompt: string,
  fetchImpl: FetchLike,
): Promise<LlmProviderResponse> {
  if (request.provider !== "openai") {
    throw new LlmProviderError(`Unsupported LLM provider "${request.provider}". Currently supported: openai.`);
  }

  const response = await fetchImpl("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${request.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: request.input,
        },
      ],
      response_format: {
        type: "json_object",
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await safeReadErrorBody(response);
    throw new LlmProviderError(`OpenAI request failed with ${response.status}${errorBody ? `: ${errorBody}` : ""}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string" && content.trim().length > 0) {
    return { content };
  }

  if (Array.isArray(content)) {
    const text = content
      .map((item) => (typeof item?.text === "string" ? item.text : ""))
      .join("")
      .trim();

    if (text.length > 0) {
      return { content: text };
    }
  }

  throw new LlmProviderError("OpenAI response did not contain JSON content.");
}

async function safeReadErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.trim().slice(0, 500);
  } catch {
    return "";
  }
}
