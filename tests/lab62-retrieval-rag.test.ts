import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { createLab62Router } from '../server/concepts/62-retrieval-rag.js';
import { chunks, handleKnowledgeTool, knowledgeToolDefinition, retrievalEval, searchKnowledge,
  verifyReport } from '../server/retrieval/lab62.js';

test('stable heading IDs and tenant/version filters exclude 60-day and 90-day policies before scoring', () => {
  assert.equal(new Set(chunks.map(chunk => chunk.id)).size, chunks.length);
  const results = searchKnowledge({ query: 'unused returns days', limit: 5 });
  assert.equal(results.results[0]?.id, 'doc-acme-returns#eligibility');
  assert.equal(results.results[0]?.text.includes('30 days'), true);
  assert.equal(results.results.some(item => item.text.includes('60 days') || item.text.includes('90 days')), false);
  assert.equal(knowledgeToolDefinition.input_schema.additionalProperties, false);
});
test('returned-set citation and independent 30-day policy key reject fabricated, archived and hostile claims', () => {
  const cases = retrievalEval(); assert.deepEqual(cases.map(item => item.verification.verified),
    [true, false, false, false, false]);
  const returned = searchKnowledge({ query: 'returns days', limit: 5 }).results;
  assert.equal(verifyReport({ answer: '60 days', evidence: [{ id: 'doc-acme-returns-old#eligibility',
    quote: 'Unused items could be returned within 60 days.' }] }, returned).citationsValid, false);
  assert.equal(verifyReport({ answer: '30 days', evidence: [{ id: 'doc-acme-returns#eligibility',
    quote: 'Fake quote.' }] }, returned).verified, false);
});
test('custom-tool result uses event ID while closed inputs block tenant override', () => {
  const accepted = handleKnowledgeTool('sevt_123', { query: 'return days', limit: 3 });
  assert.equal(accepted.custom_tool_use_id, 'sevt_123'); assert.equal(accepted.is_error, false);
  const denied = handleKnowledgeTool('sevt_124', { query: 'return days', limit: 3, tenant: 'other' });
  assert.equal(denied.is_error, true);
  assert.throws(() => handleKnowledgeTool('bad', { query: 'return days', limit: 3 }), /event ID/);
});
test('closed HTTP routes reject tenant selectors and return bounded evaluation evidence', async () => {
  const app = express(), instance = createLab62Router(); app.use('/api/c62', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => server.close());
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const root = `http://127.0.0.1:${address.port}/api/c62`;
  const post = (path: string, body: unknown) => fetch(`${root}/${path}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' }, body: JSON.stringify(body) });
  assert.equal((await fetch(`${root}/eval`)).status, 403);
  assert.equal((await post('search', { query: 'returns', limit: 5, tenant: 'other' })).status, 400);
  const result = await (await post('query', { question: 'What is the return period?', scenario: 'grounded' })).json() as {
    verification: { verified: boolean } }; assert.equal(result.verification.verified, true);
});
