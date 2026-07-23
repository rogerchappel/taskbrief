import { readFileSync } from "node:fs";
import { parseDocument } from "yaml";
import { validateWorkspaceConfig, WorkspaceConfigError } from "./schema.js";
import type { WorkspaceConfig } from "../types.js";

export function loadWorkspaceConfig(path: string): WorkspaceConfig {
  return parseWorkspaceConfig(readFileSync(path, "utf8"));
}

export function parseWorkspaceConfig(source: string): WorkspaceConfig {
  const trimmed = source.trim();
  if (trimmed === "") {
    throw new Error("Workspace config is empty.");
  }

  const parsed = trimmed.startsWith("{") ? parseJson(trimmed) : parseYaml(trimmed);
  return validateWorkspaceConfig(parsed);
}

function parseJson(source: string): unknown {
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new WorkspaceConfigError(`Invalid workspace JSON: ${errorMessage(error)}`);
  }
}

function parseYaml(source: string): unknown {
  const document = parseDocument(source, { prettyErrors: true });
  if (document.errors.length > 0) {
    throw new WorkspaceConfigError(
      `Invalid workspace YAML: ${document.errors.map((error) => error.message).join("; ")}`,
    );
  }
  return document.toJS();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
