import { z } from 'zod';

export const healthSchema = z.strictObject({
  version: z.string(),
  readiness: z.literal('ready'),
  features: z.strictObject({
    scriptedLessons: z.boolean(),
    liveAgentExecution: z.literal(false),
  }),
});
export type Health = z.infer<typeof healthSchema>;
