/**
 * PRD-aware task extractor.
 *
 * Extracts a small, coherent task set from structured PRD documents by
 * targeting only the useful implementation-oriented sections:
 * - `## V1 Scope` (numbered scope items)
 * - `## Suggested Initial Commits` (commit messages -> tasks)
 * - `## Agent Prompt` / `## Verification` explicit closing-loop requirements
 * - `## Requirements` / `## Acceptance Criteria` checklist or bullet items
 * - Numbered task lists within example/plan sections
 * - Explicit `Task:` or `- task:` blocks if present
 *
 * Ignores:
 * - Scorecard/status tables
 * - Pitch prose and marketing sections
 * - Philosophy, principles, non-goals
 * - Architecture diagrams and relationship descriptions
 * - Example outputs that are just illustrative (not prescriptive tasks)
 */

import { normalizeTask } from "./normalizeTask.js";

const PRD_HEADER_PATTERNS = [
  /^#\s+PRD[:\s]/im,
  /^#\s+Product\s+Requirements?\s+Document/im,
];

const TASK_SOURCE_SECTIONS = [
  { heading: /^##\s+\d*\.?\s*V1\s+Scope\b/im, extract: extractV1Scope },
  { heading: /^##\s+\d*\.?\s*Suggested\s+Initial\s+Commits\b/im, extract: extractCommitsAsTasks, wave: 1 },
  { heading: /^##\s+\d*\.?\s*Agent\s+Work\s+Plan\b/im, extract: extractAgentWorkPlan, wave: 1 },
  { heading: /^##\s+\d*\.?\s*Requirements?\b/im, extract: extractRequirementSectionTasks, wave: 2 },
  { heading: /^##\s+\d*\.?\s*Acceptance\s+Criteria\b/im, extract: extractRequirementSectionTasks, wave: 2 },
  { heading: /^##\s+\d*\.?\s*Agent\s+Prompt\b/im, extract: extractAgentPromptTasks, wave: 2 },
  { heading: /^##\s+\d*\.?\s*Verification\b/im, extract: extractVerificationTasks, wave: 3 },
];

const NON_TASK_SECTIONS = [
  /^##\s+Product\s+(Name|Principle|Promise)\b/im,
  /^##\s+(One-Line\s+Pitch|Tagline)\b/im,
  /^##\s+Objective\b/im,
  /^##\s+Target\s+Users\b/im,
  /^##\s+Core\s+Problem\b/im,
  /^##\s+Relationship\s+to\b/im,
  /^##\s+Non-Goals\b/im,
  /^##\s+V[2-9]\s+Scope\b/im,
  /^##\s+(CLI|LLM|Workspace|Task\s+Schema|CrewCMD\s+Export|Risk|Stop\s+Conditions|Skill|Mental\s+Model)\b/im,
  /^##\s+Acceptance\s+Criteria\b/im,
  /^##\s+Final\s+(Review|Product)\b/im,
  /^##\s+Docs\s+Requirements\b/im,
  /^##\s+Required\s+Repository\b/im,
  /^##\s+CLI\s+(Requirements?|Architecture)\b/im,
  /^##\s+Testing\s+Requirements\b/im,
  /^##\s+Example\s+(Input|Output)\b/im,
];

function isPRDDocument(text) {
  if (PRD_HEADER_PATTERNS.some((pattern) => pattern.test(text))) return true;

  return (
    /^#\s+\S+/m.test(text) &&
    /^Status:\s+ready\b/im.test(text) &&
    /^##\s+Scorecard\b/im.test(text) &&
    /^##\s+V1\s+Scope\b/im.test(text)
  );
}

export function parsePRD(input, options = {}) {
  const normalized = String(input ?? "").replace(/\r\n?/g, "\n");

  if (!isPRDDocument(normalized)) {
    return null; // Not a PRD, let the caller fall back to brain-dump parsing
  }

  const workspace = options.workspace ?? "default";
  const repository = inferRepositoryName(normalized);
  const taskCandidates = [];

  for (const { heading, extract, wave } of TASK_SOURCE_SECTIONS) {
    const matches = extract(normalized, heading).map((candidate) => asTaskCandidate(candidate, wave));
    taskCandidates.push(...matches);
  }

  const seen = new Set();
  const uniqueTasks = [];
  for (const candidate of taskCandidates) {
    const key = requirementKey(candidate.text);
    if (key && !seen.has(key)) {
      seen.add(key);
      uniqueTasks.push(candidate);
    }
  }

  if (uniqueTasks.length === 0) {
    return {
      version: "0.1",
      source: "taskbrief",
      workspace,
      tasks: [],
    };
  }

  const tasks = uniqueTasks.map((candidate, index) => {
    const dependsOn = dependencyForWave(candidate.wave);
    const context = [
      `Wave: ${candidate.wave}`,
      `Depends on: ${dependsOn}`,
      "",
      `Requirement: ${candidate.text}`,
    ].join("\n");

    return normalizeTask({ text: candidate.text, repo: repository, context }, index);
  });

  return {
    version: "0.1",
    source: "taskbrief",
    workspace,
    tasks,
  };
}

function inferRepositoryName(text) {
  const headingMatch = text.match(/^#\s+(?:PRD:\s*)?(.+?)\s*$/im);
  if (!headingMatch) return "unknown";

  return headingMatch[1]
    .replace(/\s+status:.*$/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

function asTaskCandidate(candidate, wave = 1) {
  if (typeof candidate === "string") return { text: candidate, wave };
  return { text: candidate.text, wave: candidate.wave ?? wave };
}

function requirementKey(text) {
  return cleanRequirement(text).toLowerCase().replace(/\s+/g, " ").trim();
}

function dependencyForWave(wave) {
  if (wave <= 1) return "None";
  if (wave === 2) return "Wave 1 core implementation tasks";
  return "Wave 1 core implementation tasks and Wave 2 closing-loop requirements";
}

function extractSectionContent(text, headingRegex) {
  const lines = text.split("\n");
  let inSection = false;
  const contentLines = [];

  for (const line of lines) {
    if (headingRegex.test(line)) {
      if (inSection) break; // Hit next section
      inSection = true;
      continue; // Skip the heading itself
    }

    if (inSection) {
      if (/^##\s+\S/.test(line)) break; // Next ## heading
      if (/^#\s+\S/.test(line)) break; // Next # heading
      contentLines.push(line);
    }
  }

  return contentLines.join("\n").trim();
}

function extractV1Scope(text) {
  const content = extractSectionContent(text, /^##\s+\d*\.?\s*V1\s+Scope\b/im);
  if (!content) return [];

  const tasks = [];

  // Match numbered list items: 1. Task description
  const numberedPattern = /^\d+\.\s+(.+)$/gm;
  let match;
  while ((match = numberedPattern.exec(content)) !== null) {
    const taskText = match[1].trim();
    if (taskText && !isBoilerplate(taskText)) {
      tasks.push(taskText);
    }
  }

  // If no numbered items, look for bullet lists
  if (tasks.length === 0) {
    const bulletPattern = /^[-*]\s+(.+)$/gm;
    while ((match = bulletPattern.exec(content)) !== null) {
      const taskText = match[1].trim();
      if (taskText && !isBoilerplate(taskText)) {
        tasks.push(taskText);
      }
    }
  }

  return tasks;
}

function extractCommitsAsTasks(text, headingRegex = /^##\s+\d*\.?\s*Suggested\s+Initial\s+Commits\b/im) {
  const content = extractSectionContent(text, headingRegex);
  if (!content) return [];

  const tasks = [];
  const pattern = /^[-*]\s+(.+)$/gm;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const commitMessage = match[1].trim();
    if (commitMessage && !isBoilerplate(commitMessage)) {
      // Convert commit message to task description
      const taskText = commitMessage.replace(/^(chore|feat|docs|fix|test|ci)\([^)]*\):\s*/i, "");
      tasks.push(capitalize(taskText));
    }
  }

  return tasks;
}

function extractAgentWorkPlan(text, headingRegex = /^##\s+\d*\.?\s*Agent\s+Work\s+Plan\b/im) {
  const content = extractSectionContent(text, headingRegex);
  if (!content) return [];

  const tasks = [];

  // Extract "Agent N: Title" then bullet items beneath
  const agentPattern = /^###\s+Agent\s+\d+:\s+(.+)$/gm;
  let agentMatch;
  let currentAgent = "";

  while ((agentMatch = agentPattern.exec(content)) !== null) {
    currentAgent = agentMatch[1].trim();
  }

  // For now, just use agent titles as high-level tasks
  agentPattern.lastIndex = 0;
  while ((agentMatch = agentPattern.exec(content)) !== null) {
    const agentTitle = agentMatch[1].trim();
    tasks.push(`Build ${agentTitle}`);
  }

  return tasks;
}

function extractRequirementSectionTasks(text, headingRegex) {
  const content = extractSectionContent(text, headingRegex);
  if (!content) return [];

  return extractExplicitRequirements(content);
}

function extractAgentPromptTasks(text, headingRegex = /^##\s+\d*\.?\s*Agent\s+Prompt\b/im) {
  const content = extractSectionContent(text, headingRegex);
  if (!content) return [];

  return extractExplicitRequirements(content);
}

function extractVerificationTasks(text, headingRegex = /^##\s+\d*\.?\s*Verification\b/im) {
  const content = extractSectionContent(text, headingRegex);
  if (!content) return [];

  return extractExplicitRequirements(content, { includeFinalValidation: true });
}

function extractExplicitRequirements(content, options = {}) {
  const tasks = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const item = line.match(/^\s*(?:[-*]|\d+\.)\s+(?:\[[ xX-]\]\s*)?(.+)$/);
    if (item) addRequirement(tasks, item[1]);
  }

  for (const sentence of splitSentences(content)) {
    const includeMatch = sentence.match(/\binclude\s+(.+)$/i);
    if (includeMatch) addRequirement(tasks, includeMatch[1]);
    else if (looksLikeClosingLoopRequirement(sentence, options)) addRequirement(tasks, sentence);
  }

  return tasks;
}

function splitSentences(content) {
  return content
    .replace(/`([^`]+)`/g, "$1")
    .split(/(?:\n+|(?<=[.!?])\s+)/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function addRequirement(tasks, value) {
  const cleaned = cleanRequirement(value);
  if (cleaned && looksLikeTaskRequirement(cleaned)) tasks.push(cleaned);
}

function cleanRequirement(value) {
  return String(value ?? "")
    .replace(/^\s*(?:[-*]|\d+\.)\s+(?:\[[ xX-]\]\s*)?/, "")
    .replace(/^\s*(?:task|requirement|acceptance criterion)\s*:\s*/i, "")
    .replace(/\s+and\s+CrewCmd\s+integration\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^[,.;:\-\s]+|[,.;:\-\s]+$/g, "")
    .trim();
}

function looksLikeTaskRequirement(text) {
  if (isBoilerplate(text)) return false;
  if (/^(do not|don['’]t|skip|avoid|non-goal)\b/i.test(text)) return false;
  if (/\b(scorecard|scoring)\b/i.test(text)) return false;
  return looksLikeClosingLoopRequirement(text);
}

function looksLikeClosingLoopRequirement(text, options = {}) {
  return /\b(cli|command|package(?: manager)?|script|safe checks?|checks?\b|reports?|exit\s+non[- ]?zero|config(?:uration)?|fixtures?|pass(?:ing)? fixture|fail(?:ing)? fixture|tests?|json schema|schema tests?|readme|docs?|documentation|github actions?|workflow|example|validation|release readiness|readiness)\b/i.test(text) ||
    (options.includeFinalValidation && /\bfinal\b.*\b(validate|validation|readiness|release)\b/i.test(text));
}

function isBoilerplate(text) {
  const lower = text.toLowerCase();
  return (
    lower.length < 5 ||
    /^(yes|no|n\/a|todo|tbd|wip)$/i.test(lower) ||
    /^(package|docs|suggested|stack|create|add|set\s+up)\s*$/.test(lower)
  );
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
