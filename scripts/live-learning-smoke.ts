import { mkdir, writeFile } from 'node:fs/promises';
import { createManagedClient, managedSettings } from '../server/lib/managed-config.js';
import { createLiveLab02Port } from '../server/lib/lab02-port.js';
import { runLab02 } from '../server/lib/lab02-run.js';
import { lab02RequestSchema } from '../shared/lab02-options.js';
import { createLiveLab09Port } from '../server/lib/lab09-port.js';
import { runLab09 } from '../server/lib/lab09-run.js';
import { lab09RequestSchema } from '../shared/lab09-system-prompts.js';
import { createLiveLab11Port } from '../server/lib/lab11-port.js';
import { runLab11 } from '../server/lib/lab11-run.js';
import { lab11Question, lab11RequestSchema } from '../shared/lab11-skills.js';
import { redact } from '../src/lib/presentation.js';

if (process.argv[2] !== '--execute-authorized-live-tests') throw new Error('Explicit live execution flag required.');
if (!managedSettings().liveReady) throw new Error('Shared live setup is incomplete.');
const env = { ...process.env, MANAGED_BUDGET_CENTS: '10' }, client = createManagedClient(env);
const report = `artifacts/learning-guide/live-learning-${crypto.randomUUID()}.json`;
const results: Record<string, unknown>[] = [];
let failed = false, safe = true;
await mkdir('artifacts/learning-guide', { recursive: true });
async function record(value: Record<string, unknown>) {
  results.push(value); await writeFile(report, JSON.stringify({ at: new Date().toISOString(), maximumSessions: 6, sessionBudgetCents: 10, results }, null, 2));
  console.log(JSON.stringify(value));
}
async function run(lesson: number, scenario: string, action: () => Promise<{ source: string; sessionId: string | null; cleanup: string; interruption: string; outcome: { kind: string }; messages: { text: string }[]; reads?: unknown[] }>, marker?: string) {
  if (!safe) return;
  try {
    const result = await action();
    const passed = result.source === 'managed-api' && result.outcome.kind === 'completed' && result.cleanup === 'archived'
      && (!marker || result.messages.some(message => message.text.trim() === marker));
    await record({ lesson, scenario, passed, source: result.source, sessionId: result.sessionId, outcome: result.outcome.kind, cleanup: result.cleanup,
      interruption: result.interruption, ...(result.reads ? { reads: result.reads } : {}) });
    if (!passed) failed = true;
    if (result.cleanup === 'pending' || result.interruption === 'unconfirmed') safe = false;
  } catch (error) { failed = true; safe = false; await record({ lesson, scenario, passed: false, error: redact(error instanceof Error ? error.message : 'Unknown failure').slice(0, 500) }); }
}
for (const previews of [true, false]) {
  const marker = 'OPTIONS_LIVE_OK';
  const input = lab02RequestSchema.parse({ mode: 'live', prompt: `Return exactly ${marker}.`, scenario: 'normal', model: 'claude-sonnet-5-5',
    system: { choice: 'override', text: 'Follow the requested exact response format.' }, budgetCents: 10, previews, deadlineSeconds: 60 });
  await run(2, `previews-${previews}`, () => runLab02(input, createLiveLab02Port(input, client, env), new AbortController().signal, () => {}), marker);
}
const instructions = lab09RequestSchema.parse({ mode: 'live', variant: 'custom', customSystem: 'Follow the requested exact response format.',
  prompt: 'Return exactly INSTRUCTIONS_LIVE_OK.', deadlineSeconds: 60, budgetCents: 10 });
await run(9, 'custom-instructions', () => runLab09(instructions, createLiveLab09Port(instructions, client, env), new AbortController().signal, () => {}), 'INSTRUCTIONS_LIVE_OK');
for (const variant of ['without-skill', 'with-skill', 'revised-version'] as const) {
  const input = lab11RequestSchema.parse({ mode: 'live', variant, prompt: lab11Question, deadlineSeconds: 60, budgetCents: 10 });
  await run(11, variant, async () => runLab11(input, await createLiveLab11Port(input, client, env), new AbortController().signal, () => {}));
}
console.log(JSON.stringify({ finished: true, safeCleanup: safe, report }));
process.exitCode = failed || !safe ? 1 : 0;
