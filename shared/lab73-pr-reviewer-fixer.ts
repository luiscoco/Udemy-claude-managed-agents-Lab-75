import { z } from 'zod';
export const lab73Lesson = { id: 73, title: 'An autonomous PR reviewer and fixer', topic: 'Agents for real work', serverPrefix: '/api/c73' } as const;
export const prScenarioSchema = z.enum(['good-fix', 'out-of-scope', 'skipped-tests', 'unresolved', 'malformed-review', 'timeout']);
export const findingSchema = z.strictObject({ file: z.string().max(100), line: z.number().int().positive(), severity: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.enum(['low', 'high']), message: z.string().min(1).max(500), question: z.boolean() });
export const reviewSchema = z.strictObject({ findings: z.array(findingSchema).max(20) });
export const prToolSchema = z.discriminatedUnion('name', [
  z.strictObject({ name: z.literal('read_diff'), input: z.strictObject({}) }),
  z.strictObject({ name: z.literal('submit_review'), input: reviewSchema }),
  z.strictObject({ name: z.literal('write_assigned_file'), input: z.strictObject({ file: z.enum(['src/price.mjs', 'tests/price.test.mjs']), text: z.string().max(16000) }) }),
]);
export type Finding = z.infer<typeof findingSchema>;
export type PrScenario = z.infer<typeof prScenarioSchema>;

export const prToolDefinitions = prToolSchema.options.map(option => {
  const { $schema: _dialect, ...input_schema } = z.toJSONSchema(option.shape.input, { target: 'draft-2020-12' });
  return { type: 'custom' as const, name: option.shape.name.value, description: 'Bounded host PR operation; role policy grants authority.', input_schema };
});
