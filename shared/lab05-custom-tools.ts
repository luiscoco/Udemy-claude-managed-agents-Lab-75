import { z } from 'zod';
import { lab01OutcomeSchema, lab01SessionSchema, lab01Source } from './lab01-events.js';
import { lab03FrameSchema } from './lab03-tools.js';

/**
 * Lab 05 wire contract. The Agent SDK's createSdkMcpServer + tool() become custom tools declared on a
 * persisted agent. The host runs each handler and answers agent.custom_tool_use with user.custom_tool_result.
 */
export const lab05Lesson = { id: 5, title: 'Custom tools', topic: 'Tools, MCP and skills', serverPrefix: '/api/c5' } as const;

/** Agent SDK options with no Managed Agents request field. They are rejected, never translated. */
export const lab05SdkOnlyFields = ['mcpServers', 'allowedTools', 'createSdkMcpServer', 'tools'] as const;
export const taskLimits = { maxTasks: 20, titleMax: 120 } as const;
export const handlerLimits = { minMs: 100, maxMs: 5000, defaultMs: 1000 } as const;

/** The three tool input shapes. They are the only definition: the JSON Schemas below are generated from them. */
export const taskIdSchema = z.string().regex(/^task_\d{1,4}$/, 'Use an ID such as task_1.').describe('Task ID returned by list_tasks or add_task, for example task_1.');
export const toolShapes = {
  list_tasks: z.strictObject({
    status: z.enum(['open', 'done']).optional().describe('Only list tasks with this status. Omit it to list every task.'),
  }),
  add_task: z.strictObject({
    title: z.string().min(1).max(taskLimits.titleMax).regex(/\S/, 'The title must contain a non-space character.').describe('Short task title.'),
    priority: z.enum(['low', 'normal', 'high']).optional().describe('Defaults to normal.'),
  }),
  complete_task: z.strictObject({ id: taskIdSchema }),
} as const;
export type ToolName = keyof typeof toolShapes;
export const toolNames = Object.keys(toolShapes) as ToolName[];
export type ToolInput<N extends ToolName> = z.infer<(typeof toolShapes)[N]>;

const descriptions: Readonly<Record<ToolName, string>> = {
  list_tasks: 'List the tasks in this exercise, optionally filtered by status. Returns JSON with id, title, priority and status for each task.',
  add_task: 'Add one open task. Returns the new task as JSON, including its ID.',
  complete_task: 'Mark one open task as done by ID. Fails if the ID is unknown or the task is already done.',
};

/** JSON Schema for one shape, exactly as declared on the agent: no $schema key, closed objects. */
export function inputSchemaFor(name: ToolName) {
  const { $schema: _dialect, ...schema } = z.toJSONSchema(toolShapes[name], { target: 'draft-2020-12', io: 'input' });
  return schema as { type: 'object'; properties: Record<string, unknown>; required?: string[]; additionalProperties: false };
}
export interface CustomToolDefinition {
  type: 'custom'; name: ToolName; description: string; input_schema: ReturnType<typeof inputSchemaFor>;
}
/** The agent's tools. managed/lab05-agent.json must contain exactly these; a test compares them. */
export const lab05Tools: readonly CustomToolDefinition[] = Object.freeze(toolNames.map((name) => ({
  type: 'custom' as const, name, description: descriptions[name], input_schema: inputSchemaFor(name),
})));

export const conceptMapping = [
  { sdk: 'createSdkMcpServer({ tools })', managed: 'No in-process server. The persisted agent declares tools: [{ type: "custom", name, description, input_schema }].' },
  { sdk: 'tool(name, description, zodShape, handler)', managed: 'The same Zod shape generates input_schema; the handler runs on the host, never in the session container.' },
  { sdk: 'Handler called by the SDK loop', managed: 'agent.custom_tool_use event, then session.status_idle with stop_reason requires_action listing its sevt_ ID.' },
  { sdk: 'Handler return { content, isError }', managed: 'user.custom_tool_result with custom_tool_use_id (the sevt_ ID), content text blocks and is_error.' },
  { sdk: 'Input validated by the SDK', managed: 'The host validates with Zod before any handler runs; a rejection is an is_error result.' },
  { sdk: 'allowedTools: ["mcp__tasks__…"]', managed: 'Custom tools have no permission policy. Which tools exist is fixed on the agent, not per request.' },
] as const;

export const lab05Scenarios = ['tour', 'valid-only', 'slow-handler', 'hang'] as const;
export type Lab05Scenario = (typeof lab05Scenarios)[number];
export const lab05Prompt = 'Use the task tools. List the tasks, add a high-priority task titled "Write the custom tools guide", then complete it. Then try to complete task_99. Finish with a one-line summary of the open tasks.';
/** Student challenge default: add_task with the title missing. */
export const defaultChallengeInput = { priority: 'high' } as const;

