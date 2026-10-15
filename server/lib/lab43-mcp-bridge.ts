import { randomUUID } from 'node:crypto';
import { startLab43McpServer } from '../../mcp-servers/lab43-resources.js';
import { lab43SnapshotSchema } from '../../shared/lab43-remote-mcp-resources.js';
import type { Lab43Scenario } from '../../shared/lab43-remote-mcp-resources.js';

export class Lab43Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
type Owner = { consent: boolean; token: string | null; expiresAt: number; last: ReturnType<typeof lab43SnapshotSchema.parse> | null };
export class Lab43Bridge {
  private owners = new Map<string, Owner>(); private server: Awaited<ReturnType<typeof startLab43McpServer>> | null = null;
  private closed = false; private cache = new Map<string, string>();
  constructor(private now = () => Date.now()) {}
  facts() { return { source: 'host-only', directManagedMcp: false, bridge: 'loopback HTTP JSON-RPC fixture',
    supported: ['tools/list', 'resources/list', 'resources/templates/list', 'prompts/list', 'resources/read', 'prompts/get'],
    localCallbacksAutomaticallyExposed: false, providerCalls: 0,
    note: 'A reachable URL MCP toolset uses separate reviewed credentials and idle-update or fresh-session configuration.' }; }
  private owner(id: string) { const found = this.owners.get(id); if (!found) throw new Lab43Error(403, 'Local consent required.'); return found; }
  async auth(owner: string, consent: boolean, refresh = false) {
    if (!consent) { this.owners.delete(owner); return { consent: false, tokenStatus: 'absent', tokenPreview: null, transport: this.server ? 'loopback-http' : 'closed' }; }
    if (this.closed || this.owners.size >= 16 && !this.owners.has(owner)) throw new Lab43Error(429, 'Bridge capacity reached.');
    if (!this.server) this.server = await startLab43McpServer(value => [...this.owners.values()].some(entry => entry.token === value && this.now() < entry.expiresAt));
    const previous = this.owners.get(owner), token = refresh || !previous?.token ? `toy-${randomUUID()}` : previous.token;
    this.owners.set(owner, { consent: true, token, expiresAt: this.now() + 30_000, last: previous?.last ?? null });
    return { consent: true, tokenStatus: 'valid', tokenPreview: `${token.slice(0, 6)}…redacted`, transport: 'loopback-http' };
  }
  private async rpc(owner: string, method: string, params: Record<string, unknown> = {}, overrideToken?: string) {
    const entry = this.owner(owner); if (!entry.consent || !entry.token || !this.server) throw new Lab43Error(403, 'No active bridge token.');
    const token = overrideToken ?? entry.token;
    const response = await fetch(this.server.url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ jsonrpc: '2.0', id: randomUUID(), method, params }), signal: AbortSignal.timeout(2000) });
    if (!response.ok) throw new Lab43Error(response.status, response.status === 403 ? 'MCP bridge token refused.' : 'MCP resource unavailable.');
    const body = await response.json() as { result: unknown }; return body.result;
  }
  async inventory(owner: string, method: 'tools/list' | 'resources/list' | 'resources/templates/list' | 'prompts/list') {
    const entry = this.owner(owner); if (this.now() >= entry.expiresAt) throw new Lab43Error(403, 'Host token expired; refresh consent.');
    return { source: 'loopback-mcp-fixture', method, result: await this.rpc(owner, method), providerCalls: 0 };
  }
  toolsets(owner: string) { this.owner(owner); return { source: 'host-only', directManagedUrlMcp: { configured: false, reachableServerRequired: true,
    credentials: 'server-side vault reference only', update: 'documented idle update or fresh session' },
    bridgeCustomTool: { name: 'read_approved_resource', type: 'custom', serverOwnedUris: true }, providerCalls: 0 }; }
  cacheView(owner: string) { this.owner(owner); return { source: 'host-only', cachedKeys: [...this.cache.keys()], maxEntries: 8, providerCalls: 0 }; }
  async run(owner: string, scenario: Lab43Scenario, proposedUri?: string) {
    const entry = this.owner(owner); const uri = proposedUri ?? (scenario === 'allowed-template' ? 'lab43://observations/v2' :
      scenario === 'unknown-uri' ? 'lab43://private/unknown' : 'lab43://observations/v1');
    const allowed = uri === 'lab43://observations/v1' || uri === 'lab43://observations/v2';
    const method = scenario === 'known-prompt' ? 'prompts/get' : 'resources/read';
    let status: 'allowed' | 'refused' = 'allowed', reason = 'Authenticated loopback MCP result inspected.', result: string | null = null;
    let tokenStatus: 'valid' | 'expired' | 'invalid' = 'valid';
    const evidence = ['Host owns resource URI allowlist; branch text cannot select an arbitrary URI.', 'Toy token is server-side and redacted from browser evidence.'];
    if (scenario === 'expired-token' || this.now() >= entry.expiresAt) { tokenStatus = 'expired'; status = 'refused'; reason = 'Host token expired; refresh before another call.'; }
    else if (scenario === 'bad-token') { tokenStatus = 'invalid'; status = 'refused'; reason = 'MCP bridge refused the bad bearer token.';
      try { await this.rpc(owner, method, { uri }, 'toy-invalid'); } catch { evidence.push('Loopback server returned an authentication refusal.'); } }
    else if (method === 'resources/read' && !allowed) { status = 'refused'; reason = 'Unknown or non-server-owned URI refused before transport.'; }
    else {
      try { const payload = await this.rpc(owner, method, method === 'prompts/get' ? { name: 'summarize-observations' } : { uri });
        const raw = JSON.stringify(payload); if (raw.length > 1200) throw new Lab43Error(413, 'MCP result too large.');
        result = raw; this.cache.set(`${method}:${uri}`, raw); if (this.cache.size > 8) this.cache.delete(this.cache.keys().next().value!);
      } catch (error) { status = 'refused'; reason = error instanceof Lab43Error ? error.message : 'MCP transport failed.'; }
    }
    if (status === 'refused') evidence.push(`Host refusal: ${reason}`); else evidence.push(`Bounded ${method} result returned through host bridge.`);
    const snapshot = lab43SnapshotSchema.parse({ source: 'loopback-mcp-fixture', scenario, consent: entry.consent,
      tokenStatus, tokenPreview: entry.token ? `${entry.token.slice(0, 6)}…redacted` : null,
      transport: this.server ? 'loopback-http' : 'closed', method, uri: method === 'prompts/get' ? null : uri,
      status, reason, resourceVersion: status === 'allowed' && method === 'resources/read' ? uri.endsWith('/v2') ? 2 : 1 : null,
      result, resultBytes: result?.length ?? 0,
      customToolResult: status === 'allowed' ? { type: 'user.custom_tool_result', tool_use_id: `tool_${randomUUID().replaceAll('-', '')}`,
        is_error: false, content: result! } : null, directMcpConfigured: false, providerCalls: 0, evidence });
    entry.last = snapshot; return snapshot;
  }
  async close() { this.closed = true; await this.server?.close(); this.server = null; this.owners.clear(); this.cache.clear(); }
}
