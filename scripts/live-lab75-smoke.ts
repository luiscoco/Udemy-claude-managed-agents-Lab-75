import { mkdir, writeFile } from 'node:fs/promises';
import { TeamWorkshop } from '../server/team/orchestrator.js';
import { liveTeam, liveTeamReadiness } from '../server/team/live.js';
import { createManagedClient } from '../server/lib/managed-config.js';
if (process.argv[2] !== '--execute-authorized-live-test') throw new Error('Explicit live execution flag required.');
if (!liveTeamReadiness().ready) throw new Error('Dedicated Lab 75 setup is incomplete.');
const budgetCents = Number(process.argv.find(argument => /^--budget-cents=\d+$/.test(argument))?.split('=')[1] ?? 300);
if (!Number.isSafeInteger(budgetCents) || budgetCents < 30 || budgetCents > 300) throw new Error('Choose a reference budget between 30 and 300 cents.');
const store = new TeamWorkshop(), owner = `authorized-live-${crypto.randomUUID()}`;
const created = await store.create(owner, { mode: 'live', scenario: 'happy-rework', maxParallel: 2, budgetCents });
await mkdir('artifacts/lab75', { recursive: true });
console.log(JSON.stringify({ started: true, runId: created.id, source: 'managed-api', maxParallel: 2, referenceBudgetCents: budgetCents, sessionBudgetCents: 30 }));
const progress = setInterval(() => { const state = store.get(owner, created.id); console.log(JSON.stringify({ state: state.state,
  tasks: state.tasks.map(task => ({ id: task.id, state: task.state, rounds: task.rounds })), calls: state.calls.length, reportedCents: state.totalCents, knownCost: state.knownCost })); }, 10000);
let snapshot;
try { snapshot = await store.start(owner, created.id, liveTeam()); }
finally { clearInterval(progress); store.close(); }
const entries = await store.journal(owner, created.id);
const ids = [...new Set(entries.filter(entry => entry.type === 'remote-session').map(entry => (entry.data as { data: { id: string } }).data.id))];
const client = createManagedClient({ ...process.env, ANTHROPIC_API_KEY: process.env.LAB75_ANTHROPIC_API_KEY });
const sessions = [];
for (const id of ids) {
  try { const session = await client.beta.sessions.retrieve(id, {}, { timeout: 5000 }); sessions.push({ id, status: session.status, archived: Boolean(session.archived_at), listCost: session.usage.list_cost ?? null }); }
  catch { sessions.push({ id, status: 'unknown', archived: false, listCost: null }); }
}
const evidence = { at: new Date().toISOString(), source: 'managed-api', snapshot, sessions,
  allArchived: sessions.length > 0 && sessions.every(session => session.archived),
  reportedListCents: sessions.every(session => session.listCost?.currency === 'USD') ? sessions.reduce((sum, session) => sum + Number(session.listCost!.amount), 0) : null,
  note: 'Provider-reported cumulative list costs are not a final invoice. Fixture repositories were not pushed.' };
await writeFile(`artifacts/lab75/live-${created.id}.json`, JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({ finished: true, runId: created.id, state: snapshot.state, releaseGate: snapshot.releaseGate,
  tasks: snapshot.tasks.map(task => ({ id: task.id, state: task.state, checks: task.checks })), questions: snapshot.questions,
  sessions: sessions.length, allArchived: evidence.allArchived, reportedListCents: evidence.reportedListCents, artifact: `artifacts/lab75/live-${created.id}.json` }));
process.exitCode = snapshot.releaseGate.ready && evidence.allArchived ? 0 : 1;
