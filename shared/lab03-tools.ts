import { z } from 'zod';
import { lab01FrameSchema, lab01OutcomeSchema, lab01SessionSchema, lab01Source } from './lab01-events.js';

/**
 * Lab 03 wire contract. A tool being *enabled* (present in the session toolset) is separate
 * from a call being *permitted* (its permission_policy plus the host's confirmation).
 */
export const lab03Lesson = { id: 3, title: 'Built-in tools', topic: 'Tools, MCP and skills', serverPrefix: '/api/c3' } as const;

export const toolNames = ['bash', 'read', 'write', 'edit', 'glob', 'grep'] as const;
export type ToolName = (typeof toolNames)[number];
export const policyTypes = ['always_allow', 'always_ask', 'auto'] as const;
export type PolicyType = (typeof policyTypes)[number];
export const lab03Presets = ['read-only', 'unavailable-write', 'denied-write', 'permitted-edit', 'auto'] as const;
export type Lab03Preset = (typeof lab03Presets)[number];
/** Agent SDK options with no Managed Agents field. They are rejected, never translated. */
export const agentSdkOnlyFields = ['allowedTools', 'disallowedTools', 'permissionMode', 'cwd', 'canUseTool'] as const;

/** Container paths. The working directory is /workspace; file resources mount read-only under uploads. */
export const containerRoots = { workspace: '/workspace', uploads: '/mnt/session/uploads', outputs: '/mnt/session/outputs' } as const;
export type ContainerRoot = keyof typeof containerRoots;
export const writableRoots: readonly ContainerRoot[] = ['workspace', 'outputs'];

/** Exact commands the host approves for bash. Everything else is denied. */
export const bashAllowlist = [
  'ls /workspace', 'ls /mnt/session/uploads', 'ls /mnt/session/outputs',
  'cat /mnt/session/uploads/notes.md', 'cat /mnt/session/uploads/draft.md',
  'cp /mnt/session/uploads/draft.md /mnt/session/outputs/draft.md',
] as const;

/** What the host answers when a call pauses for confirmation (always_ask, or auto "indeterminate"). */
export type HostWrite = 'deny' | 'allow-inside';
export interface PresetDefinition {
  label: string; summary: string; defaultPolicy: PolicyType;
  /** Present = enabled with this policy. Absent = not enabled in the session toolset. */
  tools: Partial<Record<ToolName, PolicyType>>;
  host: { write: HostWrite; edit: HostWrite };
  prompt: string;
}
const editPrompt = 'Edit /mnt/session/outputs/draft.md so that the line "Status: draft" becomes "Status: reviewed".';
export const presets: Readonly<Record<Lab03Preset, PresetDefinition>> = Object.freeze({
  'read-only': { label: 'Read-only', summary: 'Only read, glob and grep are enabled. Nothing can change a file.',
    defaultPolicy: 'always_allow', tools: { read: 'always_allow', glob: 'always_allow', grep: 'always_allow' },
    host: { write: 'deny', edit: 'deny' },
    prompt: 'Read /mnt/session/uploads/notes.md, list the Markdown files in /mnt/session/uploads and search them for TODO. Do not change any file.' },
  'unavailable-write': { label: 'Unavailable Write', summary: 'write and edit are not enabled. A write attempt is refused before any policy applies.',
    defaultPolicy: 'always_allow', tools: { read: 'always_allow', glob: 'always_allow', grep: 'always_allow' },
    host: { write: 'deny', edit: 'deny' },
    prompt: 'Read /mnt/session/uploads/notes.md, then use the write tool to create /mnt/session/outputs/draft.md containing "Status: overwritten". Report whether the write worked.' },
  'denied-write': { label: 'Denied Write', summary: 'write is enabled with always_ask; the host answers deny with a deny_message.',
    defaultPolicy: 'always_allow', tools: { read: 'always_allow', write: 'always_ask' },
    host: { write: 'deny', edit: 'deny' },
    prompt: 'Read /mnt/session/uploads/draft.md, then use the write tool to create /mnt/session/outputs/draft.md containing "Status: overwritten". Report whether the write worked.' },
  'permitted-edit': { label: 'Permitted edit', summary: 'edit and bash are enabled with always_ask; the host allows only allowlisted commands and paths inside the fixture.',
    defaultPolicy: 'always_allow', tools: { read: 'always_allow', bash: 'always_ask', edit: 'always_ask' },
    host: { write: 'deny', edit: 'allow-inside' },
    prompt: `Read /mnt/session/uploads/notes.md. The upload is read-only, so first run exactly "cp /mnt/session/uploads/draft.md /mnt/session/outputs/draft.md" with bash. ${editPrompt} Report which tool calls succeeded.` },
  'auto': { label: 'Auto (server-evaluated, not a human checkpoint)', summary: 'The server evaluates read, write and edit calls; bash still needs host confirmation.',
    defaultPolicy: 'auto', tools: { read: 'auto', write: 'auto', edit: 'auto', bash: 'always_ask' },
    host: { write: 'allow-inside', edit: 'allow-inside' },
    prompt: `Read /mnt/session/uploads/notes.md and copy the draft with exactly "cp /mnt/session/uploads/draft.md /mnt/session/outputs/draft.md". ${editPrompt} Report which tool calls succeeded.` },
});

