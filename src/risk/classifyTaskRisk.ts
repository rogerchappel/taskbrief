import type {
  RiskClassification,
  RiskLevel,
  RiskSignal,
  WorkspaceRepoConfig,
} from "../types.js";
import { highestRisk, riskKeywordRules } from "./riskRules.js";

export interface ClassifyTaskRiskOptions {
  repo?: WorkspaceRepoConfig;
  taskType?: string;
  defaultRisk?: RiskLevel;
}

export function classifyTaskRisk(
  text: string,
  options: ClassifyTaskRiskOptions = {},
): RiskClassification {
  const signals = [
    ...keywordSignals(text),
    ...repoDefaultSignals(text, options.repo, options.taskType),
  ];

  if (signals.length === 0) {
    signals.push({
      risk: options.defaultRisk ?? "low",
      source: "fallback",
      value: options.defaultRisk ? "configured default risk" : "no risk keywords matched",
    });
  }

  const risk = highestRisk(signals.map((signal) => signal.risk));
  return {
    risk,
    requiresHumanApproval: risk === "medium" || risk === "high",
    reviewRequired: risk === "medium" || risk === "high",
    dispatchAllowed: risk !== "high",
    signals,
    reason: reasonFor(risk, signals),
  };
}

export function requiresHumanApproval(classification: Pick<RiskClassification, "risk">): boolean {
  return classification.risk === "medium" || classification.risk === "high";
}

function keywordSignals(text: string): RiskSignal[] {
  const normalizedText = normalize(text);
  const signals: RiskSignal[] = [];

  for (const rule of riskKeywordRules) {
    for (const keyword of rule.keywords) {
      if (containsKeyword(normalizedText, keyword)) {
        signals.push({ risk: rule.risk, source: "keyword", value: keyword });
      }
    }
  }

  return signals;
}

function repoDefaultSignals(
  text: string,
  repo: WorkspaceRepoConfig | undefined,
  taskType: string | undefined,
): RiskSignal[] {
  const defaults = repo?.risk_defaults;
  if (!defaults) return [];

  const normalizedText = normalize(text);
  const normalizedTaskType = normalize(taskType ?? "");
  const signals: RiskSignal[] = [];

  for (const [key, risk] of Object.entries(defaults)) {
    if (!risk) continue;
    const normalizedKey = normalize(key);
    if (normalizedKey === "") continue;

    if (normalizedTaskType === normalizedKey || containsKeyword(normalizedText, normalizedKey)) {
      signals.push({ risk, source: "repo_default", value: key });
    }
  }

  return signals;
}

function containsKeyword(text: string, keyword: string): boolean {
  const escaped = normalize(keyword).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
  return pattern.test(text);
}

function reasonFor(risk: RiskLevel, signals: RiskSignal[]): string {
  const strongestSignals = signals.filter((signal) => signal.risk === risk);
  const sources = strongestSignals.map((signal) => `${signal.source}:${signal.value}`).join(", ");
  return `${risk} risk from ${sources}`;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ");
}
