import { z } from 'zod';

export const lab59Lesson = { id: 59, title: 'Routing with verified outcomes', topic: 'Models and reasoning',
  serverPrefix: '/api/c59' } as const;
export const lab59StrategySchema = z.enum(['fixed-light', 'fixed-standard', 'fixed-deep', 'rule', 'classifier',
  'cascade', 'draft-review']);
export const lab59RunSchema = z.strictObject({ strategy: lab59StrategySchema,
  budgetUnits: z.number().int().min(100).max(10000) });
export const lab59DelegateSchema = z.strictObject({ taskId: z.string().regex(/^task-(?:0[1-9]|1[0-3])$/),
  strategy: lab59StrategySchema });
export const lab59ReportSchema = z.strictObject({ answer: z.string().trim().min(1).max(100),
  confidence: z.number().min(0).max(1) });
export const lab59ResolutionSchema = z.strictObject({ taskId: lab59DelegateSchema.shape.taskId,
  reportText: z.string().min(2).max(1000) });
