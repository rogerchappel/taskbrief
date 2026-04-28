export function renderMarkdown(queueOrTasks) {
  const tasks = Array.isArray(queueOrTasks) ? queueOrTasks : queueOrTasks.tasks ?? [];
  return `${tasks.map(renderTaskMarkdown).join("\n\n---\n\n")}\n`;
}

export function renderTaskMarkdown(task) {
  return [
    `# Task Brief: ${task.title}`,
    "",
    "## Objective",
    "",
    task.objective,
    "",
    "## Repository",
    "",
    task.repo,
    "",
    "## Suggested Branch",
    "",
    task.branch,
    "",
    "## Task Type",
    "",
    task.type,
    "",
    "## Risk Level",
    "",
    capitalize(task.risk),
    "",
    "## Context",
    "",
    task.context,
    "",
    "## Allowed Paths",
    "",
    renderList(task.allowed_paths),
    "",
    "## Forbidden Paths",
    "",
    renderList(task.forbidden_paths),
    "",
    "## Expected Commits",
    "",
    renderList(task.expected_commits),
    "",
    "## Verification",
    "",
    renderList(task.verification),
    "",
    "## Stop Conditions",
    "",
    renderList(task.stop_conditions),
    "",
    "## Review Pack Required",
    "",
    task.review_pack_required ? "Yes." : "No.",
    "",
    "## Human Decision Needed",
    "",
    renderList(task.human_decision_needed),
    "",
    "## Agent Prompt",
    "",
    task.agent_prompt,
  ].join("\n");
}

function renderList(values = []) {
  return values.length > 0 ? values.map((value) => `- ${value}`).join("\n") : "- None";
}

function capitalize(value) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "";
}
