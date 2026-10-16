import { z } from 'zod';

export const lab56Lesson = { id: 56, title: 'Teams and evidence messages',
  topic: 'Multi-agent work', serverPrefix: '/api/c56' } as const;
export const lab56ScenarioSchema = z.enum(['blocked-review', 'competing-claim', 'busy-shutdown', 'duplicate-envelope',
  'ack-before-delivery', 'rejected-30', 'verified-37', 'clean-shutdown']);
export const lab56ReplaySchema = z.strictObject({ scenario: lab56ScenarioSchema });
export const lab56LiveSchema = z.strictObject({ mode: z.literal('live'), confirmed: z.boolean() });
export const lab56TimelineSchema = z.strictObject({ step: z.number().int().positive(), action: z.string(),
  accepted: z.boolean(), reason: z.string(), effect: z.string() });
export const lab56ResultSchema = z.strictObject({ source: z.literal('offline-team-reducer'),
  scenario: lab56ScenarioSchema, timeline: z.array(lab56TimelineSchema).max(24),
  tasks: z.array(z.strictObject({ id: z.string(), owner: z.enum(['researcher', 'reviewer']).nullable(),
    state: z.enum(['blocked', 'available', 'claimed', 'done']) })),
  messages: z.array(z.strictObject({ id: z.string(), from: z.enum(['researcher', 'reviewer']),
    to: z.enum(['researcher', 'reviewer']), status: z.enum(['queued', 'delivered', 'acknowledged']),
    evidence: z.string() })).max(8),
  verifiedAnswer: z.number().int().nullable(), shutdown: z.boolean(), providerCalls: z.literal(0),
  note: z.string() });
