import { z } from 'zod';

export const lab61Lesson = { id: 61, title: 'Exposing an agent as an MCP server',
  topic: 'Search, MCP and plugins', serverPrefix: '/api/c61' } as const;
export const lab61ToolInputSchema = z.strictObject({ orderId: z.literal('O-1001'),
  question: z.string().trim().min(3).max(200), scenario: z.enum(['normal', 'slow']).default('normal') });
export const lab61StructuredSchema = z.strictObject({ caseStatus: z.literal('reviewed'),
  orderId: z.literal('O-1001'), eligible: z.boolean(), amountCents: z.number().int().nonnegative(),
  summary: z.string().min(1).max(200), agentSessionId: z.string().uuid() });
export const lab61DemoSchema = z.strictObject({ scenario: z.enum(['normal', 'timeout', 'cancel', 'concurrent']) });
