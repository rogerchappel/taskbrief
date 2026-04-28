import type { WorkspaceConfig, WorkspaceRepoConfig } from "../types.js";

export class WorkspaceConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceConfigError";
  }
}

export function validateWorkspaceConfig(value: unknown): WorkspaceConfig {
  if (!isRecord(value)) {
    throw new WorkspaceConfigError("Workspace config must be an object.");
  }

  const workspace = value.workspace;
  if (typeof workspace !== "string" || workspace.trim() === "") {
    throw new WorkspaceConfigError("Workspace config requires a non-empty workspace name.");
  }

  if (!isRecord(value.repos)) {
    throw new WorkspaceConfigError("Workspace config requires a repos object.");
  }

  const repos: Record<string, WorkspaceRepoConfig> = {};
  for (const [repoName, repoValue] of Object.entries(value.repos)) {
    if (!isRecord(repoValue)) {
      throw new WorkspaceConfigError(`Repo "${repoName}" must be an object.`);
    }

    const path = repoValue.path;
    if (typeof path !== "string" || path.trim() === "") {
      throw new WorkspaceConfigError(`Repo "${repoName}" requires a non-empty path.`);
    }

    repos[repoName] = {
      path,
      type: optionalString(repoValue.type, `repos.${repoName}.type`),
      default_base: optionalString(repoValue.default_base, `repos.${repoName}.default_base`),
      docs_url: optionalString(repoValue.docs_url, `repos.${repoName}.docs_url`),
      requires_pr: optionalBoolean(repoValue.requires_pr, `repos.${repoName}.requires_pr`),
      production_sensitive: optionalBoolean(
        repoValue.production_sensitive,
        `repos.${repoName}.production_sensitive`,
      ),
      aliases: optionalStringArray(repoValue.aliases, `repos.${repoName}.aliases`),
      common_verification: optionalStringArray(
        repoValue.common_verification,
        `repos.${repoName}.common_verification`,
      ),
      forbidden_by_default: optionalStringArray(
        repoValue.forbidden_by_default,
        `repos.${repoName}.forbidden_by_default`,
      ),
      risk_defaults: optionalRiskDefaults(repoValue.risk_defaults, `repos.${repoName}.risk_defaults`),
    };
  }

  return { workspace, repos };
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new WorkspaceConfigError(`${field} must be a string.`);
  }
  return value;
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new WorkspaceConfigError(`${field} must be a boolean.`);
  }
  return value;
}

function optionalStringArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new WorkspaceConfigError(`${field} must be an array of strings.`);
  }
  return value;
}

function optionalRiskDefaults(
  value: unknown,
  field: string,
): WorkspaceRepoConfig["risk_defaults"] | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    throw new WorkspaceConfigError(`${field} must be an object.`);
  }

  const defaults: WorkspaceRepoConfig["risk_defaults"] = {};
  for (const [key, risk] of Object.entries(value)) {
    if (risk !== "low" && risk !== "medium" && risk !== "high") {
      throw new WorkspaceConfigError(`${field}.${key} must be low, medium, or high.`);
    }
    defaults[key] = risk;
  }
  return defaults;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
