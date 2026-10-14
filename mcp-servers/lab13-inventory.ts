import express from 'express';
import { timingSafeEqual } from 'node:crypto';
import { once } from 'node:events';
import { z } from 'zod';
import { lab13Shapes } from '../shared/lab13-mcp.js';
import type { Lab13Stock } from '../shared/lab13-mcp.js';

export const mcpVersion = '2025-11-25';
export class InventoryState {
  private stock: Lab13Stock = []; readonly calls = { get_stock: 0, reserve_stock: 0 };
  constructor() { this.reset(); }
  snapshot() { return this.stock.map(item => ({ ...item })); }
  reset() { this.stock = [{ sku: 'NOTEBOOK', available: 8 }, { sku: 'BINOCULARS', available: 3 }, { sku: 'RECORDER', available: 2 }]; this.calls.get_stock = 0; this.calls.reserve_stock = 0; }
  call(name: string, args: unknown) {
    if (name === 'get_stock') { const input = lab13Shapes.get_stock.parse(args); this.calls.get_stock++; return this.snapshot().filter(item => !input.sku || item.sku === input.sku); }
    if (name === 'reserve_stock') {
      const input = lab13Shapes.reserve_stock.parse(args); const item = this.stock.find(item => item.sku === input.sku)!;
      if (input.quantity > item.available) throw new Error('Not enough fictional stock.');
      this.calls.reserve_stock++; item.available -= input.quantity; return { sku: item.sku, reserved: input.quantity, available: item.available };
    }
    throw new Error('Unknown inventory tool.');
  }
}
export async function startInventoryServer(token: string, state = new InventoryState()) {
  if (token.length < 24 || token.length > 200) throw new Error('Use a bounded server-side inventory bearer credential.');
  const app = express(); app.disable('x-powered-by');
  const expected = Buffer.from(`Bearer ${token}`);
  app.use((request, response, next) => {
    const host = request.headers.host ?? ''; const origin = request.headers.origin;
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || (origin && origin !== `http://${host}`)) { response.status(403).json({ error: 'Local origin required.' }); return; }
    const actual = Buffer.from(request.headers.authorization ?? '');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) { response.set('WWW-Authenticate', 'Bearer').status(401).json({ error: 'Unauthorized.' }); return; }
    next();
  });
  app.use(express.json({ limit: '16kb', strict: true }));
  const packet = z.strictObject({ jsonrpc: z.literal('2.0'), id: z.union([z.string().max(80), z.number().int()]).optional(), method: z.string().max(80), params: z.unknown().optional() });
  app.post('/mcp', (request, response) => {
    const parsed = packet.safeParse(request.body);
    const error = (code: number, message: string) => response.json({ jsonrpc: '2.0', id: parsed.success ? parsed.data.id ?? null : null, error: { code, message } });
    if (!parsed.success) { error(-32600, 'Invalid request.'); return; }
    const input = parsed.data;
    if (!request.accepts(['application/json', 'text/event-stream'])) { response.status(406).end(); return; }
    if (input.method !== 'initialize' && request.headers['mcp-protocol-version'] !== mcpVersion) { response.status(400).json({ error: 'Unsupported protocol version.' }); return; }
    if (input.id === undefined) { response.status(202).end(); return; }
    let result: unknown;
    if (input.method === 'initialize') {
      const params = z.object({ protocolVersion: z.literal(mcpVersion) }).safeParse(input.params);
      if (!params.success) { error(-32602, 'Use protocol 2025-11-25.'); return; }
      result = { protocolVersion: mcpVersion, capabilities: { tools: {} }, serverInfo: { name: 'lab13-inventory', version: '1.0.0' } };
    } else if (input.method === 'tools/list') result = { tools: ['get_stock', 'reserve_stock'].map(name => ({ name, description: name === 'get_stock' ? 'Read fictional stock.' : 'Reserve fictional stock.', inputSchema: z.toJSONSchema(lab13Shapes[name as 'get_stock' | 'reserve_stock']) })) };
    else if (input.method === 'tools/call') {
      const params = z.strictObject({ name: z.string().max(80), arguments: z.unknown() }).safeParse(input.params);
      if (!params.success) { error(-32602, 'Invalid tool call.'); return; }
      try { result = { content: [{ type: 'text', text: JSON.stringify(state.call(params.data.name, params.data.arguments)) }], isError: false }; }
      catch { result = { content: [{ type: 'text', text: 'Unknown tool, invalid arguments or insufficient fictional stock.' }], isError: true }; }
    } else if (input.method === 'ping') result = {};
    else { error(-32601, 'Method not found.'); return; }
    response.json({ jsonrpc: '2.0', id: input.id, result });
  });
  app.all('/mcp', (_request, response) => response.set('Allow', 'POST').status(405).end());
  app.use((_request, response) => response.status(404).json({ error: 'Missing MCP endpoint.' }));
  app.use((_error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => response.status(400).json({ error: 'Invalid or oversized JSON request.' }));
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No inventory address.');
  return { url: `http://127.0.0.1:${address.port}/mcp`, state, async close() { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); } };
}
