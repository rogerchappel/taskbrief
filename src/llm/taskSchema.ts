import { z } from "zod";

export const taskbriefTaskSchema = z
  .object({
    id: z.string().min(1).optional(),
    title: z.string().min(1),
    repo: z.string().min(1),
    branch: z.string().min(1).optional(),
    type: z.string().min(1),
    risk: z.enum(["low", "medium", "high"]),
    objective: z.string().min(1),
    context: z.string().min(1),
    allowed_paths: z.array(z.string().min(1)),
    forbidden_paths: z.array(z.string().min(1)),
    verification: z.array(z.string().min(1)),
    stop_conditions: z.array(z.string().min(1)),
    expected_commits: z.array(z.string().min(1)),
    review_pack_required: z.boolean(),
    human_decision_needed: z.array(z.string().min(1)),
    agent_prompt: z.string().min(1),
  })
  .strict();

export const taskbriefTaskQueueSchema = z
  .object({
    tasks: z.array(taskbriefTaskSchema).min(1),
  })
  .strict();

export type TaskbriefLlmTask = z.infer<typeof taskbriefTaskSchema>;
export type TaskbriefLlmTaskQueue = z.infer<typeof taskbriefTaskQueueSchema>;
