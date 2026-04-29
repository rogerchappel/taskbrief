import { normalizeTask } from "./normalizeTask.js";
import { splitTasks } from "./splitTasks.js";

export function parseBrainDump(input, options = {}) {
  const workspace = options.workspace ?? "default";
  const rawTasks = splitTasks(input);
  let previousKnownRepo = null;
  const tasks = rawTasks.map((task, index) => {
    const taskWithContext = { ...task };

    if (taskWithContext.repo !== "unknown") {
      previousKnownRepo = taskWithContext.repo;
    } else if (previousKnownRepo && isFollowOnRepoTask(taskWithContext.text)) {
      taskWithContext.repo = previousKnownRepo;
    }

    return normalizeTask(taskWithContext, index);
  });

  return {
    version: "0.1",
    source: "taskbrief",
    workspace,
    tasks: withUniqueIdentifiers(tasks),
  };
}

function isFollowOnRepoTask(text) {
  return /\b(deploy|docs?|documentation|release|npm|publish|package)\b/i.test(text);
}

function withUniqueIdentifiers(tasks) {
  const usedIds = new Set();
  const usedBranches = new Set();

  return tasks.map((task) => ({
    ...task,
    id: allocateUnique(task.id, usedIds),
    branch: allocateUnique(task.branch, usedBranches),
  }));
}

function allocateUnique(value, used) {
  if (!used.has(value)) {
    used.add(value);
    return value;
  }

  let suffix = 2;
  let candidate = `${value}-${suffix}`;
  while (used.has(candidate)) {
    suffix += 1;
    candidate = `${value}-${suffix}`;
  }

  used.add(candidate);
  return candidate;
}
