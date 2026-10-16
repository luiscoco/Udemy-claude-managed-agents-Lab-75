import { z } from 'zod';

export const lab64Lesson = { id: 64, title: 'Browser tools across host and cloud', topic: 'Tools, MCP and skills', serverPrefix: '/api/c64' } as const;
export const lab64RunSchema = z.strictObject({ scenario: z.enum(['inspect-product', 'fill-form', 'blocked-navigation', 'missing-browser']) });
export type Lab64Scenario = z.infer<typeof lab64RunSchema>['scenario'];
