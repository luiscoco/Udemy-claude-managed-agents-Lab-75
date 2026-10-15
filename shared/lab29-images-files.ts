import { z } from 'zod';

export const lab29Lesson = { id: 29, title: 'Images, documents and mounted files', topic: 'SDK fundamentals', serverPrefix: '/api/c29' } as const;
export const lab29Names = ['aurora-finch.png', 'field-note.pdf', 'observation.txt'] as const;
export const lab29RequestSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), name: z.enum(lab29Names),
  question: z.string().trim().min(1).max(240), data: z.string().max(100_000).optional() });
export type Lab29Request = z.infer<typeof lab29RequestSchema>;
export const lab29ResultSchema = z.strictObject({ source: z.literal('authored-fixture'), route: z.enum(['inline', 'upload', 'disk']),
  name: z.enum(lab29Names), mime: z.string(), bytes: z.number().int().positive(), sha256: z.string().length(64),
  sentBlocks: z.array(z.record(z.string(), z.unknown())).max(3), mountPath: z.string().nullable(), uploadedFileId: z.string().nullable(),
  agentText: z.string(), downloadedOutput: z.string().nullable(), providerCalls: z.literal(0), usage: z.null(),
  note: z.string() });
export type Lab29Result = z.infer<typeof lab29ResultSchema>;