/** The SDK-to-Managed-Agents mapping shown in the UI and the guide. Nothing else is sent. */
export const conceptMapping = [
  { sdk: 'tools (available)', managed: 'agent_toolset_20260401 with default_config.enabled: false and configs[].enabled: true per tool (bash, read, write, edit, glob, grep). web_fetch and web_search are always disabled.' },
  { sdk: 'allowedTools / permission rules', managed: 'Per-tool permission_policy: always_allow, always_ask or auto' },
  { sdk: 'permissionMode', managed: 'default_config.permission_policy' },
  { sdk: 'Host approval (canUseTool)', managed: 'user.tool_confirmation with tool_use_id = the sevt_… event ID, result allow | deny, plus a deny_message' },
  { sdk: 'cwd', managed: 'Container working directory /workspace. Fixtures mount read-only at /mnt/session/uploads/…; outputs go to /mnt/session/outputs/.' },
] as const;

const unique = <T>(values: readonly T[]) => new Set(values).size === values.length;
export const lab03RequestSchema = z.strictObject({
  mode: z.enum(['scripted', 'live']),
  preset: z.enum(lab03Presets),
  prompt: z.string().trim().min(1, 'Enter a prompt.').max(1000, 'Use at most 1000 characters.'),
  deadlineSeconds: z.number().int().min(1).max(120),
  budgetCents: z.number().int().min(1).max(500).optional(),
  /** Student challenge: remove tools from the preset's enabled set. */
  removeTools: z.array(z.enum(toolNames)).max(toolNames.length).refine(unique, 'List each tool once.').default([]),
  /** Offline only: "hang" keeps the fixture agent working so cancel and deadline can be observed. */
  scenario: z.enum(['normal', 'hang']).default('normal'),
}).superRefine((request, ctx) => {
  if (request.mode === 'live' && request.scenario !== 'normal')
    ctx.addIssue({ code: 'custom', path: ['scenario'], message: 'Fixture scenarios are offline only.' });
});
export type Lab03Request = z.input<typeof lab03RequestSchema>;
export type Lab03ParsedRequest = z.infer<typeof lab03RequestSchema>;

const policySchema = z.strictObject({ type: z.enum(policyTypes) });
export const toolsetSchema = z.strictObject({
  type: z.literal('agent_toolset_20260401'),
  default_config: z.strictObject({ enabled: z.literal(false), permission_policy: policySchema }),
  configs: z.array(z.union([
    z.strictObject({ name: z.enum(toolNames), enabled: z.literal(true), permission_policy: policySchema }),
    z.strictObject({ name: z.enum([...toolNames, 'web_fetch', 'web_search']), enabled: z.literal(false) }),
  ])),
});
export type Lab03Toolset = z.infer<typeof toolsetSchema>;

/**
 * Builds exactly what is sent as the session's tools[0]: every tool listed explicitly, only the given
 * ones enabled, web tools always off. Bash is only ever enabled with always_ask.
 */
export function toolsetFrom(defaultPolicy: PolicyType, tools: Partial<Record<ToolName, PolicyType>>,
  removeTools: readonly ToolName[] = []): Lab03Toolset {
  const configs: Lab03Toolset['configs'] = toolNames.map((name) => {
    const policy = tools[name];
    if (!policy || removeTools.includes(name)) return { name, enabled: false as const };
    if (name === 'bash' && policy !== 'always_ask') throw new Error('Bash must use always_ask.');
    return { name, enabled: true as const, permission_policy: { type: policy } };
  });
  configs.push({ name: 'web_fetch', enabled: false }, { name: 'web_search', enabled: false });
  return toolsetSchema.parse({ type: 'agent_toolset_20260401',
    default_config: { enabled: false, permission_policy: { type: defaultPolicy } }, configs });
}
export function buildToolset(preset: Lab03Preset, removeTools: readonly ToolName[] = []): Lab03Toolset {
  return toolsetFrom(presets[preset].defaultPolicy, presets[preset].tools, removeTools);
}
export function enabledTools(toolset: Lab03Toolset): { name: ToolName; policy: PolicyType }[] {
  return toolset.configs.flatMap((config) => config.enabled ? [{ name: config.name, policy: config.permission_policy.type }] : []);
}

/** How one agent.tool_use ended up, derived from the event and the host's answer. */
export const toolStates = ['allowed', 'allowed-by-host', 'awaiting-host', 'denied-by-host', 'denied-by-server', 'unavailable'] as const;
export type ToolState = (typeof toolStates)[number];
export function initialToolState(evaluatedPermission: string | null, evaluationType: string | null): ToolState {
  if (evaluatedPermission === 'allow') return 'allowed';
  if (evaluatedPermission === 'ask') return 'awaiting-host';
  // No evaluation object means no policy applied: the tool is not enabled in this session.
  if (evaluatedPermission === 'deny') return evaluationType ? 'denied-by-server' : 'unavailable';
  return 'allowed'; // Events recorded before evaluated_permission existed ran as always_allow.
}

