import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { lab48SnapshotSchema, lab48ToolInputJsonSchema, lab48ToolInputSchema } from '../../shared/lab48-security-hardening.js';
import type { Lab48Action, Lab48Policy } from '../../shared/lab48-security-hardening.js';

export class Lab48Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
const canary = 'FAKE-LAB48-CANARY-ONLY';
export function scrubLab48WorkerEnvironment(_source: NodeJS.ProcessEnv) { return { LAB48_FAKE_VALUE: 'fixture-only' }; }
export class Lab48SecurityRange {
  private active = 0; private closed = false; private keys = new Map<string, string>();
  private collector: Server | null = null; private collectorHits = 0;
  private root: string | null = null;
  private allowed = ''; private privateDir = ''; private own = ''; private outside = '';
  private prepare() { if (this.root) return; this.root = mkdtempSync(join(tmpdir(), 'lab48-'));
    this.allowed = join(this.root, 'allowed'); this.privateDir = join(this.root, 'private');
    this.own = join(this.allowed, 'report.txt'); this.outside = join(this.privateDir, 'secret.txt');
    mkdirSync(this.allowed); mkdirSync(this.privateDir); writeFileSync(this.own, 'Original approved report.'); writeFileSync(this.outside, canary); }
  facts() { return { source: 'installed-managed-custom-tool-pattern', tool: 'range_operation',
    inputSchema: lab48ToolInputJsonSchema, eventCorrelation: 'agent.custom_tool_use.id to user.custom_tool_result.tool_use_id',
    idempotency: 'host business key independent of sevt event ID', builtInTools: [], mcpServers: [], skills: [],
    workerEnvironment: Object.keys(scrubLab48WorkerEnvironment(process.env)), providerCalls: 0,
    note: 'Prompts and cwd are not enforcement boundaries; host validation and effects are authoritative.' }; }
  private async witness() {
    if (this.collector) return;
    this.collector = createServer((request, response) => { this.collectorHits++; request.resume(); response.writeHead(204); response.end(); });
    await new Promise<void>((resolve, reject) => this.collector!.listen(0, '127.0.0.1', resolve).once('error', reject));
  }
  async run(policy: Lab48Policy, action: Lab48Action, signal?: AbortSignal) {
    if (this.closed || this.active >= 4) throw new Lab48Error(429, 'Security range capacity reached.');
    if (signal?.aborted) throw new Lab48Error(499, 'Local request cancelled.');
    this.active++; try { this.prepare();
      const eventId = `sevt_fixture_${randomUUID().slice(0, 8)}`, idempotencyKey = `lab48-${randomUUID().slice(0, 8)}`;
      const target = action === 'out-of-scope-write' || action === 'secret-read' ? this.outside : 'http://127.0.0.1/sink';
      const parsed = lab48ToolInputSchema.parse({ action, target, idempotencyKey });
      const prior = this.keys.get(parsed.idempotencyKey); if (prior) throw new Lab48Error(409, 'Duplicate business key.');
      const relativeTarget = relative(this.allowed, resolve(target));
      const withinAllowed = relativeTarget !== '..' && !relativeTarget.startsWith(`..${sep}`) && !isAbsolute(relativeTarget);
      const allowed = policy === 'naive', beforeHits = this.collectorHits;
      let executed = false, blockedBy: string | null = null;
      if (!allowed) blockedBy = action === 'injected-egress' ? 'host egress allowlist and untrusted tool-output policy' :
        action === 'out-of-scope-write' && !withinAllowed ? 'canonical host path boundary' : 'least-privilege host read policy';
      else if (action === 'secret-read') { readFileSync(this.outside, 'utf8'); executed = true; }
      else if (action === 'out-of-scope-write') { writeFileSync(this.outside, 'Naive policy wrote outside the allowed path.'); executed = true; }
      else {
        await this.witness(); const address = this.collector!.address();
        if (!address || typeof address === 'string') throw new Lab48Error(500, 'Loopback witness unavailable.');
        await fetch(`http://127.0.0.1:${address.port}/sink`, { method: 'POST', body: canary, signal: signal ?? AbortSignal.timeout(3000) });
        executed = true;
      }
      this.keys.set(parsed.idempotencyKey, eventId);
      const exposed = action === 'secret-read' && executed;
      return lab48SnapshotSchema.parse({ source: 'local-security-range', policy, action, eventId, idempotencyKey,
        attempted: true, executed, blockedBy,
        toolResult: { eventId, isError: !executed, text: exposed ? canary : executed ? 'Local fixture effect executed; content redacted.' : 'Denied by host policy.' },
        collectorHits: this.collectorHits - beforeHits, insideFile: readFileSync(this.own, 'utf8'),
        outsideFile: readFileSync(this.outside, 'utf8') === canary ? 'Fake canary fixture remains unchanged.' : readFileSync(this.outside, 'utf8'),
        canaryExposed: exposed, providerCalls: 0,
        evidence: [`Host observed ${this.collectorHits - beforeHits} loopback collector hits for this attempt.`,
          `Host checked canonical path containment: ${withinAllowed ? 'inside' : 'outside'} the allowed directory.`,
          exposed ? 'Naive policy returned the fictional canary; no genuine secret was present.' :
            'The tool result is redacted; effect flags, temporary files and local witness are authoritative.'] });
    } finally { this.active--; }
  }
  async close() { this.closed = true; this.keys.clear(); if (this.collector) await new Promise<void>(resolve => this.collector!.close(() => resolve()));
    if (this.root) { unlinkSync(this.own); unlinkSync(this.outside); rmdirSync(this.allowed); rmdirSync(this.privateDir); rmdirSync(this.root); this.root = null; } }
}
