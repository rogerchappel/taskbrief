export function renderJson(queueOrTasks) {
  const queue = Array.isArray(queueOrTasks) ? { tasks: queueOrTasks } : queueOrTasks;
  return `${JSON.stringify(queue, null, 2)}\n`;
}
