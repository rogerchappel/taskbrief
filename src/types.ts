export type RiskLevel = "low" | "medium" | "high";

export type RiskDefaults = Partial<Record<string, RiskLevel>>;

export interface WorkspaceRepoConfig {
  path: string;
  type?: string;
  default_base?: string;
  docs_url?: string;
  requires_pr?: boolean;
  production_sensitive?: boolean;
  aliases?: string[];
  common_verification?: string[];
  forbidden_by_default?: string[];
  risk_defaults?: RiskDefaults;
}

export interface WorkspaceConfig {
  workspace: string;
  repos: Record<string, WorkspaceRepoConfig>;
}

export type RepoResolutionMatch = "name" | "alias" | "path";

export interface RepoResolution {
  repoName: string;
  repo: WorkspaceRepoConfig;
  matchedBy: RepoResolutionMatch;
  uncertain: false;
}

export interface UnknownRepoResolution {
  repoName: "unknown";
  repo?: undefined;
  matchedBy?: undefined;
  uncertain: true;
  reason: string;
}

export type ResolveRepoResult = RepoResolution | UnknownRepoResolution;

export type RiskSignalSource = "keyword" | "repo_default" | "fallback";

export interface RiskSignal {
  risk: RiskLevel;
  source: RiskSignalSource;
  value: string;
}

export interface RiskClassification {
  risk: RiskLevel;
  requiresHumanApproval: boolean;
  reviewRequired: boolean;
  dispatchAllowed: boolean;
  signals: RiskSignal[];
  reason: string;
}
