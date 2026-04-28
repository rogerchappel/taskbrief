import { describe, expect, it } from "vitest";

import {
  LlmParseOptionsError,
  expectedProviderEnvKeys,
  formatLlmDisclosure,
  validateLlmParseOptions,
} from "../../src/llm/index.js";

describe("LLM parse option disclosure guardrails", () => {
  it("maps known hosted providers to their expected env keys", () => {
    expect(expectedProviderEnvKeys.openai).toBe("OPENAI_API_KEY");
    expect(expectedProviderEnvKeys.anthropic).toBe("ANTHROPIC_API_KEY");
    expect(expectedProviderEnvKeys.openrouter).toBe("OPENROUTER_API_KEY");
  });

  it("returns disclosure metadata when required OpenAI options and credentials are explicit", () => {
    const metadata = validateLlmParseOptions(
      {
        provider: "openai",
        model: "gpt-4.1-mini",
        credentialSource: { type: "env", name: "OPENAI_API_KEY" },
        input: { type: "stdin" },
        outputFormat: "crewcmd",
        network: true,
      },
      { OPENAI_API_KEY: "sk-test-secret-value" },
    );

    expect(metadata).toEqual({
      provider: "openai",
      model: "gpt-4.1-mini",
      credentialSource: { type: "env", name: "OPENAI_API_KEY" },
      input: { type: "stdin" },
      outputFormat: "crewcmd",
      network: true,
    });
    expect(formatLlmDisclosure(metadata)).toContain("Credential source: OPENAI_API_KEY");
  });

  it("allows Ollama with no credential source by default", () => {
    const metadata = validateLlmParseOptions({
      provider: "ollama",
      model: "llama3.2",
      input: { type: "text", label: "fixture" },
      outputFormat: "json",
      network: false,
    });

    expect(metadata.credentialSource).toEqual({ type: "none" });
    expect(formatLlmDisclosure(metadata)).toContain("Network: no");
  });

  it("reports missing required option keys clearly", () => {
    expect(() => validateLlmParseOptions({})).toThrow(
      new LlmParseOptionsError([
        "provider is required",
        "model is required",
        "credential source is required for unknown providers",
        "input source is required",
        "output format is required",
        "network must be explicitly set to yes or no",
      ]),
    );
  });

  it("reports missing hosted provider credentials without emitting secret values", () => {
    const secret = "sk-live-should-never-be-printed";

    expect(() =>
      validateLlmParseOptions(
        {
          provider: "openai",
          model: "gpt-4.1-mini",
          credentialSource: { type: "env", name: "OPENAI_API_KEY" },
          input: { type: "file", path: "brain-dump.txt" },
          outputFormat: "markdown",
          network: true,
        },
        {
          OPENAI_API_KEY: "",
          UNRELATED_SECRET: secret,
        },
      ),
    ).toThrowError(/openai credential is missing from OPENAI_API_KEY/);

    try {
      validateLlmParseOptions(
        {
          provider: "openai",
          model: "gpt-4.1-mini",
          credentialSource: { type: "env", name: "OPENAI_API_KEY" },
          input: { type: "file", path: "brain-dump.txt" },
          outputFormat: "markdown",
          network: true,
        },
        {
          OPENAI_API_KEY: "",
          UNRELATED_SECRET: secret,
        },
      );
    } catch (error) {
      expect(String(error)).not.toContain(secret);
    }
  });

  it("requires hosted provider credential sources to disclose the expected env key", () => {
    expect(() =>
      validateLlmParseOptions(
        {
          provider: "openrouter",
          model: "openai/gpt-4.1-mini",
          input: { type: "stdin" },
          outputFormat: "json",
          network: true,
        },
        { OPENROUTER_API_KEY: "present-but-not-disclosed" },
      ),
    ).toThrowError(/openrouter credential source is required and must be OPENROUTER_API_KEY/);
  });

  it("rejects the wrong env key for known providers without scanning arbitrary env vars", () => {
    expect(() =>
      validateLlmParseOptions(
        {
          provider: "anthropic",
          model: "claude-3-5-sonnet",
          credentialSource: { type: "env", name: "OPENAI_API_KEY" },
          input: { type: "stdin" },
          outputFormat: "yaml",
          network: true,
        },
        {
          ANTHROPIC_API_KEY: "anthropic-secret",
          OPENAI_API_KEY: "openai-secret",
        },
      ),
    ).toThrowError(/anthropic credential source must be ANTHROPIC_API_KEY/);
  });
});
