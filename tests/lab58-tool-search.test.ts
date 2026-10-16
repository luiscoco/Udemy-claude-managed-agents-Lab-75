import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { createLab58Router } from '../server/concepts/58-tool-search.js';
import { invokeCatalogTool, measureCatalog, planCatalog, searchCatalog, tools } from '../server/tool-search/lab58.js';

test('64 definitions, names-only plan and bounded host metadata ranking', () => {
  assert.equal(tools.length, 64); assert.equal(new Set(tools.map(tool => tool.name)).size, 64);
  const plan = planCatalog(); assert.equal(plan.loadedDefinitions, 0); assert.equal(plan.providerCalls, 0);
  const compared = measureCatalog('refund invoice INV-2042');
  assert.equal(compared.good.results[0]?.name, 'billing_refund_invoice');
  assert.equal(compared.vague.results[0]?.name, 'billing_refund_invoice');
  assert.ok(compared.good.results[0]!.score > compared.vague.results[0]!.score);
  assert.ok(compared.good.results.length <= 5);
  assert.equal(searchCatalog({ query: 'refund invoice', variant: 'good', limit: 1 }).results.length, 1);
});

test('closed dispatcher rejects wrong tool, malformed input and unauthorized context', () => {
  const input = { invoiceId: 'INV-2042', amountCents: 1250 };
  assert.equal(invokeCatalogTool({ scenario: 'authorized', name: 'unknown_tool', input }, 'alice').accepted, false);
  assert.equal(invokeCatalogTool({ scenario: 'authorized', name: 'billing_refund_invoice',
    input: { ...input, authorization: 'forced' } }, 'alice').accepted, false);
  assert.equal(invokeCatalogTool({ scenario: 'unauthorized', name: 'billing_refund_invoice', input }, 'alice').effect, 'none');
  assert.equal(invokeCatalogTool({ scenario: 'authorized', name: 'billing_refund_invoice', input }, 'alice').effect, 'recorded-once');
  assert.equal(invokeCatalogTool({ scenario: 'authorized', name: 'billing_refund_invoice', input }, 'alice').effect, 'already-recorded');
  assert.equal(invokeCatalogTool({ scenario: 'authorized', name: 'billing_refund_invoice', input }, 'bob').effect, 'recorded-once');
});

test('HTTP inventory, search and dispatch reject invented native settings and require an owner', async () => {
  const app = express(), instance = createLab58Router(); app.use('/api/c58', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => server.close());
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const root = `http://127.0.0.1:${address.port}/api/c58`;
  const post = (path: string, body: unknown) => fetch(`${root}/${path}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' }, body: JSON.stringify(body) });
  assert.equal((await fetch(`${root}/facts`)).status, 403);
  assert.equal((await post('search', { query: 'refund', variant: 'good', limit: 5, alwaysLoad: true })).status, 400);
  assert.equal((await post('plan', { auto: 5 })).status, 400);
  const result = await (await post('search', { query: 'billing refund invoice', variant: 'good', limit: 5 })).json() as { results: unknown[] };
  assert.ok(result.results.length <= 5);
});
