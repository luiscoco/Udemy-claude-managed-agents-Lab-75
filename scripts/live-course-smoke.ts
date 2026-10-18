import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { createManagedClient, managedSettings } from '../server/lib/managed-config.js';
import { createLiveLab01Port } from '../server/lib/lab01-port.js';
import { runLab01 } from '../server/lib/lab01-run.js';
import { createLiveLab09Port } from '../server/lib/lab09-port.js';
import { createLiveLab10Port } from '../server/lib/lab10-port.js';
import { Lab10Runs } from '../server/lib/lab10-run.js';
import { lab10RequestSchema, lab10Prompt } from '../shared/lab10-structured-interrupt.js';
import { lab09RequestSchema } from '../shared/lab09-system-prompts.js';
import { liveTeamReadiness } from '../server/team/live.js';
if (process.argv[2] !== '--execute-authorized-live-tests') throw new Error('Live smoke tests require deliberate --execute-authorized-live-tests.');
const env = { ...process.env, MANAGED_BUDGET_CENTS: '10' }; const settings = managedSettings(env); if (!settings.liveReady) throw new Error('Live setup is incomplete.');
const client = createManagedClient(env), results: Record<string, unknown>[] = []; let sessionCount = 0;
async function record(result: Record<string, unknown>) { results.push(result); await mkdir('artifacts/course', { recursive: true }); await writeFile('artifacts/course/live-smoke.json', JSON.stringify({ at: new Date().toISOString(), sessionCapCents: 10, maximumSessions: 4, results }, null, 2)); console.log(JSON.stringify(result)); }
async function usage(id: string | null) { if (!id) return null; try { const session = await client.beta.sessions.retrieve(id, {}, { timeout: 5000 }); return { status: session.status, archived: Boolean(session.archived_at), listCost: session.usage.list_cost ?? null }; } catch { return null; } }
for (const scenario of ['completion', 'cancel-after-send', 'deadline'] as const) {
  if (sessionCount >= 3) break; const abort = new AbortController(); const port = createLiveLab01Port(client, env); const originalSend = port.send; const timers: ReturnType<typeof setTimeout>[] = [];
  if (scenario === 'cancel-after-send') port.send = async (...args) => { await originalSend(...args); timers.push(setTimeout(() => abort.abort(scenario), 300)); };
  // Interrupts are queued by the provider. Keep execution deadlines unchanged,
  // but allow a bounded independent confirmation window before archival.
  try { sessionCount++; const result = await runLab01({ mode: 'live', port, signal: abort.signal, deadlineMs: scenario === 'deadline' ? 5000 : 45000, cleanupWaitMs: 60000,
    prompt: scenario === 'completion' ? 'Return exactly LIVE_SMOKE_OK, with no explanation.' : 'Write a detailed fictional 1500-word explanation of offline-first bird observation notebooks. This is a cancellation test.', emit() {} });
    await record({ lesson: 1, scenario, source: result.source, sessionId: result.sessionId, outcome: result.outcome.kind, interruption: result.interruption, cleanup: result.cleanup,
      markerVerified: scenario === 'completion' ? result.messages.some(message => message.text.includes('LIVE_SMOKE_OK')) : null, usage: await usage(result.sessionId) });
    if (result.cleanup === 'pending' || result.interruption === 'unconfirmed') { await record({ scenario: 'safety-stop', reason: 'Remote cleanup unresolved; no further sessions started.' }); break; }
  } finally { timers.forEach(clearTimeout); }
}
if (!results.some(result => result.scenario === 'safety-stop')) {
  const input = lab10RequestSchema.parse({ mode: 'live', prompt: lab10Prompt, scenario: 'valid', deadlineSeconds: 60, budgetCents: 10, correctiveRound: true });
  const runs = new Lab10Runs(1, 50); let id: string | null = null;
  try { const entry = await runs.create('live-authorized-smoke', input, createLiveLab10Port(input, client, env)); id = entry.session.id; sessionCount++;
    await runs.enqueue(entry, input, new AbortController().signal, () => {}).work; const first = runs.snapshot(entry);
    await record({ lesson: 10, scenario: 'first-report', sessionId: id, state: first.state, turns: first.turns.map(turn => ({ outcome: turn.outcome, attempts: turn.attempts, reportPresent: Boolean(turn.report) })) });
    const secondInput = { ...input, prompt: 'Return a concise report for the same fictional project with one risk and one next step.' };
    await runs.enqueue(entry, secondInput, new AbortController().signal, () => {}).work; const second = runs.snapshot(entry); const closed = await runs.end(entry);
    await record({ lesson: 10, scenario: 'validated-report-continuation-and-close', source: second.source, sessionId: id, sameSession: first.session.id === second.session.id,
      turns: second.turns.map(turn => ({ state: turn.state, outcome: turn.outcome, attempts: turn.attempts, reportPresent: Boolean(turn.report) })), stateBeforeClose: second.state, stateAfterClose: closed.state, cleanup: closed.cleanup, usage: await usage(id) });
  } catch (error) { await record({ lesson: 10, scenario: 'validated-report-continuation-and-close', sessionId: id, outcome: 'error', errorType: error instanceof Error ? error.name : 'unknown' }); }
  finally { await runs.close(); }
}
const lab75 = liveTeamReadiness(env); await record({ lesson: 75, scenario: 'live-readiness', ...lab75, note: 'No isolated Lab 75 key or pinned role agents are inferred from the shared credentials.' });
// Check the system-override parameter path locally without creating a fifth paid session.
const instructionProbe = lab09RequestSchema.parse({ mode: 'live', variant: 'custom', customSystem: 'Return concise fictional evidence only.', prompt: 'Describe the notebook.', deadlineSeconds: 60, budgetCents: 10 });
createLiveLab09Port(instructionProbe, client, env); await delay(1);
console.log(JSON.stringify({ finished: true, sessionsAttempted: sessionCount, report: 'artifacts/course/live-smoke.json' }));
