import { z } from 'zod';

export const lab44Lesson = { id: 44, title: 'Host telemetry and provider event traces', topic: 'Production and deployment', serverPrefix: '/api/c44' } as const;
export const lab44RunSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: z.enum(['successful-tool', 'denied-tool', 'failed-tool', 'missing-provider-span']) });
export const lab44PrivacySchema = z.strictObject({ recordFictionalContent: z.boolean() });
export const lab44IdSchema = z.strictObject({ runId: z.string().uuid() });
export const lab44SpanSchema = z.strictObject({ traceId: z.string().regex(/^[a-f0-9]{32}$/), spanId: z.string().regex(/^[a-f0-9]{16}$/),
  parentSpanId: z.string().nullable(), name: z.string(), source: z.literal('host-otel'), status: z.enum(['ok', 'error']),
  attributes: z.record(z.string(), z.string()), durationMs: z.number().nonnegative() });
export const lab44ProviderEventSchema = z.strictObject({ id: z.string(), type: z.enum(['span.model_request_start', 'span.model_request_end']),
  modelRequestStartId: z.string().nullable(), source: z.literal('authored-provider-event-fixture') });
export const lab44SnapshotSchema = z.strictObject({ source: z.literal('authored-fixture'), runId: z.string().uuid(),
  scenario: lab44RunSchema.shape.scenario, sessionId: z.string(), threadId: z.string(), toolEventId: z.string(),
  hostSpans: z.array(lab44SpanSchema).max(20), providerEvents: z.array(lab44ProviderEventSchema).max(4),
  effectCount: z.number().int().min(0).max(1), recordFictionalContent: z.boolean(),
  collector: z.strictObject({ spanCount: z.number().int().nonnegative(), maxSpans: z.number().int().positive(), rejectedBatches: z.number().int().nonnegative(), transport: z.literal('loopback-otlp-json') }),
  providerCalls: z.literal(0), remoteOtlpExportObserved: z.literal(false), evidence: z.array(z.string()).max(20) });
export type Lab44Scenario = z.infer<typeof lab44RunSchema>['scenario'];
