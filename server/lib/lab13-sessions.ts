import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { lab13SnapshotSchema } from '../../shared/lab13-mcp.js';
import type { Lab13Call, Lab13Config, Lab13Input, Lab13Snapshot } from '../../shared/lab13-mcp.js';
import type { Lab01Session } from '../../shared/lab01-events.js';
import { Lab13LocalMcp } from './lab13-local-mcp.js';
import type { Lab13Port } from './lab13-port.js';
import { createFixtureLab13Port, createLiveLab13Port } from './lab13-port.js';
import { runToolSession } from './tool-session-run.js';
import { LabError } from './lab01-run.js';
import { redact } from '../../src/lib/presentation.js';
import { boundedLab12Text } from './lab12-queue.js';

export class Lab13Error extends Error { constructor(public readonly status: number, message: string) { super(message); } }
export interface Lab13Entry {
  runId: string; owner: string; input: Lab13Input; port: Lab13Port; local: Lab13LocalMcp; session: Lab01Session | null;
  snapshot: Lab13Snapshot; expiresAt: number; closing: boolean; controller: AbortController | null;
  work: Promise<void> | null; setup: Promise<void> | null; cleanup: Promise<void> | null;
}
export class Lab13Sessions {
  readonly entries = new Map<string, Lab13Entry>(); private closed = false;
  constructor(private readonly capacity = 2, private readonly factory?: (input: Lab13Input, observe: (call: Lab13Call) => void) => Lab13Port) {}
  value(e: Lab13Entry) {
    e.snapshot.revision++; e.snapshot.sessionId = e.session?.id ?? null; e.snapshot.stock = e.local.stock.snapshot(); e.snapshot.transportEvidence = [...e.local.evidence];
    e.snapshot.connections = e.input.integration === 'host-bridge' ? e.local.connections : [
      { server: 'notes', transport: 'stdio', state: 'disabled', advertisedTools: [], effectiveTools: [], detail: 'Local stdio is not mounted in a Managed sandbox.', httpStatus: null },
      { server: 'inventory', transport: 'managed-url', state: e.snapshot.config.inventoryEnabled ? 'configured-cloud' : 'disabled', advertisedTools: [],
        effectiveTools: e.snapshot.config.inventoryEnabled ? ['get_stock'] : [], detail: 'Configuration metadata only. Actual cloud connectivity requires MCP events/results from an explicit live turn.', httpStatus: null },
    ];
    return lab13SnapshotSchema.parse(e.snapshot);
  }
  read(id: string, owner: string) {
    const e = this.entries.get(id); if (!e) throw new Lab13Error(404, 'Unknown Lab 13 checkpoint.');
    if (e.owner !== owner) throw new Lab13Error(403, 'Checkpoint belongs to another exercise owner.');
    if (e.expiresAt < Date.now() && e.snapshot.state !== 'closed') { void this.end(e); throw new Lab13Error(409, 'Session expired; cleanup requested.'); }
    e.expiresAt = Date.now() + 15 * 60_000; return e;
  }
  async create(owner: string, input: Lab13Input, disconnected: () => boolean = () => false) {
    if (this.closed || [...this.entries.values()].filter(e => e.snapshot.state !== 'closed').length >= this.capacity) throw new Lab13Error(429, 'Close an existing MCP session before creating another.');
    if ([...this.entries.values()].some(e => e.owner === owner && e.snapshot.state !== 'closed')) throw new Lab13Error(409, 'This exercise already owns a retained session. Close it first.');
    const localInput = input.integration === 'managed-url' ? { ...input, config: { notesEnabled: false, inventoryEnabled: false, reserveEnabled: false } } : input;
    const local = new Lab13LocalMcp(localInput); let e!: Lab13Entry;
    const observe = (call: Lab13Call) => {
      const found = e.snapshot.calls.findIndex(item => item.useId === call.useId && item.path === 'native-mcp');
      const retainedBytes = e.snapshot.calls.filter(item => item.useId !== call.useId).reduce((total, item) => total + Buffer.byteLength(JSON.stringify(item.text)), 0);
      const safe = { ...call, text: boundedLab12Text(redact(call.text).slice(0, 4000), Math.max(0, 64000 - retainedBytes)) };
      if (found >= 0) e.snapshot.calls[found] = safe; else if (e.snapshot.calls.length < 40) e.snapshot.calls.push(safe);
    };
    const port = this.factory?.(input, observe) ?? (input.mode === 'live' ? createLiveLab13Port(input, observe) : createFixtureLab13Port(input));
    e = { runId: randomUUID(), owner, input, port, local, session: null, expiresAt: Date.now() + 15 * 60_000, closing: false, controller: null, work: null, setup: null, cleanup: null,
      snapshot: { runId: '', revision: 0, sessionId: null, mode: input.mode, source: input.mode === 'scripted' ? 'authored-agent-real-local-mcp' : input.integration === 'host-bridge' ? 'managed-api-host-bridge' : 'managed-api-native-mcp',
        state: 'updating', config: input.config, connections: [], turns: [], calls: [], stock: local.stock.snapshot(), stockScope: 'host-local-inventory', transportEvidence: [], interruption: 'not-needed', cleanup: 'not-needed', message: 'Preparing the owned MCP transports and session.' } };
    e.snapshot.runId = e.runId;
    for (const [id, entry] of this.entries) if (this.entries.size >= 20 && entry.snapshot.state === 'closed') this.entries.delete(id);
    this.entries.set(e.runId, e);
    e.setup = (async () => {
      try {
        await local.start();
        if (disconnected() || e.closing) throw new Lab13Error(409, 'Creation cancelled before provider access.');
        const created = await port.create(); e.session = created.session;
        if (port.verificationError) throw new LabError(port.verificationError);
        if (disconnected() || this.closed || e.closing) throw new Lab13Error(409, 'Creation cancelled; returned session cleanup requested.');
        e.snapshot.state = 'idle'; e.snapshot.message = 'Session retained. Host-local connection states are evidence of local MCP reachability only.';
      } catch (error) { e.closing = true; await this.clean(e); throw new Lab13Error(422, `${error instanceof Lab13Error || error instanceof LabError ? error.message : 'MCP session setup failed.'} Checkpoint ${e.runId}; cleanup ${e.snapshot.cleanup}.`); }
    })();
    try { await e.setup; return e; } finally { e.setup = null; }
  }
  async run(e: Lab13Entry, prompt: string, operation: Lab13Input['operation'], signal: AbortSignal, emit: (value: unknown) => void) {
    if (e.closing || e.work || e.setup || e.snapshot.state !== 'idle') throw new Lab13Error(409, 'Send requires an idle retained session.');
    if (e.snapshot.turns.length >= 10 || e.snapshot.calls.length >= 20) throw new Lab13Error(429, 'Evidence limit reached; close this session.');
    if (e.input.integration === 'managed-url' && operation !== 'inspect') throw new Lab13Error(400, 'Native URL mode is read-only.');
    e.controller = new AbortController(); const controller = e.controller; const abort = () => controller.abort('cancelled'); signal.addEventListener('abort', abort, { once: true }); if (signal.aborted) abort();
    e.snapshot.state = 'running'; e.snapshot.message = 'A turn is in progress; tool results and turn completion will be reported separately.';
    emit({ kind: 'checkpoint', snapshot: this.value(e) }); e.port.prepare(operation);
    const work = (async () => {
      try {
        const turnPort: Lab13Port = { ...e.port, async respond(id, results, respondSignal) {
          if (!e.port.respond) throw new LabError('Custom result transport unavailable.'); await e.port.respond(id, results, respondSignal);
          for (const result of results) { const call = e.snapshot.calls.find(call => call.useId === result.customToolUseId); if (call) call.resultSent = true; }
        } };
        const core = await runToolSession({ mode: e.input.mode, prompt, deadlineMs: e.input.deadlineSeconds * 1000, cleanupWaitMs: 1000, maxConfirmations: 10, retainOnCompleted: true,
          port: turnPort, signal: controller.signal, emit,
          answer: async (pending, context) => {
            const results = [];
            for (const call of pending) {
              if (!call.custom) { results.push({ toolUseId: call.id, tool: call.use?.name ?? 'unreviewed-mcp-tool', result: 'deny' as const, reason: 'This lab only answers validated bridge calls.', denyMessage: 'Unreviewed built-in or MCP tool call denied.' }); continue; }
              if (e.input.integration !== 'host-bridge' || e.snapshot.calls.length >= 40) throw new LabError('Unsupported bridge call or evidence bound.');
              const result = await e.local.call(call.custom.name, call.custom.input, context.signal);
              const retainedBytes = e.snapshot.calls.reduce((total, item) => total + Buffer.byteLength(JSON.stringify(item.text)), 0);
              const record: Lab13Call = { useId: call.id, resultId: null, resultSent: false, server: call.custom.name.startsWith('get_') || call.custom.name.startsWith('reserve_') ? 'inventory' : 'notes',
                name: call.custom.name.slice(0, 100), path: result.rejected ? 'host-rejected' : 'host-mcp', isError: result.isError, text: boundedLab12Text(redact(result.text).slice(0, 4000), Math.max(0, 64000 - retainedBytes)), handlerRan: result.handlerRan };
              e.snapshot.calls.push(record); emit({ kind: 'mcp-call', call: record });
              results.push({ customToolUseId: call.id, tool: call.custom.name, isError: result.isError, text: result.text });
            }
            return results;
          } });
        let remaining = Math.max(0, 48000 - e.snapshot.turns.reduce((total, turn) => total + turn.messages.reduce((size, message) => size + Buffer.byteLength(JSON.stringify(message.text)), 0), 0));
        const messages = core.messages.slice(-5).map(message => { const text = boundedLab12Text(redact(message.text), remaining); remaining = Math.max(0, remaining - Buffer.byteLength(JSON.stringify(text))); return { ...message, text }; });
        e.snapshot.turns.push({ id: randomUUID(), outcome: core.outcome, messages });
        e.snapshot.interruption = core.interruption; e.snapshot.cleanup = core.cleanup;
        e.snapshot.state = core.cleanup === 'retained' ? 'idle' : core.cleanup === 'pending' ? 'cleanup-pending' : 'closed';
        e.snapshot.message = `${core.outcome.kind}: ${core.outcome.detail} MCP call success is separate from agent turn completion.`.slice(0, 800);
        if (e.snapshot.state !== 'idle') { e.closing = true; await e.local.close(); }
      } finally { signal.removeEventListener('abort', abort); e.controller = null; }
    })();
    e.work = work; try { await work; return this.value(e); } finally { e.work = null; }
  }
  async configure(e: Lab13Entry, config: Lab13Config) {
    if (e.closing || e.work || e.setup || e.snapshot.state !== 'idle') throw new Lab13Error(409, 'Configure requires idle with no turn in progress.');
    if (e.input.integration === 'managed-url' && (config.notesEnabled || config.reserveEnabled)) throw new Lab13Error(400, 'Native URL configuration is inventory-only and read-only.');
    e.snapshot.state = 'updating';
    const work = (async () => {
      try {
        if (await e.port.status(e.session!.id) !== 'idle') throw new Lab13Error(409, 'Remote idle not confirmed.');
        await e.port.configure(config);
        if (e.input.integration === 'host-bridge') await e.local.start(config);
        e.snapshot.config = config; e.snapshot.state = 'idle'; e.snapshot.message = 'Idle tools/server update applied. Inspect configuration and actual calls separately.';
      } catch (error) { e.closing = true; await this.clean(e); throw error instanceof Lab13Error ? error : new Lab13Error(502, 'Configuration update failed or is uncertain; cleanup requested.'); }
    })();
    e.work = work; try { await work; return this.value(e); } finally { e.work = null; }
  }
  private async clean(e: Lab13Entry) {
    await e.local.close();
    if (!e.session) { e.snapshot.state = 'closed'; e.snapshot.cleanup = 'simulated'; return; }
    let status = await e.port.status(e.session.id).catch(() => 'unknown');
    if (status === 'archived') { e.snapshot.state = 'closed'; return; }
    if (status !== 'idle') {
      try { await e.port.interrupt(e.session.id); e.snapshot.interruption = 'acknowledged'; } catch { e.snapshot.interruption = 'unconfirmed'; }
      for (let i = 0; i < 5; i++) { status = await e.port.status(e.session.id).catch(() => 'unknown'); if (status === 'idle') break; await delay(50); }
      e.snapshot.interruption = status === 'idle' ? 'idle-confirmed' : 'unconfirmed';
    }
    if (status === 'idle') { try { await e.port.archive(e.session.id); e.snapshot.state = 'closed'; e.snapshot.cleanup = e.input.mode === 'scripted' ? 'simulated' : 'archived'; }
      catch { e.snapshot.state = 'cleanup-pending'; e.snapshot.cleanup = 'pending'; } }
    else { e.snapshot.state = 'cleanup-pending'; e.snapshot.cleanup = 'pending'; }
  }
  async end(e: Lab13Entry) {
    if (e.cleanup) { await e.cleanup; return this.value(e); }
    e.closing = true; e.controller?.abort('cancelled');
    e.cleanup = (async () => {
      await e.setup?.catch(() => {}); await e.work?.catch(() => {});
      if (e.snapshot.state !== 'closed') await this.clean(e); else await e.local.close();
      e.snapshot.message = e.snapshot.state === 'closed' ? 'Session closed; owned child process and HTTP listener stopped.' : 'Remote cleanup pending. Local transports are stopped; remote stop is not proven.';
    })();
    try { await e.cleanup; return this.value(e); } finally { e.cleanup = null; }
  }
  async sweep() { await Promise.allSettled([...this.entries.values()].filter(e => e.expiresAt < Date.now() && e.snapshot.state !== 'closed').map(e => this.end(e))); }
  async close() { this.closed = true; await Promise.allSettled([...this.entries.values()].map(e => this.end(e))); }
}
