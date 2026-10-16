import { lab61StructuredSchema } from '../../shared/lab61-agent-mcp-server.js';
import type { Lab61McpBridge } from './lab61.js';

type Scenario = 'normal' | 'timeout' | 'cancel' | 'concurrent';
export async function runLocalMcpClient(baseUrl: string, bridge: Lab61McpBridge, owner: string, scenario: Scenario) {
  const bearer = bridge.ownerToken(owner), headers = { Authorization: `Bearer ${bearer}`,
    'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
  const rpc = (id: number, method: string, params: unknown = {}) => JSON.stringify({ jsonrpc: '2.0', id, method, params });
  const start = await fetch(baseUrl, { method: 'POST', headers, body: rpc(101, 'initialize', {
    protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'lab61-local-client', version: '0.1.0' } }),
    signal: AbortSignal.timeout(2000) });
  if (!start.ok) throw new Error('Local MCP initialize failed.');
  const mcpSessionId = start.headers.get('mcp-session-id'); if (!mcpSessionId) throw new Error('MCP session ID missing.');
  const init = await start.json() as { id: number; result: { protocolVersion: string } };
  const sessionHeaders = { ...headers, 'Mcp-Session-Id': mcpSessionId, 'Mcp-Protocol-Version': '2025-11-25' };
  const post = (id: number, method: string, params: unknown, signal?: AbortSignal) => fetch(baseUrl, {
    method: 'POST', headers: sessionHeaders, body: rpc(id, method, params), ...(signal ? { signal } : {}) });
  const readCall = async (response: Response) => {
    if (!response.ok) return { progress: 0, result: await response.json() as unknown };
    if (!String(response.headers.get('content-type')).includes('text/event-stream'))
      return { progress: 0, result: (await response.json() as { result: unknown }).result };
    const body = await response.text(); const frames = body.split('\n\n').flatMap(frame => {
      const data = frame.split('\n').find(line => line.startsWith('data: '));
      return data ? [JSON.parse(data.slice(6)) as { method?: string; result?: unknown }] : []; });
    return { progress: frames.filter(frame => frame.method === 'notifications/progress').length,
      result: frames.find(frame => frame.result)?.result ?? null };
  };
  try {
    const list = await post(102, 'tools/list', {}); if (!list.ok) throw new Error('Tool discovery failed.');
    const inventory = await list.json() as { id: number; result: { tools: { name: string }[] } };
    const input = { name: 'review_support_refund', arguments: { orderId: 'O-1001',
      question: 'Is the fictional damaged unused item refundable?', scenario: scenario === 'normal' ? 'normal' : 'slow' } };
    let progress = 0, result: unknown = null, cancellation = false, concurrentRejected = false;
    if (scenario === 'cancel') {
      const controller = new AbortController(); const pending = post(103, 'tools/call', input, controller.signal);
      setTimeout(() => controller.abort(), 30);
      try { await readCall(await pending); } catch { cancellation = true; }
    } else if (scenario === 'concurrent') {
      const first = post(103, 'tools/call', input); await new Promise(resolve => setTimeout(resolve, 20));
      const second = await post(104, 'tools/call', input); concurrentRejected = second.status === 409;
      result = (await readCall(await first)).result;
    } else if (scenario === 'timeout') result = (await readCall(await post(103, 'tools/call', input))).result;
    else {
      const call = await post(103, 'tools/call', input); if (!call.ok) throw new Error('MCP tool call failed.');
      const read = await readCall(call); progress = read.progress; result = read.result;
    }
    const output = result && typeof result === 'object' && 'structuredContent' in result ?
      lab61StructuredSchema.parse((result as { structuredContent: unknown }).structuredContent) : null;
    return { source: 'local-mcp-client', scenario, transportRequestIds: [init.id, inventory.id, 103],
      mcpSessionId, agentSessionId: output?.agentSessionId ?? null, toolNames: inventory.result.tools.map(tool => tool.name),
      progressEvents: progress, structuredResponse: output, cancellation, concurrentRejected,
      timeout: scenario === 'timeout' && Boolean(result && typeof result === 'object' && 'isError' in result &&
        (result as { isError: unknown }).isError === true), providerCalls: 0,
      note: 'Local HTTP MCP 2025-11-25 subset; no Managed agent was started and token stays server-side.' };
  } finally { await fetch(baseUrl, { method: 'DELETE', headers: sessionHeaders }).catch(() => {}); }
}
