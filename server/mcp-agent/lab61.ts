import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { lab61StructuredSchema, lab61ToolInputSchema } from '../../shared/lab61-agent-mcp-server.js';

type Identity = { tenant: string; customerId: 'C-1' | 'C-2' };
type ClientSession = { id: string; identity: Identity; active: boolean; expiresAt: number; controller: AbortController | null };
const rpc = z.strictObject({ jsonrpc: z.literal('2.0'), id: z.union([z.string(), z.number()]).optional(),
  method: z.string().min(1).max(60), params: z.record(z.string(), z.unknown()).optional() });
const initParams = z.strictObject({ protocolVersion: z.literal('2025-11-25'), capabilities: z.record(z.string(), z.unknown()),
  clientInfo: z.strictObject({ name: z.string().min(1).max(80), version: z.string().min(1).max(30) }) });
const callParams = z.strictObject({ name: z.literal('review_support_refund'), arguments: lab61ToolInputSchema });
const toolSchema = (() => { const { $schema: _dialect, ...inputSchema } = z.toJSONSchema(lab61ToolInputSchema,
  { target: 'draft-2020-12', io: 'input' }); return inputSchema; })();
const outputSchema = (() => { const { $schema: _dialect, ...schema } = z.toJSONSchema(lab61StructuredSchema,
  { target: 'draft-2020-12', io: 'output' }); return schema; })();
export const managedToolDefinition = { type: 'custom' as const, name: 'review_support_refund',
  description: 'Review one host-owned fictional customer order; no payment effect.', input_schema: toolSchema };
export function handleManagedReviewTool(identity: Identity, call: { id: string; name: string; input: unknown }) {
  if (!/^sevt_[A-Za-z0-9_-]{1,80}$/.test(call.id)) throw new Error('Invalid Managed custom-tool event ID.');
  const parsed = call.name === managedToolDefinition.name ? lab61ToolInputSchema.safeParse(call.input) : null;
  const error = !parsed?.success ? 'Closed support-tool input rejected.' :
    identity.customerId !== 'C-1' ? 'Order does not belong to host-selected customer.' : null;
  const report = error ? null : lab61StructuredSchema.parse({ caseStatus: 'reviewed', orderId: 'O-1001', eligible: true,
    amountCents: 1200, summary: 'Host policy: fictional unused damaged order is within 30 days.', agentSessionId: randomUUID() });
  return { type: 'user.custom_tool_result' as const, custom_tool_use_id: call.id,
    content: [{ type: 'text' as const, text: JSON.stringify(error ? { error } : report) }], is_error: Boolean(error), report };
}
const token = () => randomBytes(32).toString('base64url');
const same = (a: string, b: string) => { const first = Buffer.from(a), second = Buffer.from(b);
  return first.length === second.length && timingSafeEqual(first, second); };
const delay = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
  const abort = () => { clearTimeout(timer); reject(new Error('aborted')); };
  signal.addEventListener('abort', abort, { once: true }); if (signal.aborted) abort(); });
