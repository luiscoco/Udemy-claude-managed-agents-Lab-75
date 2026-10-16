import { z } from 'zod';

export const lab60Lesson = { id: 60, title: 'Durable long running agents',
  topic: 'Production and deployment', serverPrefix: '/api/c60' } as const;
export const lab60StrategySchema = z.enum(['naive-restart', 'journal-only', 'journal-idempotency']);
export const lab60RunSchema = z.strictObject({ scenario: z.enum(['crash-after-third', 'lease-loss', 'no-progress']) });
export const lab60RecoverSchema = z.strictObject({ jobId: z.string().uuid(), strategy: lab60StrategySchema });
export const lab60ResetSchema = z.strictObject({ confirmed: z.literal(true) });
export const lab60ToolSchemas = {
  read_refund_item: z.strictObject({ itemId: z.string().regex(/^ITEM-0[1-8]$/) }),
  record_refund_effect: z.strictObject({ itemId: z.string().regex(/^ITEM-0[1-8]$/), effectKey: z.string().max(100) }),
  write_refund_report: z.strictObject({ result: z.enum(['done', 'failed']), completed: z.number().int().min(0).max(8) }),
} as const;
