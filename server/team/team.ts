import { z } from 'zod';
import { findingSchema } from '../../shared/lab73-pr-reviewer-fixer.js';
export const TaskSchema = z.strictObject({ id: z.string().regex(/^T[1-9]$/), files: z.array(z.string().regex(/^src\/[a-z][a-z0-9-]*\.mjs$/)).min(1).max(3),
  testFile: z.string().regex(/^tests\/[a-z][a-z0-9-]*\.test\.mjs$/), dependsOn: z.array(z.string().regex(/^T[1-9]$/)).max(3), spec: z.string().min(1).max(2000), acceptance: z.array(z.string().min(1).max(300)).min(1).max(8) });
export const PlanSchema = z.strictObject({ tasks: z.array(TaskSchema).min(1).max(4) });
export const DevReportSchema = z.strictObject({ status: z.enum(['done', 'blocked']), summary: z.string().min(1).max(1000), handoff: z.string().max(600), questions: z.array(z.string().max(300)).max(5) });
export const TeamReviewSchema = z.strictObject({ findings: z.array(findingSchema).max(20) });
export type Task = z.infer<typeof TaskSchema>; export type Plan = z.infer<typeof PlanSchema>;
export const reportDefinitions = [ ['plan', PlanSchema], ['developer', DevReportSchema], ['review', TeamReviewSchema] ] as const;
export const reportSchemas = Object.fromEntries(reportDefinitions.map(([name, schema]) => { const { $schema: _dialect, ...input_schema } = z.toJSONSchema(schema); return [name, input_schema]; }));
export function validatePlan(raw: unknown) {
  const parsed = PlanSchema.safeParse(raw); if (!parsed.success) return { valid: false as const, errors: parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`), waves: [] as string[][] };
  const plan = parsed.data, errors: string[] = [], owners = new Map<string, string>(), ids = new Set<string>();
  for (const task of plan.tasks) {
    if (ids.has(task.id)) errors.push(`Duplicate task ${task.id}`); ids.add(task.id);
    for (const file of [...task.files, task.testFile]) { if (owners.has(file)) errors.push(`Duplicate owner for ${file}: ${owners.get(file)} and ${task.id}`); owners.set(file, task.id); }
    if (task.testFile === 'tests/notes.test.mjs') errors.push(`${task.id} cannot overwrite an existing test`);
    if (task.files.includes('src/notes.mjs')) errors.push(`${task.id} cannot modify the base notes module`);
    if (new Set(task.dependsOn).size !== task.dependsOn.length) errors.push(`Duplicate dependencies in ${task.id}`);
  }
  for (const task of plan.tasks) for (const dependency of task.dependsOn) if (!ids.has(dependency)) errors.push(`Unknown dependency ${dependency} in ${task.id}`);
  const visiting: string[] = [], done = new Set<string>();
  const visit = (id: string) => { if (visiting.includes(id)) { errors.push(`Dependency cycle: ${[...visiting.slice(visiting.indexOf(id)), id].join(' -> ')}`); return; }
    if (done.has(id)) return; visiting.push(id); for (const dependency of plan.tasks.find(task => task.id === id)?.dependsOn ?? []) if (ids.has(dependency)) visit(dependency); visiting.pop(); done.add(id); };
  for (const task of plan.tasks) visit(task.id);
  const waves: string[][] = [], merged = new Set<string>();
  if (!errors.length) while (merged.size < plan.tasks.length) { const wave = plan.tasks.filter(task => !merged.has(task.id) && task.dependsOn.every(id => merged.has(id))).map(task => task.id); if (!wave.length) break; waves.push(wave); wave.forEach(id => merged.add(id)); }
  return { valid: !errors.length, errors, waves, plan };
}
export const goodPlan: Plan = { tasks: [
  { id: 'T1', files: ['src/tags.mjs'], testFile: 'tests/tags.test.mjs', dependsOn: [], spec: 'normalizeTag trims and lowercases strings; reject nonstring, empty or more than 20 characters after trim. parseTags validates an array and deduplicates normalized tags in first-seen order.', acceptance: ['20 characters accepted; 21 rejected', 'Stable deduplication'] },
  { id: 'T2', files: ['src/search.mjs'], testFile: 'tests/search.test.mjs', dependsOn: ['T1'], spec: 'findByTag(notes, tag) normalizes query and note tags, returns matching original notes in original order.', acceptance: ['Normalized matching', 'Empty matches return []'] },
  { id: 'T3', files: ['src/report.mjs'], testFile: 'tests/report.test.mjs', dependsOn: ['T1'], spec: 'tagCounts(notes) returns {tag,count} records, counts each normalized tag at most once per note; sort descending count, then ascending codepoint tag for ties.', acceptance: ['Distinct notes counted', 'Stable tie ordering'] },
] };
export function planPreset(name: string): unknown { const plan = structuredClone(goodPlan);
  if (name === 'protected-deletion') plan.tasks[0]!.files = ['.github/workflows/ci.yml'];
  else if (name === 'duplicate-owner') plan.tasks[1]!.files = ['src/tags.mjs'];
  else if (name === 'cycle') plan.tasks[0]!.dependsOn = ['T2'];
  else if (name === 'existing-test') plan.tasks[0]!.testFile = 'tests/notes.test.mjs';
  else if (name === 'sequential') plan.tasks[2]!.dependsOn = ['T2'];
  else if (name === 'malformed') return { tasks: [], unexpected: true }; return plan;
}
export type Role = 'planner' | 'reviewer' | 'developer';
export type RoleContext = { role: Role; task?: Task; root: string; round: number; feedback: string[]; signal: AbortSignal; tool: (name: string, input: unknown) => Promise<unknown>; record: (type: string, data: unknown) => Promise<void> };
export type CallResult<T> = { report: T; costCents: number | null; source: 'fixture-assumption' | 'managed-api'; sessionId?: string; eventIds?: string[] };
export interface Team { mode: 'scripted' | 'live'; plan(context: RoleContext): Promise<CallResult<unknown>>; develop(context: RoleContext): Promise<CallResult<unknown>>; review(context: RoleContext): Promise<CallResult<unknown>> }
