import Anthropic from '@anthropic-ai/sdk';
import type { MessageCreateParamsNonStreaming, MessageParam } from '@anthropic-ai/sdk/resources/messages/messages';
import type { SessionCreateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { createInventoryHandler } from './lab24-harnesses.js';

const prompt = 'Reserve two NOTEBOOK units. Use the host tool and report its checked result.';
const input = z.strictObject({ sku: z.literal('NOTEBOOK'), quantity: z.number().int().min(1).max(10) });
const reserveTool = { name: 'reserve_stock', description: 'Ask the host to reserve fictional NOTEBOOK stock.',
  input_schema: { type: 'object' as const, properties: { sku: { type: 'string', const: 'NOTEBOOK' },
    quantity: { type: 'integer', minimum: 1, maximum: 10 } }, required: ['sku', 'quantity'], additionalProperties: false } };

/** Direct Messages request: no Managed session fields are accepted here. */
export function manualMessagesParams(model: string): MessageCreateParamsNonStreaming {
  return { model, max_tokens: 300, messages: [{ role: 'user', content: prompt }], tools: [reserveTool] };
}

/** Managed session request: no Messages model, max_tokens, messages or tool_runner options. */
export function managedSessionParams(agentId: string, agentVersion: number, environmentId: string): SessionCreateParams {
  return { agent: { type: 'agent', id: agentId, version: agentVersion }, environment_id: environmentId,
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } }, title: 'Lab 24 inventory comparison' };
}

export function installedHarnessMethods() {
  const client = new Anthropic({ apiKey: 'offline-probe', maxRetries: 0 });
  return { messagesCreate: typeof client.messages.create === 'function', toolRunner: typeof client.beta.messages.toolRunner === 'function',
    managedSessions: typeof client.beta.sessions.create === 'function', providerCalls: 0 as const };
}

/** Executable direct Messages loop, tested with an injected client; invocation requires a separately authorized live path. */
export async function manualMessagesLoop(client: Pick<Anthropic, 'messages'>, model: string, signal: AbortSignal) {
  const inventory = createInventoryHandler(), parameters = manualMessagesParams(model);
  const messages: MessageParam[] = [...parameters.messages];
  const effects = [] as ReturnType<typeof inventory.execute>[];
  let calls = 0, answer = '';
  for (let turn = 0; turn < 3; turn++) {
    signal.throwIfAborted();
    const response = await client.messages.create({ ...parameters, messages }, { signal, timeout: 8000 });
    const blocks = response.content.filter(block => block.type === 'text' || block.type === 'tool_use');
    messages.push({ role: 'assistant', content: blocks });
    const tools = response.content.filter(block => block.type === 'tool_use');
    if (!tools.length) { answer = response.content.filter(block => block.type === 'text').map(block => block.text).join(' ').slice(0, 300); break; }
    const results: { type: 'tool_result'; tool_use_id: string; content: string; is_error: boolean }[] = [];
    for (const use of tools) {
      if (++calls > 2) throw new Error('Host tool-call limit reached; stop the Messages loop.');
      if (use.name !== 'reserve_stock') throw new Error('Unexpected tool name.');
      const parsed = input.safeParse(use.input);
      if (!parsed.success) { results.push({ type: 'tool_result', tool_use_id: use.id, content: 'Invalid host input.', is_error: true }); continue; }
      const effect = inventory.execute({ name: 'reserve_stock', input: parsed.data }); effects.push(effect);
      results.push({ type: 'tool_result', tool_use_id: use.id, content: JSON.stringify(effect), is_error: !effect.accepted });
    }
    messages.push({ role: 'user', content: results });
  }
  return { answer, calls, effects, stock: inventory.stock, messages };
}

/** The installed helper owns Messages iteration; its callback still enforces the same host policy. */
export async function messagesToolRunner(client: Anthropic, model: string, signal: AbortSignal) {
  const inventory = createInventoryHandler(), effects = [] as ReturnType<typeof inventory.execute>[];
  let calls = 0;
  const tool = betaZodTool({ name: 'reserve_stock', description: 'Ask the host to reserve fictional NOTEBOOK stock.', inputSchema: input,
    run: (value) => {
      if (signal.aborted || ++calls > 2) throw new Error('Host tool-call limit reached.');
      const effect = inventory.execute({ name: 'reserve_stock', input: value }); effects.push(effect);
      return JSON.stringify(effect);
    } });
  const response = await client.beta.messages.toolRunner({ model, max_tokens: 300, messages: [{ role: 'user', content: prompt }], tools: [tool] },
    { signal });
  return { response, calls, effects, stock: inventory.stock };
}
