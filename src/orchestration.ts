export interface TaskbriefTask {
  id: string;
  title: string;
  repo: string;
  branch: string;
  type: string;
  risk: "low" | "medium" | "high" | string;
  objective: string;
  context: string;
  allowed_paths: string[];
  forbidden_paths: string[];
  verification: string[];
  stop_conditions: string[];
  expected_commits: string[];
  review_pack_required: boolean;
  human_decision_needed: string[];
  agent_prompt: string;
}

export interface TaskbriefQueue {
  version?: string;
  source?: string;
  workspace?: string;
  tasks?: TaskbriefTask[];
}

export interface OrchestrationTask {
  id: string;
  title: string;
  repo: string;
  branch: string;
  type: string;
  risk: string;
  phase: OrchestrationPhase;
  depends_on: string[];
  can_run_concurrently_with: string[];
  dispatchable: boolean;
  blocked_by: string[];
  verification: string[];
}

export interface OrchestrationWave {
  wave: number;
  name: string;
  mode: "concurrent" | "sequential";
  dispatch: "now" | "after_dependencies" | "after_human_decision";
  task_ids: string[];
}

export interface OrchestrationHandoff {
  version: "0.1";
  source: "taskbrief-orchestration";
  workspace: string;
  repo: string;
  generated_from: string;
  summary: {
    total_tasks: number;
    dispatchable_now: string[];
    blocked_tasks: string[];
    final_validation_task_ids: string[];
  };
  waves: OrchestrationWave[];
  tasks: OrchestrationTask[];
  dispatch_prompt: string;
}

type OrchestrationPhase = "foundation" | "implementation" | "verification" | "documentation" | "final_validation";

const PHASE_NAMES: Record<OrchestrationPhase, string> = {
  foundation: "Foundation / setup",
  implementation: "Implementation",
  verification: "Verification / tests",
  documentation: "Documentation / examples",
  final_validation: "Final validation / release readiness",
};

const PHASE_ORDER: OrchestrationPhase[] = [
  "foundation",
  "implementation",
  "verification",
  "documentation",
  "final_validation",
];

export function buildOrchestrationHandoff(queue: TaskbriefQueue, options: { generatedFrom?: string } = {}): OrchestrationHandoff {
  const tasks = queue.tasks ?? [];
  const workspace = queue.workspace ?? "default";
  const repo = inferPrimaryRepo(tasks);
  const phaseBuckets = new Map<OrchestrationPhase, TaskbriefTask[]>();

  for (const phase of PHASE_ORDER) phaseBuckets.set(phase, []);
  for (const task of tasks) phaseBuckets.get(classifyPhase(task))?.push(task);

  const priorTaskIds: string[] = [];
  const orchestrationTasks: OrchestrationTask[] = [];
  const waves: OrchestrationWave[] = [];

  for (const phase of PHASE_ORDER) {
    const phaseTasks = phaseBuckets.get(phase) ?? [];
    if (phaseTasks.length === 0) continue;

    const taskIds = phaseTasks.map((task) => task.id);
    const blockedTaskIds = phaseTasks.filter(isBlocked).map((task) => task.id);
    const dispatchableTaskIds = phaseTasks.filter((task) => !isBlocked(task)).map((task) => task.id);
    const dependsOn = phase === "foundation" ? [] : [...priorTaskIds];

    for (const task of phaseTasks) {
      orchestrationTasks.push({
        id: task.id,
        title: task.title,
        repo: task.repo,
        branch: task.branch,
        type: task.type,
        risk: task.risk,
        phase,
        depends_on: dependsOn,
        can_run_concurrently_with: taskIds.filter((id) => id !== task.id),
        dispatchable: dependsOn.length === 0 && !isBlocked(task),
        blocked_by: blockersFor(task),
        verification: task.verification,
      });
    }

    waves.push({
      wave: waves.length + 1,
      name: PHASE_NAMES[phase],
      mode: phaseTasks.length > 1 ? "concurrent" : "sequential",
      dispatch: blockedTaskIds.length === taskIds.length ? "after_human_decision" : dependsOn.length === 0 ? "now" : "after_dependencies",
      task_ids: blockedTaskIds.length === taskIds.length ? taskIds : dispatchableTaskIds,
    });

    priorTaskIds.push(...taskIds);
  }

  const dispatchableNow = orchestrationTasks.filter((task) => task.dispatchable).map((task) => task.id);
  const blockedTasks = orchestrationTasks.filter((task) => task.blocked_by.length > 0).map((task) => task.id);
  const finalValidationTaskIds = orchestrationTasks
    .filter((task) => task.phase === "final_validation")
    .map((task) => task.id);

  return {
    version: "0.1",
    source: "taskbrief-orchestration",
    workspace,
    repo,
    generated_from: options.generatedFrom ?? queue.source ?? "taskbrief",
    summary: {
      total_tasks: tasks.length,
      dispatchable_now: dispatchableNow,
      blocked_tasks: blockedTasks,
      final_validation_task_ids: finalValidationTaskIds,
    },
    waves,
    tasks: orchestrationTasks,
    dispatch_prompt: buildDispatchPrompt(dispatchableNow, waves),
  };
}

