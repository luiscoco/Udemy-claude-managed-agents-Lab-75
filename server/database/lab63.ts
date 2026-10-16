import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { lab63QuerySchema } from '../../shared/lab63-safe-database-agent.js';

type Tenant = 'acme' | 'other';
type Order = { id: string; tenant: Tenant; status: 'open' | 'cancelled'; version: number };
type Proposal = { id: string; orderId: string; tenant: Tenant; version: number; status: string;
  expiresAt: number; effectKey: string; reason: string };
type Entry = { id: string; owner: string; tenant: Tenant; dir: string; read: DatabaseSync; write: DatabaseSync;
  now: number };
export const lab63ToolShapes = {
  read_order: z.strictObject({ orderId: z.string().regex(/^O-[AB]1$/) }),
  propose_cancel: z.strictObject({ orderId: z.string().regex(/^O-[AB]1$/), reason: z.string().trim().min(3).max(120) }),
};
export const lab63ToolDefinitions = Object.entries(lab63ToolShapes).map(([name, shape]) => {
  const { $schema: _dialect, ...input_schema } = z.toJSONSchema(shape, { target: 'draft-2020-12', io: 'input' });
  return { type: 'custom' as const, name, description: `Host-owned ${name.replaceAll('_', ' ')}.`, input_schema }; });
