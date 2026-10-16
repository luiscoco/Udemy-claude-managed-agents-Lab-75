import { z } from 'zod';

export const lab71Lesson = { id: 71, title: 'A data analysis agent', topic: 'Agents for real work', serverPrefix: '/api/c71' } as const;
export const salesMonths = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'] as const;
export const salesRegions = ['North', 'South', 'East', 'West'] as const;
export const salesProducts = ['Notebook', 'Sensor'] as const;
export const qualitySchema = z.enum(['raw', 'clean']);
export const metricSchema = z.enum(['units', 'revenue_eur', 'returns', 'return_rate', 'avg_price_eur']);
export const aggregateSchema = z.strictObject({ quality: qualitySchema, metric: metricSchema,
  operation: z.enum(['sum', 'mean', 'median', 'min', 'max', 'count', 'ratio_of_sums']),
  groupBy: z.enum(['all', 'month', 'region', 'product']), months: z.array(z.enum(salesMonths)).min(1).max(6) })
  .superRefine((input, context) => {
    const ratio = ['return_rate', 'avg_price_eur'].includes(input.metric);
    if (ratio !== (input.operation === 'ratio_of_sums')) context.addIssue({ code: 'custom', path: ['operation'], message: 'Ratio metrics require ratio_of_sums; other metrics use a numeric reduction.' });
    if (new Set(input.months).size !== input.months.length) context.addIssue({ code: 'custom', path: ['months'], message: 'Use unique months.' });
  });
export const profileSchema = z.strictObject({ quality: qualitySchema });
export const comparisonSchema = z.strictObject({ quality: qualitySchema, metric: metricSchema,
  fromMonth: z.enum(salesMonths), toMonth: z.enum(salesMonths) }).refine(value => value.fromMonth !== value.toMonth, 'Choose distinct months.');
export const chartSchema = z.strictObject({ computationId: z.string().regex(/^C[1-9]\d*$/), title: z.string().min(1).max(80) });
export const lab71ToolSchema = z.discriminatedUnion('name', [
  z.strictObject({ name: z.literal('profile_dataset'), input: profileSchema }),
  z.strictObject({ name: z.literal('aggregate'), input: aggregateSchema }),
  z.strictObject({ name: z.literal('compare_periods'), input: comparisonSchema }),
  z.strictObject({ name: z.literal('make_chart'), input: chartSchema }),
]);
export const reportSchema = z.strictObject({ title: z.string().min(1).max(160), quality: qualitySchema,
  findings: z.array(z.strictObject({ statement: z.string().min(1).max(300), value: z.number().finite(),
    unit: z.enum(['units', 'EUR', 'returns', '%', 'EUR/unit', 'rows']), computationId: z.string().regex(/^C[1-9]\d*$/) })).min(1).max(12),
  chartIds: z.array(z.string().regex(/^G[1-9]\d*$/)).max(10), commentary: z.string().max(1000).default('') });
export type SalesMetric = z.infer<typeof metricSchema>;
export type Quality = z.infer<typeof qualitySchema>;
export type SalesReport = z.infer<typeof reportSchema>;