const text = (max: number) => z.string().max(max);
const id = text(200);
export const lab03FrameSchema = z.discriminatedUnion('kind', [
  ...lab01FrameSchema.options,
  z.strictObject({ seq: z.number().int().positive(), kind: z.literal('tool_use'), id, name: text(60), input: text(4000),
    evaluatedPermission: z.enum(['allow', 'ask', 'deny']).nullable(), evaluationType: text(40).nullable(),
    reasonCode: text(80).nullable(), state: z.enum(toolStates), raw: text(4100).optional() }),
  z.strictObject({ seq: z.number().int().positive(), kind: z.literal('tool_result'), id, toolUseId: id,
    isError: z.boolean(), text: text(4000), raw: text(4100).optional() }),
  z.strictObject({ seq: z.number().int().positive(), kind: z.literal('confirmation'), toolUseId: id, tool: text(60),
    result: z.enum(['allow', 'deny']), reason: text(300), denyMessage: text(300).nullable() }),
]);
export type Lab03Frame = z.infer<typeof lab03FrameSchema>;

export const toolUseRecordSchema = z.strictObject({ id, name: text(60), input: text(4000),
  evaluatedPermission: z.enum(['allow', 'ask', 'deny']).nullable(), evaluationType: text(40).nullable(),
  reasonCode: text(80).nullable(), state: z.enum(toolStates),
  result: z.strictObject({ isError: z.boolean(), text: text(4000) }).nullable() });
export type ToolUseRecord = z.infer<typeof toolUseRecordSchema>;
export const confirmationSchema = z.strictObject({ toolUseId: id, tool: text(60), result: z.enum(['allow', 'deny']),
  reason: text(300), denyMessage: text(300).nullable() });
export type Confirmation = z.infer<typeof confirmationSchema>;
export const denialSchema = z.strictObject({ toolUseId: id, tool: text(60), kind: z.enum(['unavailable', 'denied']),
  by: z.enum(['session-toolset', 'server-auto', 'host']), reason: text(300) });
export type Denial = z.infer<typeof denialSchema>;
export const sandboxFileSchema = z.strictObject({ path: text(200), containerPath: text(200), writable: z.boolean(),
  size: z.number().int().nonnegative(), content: text(16000), truncated: z.boolean() });
export type SandboxFile = z.infer<typeof sandboxFileSchema>;
export const filesResponseSchema = z.strictObject({ sandbox: text(200), files: z.array(sandboxFileSchema).max(50) });

/** Permission denials list. Unavailable (tool not enabled) and denied (policy or host said no) stay distinct. */
export function deriveDenials(toolUses: readonly ToolUseRecord[], confirmations: readonly Confirmation[]): Denial[] {
  return toolUses.flatMap((use): Denial[] => {
    if (use.state === 'unavailable') return [{ toolUseId: use.id, tool: use.name, kind: 'unavailable', by: 'session-toolset',
      reason: `${use.name} is not enabled in this session; no permission policy was evaluated.` }];
    if (use.state === 'denied-by-server') return [{ toolUseId: use.id, tool: use.name, kind: 'denied', by: 'server-auto',
      reason: `auto policy denied the call (${use.reasonCode ?? 'no reason_code'}).` }];
    if (use.state === 'denied-by-host') {
      const answer = confirmations.find((c) => c.toolUseId === use.id);
      return [{ toolUseId: use.id, tool: use.name, kind: 'denied', by: 'host', reason: answer?.reason ?? 'Host denied the call.' }];
    }
    return [];
  });
}

export const lab03ResultSchema = z.strictObject({
  mode: z.enum(['scripted', 'live']), source: lab01Source, requested: lab03RequestSchema,
  toolset: toolsetSchema,
  effectiveTools: z.array(z.strictObject({ name: text(40), enabled: z.boolean(), policy: text(40).nullable() })).nullable(),
  sessionId: z.string().nullable(), session: lab01SessionSchema.nullable(), outcome: lab01OutcomeSchema,
  messages: z.array(z.strictObject({ eventId: z.string(), text: text(16000) })).max(100),
  toolUses: z.array(toolUseRecordSchema).max(100), confirmations: z.array(confirmationSchema).max(20),
  denials: z.array(denialSchema).max(100), files: z.array(sandboxFileSchema).max(50),
  outputs: z.strictObject({ status: z.enum(['applied-offline', 'downloaded', 'none', 'failed', 'not-attempted']), detail: text(400) }),
  uploads: z.enum(['not-needed', 'deleted', 'pending']),
  duplicatesIgnored: z.number().int().nonnegative(), eventCount: z.number().int().nonnegative(),
  interruption: z.enum(['not-needed', 'not-attempted', 'simulated', 'confirmed', 'unconfirmed']),
  cleanup: z.enum(['not-needed', 'simulated', 'archived', 'pending']),
  message: text(800),
});
export type Lab03Result = z.infer<typeof lab03ResultSchema>;
