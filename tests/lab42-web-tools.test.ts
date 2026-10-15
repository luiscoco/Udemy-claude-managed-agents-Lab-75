import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { documentedWebConfigs, guardResolvedAddresses, guardUrl, Lab42Error, Lab42Research, verifyCitations } from '../server/lib/lab42-research.js';
import { createLab42Router } from '../server/concepts/42-web-tools.js';

test('installed Managed web config names documented fields and disables unrestricted fetch', () => {
  assert.equal(documentedWebConfigs.search.name, 'web_search');
  assert.equal(documentedWebConfigs.fetch.name, 'web_fetch'); assert.equal(documentedWebConfigs.fetch.enabled, false);
  assert.equal(documentedWebConfigs.fetch.max_content_tokens, 1200);
  assert.deepEqual(documentedWebConfigs.fetch.url_sources, { user_input: 'none', client_tool_results: 'none', server_tool_results: 'none' });
});

test('URL, private address and redirect target checks refuse unsafe fetches', () => {
  assert.equal(guardUrl('https://docs.example.invalid/overview'), 'https://docs.example.invalid/overview');
  for (const url of ['http://docs.example.invalid/overview', 'https://127.0.0.1/private', 'https://docs.example.invalid:444/overview',
    'https://user@docs.example.invalid/overview', 'https://docs.example.invalid.evil.test/']) assert.throws(() => guardUrl(url), Lab42Error);
  for (const ip of ['127.0.0.1', '10.0.0.5', '169.254.2.3', '172.16.0.1', '192.168.0.2', '::1', 'not-an-ip'])
    assert.throws(() => guardResolvedAddresses([ip]), Lab42Error);
  assert.deepEqual(guardResolvedAddresses(['93.184.216.34']), ['93.184.216.34']);
  const manager = new Lab42Research(); try {
    const redirect = manager.run('alice', 'redirect'); assert.equal(redirect.decision, 'refused');
    assert.equal(redirect.requestCount, 1); assert.equal(redirect.sources.length, 0);
    assert.match(redirect.redirects[0] ?? '', /127\.0\.0\.1/);
    const blocked = manager.run('alice', 'blocked-host'); assert.equal(blocked.requestCount, 0);
  } finally { manager.close(); }
});

test('hostile page stays untrusted data; only inspected evidence IDs support citations', () => {
  const manager = new Lab42Research(); try {
    const hostile = manager.run('alice', 'injection'); assert.equal(hostile.sources[0]?.hostileInstruction, true);
    assert.equal(hostile.tools.bash, false); assert.equal(hostile.tools.builtInWebFetch, false);
    assert.equal(hostile.citationsVerified, true); assert.doesNotMatch(hostile.answer, /IGNORE HOST RULES/);
    assert.equal(verifyCitations(['source-999'], hostile.sources), false);
    assert.equal(verifyCitations(hostile.citations, hostile.sources.map(source => ({ ...source, inspected: false }))), false);
    const snippet = manager.run('alice', 'basics'); assert.equal(snippet.sources[0]?.kind, 'snippet');
    const page = manager.run('alice', 'fetch'); assert.equal(page.sources[0]?.kind, 'complete-page');
    assert.equal(page.requestCount <= page.maxRequests, true);
  } finally { manager.close(); }
});

test('closed HTTP routes reject live and foreign state, report host evidence', async () => {
  const app = express(), instance = createLab42Router(); app.use('/api/c42', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c42`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: object) => fetch(`${base}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  assert.equal((await post('research', { mode: 'live', scenario: 'research' })).status, 422);
  assert.equal((await post('research', { mode: 'scripted', scenario: 'research', proxy: 'localhost' })).status, 400);
  const opened = await (await post('research', { mode: 'scripted', scenario: 'research' })).json() as { runId: string; citationsVerified: boolean };
  assert.equal(opened.citationsVerified, true);
  assert.equal((await fetch(`${base}/state?runId=${opened.runId}`, { headers: { 'X-Lab-Owner': 'bob' } })).status, 404);
  assert.equal((await fetch(`${base}/state?runId=${opened.runId}`, { headers })).status, 200);
  assert.equal((await fetch(`${base}/facts`, { headers })).status, 200);
});
