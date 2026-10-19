import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { captureLab64Screenshot, createLab64Router } from '../server/concepts/64-browser-playwright-mcp.js';

const app = express(); const feature = createLab64Router(); app.use('/api/c64', feature.router);
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
after(async () => { await feature.close(); await new Promise<void>(resolve => server.close(() => resolve())); });
const address = server.address(); if (!address || typeof address === 'string') throw new Error('No test port');
const base = `http://127.0.0.1:${address.port}/api/c64`;
const owner = 'lab64-test-owner';
async function run(scenario: string, headerOwner = owner) { const response = await fetch(`${base}/run`, { method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': headerOwner }, body: JSON.stringify({ scenario }) });
  return { response, data: await response.json() }; }

test('closed schema and local owner boundary', async () => {
  assert.equal((await run('arbitrary')).response.status, 400);
  assert.equal((await run('inspect-product', '../bad')).response.status, 403);
  const response = await fetch(`${base}/facts`, { headers: { 'X-Lab-Owner': owner } });
  assert.equal((await response.json()).providerCalls, 0);
});
test('real MCP navigation verifies product DOM and owner-scoped screenshot', async () => {
  const { response, data } = await run('inspect-product');
  assert.equal(response.status, 200, JSON.stringify(data)); assert.equal(data.verified, true);
  assert.equal(data.product, 'Aurora Finch Field Kit');
  assert.equal(data.calls, data.events.some((event: string) => event.includes('retrying once')) ? 4 : 3);
  const proof = `${base}/artifacts/${data.proofId}/proof.png`;
  const own = await fetch(proof, { headers: { 'X-Lab-Owner': owner } });
  assert.equal(own.status, 200); assert.equal(own.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await own.arrayBuffer()).subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal((await fetch(proof, { headers: { 'X-Lab-Owner': 'other-owner' } })).status, 404);
});
test('form effect, external navigation refusal, and missing browser are distinct', async () => {
  const form = await run('fill-form'); assert.equal(form.response.status, 200, JSON.stringify(form.data));
  assert.equal(form.data.confirmation, 'Request saved for Ada Finch');
  assert.equal(form.data.calls, form.data.events.some((event: string) => event.includes('retrying once')) ? 7 : 6);
  const blocked = await run('blocked-navigation'); assert.equal(blocked.response.status, 200, JSON.stringify(blocked.data));
  assert.equal(blocked.data.outcome, 'blocked'); assert.equal(blocked.data.verified, true);
  const missing = await run('missing-browser'); assert.equal(missing.data.verified, false);
  assert.equal(missing.data.source, 'local-fixture');
});

test('screenshot recovery retries only the exact transient capture error once', async () => {
  const transient = { isError: true, content: [{ type: 'text', text: 'Protocol error (Page.captureScreenshot): Unable to capture screenshot' }] };
  const success = { isError: false, content: [{ type: 'image', data: 'captured' }] };
  let attempts = 0, recoveries = 0;
  assert.equal(await captureLab64Screenshot(async () => ++attempts === 1 ? transient : success, async () => { recoveries++; }), success);
  assert.equal(attempts, 2); assert.equal(recoveries, 1);
  attempts = 0; recoveries = 0;
  assert.equal(await captureLab64Screenshot(async () => { attempts++; return transient; }, async () => { recoveries++; }), transient);
  assert.equal(attempts, 2); assert.equal(recoveries, 1);
  for (const result of [success, { isError: true, content: [{ type: 'text', text: 'Navigation refused' }] }]) {
    attempts = 0;
    assert.equal(await captureLab64Screenshot(async () => { attempts++; return result; }, async () => { throw new Error('Unexpected retry'); }), result);
    assert.equal(attempts, 1);
  }
});
