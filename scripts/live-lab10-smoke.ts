import { mkdir, writeFile } from 'node:fs/promises';
import { createManagedClient } from '../server/lib/managed-config.js';
import { createLiveLab10Port } from '../server/lib/lab10-port.js';
import { Lab10Runs, type Lab10Entry } from '../server/lib/lab10-run.js';
import { lab10RequestSchema, lab10Prompt } from '../shared/lab10-structured-interrupt.js';
import { redact } from '../src/lib/presentation.js';
if (process.argv[2] !== '--execute-authorized-live-test') throw new Error('Explicit live execution flag required.');
const env = { ...process.env, MANAGED_BUDGET_CENTS: '10' }, client = createManagedClient(env);
const input = lab10RequestSchema.parse({ mode: 'live', prompt: lab10Prompt, scenario: 'valid', deadlineSeconds: 60, budgetCents: 10, correctiveRound: true });
const runs = new Lab10Runs(1, 50), events: unknown[] = []; let entry: Lab10Entry | undefined;
try {
  const port = createLiveLab10Port(input, client, env), originalOpen = port.open;
  port.open = async (...args) => { const stream = await originalOpen(...args); return (async function* () { for await (const event of stream) { events.push({ type: event.type, ...('id' in event ? { id: event.id } : {}) }); yield event; } })(); };
  entry = await runs.create('authorized-live-report-smoke', input, port); console.log(JSON.stringify({ created: true, sessionId: entry.session.id }));
  for (const prompt of [lab10Prompt, 'For the same project return a concise report with one risk and one next step.']) {
    await runs.enqueue(entry, { ...input, prompt }, new AbortController().signal, () => {}).work;
    const snapshot = runs.snapshot(entry); console.log(JSON.stringify({ stage: 'turn', state: snapshot.state, turns: snapshot.turns.map(turn => ({ state: turn.state, outcome: turn.outcome, errors: turn.errors, attempts: turn.attempts, reportPresent: Boolean(turn.report) })) }));
    if (snapshot.state !== 'idle' || snapshot.turns.at(-1)?.outcome !== 'verified') break;
  }
  if (entry.state === 'idle') await runs.end(entry);
} catch (error) { events.push({ errorType: error instanceof Error ? error.name : 'unknown', message: redact(error instanceof Error ? error.message : 'unknown').slice(0, 700) }); }
finally {
  await runs.close(); const session = entry ? await client.beta.sessions.retrieve(entry.session.id, {}, { timeout: 5000 }).catch(() => null) : null;
  const report = { at: new Date().toISOString(), source: 'managed-api', snapshot: entry ? runs.snapshot(entry) : null,
    cleanup: session ? { status: session.status, archived: Boolean(session.archived_at), listCost: session.usage.list_cost ?? null } : null, events };
  await mkdir('artifacts/course', { recursive: true }); await writeFile('artifacts/course/live-lab10.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ cleanup: report.cleanup, errors: events.filter(event => typeof event === 'object' && event && 'errorType' in event), resultFile: 'artifacts/course/live-lab10.json' }));
}
