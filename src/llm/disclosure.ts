export type LlmProvider =
  | "openai"
  | "anthropic"
  | "openrouter"
  | "ollama"
  | (string & {});

export type LlmOutputFormat = "markdown" | "yaml" | "json" | "crewcmd";

export type LlmCredentialSource =
  | {
      type: "env";
      name: string;
    }
  | {
      type: "local";
      label?: string;
    }
  | {
      type: "none";
    }
  | {
      type: "unknown";
    };

export type LlmInputSource =
  | {
      type: "file";
      path: string;
    }
  | {
      type: "stdin";
    }
  | {
      type: "text";
      label?: string;
    };

export interface LlmDisclosureMetadata {
  provider: LlmProvider;
  model: string;
  credentialSource: LlmCredentialSource;
  input: LlmInputSource;
  outputFormat: LlmOutputFormat;
  network: boolean;
}

export function formatLlmDisclosure(metadata: LlmDisclosureMetadata): string {
  return [
    "LLM mode enabled.",
    `Provider: ${metadata.provider}`,
    `Model: ${metadata.model}`,
    `Credential source: ${formatCredentialSource(metadata.credentialSource)}`,
    `Input: ${formatInputSource(metadata.input)}`,
    `Output format: ${metadata.outputFormat}`,
    `Network: ${metadata.network ? "yes" : "no"}`,
  ].join("\n");
}

function formatCredentialSource(source: LlmCredentialSource): string {
  if (source.type === "env") {
    return isSafeEnvName(source.name) ? source.name : "redacted credential source";
  }

  if (source.type === "local") {
    return source.label ?? "local/no auth";
  }

  if (source.type === "none") {
    return "local/no auth";
  }

  return "unknown";
}

function formatInputSource(input: LlmInputSource): string {
  if (input.type === "file") {
    return input.path;
  }

  if (input.type === "stdin") {
    return "stdin";
  }

  return input.label ?? "provided text";
}

function isSafeEnvName(value: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(value);
}