export function renderOrchestrationMarkdown(handoff: OrchestrationHandoff): string {
  return [
    "# Orchestration Handoff",
    "",
    "## Summary",
    "",
    `- Workspace: ${handoff.workspace}`,
    `- Repository: ${handoff.repo}`,
    `- Source: ${handoff.generated_from}`,
    `- Total tasks: ${handoff.summary.total_tasks}`,
    `- Dispatch now: ${handoff.summary.dispatchable_now.length > 0 ? handoff.summary.dispatchable_now.join(", ") : "None"}`,
    `- Blocked tasks: ${handoff.summary.blocked_tasks.length > 0 ? handoff.summary.blocked_tasks.join(", ") : "None"}`,
    "",
    "## Dispatch Prompt",
    "",
    handoff.dispatch_prompt,
    "",
    "## Sequential Waves",
    "",
    ...handoff.waves.flatMap((wave) => [
      `### Wave ${wave.wave}: ${wave.name}`,
      "",
      `- Mode inside wave: ${wave.mode}`,
      `- Dispatch: ${wave.dispatch}`,
      `- Tasks: ${wave.task_ids.length > 0 ? wave.task_ids.join(", ") : "None"}`,
      "",
    ]),
    "## Task Dependencies",
    "",
    ...handoff.tasks.flatMap((task) => [
      `### ${task.id}: ${task.title}`,
      "",
      `- Phase: ${task.phase}`,
      `- Repo: ${task.repo}`,
      `- Branch: ${task.branch}`,
      `- Risk: ${task.risk}`,
      `- Depends on: ${task.depends_on.length > 0 ? task.depends_on.join(", ") : "None"}`,
      `- Can run concurrently with: ${task.can_run_concurrently_with.length > 0 ? task.can_run_concurrently_with.join(", ") : "None"}`,
      `- Dispatchable now: ${task.dispatchable ? "Yes" : "No"}`,
      `- Blocked by: ${task.blocked_by.length > 0 ? task.blocked_by.join("; ") : "None"}`,
      "",
    ]),
  ].join("\n");
}

function classifyPhase(task: TaskbriefTask): OrchestrationPhase {
  const title = task.title;
  const titleAndType = `${task.title} ${task.type}`;
  const titleTypeObjective = `${task.title} ${task.type} ${task.objective}`;

  if (/final|closeout|release readiness|handoff|smoke/i.test(titleAndType)) return "final_validation";
  if (/run safe checks in order|run checks in order|lint,? typecheck,? test,? build|final validation/i.test(title)) return "final_validation";
  if (/readme|docs?|documentation|example|github actions|workflow/i.test(titleAndType)) return "documentation";
  if (/\btests?\b|\btesting\b|fixture|schema|\bqa\b|verify|verification/i.test(titleAndType)) return "verification";
  if (/config|setup|scaffold|init|model|dependency|dependencies|package manager|detect available scripts|cli flag/i.test(titleTypeObjective)) return "foundation";
  return "implementation";
}

function inferPrimaryRepo(tasks: TaskbriefTask[]): string {
  const counts = new Map<string, number>();
  for (const task of tasks) counts.set(task.repo, (counts.get(task.repo) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";
}

function isBlocked(task: TaskbriefTask): boolean {
  return blockersFor(task).length > 0;
}

function blockersFor(task: TaskbriefTask): string[] {
  const blockers = new Set<string>();
  for (const decision of task.human_decision_needed ?? []) {
    if (!decision || decision.toLowerCase() === "none") continue;
    if (/approve medium-risk implementation plan/i.test(decision)) continue;
    blockers.add(decision);
  }
  if (task.risk === "high") blockers.add("approve high-risk scope before dispatch");
  return [...blockers];
}

function buildDispatchPrompt(dispatchableNow: string[], waves: OrchestrationWave[]): string {
  if (dispatchableNow.length === 0) {
    return "No tasks are safe to dispatch yet. Resolve the blocked tasks or human decisions first, then dispatch the first unblocked wave.";
  }

  const firstWave = waves.find((wave) => wave.dispatch === "now");
  const taskList = dispatchableNow.map((id) => `- ${id}`).join("\n");
  return [
    `Dispatch Wave ${firstWave?.wave ?? 1} first. These tasks may run concurrently:`,
    taskList,
    "Wait for the whole wave to finish and pass verification before dispatching the next sequential wave.",
  ].join("\n");
}
