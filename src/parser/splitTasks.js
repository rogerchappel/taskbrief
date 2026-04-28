import { inferRepo } from "./normalizeTask.js";

const BOUNDARY_MARKER = "\n@@TASKBRIEF_BOUNDARY@@\n";

export function splitTasks(input) {
  const normalized = String(input ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\b(?:also|then|next)\b/gi, BOUNDARY_MARKER)
    .replace(/;\s+/g, BOUNDARY_MARKER)
    .replace(/\.\s+/g, BOUNDARY_MARKER)
    .replace(/\s+(?:and|&)\s+(?=(?:product[- ]videogen|branchbrief|crewcmd|agentic[- ]oss[- ]template|agentic template|taskbrief|roger[- ]website|blog|docs?|deploy|set up|review|write)\b)/gi, BOUNDARY_MARKER)
    .replace(/,\s+(?=(?:product[- ]videogen|branchbrief|crewcmd|agentic[- ]oss[- ]template|agentic template|taskbrief|roger[- ]website|blog|deploy|set up|review|write)\b)/gi, BOUNDARY_MARKER);

  return normalized
    .split(BOUNDARY_MARKER)
    .flatMap(splitNumberedLines)
    .map(cleanTaskText)
    .filter(Boolean)
    .filter((task) => !/^(okay|ok|need to|we need to)$/i.test(task))
    .map((text) => ({ text, repo: inferRepo(text) }));
}

function splitNumberedLines(chunk) {
  const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1) return [chunk];

  const numbered = lines.filter((line) => /^[-*]|\d+[.)]/.test(line));
  if (numbered.length === lines.length) {
    return lines.map((line) => line.replace(/^[-*]\s*|\d+[.)]\s*/, ""));
  }

  return [chunk];
}

function cleanTaskText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/^(okay|ok),?\s+/i, "")
    .replace(/^(we\s+)?need to\s+/i, "")
    .replace(/^(and|also|then|next)\s+/i, "")
    .replace(/^[,.;:\-\s]+|[,.;:\-\s]+$/g, "")
    .trim();
}
