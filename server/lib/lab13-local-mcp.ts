import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { lab13Shapes, lab13ToolNames } from '../../shared/lab13-mcp.js';
import type { Lab13Config, Lab13Connection, Lab13Input, Lab13Snapshot } from '../../shared/lab13-mcp.js';
import { InventoryState, mcpVersion, startInventoryServer } from '../../mcp-servers/lab13-inventory.js';

const replySchema = z.object({ jsonrpc: z.literal('2.0'), id: z.number().int(), result: z.unknown().optional(), error: z.object({ code: z.number(), message: z.string() }).optional() });
const listSchema = z.object({ tools: z.array(z.object({ name: z.enum(lab13ToolNames) })).max(4) });
const resultSchema = z.object({ content: z.array(z.object({ type: z.literal('text'), text: z.string().max(4000) })).max(4), isError: z.boolean().optional() });
export class LocalMcpError extends Error { constructor(message: string, public readonly httpStatus: number | null = null) { super(message); } }
type Evidence = Lab13Snapshot['transportEvidence'][number];
interface Rpc { request(method: string, params: unknown, signal: AbortSignal, requestId?: number): Promise<unknown>; notify(method: string): Promise<void>; close(): Promise<void> }
const initialize = { protocolVersion: mcpVersion, capabilities: {}, clientInfo: { name: 'lab13-host', version: '1.0.0' } };

export function startNotesClient(missing = false): Rpc {
  const child = spawn(process.execPath, [fileURLToPath(new URL(missing ? '../../mcp-servers/lab13-missing.mjs' : '../../mcp-servers/lab13-notes.mjs', import.meta.url))],
    { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], env: { SystemRoot: process.env.SystemRoot ?? '', PATH: process.env.PATH ?? '', TEMP: process.env.TEMP ?? '' } });
  let nextId = 0; let buffer = ''; let closed = false;
  const pending = new Map<number, { resolve(value: unknown): void; reject(error: unknown): void }>();
  function fail() { for (const item of pending.values()) item.reject(new LocalMcpError('Notes stdio transport exited or violated its response bound.')); pending.clear(); }
  child.stderr.on('data', () => { /* Diagnostics never become stdout protocol or browser evidence. */ });
  child.on('error', fail); child.on('exit', fail);
  child.stdin.on('error', fail);
  child.stdout.setEncoding('utf8'); child.stdout.on('data', (chunk: string) => {
    buffer += chunk; if (buffer.length > 32768) { fail(); child.kill(); return; }
    for (;;) { const at = buffer.indexOf('\n'); if (at < 0) break; const line = buffer.slice(0, at); buffer = buffer.slice(at + 1);
      try { const response = replySchema.parse(JSON.parse(line)); const item = pending.get(response.id); if (!item) continue; pending.delete(response.id);
        if (response.error) item.reject(new LocalMcpError('Notes MCP returned a protocol error.')); else item.resolve(response.result);
      } catch { fail(); child.kill(); }
    }
  });
  return { async request(method, params, signal, requestId) {
    signal.throwIfAborted(); if (closed || child.exitCode !== null || child.signalCode !== null || pending.size >= 4) throw new LocalMcpError('Notes transport is closed or full.');
    const id = requestId ?? ++nextId;
    return new Promise((resolve, reject) => {
      const abort = () => { pending.delete(id); reject(new LocalMcpError('Notes request cancelled.')); };
      const clean = () => signal.removeEventListener('abort', abort);
      pending.set(id, { resolve(value) { clean(); resolve(value); }, reject(error) { clean(); reject(error); } });
      signal.addEventListener('abort', abort, { once: true });
      child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`, error => { if (error) { pending.delete(id); clean(); reject(new LocalMcpError('Notes transport write failed.')); } });
    });
  }, async notify(method) { child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method })}\n`); }, async close() {
    if (closed) return; closed = true; fail(); child.stdin.end();
    if (child.exitCode === null && child.signalCode === null) { const exited = new Promise<void>(resolve => child.once('exit', () => resolve())); child.kill(); await exited; }
  } };
}
export function inventoryClient(url: string, token: string): Rpc {
  // Only callers that just created the owned loopback server may supply this URL.
  const parsed = new URL(url); if (parsed.hostname !== '127.0.0.1' || parsed.protocol !== 'http:' || !/^\d+$/.test(parsed.port) || !['/mcp', '/missing'].includes(parsed.pathname)) throw new LocalMcpError('Only the owned local inventory endpoint is allowed.');
  let id = 0; let closed = false;
  async function send(method: string, params: unknown, signal: AbortSignal, notification = false, externalId?: number) {
    if (closed) throw new LocalMcpError('Inventory transport is closed.'); const requestId = externalId ?? ++id;
    const response = await fetch(url, { method: 'POST', redirect: 'error', signal, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': mcpVersion },
      body: JSON.stringify({ jsonrpc: '2.0', ...(notification ? {} : { id: requestId }), method, ...(params === undefined ? {} : { params }) }) });
    if (!response.ok) { await response.body?.cancel(); throw new LocalMcpError(`Inventory HTTP ${response.status}.`, response.status); }
    if (notification) { await response.body?.cancel(); return undefined; }
    const reader = response.body?.getReader(); if (!reader) throw new LocalMcpError('Inventory response missing.');
    let bytes = 0; const chunks: Uint8Array[] = [];
    try { for (;;) { const chunk = await reader.read(); if (chunk.done) break; bytes += chunk.value.length; if (bytes > 32768) throw new LocalMcpError('Inventory response exceeded bound.'); chunks.push(chunk.value); } }
    finally { await reader.cancel().catch(() => {}); }
    const packet = replySchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    if (packet.id !== requestId || packet.error) throw new LocalMcpError('Inventory RPC correlation or protocol error.'); return packet.result;
  }
  return { async request(method, params, signal, requestId) { return send(method, params, signal, false, requestId); }, async notify(method) { await send(method, undefined, AbortSignal.timeout(3000), true); }, async close() { closed = true; } };
}

