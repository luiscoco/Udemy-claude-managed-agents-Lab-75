import { z } from 'zod';

export const lab12Lesson = { id: 12, title: 'Multiple messages in one session', topic: 'Sessions and context', serverPrefix: '/api/c12' } as const;
export const lab12Scenarios = ['normal', 'slow', 'hang', 'error', 'duplicate-events', 'stream-ended', 'interrupt-unconfirmed'] as const;
export const lab12Models = ['claude-sonnet-5-5', 'claude-opus-5-5'] as const;
export const lab12CreateSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), deadlineSeconds: z.number().int().min(1).max(120).default(30), budgetCents: z.number().int().min(1).max(500).default(50) });
export type Lab12Input = z.infer<typeof lab12CreateSchema>;
export const lab12ImageSchema = z.strictObject({ media_type: z.literal('image/png'), data: z.string().min(1).max(5500).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/) }).refine(image => {
  try {
    const bytes = Uint8Array.from(atob(image.data), c => c.charCodeAt(0));
    if (bytes.length < 45 || bytes.length > 4096 || btoa(String.fromCharCode(...bytes)) !== image.data) return false;
    const view = new DataView(bytes.buffer);
    return bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10' && view.getUint32(8) === 13 &&
      String.fromCharCode(...bytes.slice(12, 16)) === 'IHDR' && view.getUint32(16) > 0 && view.getUint32(16) <= 256 &&
      view.getUint32(20) > 0 && view.getUint32(20) <= 256 && String.fromCharCode(...bytes.slice(-8, -4)) === 'IEND';
  } catch { return false; }
}, 'Use a base64 PNG of at most 4 KiB and 256 × 256 pixels.');
export const lab12MessageSchema = z.strictObject({ commandId: z.uuid(), text: z.string().trim().min(1).max(1000), image: lab12ImageSchema.optional(), scenario: z.enum(lab12Scenarios).default('normal') });
export type Lab12Message = z.infer<typeof lab12MessageSchema>;
export const lab12ControlSchema = z.strictObject({ runId: z.uuid() });
export const lab12SendSchema = lab12MessageSchema.extend({ runId: z.uuid() });
export const lab12ScriptSchema = lab12ControlSchema.extend({ messages: z.array(lab12MessageSchema).min(1).max(3) });
export const lab12ToolsSchema = lab12ControlSchema.extend({ preset: z.enum(['none', 'read-only']) });
export const lab12ContextSchema = lab12ControlSchema.extend({ text: z.string().trim().min(1).max(1000) });
export const lab12ModelSchema = lab12ControlSchema.extend({ model: z.enum(lab12Models), effort: z.enum(['low', 'medium', 'high']), context: z.string().trim().min(1).max(1000) });
export const lab12CommandSchema = z.strictObject({ commandId: z.uuid(), text: z.string(), hasImage: z.boolean(), state: z.enum(['admitted', 'submitting', 'accepted', 'completed', 'failed', 'cancelled']),
  userEventId: z.string().nullable(), agentEventIds: z.array(z.string()).max(100), output: z.string().max(16000), outputTruncated: z.boolean(), outcome: z.string().max(300), admittedAt: z.string(), startedAt: z.string().nullable(), finishedAt: z.string().nullable() });
export type Lab12Command = z.infer<typeof lab12CommandSchema>;
export const lab12SnapshotSchema = z.strictObject({ runId: z.uuid(), sessionId: z.string(), mode: z.enum(['scripted', 'live']), source: z.enum(['authored-fixture', 'managed-api']),
  revision: z.number().int().nonnegative(),
  state: z.enum(['idle', 'running', 'updating', 'stopping', 'closed', 'cleanup-pending']), queueDepth: z.number().int().min(0).max(3), commands: z.array(lab12CommandSchema).max(20),
  model: z.string(), effort: z.string(), tools: z.enum(['none', 'read-only']), mcpServers: z.literal(0), contextEventIds: z.array(z.string()).max(20), handoffFrom: z.string().nullable(),
  interruption: z.enum(['not-needed', 'acknowledged', 'idle-confirmed', 'unconfirmed']), cleanup: z.enum(['not-needed', 'simulated', 'archived', 'pending']),
  events: z.array(z.strictObject({ id: z.string(), type: z.string(), commandId: z.string().nullable() })).max(100), message: z.string().max(600) });
export type Lab12Snapshot = z.infer<typeof lab12SnapshotSchema>;
export const lab12TinyImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ1sAAAAASUVORK5CYII=';
