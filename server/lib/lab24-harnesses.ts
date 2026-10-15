import { lab24RequestSchema, lab24ResultSchema } from '../../shared/lab24-harnesses.js';
import type { Lab24Request, Lab24Result } from '../../shared/lab24-harnesses.js';

const stockInput = { sku: 'NOTEBOOK' as const };
type Call = { name: 'get_stock'; input: typeof stockInput } | { name: 'reserve_stock'; input: typeof stockInput & { quantity: number } };
type Wire = { type: 'messages.tool_use'; call: Call } | { type: 'runner.invoke'; call: Call } |
  { type: 'managed.custom_tool_use'; call: Call };
const adapter = { 'messages.tool_use': 'messages-tool-use', 'runner.invoke': 'messages-runner-callback',
  'managed.custom_tool_use': 'managed-custom-tool-use' } as const;
const owners = { 'manual-messages': 'application', 'messages-tool-runner': 'sdk-tool-runner',
  'managed-session': 'managed-harness' } as const;

/** Distinct wire event types are normalized before one host policy and effect boundary. */
function fixtureEvents(request: Lab24Request): Wire[] {
  const type = request.harness === 'manual-messages' ? 'messages.tool_use' : request.harness === 'messages-tool-runner' ? 'runner.invoke' : 'managed.custom_tool_use';
  const quantity = request.scenario === 'large-reservation' ? 5 : 2;
  const calls: Call[] = request.scenario === 'call-limit'
    ? [{ name: 'get_stock', input: stockInput }, { name: 'reserve_stock', input: { ...stockInput, quantity } }]
    : [{ name: 'reserve_stock', input: { ...stockInput, quantity } }];
  return calls.map(call => ({ type, call }) as Wire);
}

/** This handler is the only writer of inventory. Model or fixture text has no path to state. */
export function createInventoryHandler() {
  let stock = 5;
  const execute = (call: Call) => {
    const before = stock;
    if (call.name === 'get_stock') return { tool: call.name, sku: call.input.sku, quantity: 0, before, after: stock,
      accepted: true, reason: 'Read-only stock check.' };
    const quantity = call.input.quantity;
    const accepted = Number.isInteger(quantity) && quantity >= 1 && quantity <= 2 && quantity <= stock;
    if (accepted) stock -= quantity;
    return { tool: call.name, sku: call.input.sku, quantity, before, after: stock, accepted,
      reason: accepted ? 'Host reservation accepted.' : 'Host policy allows 1 or 2 units within available stock.' };
  };
  return { execute, get stock() { return stock; } };
}

export async function runLab24(input: Lab24Request, signal?: AbortSignal): Promise<Lab24Result> {
  const request = lab24RequestSchema.parse(input);
  if (request.mode !== 'scripted') throw new Error('Live runs require a separately configured provider path.');
  const inventory = createInventoryHandler();
  const trace: Lab24Result['trace'] = [{ stage: 'request', adapter: 'host',
    detail: `Reserve 2 fictional NOTEBOOK units; scenario ${request.scenario}; limit ${request.callLimit}.` }];
  const effects: Lab24Result['effects'] = [];
  let toolCalls = 0, outcome: Lab24Result['outcome'] = 'rejected';
  for (const event of fixtureEvents(request)) {
    if (signal?.aborted) throw signal.reason ?? new Error('Run cancelled.');
    if (toolCalls >= request.callLimit) { outcome = 'call-limit'; trace.push({ stage: 'call', adapter: 'host', detail: 'Host call-count limit reached before dispatch.' }); break; }
    toolCalls++;
    trace.push({ stage: 'call', adapter: adapter[event.type], detail: `${event.call.name}(${JSON.stringify(event.call.input)})` });
    const effect = inventory.execute(event.call);
    effects.push(effect);
    trace.push({ stage: 'checked-effect', adapter: 'host', detail: `${effect.reason} Stock ${effect.before} -> ${effect.after}.` });
    trace.push({ stage: 'result', adapter: adapter[event.type], detail: effect.accepted ? 'Checked host result returned.' : 'Host rejection returned as tool error.' });
    if (event.call.name === 'reserve_stock') outcome = effect.accepted ? 'reserved' : 'rejected';
  }
  const answer = outcome === 'reserved' ? 'The host reserved 2 NOTEBOOK units.' : outcome === 'call-limit'
    ? 'The host stopped at the call-count limit; no reservation was made.' : 'The host rejected the large reservation; no stock changed.';
  trace.push({ stage: 'answer', adapter: 'host', detail: `${answer} This fixture answer is not inventory evidence.` });
  trace.push({ stage: 'cleanup', adapter: 'host', detail: 'Local fixture and handler released; no remote session existed.' });
  return lab24ResultSchema.parse({ source: 'authored-fixture', harness: request.harness, scenario: request.scenario,
    loopOwner: owners[request.harness], outcome, providerCalls: 0, toolCalls, stock: inventory.stock, answer, trace, effects,
    cleanup: 'local-run-complete' });
}
