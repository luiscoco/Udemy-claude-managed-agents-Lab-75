import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { createLab61Router } from '../server/concepts/61-agent-as-mcp-server.js';
import { Lab61McpBridge, handleManagedReviewTool, managedToolDefinition } from '../server/mcp-agent/lab61.js';

async function fixture() { const bridge = new Lab61McpBridge(), app = express(), instance = createLab61Router(bridge);
  app.use('/api/c61', instance.router); const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  after(async () => { await instance.close(); server.close(); });
  return { bridge, root: `http://127.0.0.1:${address.port}/api/c61` }; }
const rpc = (id: number, method: string, params: unknown = {}) => JSON.stringify({ jsonrpc: '2.0', id, method, params });
test('Managed custom-tool facade keeps event ID distinct and host customer binding authoritative', () => {
  assert.equal(managedToolDefinition.type, 'custom');
  const input = { orderId: 'O-1001', question: 'Can this fictional order be refunded?' };
  const accepted = handleManagedReviewTool({ tenant: 'A', customerId: 'C-1' },
    { id: 'sevt_abc', name: 'review_support_refund', input });
  assert.equal(accepted.custom_tool_use_id, 'sevt_abc'); assert.equal(accepted.is_error, false);
  const denied = handleManagedReviewTool({ tenant: 'B', customerId: 'C-2' },
    { id: 'sevt_def', name: 'review_support_refund', input });
  assert.equal(denied.is_error, true);
  assert.throws(() => handleManagedReviewTool({ tenant: 'A', customerId: 'C-1' },
    { id: 'bad', name: 'review_support_refund', input }), /event ID/);
});
test('auth before session lookup and foreign bearer cannot reuse MCP session', async () => {
  const { bridge, root } = await fixture(), ownToken = bridge.ownerToken('alice'), foreignToken = bridge.alternateToken();
  const init = await fetch(`${root}/mcp`, { method: 'POST', headers: { Authorization: `Bearer ${ownToken}`,
    'Content-Type': 'application/json' }, body: rpc(1, 'initialize', { protocolVersion: '2025-11-25',
      capabilities: {}, clientInfo: { name: 'test', version: '1' } }) });
  assert.equal(init.status, 200); const session = init.headers.get('mcp-session-id'); assert.ok(session);
  const call = (bearer: string) => fetch(`${root}/mcp`, { method: 'POST', headers: { Authorization: `Bearer ${bearer}`,
    'Content-Type': 'application/json', 'Mcp-Session-Id': session, 'Mcp-Protocol-Version': '2025-11-25' },
    body: rpc(2, 'tools/list') });
  assert.equal((await call('wrong-token')).status, 403);
  assert.equal((await call(foreignToken)).status, 404);
  const listed = await (await call(ownToken)).json() as { result: { tools: { name: string; inputSchema: Record<string, unknown> }[] } };
  assert.deepEqual(listed.result.tools.map(tool => tool.name), ['review_support_refund']);
  assert.equal(listed.result.tools[0]?.inputSchema.additionalProperties, false);
});
test('local MCP client separates IDs, validates output, progress, timeout, cancel and concurrency', async () => {
  const { root } = await fixture(); const post = async (scenario: string) => {
    const response = await fetch(`${root}/demo`, { method: 'POST', headers: { 'Content-Type': 'application/json',
      'X-Lab-Owner': 'alice' }, body: JSON.stringify({ scenario }) });
    assert.equal(response.status, 200); return response.json() as Promise<Record<string, unknown>>; };
  const normal = await post('normal'); assert.equal(normal.progressEvents, 2);
  assert.notEqual(normal.mcpSessionId, normal.agentSessionId); assert.equal(normal.providerCalls, 0);
  assert.deepEqual(normal.transportRequestIds, [101, 102, 103]);
  assert.equal((normal.structuredResponse as { eligible: boolean }).eligible, true);
  assert.equal((await post('timeout')).timeout, true);
  assert.equal((await post('cancel')).cancellation, true);
  assert.equal((await post('concurrent')).concurrentRejected, true);
});
test('closed demo route rejects caller-selected workspace and token fields', async () => {
  const { root } = await fixture();
  assert.equal((await fetch(`${root}/facts`)).status, 403);
  const response = await fetch(`${root}/demo`, { method: 'POST', headers: { 'Content-Type': 'application/json',
    'X-Lab-Owner': 'alice' }, body: JSON.stringify({ scenario: 'normal', workspace: 'C:/secret', token: 'x' }) });
  assert.equal(response.status, 400);
});
