import { z } from 'zod';
import { lab01OutcomeSchema, lab01SessionSchema, lab01Source } from './lab01-events.js';
import { confirmationSchema, denialSchema, lab03FrameSchema, sandboxFileSchema, toolsetFrom, toolsetSchema, toolUseRecordSchema } from './lab03-tools.js';

/**
 * Lab 04 wire contract. The Agent SDK's canUseTool becomes a host reviewer for requires_action pauses,
 * answered with user.tool_confirmation keyed by the sevt_ event ID.
 */
export const lab04Lesson = { id: 4, title: 'Permissions', topic: 'Permissions and security', serverPrefix: '/api/c4' } as const;

/** Agent SDK permission options with no Managed Agents field. They are rejected, never translated. */
export const lab04SdkOnlyFields = ['canUseTool', 'allowedTools', 'permissionMode', 'updatedInput', 'behavior'] as const;
export const approvalExpiredMessage = 'Approval expired; the reviewer did not answer.';
export const approvalLimits = { minSeconds: 5, maxSeconds: 120, defaultSeconds: 30, maxPendingPerRun: 8, maxPendingTotal: 64 } as const;

/** read and glob never pause; write and edit always wait for the reviewer. */
export const lab04Toolset = toolsetFrom('always_allow', { read: 'always_allow', glob: 'always_allow', write: 'always_ask', edit: 'always_ask' });
export const lab04Scenarios = ['review', 'preallowed-only'] as const;
export const lab04Prompt = 'Read /mnt/session/uploads/notes.md. Use the write tool to create /mnt/session/outputs/draft.md with exactly the contents of /mnt/session/uploads/draft.md. Then use one edit to change "Status: draft" to "Status: reviewed", and a second edit to change "Reviewer notes are in notes.md." to "Approved by the reviewer.". If a tool call is denied, do not retry it; report the deny message.';

export const conceptMapping = [
  { sdk: 'canUseTool(toolName, input)', managed: 'Host handler for a requires_action pause; it reads the matching agent.tool_use (name, input, evaluated_permission: "ask")' },
  { sdk: '{ behavior: "allow" }', managed: 'user.tool_confirmation with result: "allow"' },
  { sdk: '{ behavior: "deny", message }', managed: 'user.tool_confirmation with result: "deny" and deny_message; the agent receives it as an error tool result' },
  { sdk: 'updatedInput', managed: 'No equivalent. A confirmation cannot change the input. The host can only allow the call as requested, or deny it with a deny_message that suggests a correction.' },
  { sdk: 'Preallowed tools (allowedTools)', managed: 'Tools with always_allow never pause, so they never reach the reviewer. auto calls the server allows or denies don\'t reach it either.' },
  { sdk: 'Tool use ID', managed: 'The sevt_… ID of the agent.tool_use event, not a toolu_… ID' },
] as const;

export const lab04RequestSchema = z.strictObject({
  mode: z.enum(['scripted', 'live']),
  prompt: z.string().trim().min(1, 'Enter a prompt.').max(1000, 'Use at most 1000 characters.'),
  deadlineSeconds: z.number().int().min(1).max(120),
  approvalSeconds: z.number().int().min(approvalLimits.minSeconds).max(approvalLimits.maxSeconds).default(approvalLimits.defaultSeconds),
  budgetCents: z.number().int().min(1).max(500).optional(),
  /** Offline only: "preallowed-only" makes calls that never pause, so nothing reaches the reviewer. */
  scenario: z.enum(lab04Scenarios).default('review'),
}).superRefine((request, ctx) => {
  if (request.mode === 'live' && request.scenario !== 'review')
    ctx.addIssue({ code: 'custom', path: ['scenario'], message: 'Fixture scenarios are offline only.' });
});
export type Lab04Request = z.input<typeof lab04RequestSchema>;
export type Lab04ParsedRequest = z.infer<typeof lab04RequestSchema>;

export const lab04DecisionSchema = z.strictObject({
  runId: z.uuid(),
  toolUseId: z.string().min(1).max(200),
  decisionToken: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/),
  decision: z.enum(['allow', 'deny']),
  denyMessage: z.string().trim().min(1).max(300).optional(),
}).superRefine((value, ctx) => {
  if (value.decision === 'allow' && value.denyMessage !== undefined)
    ctx.addIssue({ code: 'custom', path: ['denyMessage'], message: 'A deny message only goes with deny.' });
});
export type Lab04Decision = z.infer<typeof lab04DecisionSchema>;

export const decidedBySchema = z.enum(['reviewer', 'expiry', 'host-limit', 'cancellation']);
export const decisionLogSchema = z.strictObject({
  toolUseId: z.string().max(200), tool: z.string().max(60), decision: z.enum(['allow', 'deny', 'abandoned']),
  decidedBy: decidedBySchema, denyMessage: z.string().max(300).nullable(), latencyMs: z.number().int().nonnegative(),
  confirmationSent: z.boolean(),
});
export type DecisionLogEntry = z.infer<typeof decisionLogSchema>;

const seq = { seq: z.number().int().positive() };
export const lab04FrameSchema = z.discriminatedUnion('kind', [
  ...lab03FrameSchema.options,
  z.strictObject({ ...seq, kind: z.literal('run'), runId: z.uuid(), decisionToken: z.string().max(128), approvalSeconds: z.number().int() }),
  z.strictObject({ ...seq, kind: z.literal('review'), toolUseId: z.string().max(200), tool: z.string().max(60), input: z.string().max(2000),
    containerPath: z.string().max(200).nullable(), guard: z.strictObject({ ok: z.boolean(), reason: z.string().max(300) }), expiresAt: z.iso.datetime() }),
  z.strictObject({ ...seq, kind: z.literal('decision'), entry: decisionLogSchema }),
  z.strictObject({ ...seq, kind: z.literal('expired'), toolUseId: z.string().max(200), tool: z.string().max(60) }),
]);
export type Lab04Frame = z.infer<typeof lab04FrameSchema>;

export const lab04ResultSchema = z.strictObject({
  mode: z.enum(['scripted', 'live']), source: lab01Source, requested: lab04RequestSchema, runId: z.uuid(),
  toolset: toolsetSchema,
  effectiveTools: z.array(z.strictObject({ name: z.string().max(40), enabled: z.boolean(), policy: z.string().max(40).nullable() })).nullable(),
  sessionId: z.string().nullable(), session: lab01SessionSchema.nullable(), outcome: lab01OutcomeSchema,
  messages: z.array(z.strictObject({ eventId: z.string(), text: z.string().max(16000) })).max(100),
  toolUses: z.array(toolUseRecordSchema).max(100), confirmations: z.array(confirmationSchema).max(20),
  decisions: z.array(decisionLogSchema).max(40), denials: z.array(denialSchema).max(100), files: z.array(sandboxFileSchema).max(50),
  outputs: z.strictObject({ status: z.enum(['applied-offline', 'downloaded', 'none', 'failed', 'not-attempted']), detail: z.string().max(400) }),
  uploads: z.enum(['not-needed', 'deleted', 'pending']),
  duplicatesIgnored: z.number().int().nonnegative(), eventCount: z.number().int().nonnegative(),
  interruption: z.enum(['not-needed', 'not-attempted', 'simulated', 'confirmed', 'unconfirmed']),
  cleanup: z.enum(['not-needed', 'simulated', 'archived', 'pending']),
  message: z.string().max(800),
});
export type Lab04Result = z.infer<typeof lab04ResultSchema>;
