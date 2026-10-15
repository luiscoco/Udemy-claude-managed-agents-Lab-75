import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { Lab43Bridge, Lab43Error } from '../server/lib/lab43-mcp-bridge.js';
import { createLab43Router } from '../server/concepts/43-remote-mcp-resources.js';

test('loopback MCP lists tools, resources, templates and prompts with server-side consent', async () => {
  const bridge = new Lab43Bridge(); try {
    await bridge.auth('alice', true);
    const tools = await bridge.inventory('alice', 'tools/list');
    assert.match(JSON.stringify(tools.result), /read_approved_resource/);
    assert.match(JSON.stringify((await bridge.inventory('alice', 'resources/list')).result), /lab43:\/\/observations\/v1/);
    assert.match(JSON.stringify((await bridge.inventory('alice', 'resources/templates/list')).result), /\{version\}/);
    assert.match(JSON.stringify((await bridge.inventory('alice', 'prompts/list')).result), /summarize-observations/);
    assert.equal(bridge.toolsets('alice').directManagedUrlMcp.configured, false);
  } finally { await bridge.close(); }
});

test('host read bounds an approved version and formats a typed custom tool result', async () => {
  const bridge = new Lab43Bridge(); try { await bridge.auth('alice', true);
    const first = await bridge.run('alice', 'versioned-resource'); assert.equal(first.resourceVersion, 1);
    assert.equal(first.status, 'allowed'); assert.equal(first.customToolResult?.type, 'user.custom_tool_result');
    assert.match(first.result ?? '', /count: 3/); assert.ok(first.resultBytes <= 1200);
    const second = await bridge.run('alice', 'allowed-template'); assert.equal(second.resourceVersion, 2);
    assert.match(second.result ?? '', /count: 4/);
    const prompted = await bridge.run('alice', 'known-prompt'); assert.match(prompted.result ?? '', /Summarize/);
    assert.equal(prompted.providerCalls, 0);
  } finally { await bridge.close(); }
});

test('bad token, expiry and unknown URI refuse before privileged result', async () => {
  let now = 1000; const bridge = new Lab43Bridge(() => now); try { await bridge.auth('alice', true);
    const bad = await bridge.run('alice', 'bad-token'); assert.equal(bad.status, 'refused'); assert.equal(bad.customToolResult, null);
    const unknown = await bridge.run('alice', 'unknown-uri'); assert.equal(unknown.status, 'refused'); assert.equal(unknown.result, null);
    now = 40_000; await assert.rejects(bridge.inventory('alice', 'resources/list'), Lab43Error);
    const expired = await bridge.run('alice', 'versioned-resource'); assert.equal(expired.tokenStatus, 'expired');
    await bridge.auth('alice', true, true); assert.equal((await bridge.run('alice', 'versioned-resource')).status, 'allowed');
  } finally { await bridge.close(); }
});

test('HTTP consent, owner gates and closed requests keep token server-side', async () => {
  const app = express(), instance = createLab43Router(); app.use('/api/c43', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c43`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object, custom: Record<string, string> = headers) => fetch(`${base}/${path}`, { method: 'POST', headers: custom, body: JSON.stringify(body) });
  assert.equal((await post('host-read', { scenario: 'versioned-resource' })).status, 403);
  assert.equal((await post('auth', { consent: true, token: 'client-chosen' })).status, 400);
  const auth = await (await post('auth', { consent: true })).json() as Record<string, unknown>;
  assert.equal('token' in auth, false); assert.match(String(auth.tokenPreview), /redacted/);
  assert.equal((await post('host-read', { scenario: 'versioned-resource' }, { ...headers, 'X-Lab-Owner': 'bob' })).status, 403);
  assert.equal((await post('host-read', { scenario: 'versioned-resource' })).status, 200);
  assert.equal((await post('live', {})).status, 422);
});