export const lab05RequestSchema = z.strictObject({
  mode: z.enum(['scripted', 'live']),
  prompt: z.string().trim().min(1, 'Enter a prompt.').max(1000, 'Use at most 1000 characters.'),
  deadlineSeconds: z.number().int().min(1).max(120),
  handlerTimeoutMs: z.number().int().min(handlerLimits.minMs).max(handlerLimits.maxMs).default(handlerLimits.defaultMs),
  budgetCents: z.number().int().min(1).max(500).optional(),
  /** Offline only: which recorded agent.custom_tool_use sequence the fixture replays. */
  scenario: z.enum(lab05Scenarios).default('tour'),
  /** Offline only: the malformed add_task input the tour sends (student challenge). */
  challengeInput: z.record(z.string(), z.unknown())
    .refine((value) => JSON.stringify(value).length <= 400, 'Keep the challenge input under 400 characters of JSON.').optional(),
}).superRefine((request, ctx) => {
  if (request.mode === 'live' && request.scenario !== 'tour')
    ctx.addIssue({ code: 'custom', path: ['scenario'], message: 'Fixture scenarios are offline only.' });
  if (request.mode === 'live' && request.challengeInput !== undefined)
    ctx.addIssue({ code: 'custom', path: ['challengeInput'], message: 'The challenge input is replayed by the offline fixture only.' });
});
export type Lab05Request = z.input<typeof lab05RequestSchema>;
export type Lab05ParsedRequest = z.infer<typeof lab05RequestSchema>;

const text = (max: number) => z.string().max(max);
export const taskSchema = z.strictObject({ id: text(20), title: text(taskLimits.titleMax), priority: z.enum(['low', 'normal', 'high']),
  status: z.enum(['open', 'done']) });
export type Task = z.infer<typeof taskSchema>;
export const handlerCallsSchema = z.strictObject({ list_tasks: z.number().int().nonnegative(), add_task: z.number().int().nonnegative(),
  complete_task: z.number().int().nonnegative() });
export type HandlerCalls = z.infer<typeof handlerCallsSchema>;

/** How the host answered one agent.custom_tool_use. */
export const callOutcomes = ['ok', 'tool-error', 'rejected', 'unknown-tool', 'timeout', 'not-seen'] as const;
export const customCallSchema = z.strictObject({
  id: text(200), name: text(128), rawInput: text(2000),
  validation: z.strictObject({ ok: z.boolean(), issues: z.array(z.strictObject({ path: text(100), message: text(300) })).max(20) }),
  handlerRan: z.boolean(), outcome: z.enum(callOutcomes),
  result: z.strictObject({ isError: z.boolean(), text: text(4000) }),
  before: z.array(taskSchema).max(taskLimits.maxTasks), after: z.array(taskSchema).max(taskLimits.maxTasks),
  durationMs: z.number().int().nonnegative(),
});
export type CustomCall = z.infer<typeof customCallSchema>;

const seq = { seq: z.number().int().positive() };
export const lab05FrameSchema = z.discriminatedUnion('kind', [
  ...lab03FrameSchema.options,
  z.strictObject({ ...seq, kind: z.literal('run'), runId: z.uuid(), tools: z.array(text(128)).max(10) }),
  z.strictObject({ ...seq, kind: z.literal('custom_call'), call: customCallSchema }),
]);
export type Lab05Frame = z.infer<typeof lab05FrameSchema>;

export const tasksResponseSchema = z.strictObject({ runId: z.uuid(), active: z.boolean(), tasks: z.array(taskSchema).max(taskLimits.maxTasks),
  handlerCalls: handlerCallsSchema });
export type TasksResponse = z.infer<typeof tasksResponseSchema>;

export const lab05ResultSchema = z.strictObject({
  mode: z.enum(['scripted', 'live']), source: lab01Source, requested: lab05RequestSchema, runId: z.uuid(),
  /** Tool names the created session reports; null offline before creation or when creation failed. */
  sessionTools: z.array(z.strictObject({ name: text(128), type: text(40) })).max(10).nullable(),
  sessionId: z.string().nullable(), session: lab01SessionSchema.nullable(), outcome: lab01OutcomeSchema,
  messages: z.array(z.strictObject({ eventId: z.string(), text: text(16000) })).max(100),
  calls: z.array(customCallSchema).max(40), resultsSent: z.number().int().nonnegative(),
  tasks: z.strictObject({ initial: z.array(taskSchema).max(taskLimits.maxTasks), final: z.array(taskSchema).max(taskLimits.maxTasks) }),
  handlerCalls: handlerCallsSchema,
  duplicatesIgnored: z.number().int().nonnegative(), eventCount: z.number().int().nonnegative(),
  interruption: z.enum(['not-needed', 'not-attempted', 'simulated', 'confirmed', 'unconfirmed']),
  cleanup: z.enum(['not-needed', 'simulated', 'archived', 'pending']),
  message: text(800),
});
export type Lab05Result = z.infer<typeof lab05ResultSchema>;