export class Lab61McpBridge {
  private readonly tokens = new Map<string, Identity>(); private readonly ownerTokens = new Map<string, string>();
  private readonly sessions = new Map<string, ClientSession>(); private closed = false;
  constructor(private readonly now = () => Date.now()) {
    this.tokens.set(process.env.LAB61_MCP_TOKEN || token(), { tenant: 'external-demo', customerId: 'C-1' }); }
  ownerToken(owner: string) { let value = this.ownerTokens.get(owner); if (value) return value;
    if (this.ownerTokens.size >= 8) throw new Error('Demo client capacity reached.');
    value = token(); this.ownerTokens.set(owner, value); this.tokens.set(value, { tenant: `demo-${owner}`, customerId: 'C-1' });
    return value; }
  alternateToken() { const value = token(); this.tokens.set(value, { tenant: 'foreign-test', customerId: 'C-2' }); return value; }
  authenticate(request: Request) { if (this.closed) return null;
    const auth = request.headers.authorization;
    if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) return null;
    const value = auth.slice(7);
    for (const [registered, identity] of this.tokens) if (same(value, registered)) return identity;
    return null; }
  private session(id: unknown, identity: Identity) { if (typeof id !== 'string') return null;
    const session = this.sessions.get(id);
    if (!session || session.expiresAt <= this.now()) { this.sessions.delete(id); return null; }
    return session.identity.tenant === identity.tenant && session.identity.customerId === identity.customerId ? session : null; }
  private reply(response: Response, id: string | number, result: unknown) {
    response.json({ jsonrpc: '2.0', id, result }); }
  private error(response: Response, id: string | number | null, code: number, message: string, status = 400) {
    response.status(status).json({ jsonrpc: '2.0', id, error: { code, message } }); }
  async handle(request: Request, response: Response, identity: Identity) {
    response.set('Cache-Control', 'no-store');
    if (request.method === 'DELETE') { const session = this.session(request.headers['mcp-session-id'], identity);
      if (!session) { response.sendStatus(404); return; }
      session.controller?.abort('session-close'); this.sessions.delete(session.id); response.sendStatus(204); return; }
    if (request.method !== 'POST') { response.set('Allow', 'POST, DELETE').sendStatus(405); return; }
    const parsed = rpc.safeParse(request.body);
    if (!parsed.success) { this.error(response, null, -32600, 'Invalid JSON-RPC request.'); return; }
    const { id, method, params } = parsed.data;
    if (method === 'initialize') {
      if (id === undefined || !initParams.safeParse(params).success || request.headers['mcp-session-id']) {
        this.error(response, id ?? null, -32602, 'Invalid initialize request.'); return; }
      if (this.sessions.size >= 4) { this.error(response, id, -32000, 'MCP session capacity reached.', 429); return; }
      const session: ClientSession = { id: randomUUID(), identity, active: false, expiresAt: this.now() + 120000,
        controller: null }; this.sessions.set(session.id, session); response.set('Mcp-Session-Id', session.id);
      this.reply(response, id, { protocolVersion: '2025-11-25', capabilities: { tools: {} },
        serverInfo: { name: 'lab61-support-agent', version: '0.1.0' } }); return;
    }
    const session = this.session(request.headers['mcp-session-id'], identity);
    if (!session || request.headers['mcp-protocol-version'] !== '2025-11-25') {
      this.error(response, id ?? null, -32001, 'Unknown, foreign or expired MCP session.', 404); return; }
    session.expiresAt = this.now() + 120000;
    if (method === 'notifications/initialized' && id === undefined) { response.sendStatus(202); return; }
    if (id === undefined) { this.error(response, null, -32600, 'Request ID required.'); return; }
    if (method === 'tools/list') { this.reply(response, id, { tools: [{ name: 'review_support_refund',
      description: 'Review the host-owned fictional customer order and return a checked refund eligibility report.',
      inputSchema: toolSchema, outputSchema }] }); return; }
    if (method !== 'tools/call') { this.error(response, id, -32601, 'Method not found.', 404); return; }
    const call = callParams.safeParse(params);
    if (!call.success) { this.error(response, id, -32602, 'Closed tool arguments required.'); return; }
    if (session.active) { this.error(response, id, -32000, 'Concurrent call is already active.', 409); return; }
    session.active = true; const controller = new AbortController(); session.controller = controller;
    const close = () => { if (!response.writableEnded) controller.abort('client-disconnect'); };
    response.on('close', close); const deadline = setTimeout(() => controller.abort('deadline'), 120);
    const sse = String(request.headers.accept ?? '').includes('text/event-stream');
    const send = (value: unknown) => { if (!response.destroyed && !response.writableEnded)
      response.write(`event: message\ndata: ${JSON.stringify(value)}\n\n`); };
    try {
      if (sse) { response.set('Content-Type', 'text/event-stream'); response.flushHeaders();
        send({ jsonrpc: '2.0', method: 'notifications/progress', params: { progressToken: id, progress: 1, total: 2 } }); }
      await delay(call.data.arguments.scenario === 'slow' ? 300 : 35, controller.signal);
      const handled = handleManagedReviewTool(identity, { id: `sevt_${randomUUID()}`, name: call.data.name,
        input: call.data.arguments });
      const result = handled.is_error ? { content: handled.content, isError: true } :
        { content: handled.content, structuredContent: lab61StructuredSchema.parse(handled.report), isError: false };
      if (sse) { send({ jsonrpc: '2.0', method: 'notifications/progress', params: { progressToken: id, progress: 2, total: 2 } });
        send({ jsonrpc: '2.0', id, result }); response.end(); }
      else this.reply(response, id, result);
    } catch {
      if (!response.destroyed && !response.writableEnded) {
        const result = { content: [{ type: 'text', text: 'Local review cancelled or timed out.' }], isError: true };
        if (sse) { send({ jsonrpc: '2.0', id, result }); response.end(); } else this.reply(response, id, result);
      }
    } finally { clearTimeout(deadline); response.off('close', close); session.active = false; session.controller = null; }
  }
  facts() { return { protocolVersion: '2025-11-25', sessionCapacity: 4, activeSessions: this.sessions.size,
    providerCalls: 0, tokenConfigured: Boolean(process.env.LAB61_MCP_TOKEN), tokenGeneratedWhenAbsent: true,
    note: '2025-11-25 sessionful JSON/SSE subset for one offline typed tool; 2026-07-28 stateless MCP is not implemented.' }; }
  close() { this.closed = true; for (const session of this.sessions.values()) session.controller?.abort('server-close');
    this.sessions.clear(); this.tokens.clear(); this.ownerTokens.clear(); }
}