export class Lab13LocalMcp {
  readonly stock = new InventoryState(); readonly evidence: Evidence[] = []; connections: Lab13Connection[] = [];
  private notes: Rpc | undefined; private inventory: Rpc | undefined; private server: Awaited<ReturnType<typeof startInventoryServer>> | undefined;
  private count = 0; private config: Lab13Config;
  constructor(private readonly input: Lab13Input) { this.config = input.config; }
  async start(config = this.config) {
    await this.close(); this.config = config; this.connections = [];
    for (const name of ['notes', 'inventory'] as const) {
      const enabled = name === 'notes' ? config.notesEnabled : config.inventoryEnabled;
      const connection: Lab13Connection = { server: name, transport: name === 'notes' ? 'stdio' : 'streamable-http', state: enabled ? 'not-tested' : 'disabled', advertisedTools: [], effectiveTools: [], detail: enabled ? 'Host-local connection not yet tested.' : 'Server disabled by host configuration.', httpStatus: null }; this.connections.push(connection);
      if (!enabled) continue;
      try {
        let rpc: Rpc;
        if (name === 'notes') { rpc = startNotesClient(this.input.scenario === 'missing'); this.notes = rpc; }
        else { const token = randomBytes(32).toString('hex'); this.server = await startInventoryServer(token, this.stock);
          rpc = inventoryClient(this.input.scenario === 'missing' ? this.server.url.replace('/mcp', '/missing') : this.server.url, this.input.scenario === 'unauthorized' ? 'authored-wrong-credential' : token); this.inventory = rpc; }
        const response = await this.rpc(name, rpc, 'initialize', initialize, AbortSignal.timeout(3000));
        if (!response || (response as { protocolVersion?: string }).protocolVersion !== mcpVersion) throw new LocalMcpError('Unsupported MCP protocol version.');
        await rpc.notify('notifications/initialized');
        const listed = listSchema.parse(await this.rpc(name, rpc, 'tools/list', {}, AbortSignal.timeout(3000)));
        connection.advertisedTools = listed.tools.map(tool => tool.name); connection.effectiveTools = connection.advertisedTools.filter(tool => tool !== 'reserve_stock' || config.reserveEnabled);
        connection.state = 'ready-local'; connection.detail = 'Real MCP handshake/tool discovery succeeded on the host. Cloud reachability is untested.';
      } catch (error) { connection.state = 'failed-local'; connection.detail = error instanceof LocalMcpError ? error.message : 'Local MCP transport failed.'; connection.httpStatus = error instanceof LocalMcpError ? error.httpStatus : null; }
    }
  }
  private async rpc(server: string, rpc: Rpc, method: string, params: unknown, signal: AbortSignal) {
    const record: Evidence = { server, method, requestId: ++this.count, outcome: 'pending' }; this.evidence.push(record); if (this.evidence.length > 80) this.evidence.shift();
    try { const result = await rpc.request(method, params, signal, record.requestId); record.outcome = 'response-correlated'; return result; }
    catch (error) { record.outcome = error instanceof LocalMcpError && error.httpStatus ? `HTTP ${error.httpStatus}` : 'transport-error'; throw error; }
  }
  async call(name: string, args: unknown, signal: AbortSignal) {
    if (!lab13ToolNames.includes(name as typeof lab13ToolNames[number])) return { handlerRan: false, isError: true, text: 'Unknown bridge tool.', rejected: true };
    const tool = name as typeof lab13ToolNames[number]; const parsed = lab13Shapes[tool].safeParse(args);
    const server = tool.endsWith('note') || tool.endsWith('notes') ? 'notes' : 'inventory';
    const connection = this.connections.find(item => item.server === server);
    if (!parsed.success || connection?.state !== 'ready-local' || !connection.effectiveTools.includes(tool)) return { handlerRan: false, isError: true, text: 'Invalid arguments, unavailable connection or disabled tool. No MCP call was made.', rejected: true };
    const rpc = server === 'notes' ? this.notes : this.inventory;
    if (!rpc) return { handlerRan: false, isError: true, text: 'MCP transport unavailable.', rejected: true };
    try { const result = resultSchema.parse(await this.rpc(server, rpc, 'tools/call', { name: tool, arguments: parsed.data }, AbortSignal.any([signal, AbortSignal.timeout(3000)])));
      return { handlerRan: true, isError: result.isError ?? false, text: result.content.map(block => block.text).join('\n').slice(0, 4000), rejected: false }; }
    catch { return { handlerRan: true, isError: true, text: 'MCP transport failed; inspect local stock for effects before retrying.', rejected: false }; }
  }
  async close() { await this.notes?.close(); await this.inventory?.close(); await this.server?.close(); this.notes = undefined; this.inventory = undefined; this.server = undefined; }
}
