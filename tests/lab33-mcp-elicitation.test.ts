import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { lab33FieldSchema, lab33RespondSchema } from '../shared/lab33-mcp-elicitation.js';
import { Lab33Elicitation, Lab33Error } from '../server/lib/lab33-elicitation.js';
import { createLab33Router } from '../server/concepts/33-mcp-elicitation.js';

test('real local MCP form returns one validated correlated bridge result', async () => {
  const host = new Lab33Elicitation(); try {
    const opened = await host.run('alice', { mode: 'scripted', scenario: 'valid-form' });
    assert.equal(opened.status, 'pending'); assert.equal(opened.mcpCallCount, 1);
    assert.notEqual(opened.runId, opened.consentId); assert.match(opened.customCallId, /^sevt_/);
    const body = { runId: opened.runId, mcpRequestId: opened.mcpRequestId, customCallId: opened.customCallId,
      consentId: opened.consentId, action: 'accept' as const, content: { date: '2026-10-15', quantity: 3 } };
    const done = await host.respond('alice', body);
    assert.equal(done.status, 'accepted'); assert.equal(done.answerCount, 1); assert.match(done.result ?? '', /quantity 3/);
    assert.equal(done.bridgeResult?.custom_tool_use_id, opened.customCallId); assert.equal(done.bridgeResult?.is_error, false);
    assert.throws(() => host.inspect('bob', opened.runId), Lab33Error);
    await assert.rejects(host.respond('alice', body), (error: unknown) => error instanceof Lab33Error && error.statusCode === 409);
  } finally { host.close(); }
});
test('invalid form remains pending; decline, abort and timeout close local transport', async () => {
  const host = new Lab33Elicitation(); try {
    const opened = await host.run('alice', { mode: 'scripted', scenario: 'invalid-values' });
    const base = { runId: opened.runId, mcpRequestId: opened.mcpRequestId, customCallId: opened.customCallId,
      consentId: opened.consentId };
    assert.equal(lab33FieldSchema.safeParse({ date: '2026-02-30', quantity: 3 }).success, false);
    assert.equal(lab33RespondSchema.safeParse({ ...base, action: 'accept', content: { date: '2026-10-15', quantity: 99 } }).success, false);
    assert.equal(host.inspect('alice', opened.runId).status, 'pending');
    const declined = await host.respond('alice', { ...base, action: 'decline' });
    assert.equal(declined.status, 'declined'); assert.equal(declined.bridgeResult?.is_error, true);
    const abort = await host.run('alice', { mode: 'scripted', scenario: 'abort' });
    assert.equal(host.abort('alice', abort.runId).status, 'aborted');
    const timed = await host.run('alice', { mode: 'scripted', scenario: 'timeout' });
    await new Promise(resolve => setTimeout(resolve, 1350)); assert.equal(host.inspect('alice', timed.runId).status, 'timed-out');
  } finally { host.close(); }
});
test('HTTP validates closed responses, ownership, local consent and live denial', async () => {
  const app = express(), instance = createLab33Router(); app.use('/api/c33', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c33`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object, custom: Record<string, string> = headers) => fetch(`${base}/${path}`, { method: 'POST', headers: custom, body: JSON.stringify(body) });
  assert.equal((await post('run', { mode: 'live', scenario: 'valid-form' })).status, 422);
  const response = await post('run', { mode: 'scripted', scenario: 'url-consent' }); assert.equal(response.status, 200);
  const opened = await response.json() as { runId: string; mcpRequestId: number; customCallId: string; consentId: string; consentPath: string };
  assert.equal(opened.consentPath, `/api/c33/consent/${opened.consentId}`);
  const body = { runId: opened.runId, mcpRequestId: opened.mcpRequestId, customCallId: opened.customCallId,
    consentId: opened.consentId, action: 'accept', content: { date: '2026-10-15', quantity: 2 } };
  assert.equal((await post('respond', body, { ...headers, 'X-Lab-Owner': 'bob' })).status, 404);
  assert.equal((await post('respond', { ...body, arbitraryUrl: 'https://example.com' })).status, 400);
  assert.equal((await post(`consent/${opened.consentId}`, body)).status, 200);
  assert.equal((await post(`consent/${opened.consentId}`, body)).status, 409);
});
