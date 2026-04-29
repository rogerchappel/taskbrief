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
          content:
            "You convert messy PRDs into Taskbrief task queues. Return only JSON with the exact shape {\"tasks\":[...]} using snake_case keys. Do not wrap in markdown fences. Every task must include title, repo, type, risk, objective, context, allowed_paths, forbidden_paths, verification, stop_conditions, expected_commits, review_pack_required, human_decision_needed, and agent_prompt. No extra keys.",
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

  throw new LlmProviderError("OpenAI response did not contain task JSON content.");
}

async function safeReadErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.trim().slice(0, 500);
  } catch {
    return "";
  }
}
