export const packageName = "taskbrief";
export const packageVersion = "0.1.0";

// @ts-expect-error Existing JavaScript modules do not publish local declarations yet.
import * as crewcmd from "./crewcmd/index.js";
// @ts-expect-error Existing JavaScript modules do not publish local declarations yet.
import * as output from "./output/index.js";
// @ts-expect-error Existing JavaScript modules do not publish local declarations yet.
import * as parser from "./parser/index.js";

export type TaskbriefRuntimeInfo = {
  name: string;
  version: string;
};

export function getRuntimeInfo(): TaskbriefRuntimeInfo {
  return {
    name: packageName,
    version: packageVersion
  };
}

export const { exportCrewCmd, requiresHumanApproval, toCrewCmdTask } = crewcmd;
export const { renderJson, renderMarkdown, renderTaskMarkdown, renderYaml, toYaml } = output;
export const { classifyRisk, inferRepo, inferType, normalizeTask, parseBrainDump, splitTasks, slugify } = parser;
export { loadWorkspaceConfig, parseWorkspaceConfig } from "./workspace/loadWorkspace.js";
export { listRepoAliases, resolveRepo } from "./workspace/resolveRepo.js";
export type {
  RepoResolution,
  RepoResolutionMatch,
  ResolveRepoResult,
  RiskClassification,
  RiskDefaults,
  RiskLevel,
  RiskSignal,
  RiskSignalSource,
  UnknownRepoResolution,
  WorkspaceConfig,
  WorkspaceRepoConfig,
} from "./types.js";
