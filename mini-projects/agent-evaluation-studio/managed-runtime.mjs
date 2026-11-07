const activeTurns = new Map();
export async function shutdownManagedTurns() {
  const pending = [...activeTurns.values()];
  for (const controller of activeTurns.keys()) controller.abort();
  await Promise.allSettled(pending);
}
globalThis[Symbol.for('managed.milestone.shutdown')] = shutdownManagedTurns;

export function managedReadiness(env = process.env) {
  const agentId = env.CLAUDE_MANAGED_AGENT_ID || env.MANAGED_AGENT_ID;
  const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID || env.MANAGED_ENVIRONMENT_ID;
  return { liveAvailable: env.MANAGED_LIVE_ENABLED === 'true' && env.MILESTONE_LIVE_ENABLED !== 'false' &&
    !!env.ANTHROPIC_API_KEY?.trim() && !!agentId?.trim() && !!environmentId?.trim(), agentId, environmentId };
}
export async function runManagedTurn({ prompt, system, model = 'claude-haiku-4-5', maxBudgetUsd = .2,
  eventLimit = 500, mcpServers = [], tools = [], image = null, signal, title = 'Managed milestone question' },
  { client, env = process.env, deadlineMs = 120000 } = {}) {
  const ready = managedReadiness(env);
  if (!ready.liveAvailable) throw Error('Configure ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID, CLAUDE_MANAGED_ENVIRONMENT_ID and MANAGED_LIVE_ENABLED=true on the server.');
  if (!Number.isFinite(maxBudgetUsd) || maxBudgetUsd < .01 || maxBudgetUsd > 2 || !Number.isInteger(eventLimit) || eventLimit < 1 || eventLimit > 1000) throw Error('Invalid Managed session limits.');
  let sdk = client;
  if (!sdk) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    sdk = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 15000,
      openTelemetry: { propagation: false, traces: { enabled: false } } });
  }
  const sessions = sdk.beta.sessions, controller = new AbortController();
  const abort = () => controller.abort(); signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const timer = setTimeout(abort, Math.min(deadlineMs, 120000));
  let finish;
  activeTurns.set(controller, new Promise(resolve => { finish = resolve; }));
  const result = { answer: '', sessionId: null, subtype: 'managed_incomplete', stopReason: null, isError: true,
    events: [], modelCalls: null, mcpToolCalls: 0, specialistCalls: 0, costUsd: null, usage: null, cleanup: 'not-needed' };
  let stream, completed = false; const seen = new Set();
  try {
    controller.signal.throwIfAborted();
    const session = await sessions.create({ agent: { type: 'agent_with_overrides', id: ready.agentId,
      model, system, tools, mcp_servers: mcpServers, skills: [] }, environment_id: ready.environmentId,
      title, budget: { type: 'limit', max_list_cost: { amount: String(Math.round(maxBudgetUsd * 100)), currency: 'USD' } } });
    result.sessionId = session.id; result.cleanup = 'pending';
    result.events.push({ type: 'session.created', label: 'Managed session created', detail: session.id });
    controller.signal.throwIfAborted();
    stream = await sessions.events.stream(session.id, {}, { signal: controller.signal });
    const content = [{ type: 'text', text: prompt }];
    if (image) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: image.bytes.toString('base64') } });
    await sessions.events.send(session.id, { events: [{ type: 'user.message', content }] }, { signal: controller.signal });
    let count = 0, modelRequests = 0;
    for await (const event of stream) {
      controller.signal.throwIfAborted();
      if (event.type === 'event_start' || event.type === 'event_delta') continue;
      if (event.id && seen.has(event.id)) continue;
      if (event.id) seen.add(event.id);
      if (++count > eventLimit) { result.subtype = 'host_event_limit'; break; }
      if (event.type === 'span.model_request_start') modelRequests++;
      if (event.type === 'agent.mcp_tool_use') result.mcpToolCalls++;
      // Thread-specific text is separate evidence and must not become the primary answer.
      if (event.type === 'agent.message' && !event.session_thread_id) {
        result.answer += (event.content || []).filter(block => block.type === 'text').map(block => block.text).join('\n') + '\n';
        if (result.answer.length > 32000) { result.answer = result.answer.slice(0, 32000); result.subtype = 'host_output_limit'; break; }
      }
      result.events.push({ type: event.type, label: event.type, detail: event.type === 'session.status_idle' ? event.stop_reason?.type || 'unknown' : event.id || '' });
      if (event.type === 'session.status_idle') {
        result.stopReason = event.stop_reason?.type || 'unknown'; result.subtype = result.stopReason;
        completed = result.stopReason === 'end_turn'; result.isError = !completed || !result.answer.trim(); break;
      }
      if (event.type === 'session.error' || event.type === 'session.status_terminated' || event.type.startsWith('workflow_run.')) {
        result.subtype = 'managed_error'; break;
      }
    }
    result.modelCalls = modelRequests || null;
  } catch {
    result.subtype = controller.signal.aborted ? 'host_cancelled_or_deadline' : 'managed_error';
    result.events.push({ type: 'error', label: 'Managed request stopped', detail: 'No automatic retry was made.' });
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort', abort); stream?.controller?.abort();
    if (result.sessionId) {
      try {
        // Cleanup uses independent requests after local cancellation.
        if (!completed) await sessions.events.send(result.sessionId, { events: [{ type: 'user.interrupt' }] }, { timeout: 3000 });
        let state = await sessions.retrieve(result.sessionId, {}, { timeout: 3000 });
        const end = Date.now() + 5000;
        while (!['idle', 'terminated'].includes(state.status) && Date.now() < end) {
          await new Promise(resolve => setTimeout(resolve, 200));
          state = await sessions.retrieve(result.sessionId, {}, { timeout: 3000 });
        }
        result.usage = state.usage || null;
        const cost = state.usage?.list_cost;
        if (cost?.currency === 'USD' && /^\d+$/.test(cost.amount)) result.costUsd = Number(cost.amount) / 100;
        if (state.status === 'idle') { await sessions.archive(result.sessionId, {}, { timeout: 3000 }); result.cleanup = 'archived'; }
        else if (state.status === 'terminated') result.cleanup = 'terminated';
      } catch { /* Retain the session identifier and pending cleanup receipt. */ }
      result.events.push({ type: 'cleanup', label: 'Managed session cleanup', detail: result.cleanup });
    }
    controller.abort(); activeTurns.delete(controller); finish();
  }
  return result;
}
