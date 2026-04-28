export type LlmProvider =
  | "openai"
  | "anthropic"
  | "openrouter"
  | "ollama"
  | (string & {});

export type LlmOutputFormat = "markdown" | "yaml" | "json" | "crewcmd";

export type KnownLlmProvider = "openai" | "anthropic" | "openrouter" | "ollama";

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

export type LlmParseOptions = Partial<{
  provider: LlmProvider;
  model: string;
  credentialSource: LlmCredentialSource;
  input: LlmInputSource;
  outputFormat: LlmOutputFormat;
  network: boolean;
}>;

export type LlmEnvironment = Record<string, string | undefined>;

export class LlmParseOptionsError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid LLM parse options:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
    this.name = "LlmParseOptionsError";
    this.issues = issues;
  }
}

export const expectedProviderEnvKeys = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  ollama: undefined,
} as const satisfies Record<KnownLlmProvider, string | undefined>;

export function validateLlmParseOptions(
  options: LlmParseOptions,
  environment: LlmEnvironment = {},
): LlmDisclosureMetadata {
  const issues: string[] = [];
  const provider = validateProvider(options.provider, issues);
  const model = validateRequiredText("model", options.model, issues);
  const credentialSource = validateCredentialSource(provider, options.credentialSource, environment, issues);
  const input = validateInputSource(options.input, issues);
  const outputFormat = validateOutputFormat(options.outputFormat, issues);
  const network = validateNetwork(options.network, issues);

  if (issues.length > 0) {
    throw new LlmParseOptionsError(issues);
  }

  return {
    provider,
    model,
    credentialSource,
    input,
    outputFormat,
    network,
  };
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

function validateProvider(provider: LlmProvider | undefined, issues: string[]): LlmProvider {
  if (typeof provider !== "string" || provider.trim().length === 0) {
    issues.push("provider is required");
    return "";
  }

  return provider.trim();
}

function validateRequiredText(field: string, value: string | undefined, issues: string[]): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`${field} is required`);
    return "";
  }

  return value.trim();
}

function validateCredentialSource(
  provider: LlmProvider,
  source: LlmCredentialSource | undefined,
  environment: LlmEnvironment,
  issues: string[],
): LlmCredentialSource {
  if (provider === "ollama" && source === undefined) {
    return { type: "none" };
  }

  const expectedEnvKey = expectedEnvKeyForProvider(provider);
  if (expectedEnvKey !== undefined) {
    if (source === undefined) {
      issues.push(`${provider} credential source is required and must be ${expectedEnvKey}`);
      if (!hasCredential(environment, expectedEnvKey)) {
        issues.push(`${provider} credential is missing from ${expectedEnvKey}`);
      }
      return { type: "env", name: expectedEnvKey };
    }

    const credentialSource = source;

    if (credentialSource.type !== "env") {
      issues.push(`${provider} credentials must use ${expectedEnvKey}`);
      return credentialSource;
    }

    if (credentialSource.name !== expectedEnvKey) {
      issues.push(`${provider} credential source must be ${expectedEnvKey}`);
      return credentialSource;
    }

    if (!hasCredential(environment, expectedEnvKey)) {
      issues.push(`${provider} credential is missing from ${expectedEnvKey}`);
    }

    return credentialSource;
  }

  if (source === undefined) {
    issues.push("credential source is required for unknown providers");
    return { type: "unknown" };
  }

  if (source.type === "env") {
    if (!isSafeEnvName(source.name)) {
      issues.push("credential source env key must be an uppercase environment variable name");
      return source;
    }

    if (!hasCredential(environment, source.name)) {
      issues.push(`credential is missing from ${source.name}`);
    }
  }

  return source;
}

function validateInputSource(input: LlmInputSource | undefined, issues: string[]): LlmInputSource {
  if (input === undefined) {
    issues.push("input source is required");
    return { type: "text", label: "missing" };
  }

  if (input.type === "file" && input.path.trim().length === 0) {
    issues.push("input file path is required");
  }

  return input;
}

function validateOutputFormat(format: LlmOutputFormat | undefined, issues: string[]): LlmOutputFormat {
  if (format === undefined) {
    issues.push("output format is required");
    return "markdown";
  }

  if (!["markdown", "yaml", "json", "crewcmd"].includes(format)) {
    issues.push("output format must be one of markdown, yaml, json, crewcmd");
  }

  return format;
}

function validateNetwork(network: boolean | undefined, issues: string[]): boolean {
  if (typeof network !== "boolean") {
    issues.push("network must be explicitly set to yes or no");
    return false;
  }

  return network;
}

function expectedEnvKeyForProvider(provider: LlmProvider): string | undefined {
  if (provider === "openai") {
    return expectedProviderEnvKeys.openai;
  }

  if (provider === "anthropic") {
    return expectedProviderEnvKeys.anthropic;
  }

  if (provider === "openrouter") {
    return expectedProviderEnvKeys.openrouter;
  }

  if (provider === "ollama") {
    return expectedProviderEnvKeys.ollama;
  }

  return undefined;
}

function hasCredential(environment: LlmEnvironment, name: string): boolean {
  return typeof environment[name] === "string" && environment[name].trim().length > 0;
}
