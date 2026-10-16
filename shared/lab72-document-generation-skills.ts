import { z } from 'zod';
export const lab72Lesson = { id: 72, title: 'Document generation with Skills', topic: 'Agents for real work', serverPrefix: '/api/c72' } as const;
export const scenarioSchema = z.enum(['incident', 'ordinary', 'invalid-spec', 'injection', 'placeholder', 'skill-tamper']);
export const referenceSchema = z.strictObject({ reference: z.enum(['spec-format', 'incident-report']) });
const text = z.string().min(1).max(1200);
export const documentSpecSchema = z.strictObject({ title: z.string().min(1).max(100), kind: z.enum(['ordinary', 'incident']),
  classification: z.enum(['Internal', 'Public']), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), blocks: z.array(z.discriminatedUnion('type', [
    z.strictObject({ type: z.literal('paragraph'), text }),
    z.strictObject({ type: z.literal('heading'), level: z.union([z.literal(1), z.literal(2)]), text: text.max(100) }),
    z.strictObject({ type: z.literal('list'), ordered: z.boolean(), items: z.array(text.max(400)).min(1).max(10) }),
    z.strictObject({ type: z.literal('table'), headers: z.array(text.max(50)).min(2).max(6), widths: z.array(z.number().int().min(5).max(95)).min(2).max(6), rows: z.array(z.array(text.max(300)).min(2).max(6)).min(1).max(20) }),
  ])).min(1).max(40) });
export const docgenToolSchema = z.discriminatedUnion('name', [
  z.strictObject({ name: z.literal('read_spec_reference'), input: referenceSchema }),
  z.strictObject({ name: z.literal('write_spec'), input: z.strictObject({ spec: documentSpecSchema }) }),
  z.strictObject({ name: z.literal('build_document'), input: z.strictObject({}) }),
]);
export type DocumentSpec = z.infer<typeof documentSpecSchema>;
export type DocumentScenario = z.infer<typeof scenarioSchema>;
