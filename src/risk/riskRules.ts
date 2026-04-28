import type { RiskLevel } from "../types.js";

export interface RiskKeywordRule {
  risk: RiskLevel;
  keywords: string[];
}

export const highRiskKeywords = [
  "production data",
  "payments",
  "stripe",
  "billing",
  "auth",
  "authentication",
  "authorization",
  "security",
  "migration",
  "migrations",
  "secrets",
  "environment variables",
  "env vars",
  "destructive action",
  "data deletion",
  "delete data",
  "public api compatibility",
  "launch-critical",
  "launch critical",
  "customer data",
  "credentials",
  "webhooks",
  "tokens",
] as const;

export const mediumRiskKeywords = [
  "release",
  "npm publish",
  "ci",
  "deployment",
  "deploy",
  "dependency updates",
  "dependencies",
  "config",
  "mobile testing",
  "database sync",
  "public cli behavior",
  "github actions",
  "cloudflare pages",
  "package metadata",
  "versioning",
] as const;

export const lowRiskKeywords = [
  "docs",
  "documentation",
  "readme",
  "examples",
  "tests",
  "issue templates",
  "changelog",
  "roadmap",
  "non-runtime content",
  "copy updates",
] as const;

export const riskKeywordRules: RiskKeywordRule[] = [
  { risk: "high", keywords: [...highRiskKeywords] },
  { risk: "medium", keywords: [...mediumRiskKeywords] },
  { risk: "low", keywords: [...lowRiskKeywords] },
];

export function compareRisk(left: RiskLevel, right: RiskLevel): number {
  return riskRank(left) - riskRank(right);
}

export function highestRisk(risks: RiskLevel[]): RiskLevel {
  return risks.reduce<RiskLevel>(
    (highest, risk) => (compareRisk(risk, highest) > 0 ? risk : highest),
    "low",
  );
}

function riskRank(risk: RiskLevel): number {
  if (risk === "high") return 3;
  if (risk === "medium") return 2;
  return 1;
}