export class SafeDatabaseStore {
  private readonly entries = new Map<string, Entry>();
  constructor(private readonly root = resolve('artifacts/lab63/sessions'),
    private readonly tenantOfOwner: (owner: string) => Tenant = () => 'acme') { mkdirSync(root, { recursive: true }); }
  create(owner: string) {
    if (this.entries.size >= 4) throw new Error('Session capacity reached.');
    const id = randomUUID(), dir = resolve(this.root, id); mkdirSync(dir);
    const path = resolve(dir, 'orders.sqlite'), write = new DatabaseSync(path), read = new DatabaseSync(path);
    write.exec('CREATE TABLE orders (id TEXT PRIMARY KEY, tenant TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL)');
    write.exec('CREATE TABLE proposals (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, tenant TEXT NOT NULL, version INTEGER NOT NULL, status TEXT NOT NULL, expires_at INTEGER NOT NULL, effect_key TEXT UNIQUE NOT NULL, reason TEXT NOT NULL)');
    write.exec('CREATE TABLE audit (seq INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT NOT NULL, detail TEXT NOT NULL)');
    const insert = write.prepare('INSERT INTO orders (id,tenant,status,version) VALUES (?,?,?,?)');
    insert.run('O-A1', 'acme', 'open', 1); insert.run('O-B1', 'other', 'open', 1);
    read.exec('PRAGMA query_only=ON'); write.exec('PRAGMA query_only=ON');
    const entry: Entry = { id, owner, tenant: this.tenantOfOwner(owner), dir, read, write, now: Date.now() };
    this.entries.set(id, entry); return this.snapshot(id, owner);
  }
  private owned(id: string, owner: string) { const entry = this.entries.get(id);
    if (!entry || entry.owner !== owner) throw new Error('Unknown or foreign session.'); return entry; }
  private hostWrite<T>(entry: Entry, callback: () => T) { entry.write.exec('PRAGMA query_only=OFF');
    try { return callback(); } finally { entry.write.exec('PRAGMA query_only=ON'); } }
  private order(entry: Entry, orderId: string) { return entry.read.prepare(
    'SELECT id, tenant, status, version FROM orders WHERE tenant=? AND id=?').get(entry.tenant, orderId) as Order | undefined; }
  snapshot(id: string, owner: string) { const entry = this.owned(id, owner);
    const rows = entry.read.prepare('SELECT id, tenant, status, version FROM orders WHERE tenant=? ORDER BY id')
      .all(entry.tenant) as Order[];
    const proposals = entry.read.prepare('SELECT id, order_id as orderId, tenant, version, status, expires_at as expiresAt, effect_key as effectKey, reason FROM proposals WHERE tenant=? ORDER BY rowid')
      .all(entry.tenant) as Proposal[];
    const audit = entry.read.prepare('SELECT event, detail FROM audit ORDER BY seq').all();
    const readQueryOnly = (entry.read.prepare('PRAGMA query_only').get() as { query_only: number }).query_only === 1;
    const writeQueryOnly = (entry.write.prepare('PRAGMA query_only').get() as { query_only: number }).query_only === 1;
    return { source: 'offline-sqlite', sessionId: id, tenant: entry.tenant, rows, proposals, audit,
      readQueryOnly, writeQueryOnly, providerCalls: 0,
      note: 'Host SQLite state is authoritative; agent prose is not a commit.' }; }
  query(id: string, owner: string, input: z.infer<typeof lab63QuerySchema>) {
    const entry = this.owned(id, owner), order = this.order(entry, input.orderId);
    if (!order) throw new Error('Order does not belong to host-selected tenant.');
    if (input.operation === 'read') return { operation: 'read' as const, order, sessionId: id, providerCalls: 0 };
    if (order.status !== 'open') throw new Error('Only an open order can be proposed for cancellation.');
    const effectKey = `cancel:${entry.tenant}:${order.id}`;
    const proposal: Proposal = { id: randomUUID(), orderId: order.id, tenant: entry.tenant, version: order.version,
      status: 'pending', expiresAt: entry.now + 300000, effectKey, reason: input.reason };
    this.hostWrite(entry, () => {
      entry.write.prepare('INSERT INTO proposals (id,order_id,tenant,version,status,expires_at,effect_key,reason) VALUES (?,?,?,?,?,?,?,?)')
        .run(proposal.id, proposal.orderId, proposal.tenant, proposal.version, proposal.status, proposal.expiresAt,
          proposal.effectKey, proposal.reason);
      entry.write.prepare('INSERT INTO audit (event,detail) VALUES (?,?)').run('proposed', proposal.id);
    });
    return { operation: 'propose' as const, proposal, committed: false, order, providerCalls: 0 };
  }
  decision(id: string, owner: string, proposalId: string, decision: 'approve' | 'reject') {
    const entry = this.owned(id, owner);
    const proposal = entry.read.prepare('SELECT id, order_id as orderId, tenant, version, status, expires_at as expiresAt, effect_key as effectKey, reason FROM proposals WHERE id=? AND tenant=?')
      .get(proposalId, entry.tenant) as Proposal | undefined;
    if (!proposal || proposal.status !== 'pending') throw new Error('Unknown or already decided proposal.');
    if (entry.now >= proposal.expiresAt) { this.mark(entry, proposal.id, 'expired'); return { outcome: 'expired', changedRows: 0, ...this.snapshot(id, owner) }; }
    if (decision === 'reject') { this.mark(entry, proposal.id, 'rejected'); return { outcome: 'rejected', changedRows: 0, ...this.snapshot(id, owner) }; }
    let changedRows = 0, outcome = 'approved';
    this.hostWrite(entry, () => { entry.write.exec('BEGIN IMMEDIATE');
      try {
        const changed = entry.write.prepare("UPDATE orders SET status='cancelled', version=version+1 WHERE id=? AND tenant=? AND status='open' AND version=?")
          .run(proposal.orderId, entry.tenant, proposal.version);
        changedRows = Number(changed.changes);
        if (changedRows !== 1) { entry.write.exec('ROLLBACK'); outcome = 'stale'; return; }
        entry.write.prepare("UPDATE proposals SET status='approved' WHERE id=? AND status='pending'").run(proposal.id);
        entry.write.prepare('INSERT INTO audit (event,detail) VALUES (?,?)').run('approved', proposal.id);
        entry.write.exec('COMMIT');
      } catch (error) { entry.write.exec('ROLLBACK'); throw error; }
    });
    if (outcome === 'stale') this.mark(entry, proposal.id, 'stale');
    return { outcome, changedRows, ...this.snapshot(id, owner) };
  }
  private mark(entry: Entry, id: string, status: string) { this.hostWrite(entry, () => {
    entry.write.prepare("UPDATE proposals SET status=? WHERE id=? AND status='pending'").run(status, id);
    entry.write.prepare('INSERT INTO audit (event,detail) VALUES (?,?)').run(status, id); }); }
  fixture(id: string, owner: string, action: 'change-version' | 'advance-time') {
    const entry = this.owned(id, owner);
    if (action === 'advance-time') entry.now += 300001;
    else this.hostWrite(entry, () => entry.write.prepare("UPDATE orders SET version=version+1 WHERE id='O-A1' AND tenant=?").run(entry.tenant));
    return this.snapshot(id, owner);
  }
  handleTool(id: string, owner: string, eventId: string, name: string, input: unknown) {
    if (!/^sevt_[A-Za-z0-9_-]{1,80}$/.test(eventId)) throw new Error('Invalid Managed event ID.');
    const shape = lab63ToolShapes[name as keyof typeof lab63ToolShapes], parsed = shape?.safeParse(input);
    const answer = (content: unknown, is_error = false) => ({ type: 'user.custom_tool_result' as const,
      custom_tool_use_id: eventId, content: [{ type: 'text' as const, text: JSON.stringify(content) }], is_error });
    if (!parsed?.success) return answer({ error: 'Unknown tool or closed input rejected.' }, true);
    try { return answer(this.query(id, owner, name === 'read_order' ? { operation: 'read', ...parsed.data } as z.infer<typeof lab63QuerySchema> :
      { operation: 'propose', ...parsed.data } as z.infer<typeof lab63QuerySchema>)); }
    catch { return answer({ error: 'Host tenant, status or proposal check rejected.' }, true); }
  }
  blockedSql(id: string, owner: string) { this.owned(id, owner);
    return { blocked: true, reason: 'Arbitrary SQL is never passed to DatabaseSync.', providerCalls: 0 }; }
  close() { for (const entry of this.entries.values()) { entry.read.close(); entry.write.close(); }
    this.entries.clear(); }
  reset() { this.close(); rmSync(this.root, { recursive: true, force: true }); mkdirSync(this.root, { recursive: true }); }
}
