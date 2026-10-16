import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';
import { createLab63Router } from '../server/concepts/63-safe-database-agent.js';
import { lab63ToolDefinitions, SafeDatabaseStore } from '../server/database/lab63.js';

const fixture = () => { const root = mkdtempSync(join(tmpdir(), 'lab63-test-'));
  return { root, store: new SafeDatabaseStore(root, owner => owner === 'bob' ? 'other' : 'acme') }; };
test('fixed read and proposal leave order open; human approval changes exactly one tenant row', () => {
  const { root, store } = fixture(), initial = store.create('alice');
  assert.equal(initial.readQueryOnly, true); assert.equal(initial.writeQueryOnly, true);
  assert.equal(lab63ToolDefinitions[0]?.input_schema.additionalProperties, false);
  const proposed = store.query(initial.sessionId, 'alice', { operation: 'propose', orderId: 'O-A1', reason: 'Cancel this order.' });
  if (proposed.operation !== 'propose') throw new Error('Expected proposal');
  assert.equal(proposed.committed, false); assert.equal(store.snapshot(initial.sessionId, 'alice').rows[0]?.status, 'open');
  const decision = store.decision(initial.sessionId, 'alice', proposed.proposal.id, 'approve');
  assert.equal(decision.changedRows, 1); assert.equal(decision.rows[0]?.status, 'cancelled');
  assert.equal(decision.readQueryOnly, true); assert.equal(decision.writeQueryOnly, true);
  assert.throws(() => store.decision(initial.sessionId, 'alice', proposed.proposal.id, 'approve'), /already decided/);
  const db = new DatabaseSync(join(root, initial.sessionId, 'orders.sqlite'));
  assert.deepEqual(db.prepare('SELECT id,status FROM orders ORDER BY id').all().map(row => [row.id, row.status]),
    [['O-A1', 'cancelled'], ['O-B1', 'open']]); db.close(); store.close();
});
test('reject, stale and expired decisions change no order rows', () => {
  for (const [action, expected] of [['reject', 'rejected'], ['change-version', 'stale'],
    ['advance-time', 'expired']] as const) {
    const { store } = fixture(), session = store.create('alice');
    const proposed = store.query(session.sessionId, 'alice', { operation: 'propose', orderId: 'O-A1', reason: 'Cancel order.' });
    if (proposed.operation !== 'propose') throw new Error('Expected proposal');
    if (action !== 'reject') store.fixture(session.sessionId, 'alice', action);
    const result = store.decision(session.sessionId, 'alice', proposed.proposal.id, action === 'reject' ? 'reject' : 'approve');
    assert.equal(result.outcome, expected); assert.equal(result.changedRows, 0);
    assert.equal(result.rows[0]?.status, 'open'); assert.equal(result.writeQueryOnly, true); store.close();
  }
});
test('tenant boundaries, closed custom tools and blocked SQL prevent bypass', () => {
  const { store } = fixture(), acme = store.create('alice'), other = store.create('bob');
  assert.throws(() => store.query(acme.sessionId, 'alice', { operation: 'read', orderId: 'O-B1' }), /host-selected tenant/);
  assert.throws(() => store.snapshot(acme.sessionId, 'bob'), /foreign/);
  assert.equal(store.snapshot(other.sessionId, 'bob').rows[0]?.id, 'O-B1');
  assert.equal(store.blockedSql(acme.sessionId, 'alice').blocked, true);
  const result = store.handleTool(acme.sessionId, 'alice', 'sevt_123', 'read_order', { orderId: 'O-A1', sql: 'DROP TABLE orders' });
  assert.equal(result.is_error, true); assert.equal(result.custom_tool_use_id, 'sevt_123'); store.close();
});
test('HTTP route rejects arbitrary SQL and caller tenant while separate human endpoint commits', async () => {
  const { store } = fixture(), app = express(), instance = createLab63Router(store); app.use('/api/c63', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(async () => { await instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const root = `http://127.0.0.1:${address.port}/api/c63`;
  const post = (path: string, body: unknown) => fetch(`${root}/${path}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' }, body: JSON.stringify(body) });
  assert.equal((await post('sessions', { mode: 'offline', tenant: 'other' })).status, 400);
  const session = await (await post('sessions', { mode: 'offline' })).json() as { sessionId: string };
  const blocked = await (await post(`sessions/${session.sessionId}/blocked-sql`, { sql: 'DELETE FROM orders' })).json() as { blocked: boolean };
  assert.equal(blocked.blocked, true);
  const proposal = await (await post(`sessions/${session.sessionId}/query`, { operation: 'propose', orderId: 'O-A1',
    reason: 'Cancel this order.' })).json() as { proposal: { id: string } };
  const approved = await (await post(`sessions/${session.sessionId}/decision`, { proposalId: proposal.proposal.id,
    decision: 'approve' })).json() as { changedRows: number };
  assert.equal(approved.changedRows, 1);
});
