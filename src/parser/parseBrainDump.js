import { buildTaskQueue } from "./taskQueue.js";
import { splitTasks } from "./splitTasks.js";

export function parseBrainDump(input, options = {}) {
  const workspace = options.workspace ?? "default";
  const rawTasks = splitTasks(input);
  let previousKnownRepo = null;
  const tasks = rawTasks.map((task) => {
    const taskWithContext = { ...task };

    if (taskWithContext.repo !== "unknown") {
      previousKnownRepo = taskWithContext.repo;
    } else if (previousKnownRepo && isFollowOnRepoTask(taskWithContext.text)) {
      taskWithContext.repo = previousKnownRepo;
    }

    return taskWithContext;
  });

  return buildTaskQueue(tasks, { workspace });
}

function isFollowOnRepoTask(text) {
  return /\b(deploy|docs?|documentation|release|npm|publish|package)\b/i.test(text);
}

