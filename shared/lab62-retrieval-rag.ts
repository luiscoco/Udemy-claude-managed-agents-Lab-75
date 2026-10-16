import { z } from 'zod';

export const lab62Lesson = { id: 62, title: 'Retrieval RAG through custom tools',
  topic: 'Search, MCP and plugins', serverPrefix: '/api/c62' } as const;
export const lab62SearchSchema = z.strictObject({ query: z.string().trim().min(2).max(200),
  limit: z.number().int().min(1).max(5) });
export const lab62QuerySchema = z.strictObject({ question: z.string().trim().min(2).max(200),
  scenario: z.enum(['grounded', 'fabricated-citation', 'wrong-policy', 'no-match', 'hostile-note']) });
export const lab62ReportSchema = z.strictObject({ answer: z.string().trim().min(1).max(300),
  evidence: z.array(z.strictObject({ id: z.string().regex(/^doc-[a-z0-9-]+#[a-z0-9-]+$/),
    quote: z.string().min(1).max(200) })).min(1).max(5) });
