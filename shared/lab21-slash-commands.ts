import { z } from 'zod';

export const lab21Lesson = { id: 21, title: 'Host commands and prompt expansion', topic: 'Tools and extensions', serverPrefix: '/api/c21' } as const;
export const lab21ModeSchema = z.enum(['scripted', 'live']);
export const lab21SessionSchema = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('prepare'), mode: lab21ModeSchema }),
  z.strictObject({ action: z.literal('close'), runId: z.uuid() }),
]);
export const lab21RunSchema = z.strictObject({ runId: z.uuid(), command: z.enum(['observation', 'checklist', 'inspect', 'reset']),
  args: z.record(z.string(), z.unknown()).default({}), });
export type Lab21Run = z.infer<typeof lab21RunSchema>;

const species = z.enum(['Aurora Finch', 'Silver Heron', 'Forest Wren']);
const count = z.number().int().min(1).max(50);
const location = z.enum(['north marsh', 'pine grove', 'river bend']);
const empty = z.strictObject({});
export const lab21Commands = [
  { name: 'observation', description: 'Format a fictional field observation.', kind: 'model', arguments: 'species, count, location', template: 'Format a fictional observation note. Species: {species}. Count: {count}. Location: {location}.' },
  { name: 'checklist', description: 'Create a three-item field checklist.', kind: 'model', arguments: 'location', template: 'Create a three-item fictional field checklist for {location}.' },
  { name: 'inspect', description: 'Read this session’s bounded local command history.', kind: 'local', arguments: 'none', template: null },
  { name: 'reset', description: 'Clear this session’s bounded local command history.', kind: 'local', arguments: 'none', template: null },
] as const;

export function expandLab21Command(command: string, raw: unknown) {
  if (command === 'observation') {
    const args = z.strictObject({ species, count, location }).parse(raw);
    return `Format a fictional observation note. Species: ${args.species}. Count: ${args.count}. Location: ${args.location}.`;
  }
  if (command === 'checklist') {
    const args = z.strictObject({ location }).parse(raw);
    return `Create a three-item fictional field checklist for ${args.location}.`;
  }
  if (command === 'inspect' || command === 'reset') { empty.parse(raw); return null; }
  throw new Error('Unknown host command.');
}
