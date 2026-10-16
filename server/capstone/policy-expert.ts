import { randomUUID } from 'node:crypto';
import { CapstoneStore } from './store.js';
import type { CustomerId } from './store.js';
import { handleCapstoneTool } from './tools.js';

export class ScriptedPolicyExpert {
  readonly sessionId = `sesn_fixture_policy_${randomUUID().replaceAll('-', '')}`;
  readonly allowedTools = ['search_policy'] as const;
  readonly usage = null;
  lastResult: 'not-run' | 'read' | 'denied' = 'not-run';
  call(store: CapstoneStore, context: { owner: string; customerId: CustomerId; conversationId: string }, name: string,
    input: unknown) { if (name !== 'search_policy') { this.lastResult = 'denied'; return { isError: true, text: 'Policy expert is read-only.' }; }
    const result = handleCapstoneTool(store, context, { id: `sevt_policy_${randomUUID().replaceAll('-', '')}`, name, input });
    this.lastResult = result.is_error ? 'denied' : 'read'; return { isError: result.is_error, text: result.content[0].text }; }
}
