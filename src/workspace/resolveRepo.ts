import type { ResolveRepoResult, WorkspaceConfig } from "../types.js";

export function resolveRepo(config: WorkspaceConfig, query: string): ResolveRepoResult {
  const normalizedQuery = normalize(query);
  if (normalizedQuery === "") {
    return unknown("Repo query is empty.");
  }

  for (const [repoName, repo] of Object.entries(config.repos)) {
    if (normalize(repoName) === normalizedQuery) {
      return { repoName, repo, matchedBy: "name", uncertain: false };
    }
  }

  for (const [repoName, repo] of Object.entries(config.repos)) {
    if ((repo.aliases ?? []).some((alias) => normalize(alias) === normalizedQuery)) {
      return { repoName, repo, matchedBy: "alias", uncertain: false };
    }
  }

  for (const [repoName, repo] of Object.entries(config.repos)) {
    const pathName = repo.path.split(/[\\/]/).filter(Boolean).at(-1);
    if (normalize(pathName ?? "") === normalizedQuery || normalize(repo.path) === normalizedQuery) {
      return { repoName, repo, matchedBy: "path", uncertain: false };
    }
  }

  return unknown(`No repo matched "${query}".`);
}

export function listRepoAliases(config: WorkspaceConfig, repoName: string): string[] {
  const repo = config.repos[repoName];
  if (!repo) return [];
  return [repoName, ...(repo.aliases ?? [])];
}

function unknown(reason: string): ResolveRepoResult {
  return { repoName: "unknown", uncertain: true, reason };
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
