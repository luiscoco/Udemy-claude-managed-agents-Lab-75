import { z } from 'zod';

export const lab51Lesson = { id: 51, title: 'Testing the Managed host offline', topic: 'Production and deployment',
  serverPrefix: '/api/c51' } as const;
export const lab51ScenarioSchema = z.enum(['all', 'malformed-order', 'foreign-order', 'denial', 'cancellation',
  'missing-terminal', 'child-thread', 'duplicate-events', 'invalid-report', 'retained-session', 'policy-mutation']);
export const lab51RunSchema = z.strictObject({ scenario: lab51ScenarioSchema });
export const lab51ReplaySchema = z.strictObject({ scenario: z.enum(['child-thread', 'duplicate-events', 'missing-terminal']) });
export const lab51AssertionSchema = z.strictObject({ name: z.string(), pass: z.boolean(),
  expectedFailure: z.boolean(), evidence: z.string(), expected: z.string(), observed: z.string() });
export const lab51ResultSchema = z.strictObject({ source: z.literal('offline-injected-host'), scenario: lab51ScenarioSchema,
  providerCalls: z.literal(0), assertions: z.array(lab51AssertionSchema), pass: z.boolean(),
  mutationDetected: z.boolean().nullable() });
