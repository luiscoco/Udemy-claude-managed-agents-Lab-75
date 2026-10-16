import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { callLab54, lab54Definitions, lintToolContract, runLab54 } from '../server/tool-design/lab54.js';
import { createLab54Router } from '../server/concepts/54-tool-design.js';

test('Zod-derived Managed custom-tool contracts are closed and linter identifies ambiguous units', () => {
  const vague = lintToolContract('vague'), explicit = lintToolContract('explicit');
  assert.equal(vague.tool.input_schema.additionalProperties, false);
  assert.equal(explicit.tool.input_schema.additionalProperties, false);
  assert.ok(vague.issues.some(issue => /integer USD cents/.test(issue)));
  assert.deepEqual(explicit.issues, []);
  assert.equal(explicit.hostMetadata.nativeAnnotationsAvailable, false);
  assert.equal(lab54Definitions.explicit.type, 'custom');
});

test('input, domain and prerequisite errors leave approval and refund ledgers unchanged', () => {
  for (const variant of ['vague', 'explicit'] as const)
    for (const scenario of ['invalid-input', 'domain-rejection', 'missing-prerequisite'] as const) {
      const result = callLab54(variant, scenario);
      assert.equal(result.steps.length, 1); assert.equal(result.steps[0]?.isError, true);
      assert.equal(result.refundCount, 0); assert.equal(result.approvalCount, 0);
      assert.match(result.steps[0]!.eventId, /^sevt_/); assert.equal(result.providerCalls, 0);
    }
});

test('correct action uses separate event and stable business keys, one approval and one refund', () => {
  const explicit = callLab54('explicit', 'correct-idempotent');
  assert.deepEqual(explicit.steps.map(step => step.isError), [false, false, true]);
  assert.equal(explicit.steps[0]?.actionKey, explicit.steps[1]?.actionKey);
  assert.notEqual(explicit.steps[0]?.eventId, explicit.steps[1]?.eventId);
  assert.equal(explicit.stableIdempotency, true); assert.equal(explicit.approvalCount, 1);
  assert.equal(explicit.refundCount, 1);
  const vague = callLab54('vague', 'correct-idempotent');
  assert.equal(vague.steps[0]?.isError, true);
  assert.equal(vague.steps[1]?.name, lab54Definitions.explicit.name);
  assert.equal(vague.refundCount, 1); assert.equal(vague.stableIdempotency, true);
  assert.equal(runLab54('vague').cases.length, 4);
});

test('closed workshop HTTP routes reject unsupported live and Agent SDK fields', async () => {
  const app = express(), instance = createLab54Router(); app.use('/api/c54', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => server.close());
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const root = `http://127.0.0.1:${address.port}/api/c54`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const post = (path: string, body: unknown) => fetch(`${root}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  assert.equal((await fetch(`${root}/facts`)).status, 403);
  assert.equal((await post('call', { variant: 'explicit', scenario: 'invalid-input', mode: 'live' })).status, 400);
  assert.equal((await post('run', { variant: 'vague', canUseTool: 'host' })).status, 400);
  const result = await (await post('call', { variant: 'explicit', scenario: 'correct-idempotent' })).json() as {
    refundCount: number; stableIdempotency: boolean };
  assert.equal(result.refundCount, 1); assert.equal(result.stableIdempotency, true);
  assert.equal((await post('run', { variant: 'vague' })).status, 200);
});
