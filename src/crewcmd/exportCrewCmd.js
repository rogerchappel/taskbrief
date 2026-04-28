export function exportCrewCmd(queueOrTasks, options = {}) {
  const queue = Array.isArray(queueOrTasks) ? { tasks: queueOrTasks } : queueOrTasks;
  const tasks = queue.tasks ?? [];

  return {
    version: options.version ?? queue.version ?? "0.1",
    source: "taskbrief",
    workspace: options.workspace ?? queue.workspace ?? "default",
    tasks: tasks.map(toCrewCmdTask),
  };
}

export function toCrewCmdTask(task) {
  return {
    id: task.id,
    repo: task.repo,
    branch: task.branch,
    type: task.type,
    risk: task.risk,
    objective: task.objective,
    allowedPaths: task.allowed_paths ?? [],
    forbiddenPaths: task.forbidden_paths ?? [],
    verification: task.verification ?? [],
    stopConditions: task.stop_conditions ?? [],
    reviewPackRequired: task.review_pack_required ?? true,
    requiresHumanApproval: requiresHumanApproval(task),
  };
}

export function requiresHumanApproval(task) {
  if (task.requires_human_approval === true) return true;
  if (task.risk === "high" || task.risk === "medium") return true;
  return (task.human_decision_needed ?? []).length > 0;
}
