import { z } from 'zod';

export const lab08Lesson = { id: 8, title: 'Delegation and session threads', topic: 'Multi agent systems', serverPrefix: '/api/c8' } as const;
export const lab08Prompt = 'Delegate fixture research, review the proposed change, and calculate 21 + 21.';
export const lab08Scenarios = ['normal', 'duplicate-events', 'cross-posted-call', 'wrong-role', 'hang'] as const;
export type Lab08Scenario = (typeof lab08Scenarios)[number];
export const lab08Roles = ['researcher', 'reviewer', 'calculator'] as const;
export type Lab08Role = (typeof lab08Roles)[number];
export const lab08SdkOnlyFields = ['agents', 'Agent', 'parent_tool_use_id'] as const;

export const lab08RequestSchema = z.strictObject({
  mode: z.enum(['scripted', 'live']), prompt: z.string().trim().min(1).max(1200), scenario: z.enum(lab08Scenarios).default('normal'),
  deadlineSeconds: z.number().int().min(1).max(120), budgetCents: z.number().int().min(1).max(500).optional(),
}).superRefine((value, ctx) => { if (value.mode === 'live' && value.scenario !== 'normal') ctx.addIssue({ code: 'custom', path: ['scenario'], message: 'Fixture scenarios are offline only.' }); });
export type Lab08Request = z.input<typeof lab08RequestSchema>;
export type Lab08ParsedRequest = z.infer<typeof lab08RequestSchema>;

const short = z.string().max(2000);
export const lab08AgentSchema = z.strictObject({ role: z.enum(lab08Roles), name: short, model: short, tools: z.array(short).max(10), restriction: short });
export type Lab08Agent = z.infer<typeof lab08AgentSchema>;
export const lab08ThreadSchema = z.strictObject({ threadId: short, role: z.enum(['parent', ...lab08Roles]), agentName: short,
  status: z.enum(['created', 'running', 'idle', 'terminated', 'stopped']), history: z.array(z.strictObject({ id: short, direction: z.enum(['sent', 'received', 'report']), text: z.string().max(8000) })).max(30) });
export type Lab08Thread = z.infer<typeof lab08ThreadSchema>;
export const lab08EffectSchema = z.strictObject({ id: short, threadId: short, role: z.enum(lab08Roles), action: short,
  decision: z.enum(['allowed', 'denied']), handlerRan: z.boolean(), effect: short });
export type Lab08Effect = z.infer<typeof lab08EffectSchema>;
export const lab08FrameSchema = z.discriminatedUnion('kind', [
  z.strictObject({ seq: z.number().int().positive(), kind: z.literal('thread'), thread: lab08ThreadSchema }),
  z.strictObject({ seq: z.number().int().positive(), kind: z.literal('effect'), effect: lab08EffectSchema }),
  z.strictObject({ seq: z.number().int().positive(), kind: z.literal('state'), state: z.enum(['delegated', 'report-received', 'verified']), detail: short }),
]);
export type Lab08Frame = z.infer<typeof lab08FrameSchema>;
export const lab08ResultSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), source: z.enum(['authored-fixture', 'managed-api']), runId: z.uuid(),
  sessionId: short.nullable(), requested: lab08RequestSchema, agents: z.array(lab08AgentSchema).length(3), threads: z.array(lab08ThreadSchema).min(1).max(10),
  effects: z.array(lab08EffectSchema).max(20), states: z.array(z.enum(['delegated', 'report-received', 'verified'])), duplicatesIgnored: z.number().int().nonnegative(),
  outcome: z.enum(['completed', 'cancelled', 'incomplete']), interruption: z.enum(['not-needed', 'simulated', 'confirmed', 'unconfirmed']), message: z.string().max(1200) });
export type Lab08Result = z.infer<typeof lab08ResultSchema>;
export const lab08AgentsResponseSchema = z.strictObject({ agents: z.array(lab08AgentSchema).length(3), liveAgent: z.strictObject({ envVar: short, configured: z.boolean() }),
  configuration: z.strictObject({ type: z.literal('multiagent_20261001'), inlineAgents: z.literal('disabled'), workflows: z.literal('disabled') }) });

export const lab08Agents: readonly Lab08Agent[] = Object.freeze([
  { role: 'researcher', name: 'fixture-researcher', model: 'account MANAGED_MODEL at provisioning', tools: ['read_fixture'], restriction: 'May read only /workspace/research.md.' },
  { role: 'reviewer', name: 'change-reviewer', model: 'account MANAGED_MODEL at provisioning', tools: ['propose_write'], restriction: 'All write requests are denied by the host for this exercise.' },
  { role: 'calculator', name: 'verified-calculator', model: 'account MANAGED_MODEL at provisioning', tools: ['add_numbers'], restriction: 'May add two bounded finite numbers; the host recomputes the result.' },
]);
