import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { Lab69Backend } from '../server/concepts/69-embedding-sdk.js';
import { Lab70Workshop } from '../server/concepts/70-python-sdk.js';
import { createManagedClient, managedSettings } from '../server/lib/managed-config.js';
import { redact } from '../src/lib/presentation.js';
if (process.argv[2] !== '--execute-authorized-live-tests') throw new Error('Explicit billed execution flag required.');
process.env.MANAGED_BUDGET_CENTS = '10';
if (!managedSettings().liveReady) throw new Error('Shared live setup is incomplete.');
const owner = `live-host-${crypto.randomUUID()}`, results: Record<string, unknown>[] = [], ids = new Set<string>();
const client = createManagedClient(), host = new Lab69Backend(), python = new Lab70Workshop();
const evidencePath = `artifacts/course/live-host-integrations-${crypto.randomUUID()}.json`;
await mkdir('artifacts/course', { recursive: true });
let failed = false;
async function record(result: Record<string, unknown>) {
  results.push(result); await writeFile(evidencePath, JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
  console.log(JSON.stringify(result));
}
try {
  const context = host.document(owner), started = host.start(owner, { correlationId: crypto.randomUUID(), context, mode: 'live', scenario: 'normal' });
  const result = await host.settle(owner, started.id); if (result.sessionId) ids.add(result.sessionId);
  await record({ lesson: 69, scenario: 'backend-patch', state: result.state, cleanup: result.cleanup, sessionId: result.sessionId, patchValidated: Boolean(result.patch) });
  assert.equal(result.state, 'completed'); assert.equal(result.cleanup, 'archived');
  assert.equal(host.document(owner).hash, context.hash); const applied = host.apply(owner, started.id); assert.equal(applied.version, context.version + 1);
  await record({ lesson: 69, scenario: 'host-apply', appliedOnce: true, interactiveVSCodeTest: false });
  const capability = await python.probe(); await record({ lesson: 70, scenario: 'readiness', ...capability });
  assert.equal(capability.liveReady, true);
  async function turn(operation: 'one-shot' | 'retained-start' | 'retained-turn' | 'close', scenario: 'normal' | 'custom-tool', prompt: string, sessionHandle?: string) {
    const started = python.start(owner, { mode: 'live', operation, scenario, prompt, ...(sessionHandle ? { sessionHandle } : {}) });
    const result = await python.settle(owner, started.id);
    for (const frame of result.frames) if (frame.type === 'session') ids.add(frame.id);
    const final = result.frames.find(frame => frame.type === 'result');
    await record({ lesson: 70, scenario, operation, state: result.state, result: final, toolCalls: result.frames.filter(frame => frame.type === 'tool_use').length, protocolError: result.reply?.protocolError });
    assert.equal(result.state, 'completed'); assert.ok(final?.type === 'result');
    if (operation === 'one-shot' || operation === 'close') assert.equal(final.cleanup, 'archived');
    else assert.equal(final.cleanup, 'confirmed-idle-retained');
    return result;
  }
  const retained = await turn('retained-start', 'normal', 'Return exactly PYTHON_LIVE_OK.');
  assert.ok(retained.sessionHandle);
  await turn('retained-turn', 'normal', 'Return exactly PYTHON_CONTINUATION_OK.', retained.sessionHandle);
  await turn('close', 'normal', 'Close this idle session.', retained.sessionHandle);
  const custom = await turn('one-shot', 'custom-tool', 'Use format_observation for 3 Aurora Finch birds, then return the formatted observation.');
  assert.ok(custom.frames.some(frame => frame.type === 'tool_use'));
} catch (error) { failed = true; await record({ outcome: 'failed', errorType: error instanceof Error ? error.name : 'unknown',
  errorMessage: error instanceof Error ? redact(error.message).slice(0, 500) : 'Unknown failure' }); }
finally {
  await host.close(); await python.close();
  const sessions = [];
  for (const id of ids) { try { const session = await client.beta.sessions.retrieve(id, {}, { timeout: 5000 }); sessions.push({ id, archived: Boolean(session.archived_at), listCost: session.usage.list_cost }); }
    catch { sessions.push({ id, archived: false, listCost: null }); } }
  const allArchived = sessions.length > 0 && sessions.every(session => session.archived);
  await record({ scenario: 'final-cleanup-audit', sessions, allArchived, evidencePath, note: 'Reported list cost is not a final invoice. No external notification or deployment was attempted.' });
  if (!allArchived) failed = true;
}
process.exitCode = failed ? 1 : 0;
