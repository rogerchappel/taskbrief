/**
 * PRD-aware task extractor.
 *
 * Extracts a small, coherent task set from structured PRD documents by
 * targeting only the useful implementation-oriented sections:
 * - `## V1 Scope` (numbered scope items)
 * - `## Suggested Initial Commits` (commit messages -> tasks)
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
  { heading: /^##\s+\d*\.?\s*Suggested\s+Initial\s+Commits\b/im, extract: extractCommitsAsTasks },
  { heading: /^##\s+\d*\.?\s*Agent\s+Work\s+Plan\b/im, extract: extractAgentWorkPlan },
  { heading: /^##\s+\d*\.?\s*Agent\s+Prompt\b/im, extract: extractAgentPromptTasks },
  { heading: /^##\s+\d*\.?\s*Verification\b/im, extract: extractVerificationTasks },
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
  return PRD_HEADER_PATTERNS.some((pattern) => pattern.test(text));
}

export function parsePRD(input, options = {}) {
  const normalized = String(input ?? "").replace(/\r\n?/g, "\n");

  if (!isPRDDocument(normalized)) {
    return null; // Not a PRD, let the caller fall back to brain-dump parsing
  }

  const workspace = options.workspace ?? "default";
  const taskCandidates = [];

  for (const { heading, extract } of TASK_SOURCE_SECTIONS) {
    const matches = extract(normalized, heading);
    taskCandidates.push(...matches);
  }

  const seen = new Set();
  const uniqueTasks = [];
  for (const text of taskCandidates) {
    const key = text.toLowerCase().replace(/\s+/g, " ").trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      uniqueTasks.push(text);
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

  const tasks = uniqueTasks.map((text, index) =>
    normalizeTask({ text, repo: "taskbrief" }, index),
  );

  return {
    version: "0.1",
    source: "taskbrief",
    workspace,
    tasks,
  };
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

function extractCommitsAsTasks(text) {
  const content = extractSectionContent(text, /^##\s+Suggested\s+Initial\s+Commits\b/im);
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

function extractAgentWorkPlan(text) {
  const content = extractSectionContent(text, /^##\s+Agent\s+Work\s+Plan\b/im);
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

function extractAgentPromptTasks(text) {
  const content = extractSectionContent(text, /^##\s+Agent\s+Prompt\b/im);
  if (!content) return [];

  // Agent Prompt sections typically contain skill/instruction text, not executable tasks
  // Skip this unless it contains explicit task lists
  return [];
}

function extractVerificationTasks(text) {
  const content = extractSectionContent(text, /^##\s+Verification\b/im);
  if (!content) return [];

  // Verification sections list commands/checks, not development tasks
  // Only extract if explicitly labeled as tasks
  return [];
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
