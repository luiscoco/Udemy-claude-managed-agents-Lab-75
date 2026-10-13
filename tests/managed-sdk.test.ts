import assert from 'node:assert/strict';
import { test } from 'node:test';
import Anthropic from '@anthropic-ai/sdk';
import { createManagedPort } from '../server/lib/managed-port.js';
import { runFoundation, fixtureOutput } from '../server/lib/managed-run.js';

test('official SDK sends beta headers, budget and prompt, decodes streamed events and maps usage', async () => {
  const requests: { method: string; path: string; body: unknown }[] = [];
  const client = new Anthropic({ apiKey: 'test-only', maxRetries: 0,
    fetch: async (input, init) => {
      const request = new Request(input, init); const url = new URL(request.url);
      assert.equal(request.headers.get('anthropic-beta'), 'managed-agents-2026-04-01');
      const text = await request.text();
      requests.push({ method: request.method, path: url.pathname, body: text ? JSON.parse(text) : null });
      if (url.pathname.endsWith('/events/stream')) {
        const events = [
          { type: 'agent.message', content: [{ type: 'text', text: fixtureOutput }] },
          { type: 'session.status_idle', stop_reason: { type: 'end_turn' } },
        ];
        return new Response(events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''),
          { headers: { 'Content-Type': 'text/event-stream' } });
      }
      return Response.json({ id: 'sesn_sdk', status: 'idle', usage: {
        input_tokens: 9, output_tokens: 18, active_seconds: 0.5, list_cost: { amount: '1', currency: 'USD' },
      } });
    },
  });
  const port = createManagedPort(client, { MANAGED_LIVE_ENABLED: 'true', ANTHROPIC_API_KEY: 'test-only', MANAGED_AGENT_ID: 'agent_test',
    MANAGED_ENVIRONMENT_ID: 'env_test', MANAGED_BUDGET_CENTS: '50' });
  const result = await runFoundation('live', port, new AbortController().signal, () => {});
  assert.equal(result.status, 'succeeded'); assert.equal(result.verified, true); assert.equal(result.cleanup, 'archived');
  assert.deepEqual(result.usage, { inputTokens: 9, outputTokens: 18, cacheReadInputTokens: null,
    activeSeconds: 0.5, listCost: { amount: '1', currency: 'USD' } });
  assert.deepEqual(requests.map(request => [request.method, request.path]), [
    ['POST', '/v1/sessions'], ['GET', '/v1/sessions/sesn_sdk/events/stream'],
    ['POST', '/v1/sessions/sesn_sdk/events'], ['GET', '/v1/sessions/sesn_sdk'], ['POST', '/v1/sessions/sesn_sdk/archive'],
  ]);
  const creation = requests[0]!.body as { budget: unknown; agent: string; environment_id: string };
  assert.deepEqual(creation.budget, { type: 'limit', max_list_cost: { amount: '50', currency: 'USD' } });
  assert.equal(creation.agent, 'agent_test'); assert.equal(creation.environment_id, 'env_test');
});

test('failed session creation is never retried or exposed as a successful run', async () => {
  let calls = 0;
  const client = new Anthropic({ apiKey: 'test-only', maxRetries: 0,
    fetch: async () => { calls++; return Response.json({ type: 'error', error: { type: 'api_error', message: 'private detail' } }, { status: 500 }); },
  });
  const port = createManagedPort(client, { MANAGED_LIVE_ENABLED: 'true', ANTHROPIC_API_KEY: 'test-only', MANAGED_AGENT_ID: 'agent_test', MANAGED_ENVIRONMENT_ID: 'env_test' });
  const result = await runFoundation('live', port, new AbortController().signal, () => {});
  assert.equal(calls, 1); assert.equal(result.status, 'failed'); assert.equal(result.sessionId, null);
  assert.doesNotMatch(result.message, /private detail/);
});
