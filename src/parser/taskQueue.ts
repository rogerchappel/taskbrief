// @ts-expect-error Existing JavaScript modules do not publish local declarations yet.
import { normalizeTask } from "./normalizeTask.js";

export interface BuildTaskQueueOptions {
  workspace?: string;
  source?: string;
}

export function buildTaskQueue(rawTasks: any[], options: BuildTaskQueueOptions = {}) {
  const workspace = options.workspace ?? "default";
  const source = options.source ?? "taskbrief";
  const tasks = rawTasks.map((task, index) => normalizeTask(task, index));

  return {
    version: "0.1",
    source,
    workspace,
    tasks: withUniqueIdentifiers(tasks),
  };
}

export function withUniqueIdentifiers(tasks: any[]) {
  const usedIds = new Set<string>();
  const usedBranches = new Set<string>();

  return tasks.map((task) => ({
    ...task,
    id: allocateUnique(task.id, usedIds),
    branch: allocateUnique(task.branch, usedBranches),
  }));
}

function allocateUnique(value: string, used: Set<string>) {
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
