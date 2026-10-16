import { z } from 'zod';

export const lab58Lesson = { id: 58, title: 'Tool catalogs and bounded discovery',
  topic: 'Function tools and human control', serverPrefix: '/api/c58' } as const;
export const lab58VariantSchema = z.enum(['good', 'vague']);
export const lab58SearchSchema = z.strictObject({ query: z.string().trim().min(2).max(120),
  variant: lab58VariantSchema, limit: z.number().int().min(1).max(5) });
export const lab58RunSchema = z.strictObject({ scenario: z.enum(['authorized', 'unauthorized']),
  name: z.string().min(1).max(80), input: z.record(z.string(), z.unknown()) });
export const lab58ToolSchema = z.strictObject({ name: z.string(), hint: z.string(), description: z.string(),
  inputSchema: z.record(z.string(), z.unknown()), score: z.number().int().nonnegative() });
export const lab58SearchResultSchema = z.strictObject({ source: z.literal('offline-host-scorer'),
  query: z.string(), variant: lab58VariantSchema, totalTools: z.literal(64), resultLimit: z.number().int(),
  results: z.array(lab58ToolSchema).max(5), estimatedInitialTokens: z.number().int().nonnegative(),
  estimatedReturnedTokens: z.number().int().nonnegative(), providerCalls: z.literal(0),
  note: z.string() });
