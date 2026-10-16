import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { setTimeout as delay } from 'node:timers/promises';
import { Router, json, raw, type Request, type Response } from 'express';
import { z } from 'zod';
import { lab68AdvanceSchema, lab68FixtureSchema, lab68ScheduleSchema, lab68ToolInputSchema,
  lab68WebhookSchema, lab68WorkerSchema } from '../../shared/lab68-scheduled-event-driven.js';
import { apiError } from '../lib/errors.js';

type Job = { id: string; owner: string; key: string; source: 'schedule' | 'webhook'; coalesced: number;
  state: 'queued' | 'running' | 'retry' | 'succeeded' | 'dead-letter' | 'cancelled'; attempts: number; dueAt: number;
  audit: string[]; controller?: AbortController; work?: Promise<void> };
type Schedule = { id: string; owner: string; intervalMs: number; nextDue: number };
class QueueError extends Error { constructor(message: string, readonly status = 409) { super(message); } }
export const signLab68 = (secret: string, timestamp: string, body: Buffer) =>
  createHmac('sha256', secret).update(timestamp).update('.').update(body).digest('hex');
export function verifyLab68(secret: string, timestamp: string, signature: string, body: Buffer, realNow = Date.now()) {
  if (!/^\d{10,13}$/.test(timestamp) || Math.abs(realNow - Number(timestamp) * 1000) > 300000 || !/^[a-f0-9]{64}$/.test(signature)) return false;
  return timingSafeEqual(Buffer.from(signLab68(secret, timestamp, body), 'hex'), Buffer.from(signature, 'hex'));
}
const toolInput = (() => { const { $schema: _dialect, ...schema } = z.toJSONSchema(lab68ToolInputSchema,
  { target: 'draft-2020-12', io: 'input' }); return schema; })();
export const lab68ToolDefinition = { type: 'custom' as const, name: 'record_incident_triage',
  description: 'Record one host-claimed fictional incident outcome with a stable business key.', input_schema: toolInput };

export class Lab68Queue {
  private readonly jobs = new Map<string, Job>(); private readonly schedules = new Map<string, Schedule>();
  private readonly dedup = new Map<string, string>(); private readonly db: DatabaseSync;
  private readonly offsets = new Map<string, number>(); private closing = false;
  constructor(private readonly secret = process.env.LAB68_WEBHOOK_SECRET || randomBytes(32).toString('hex'),
    private readonly realNow = () => Date.now(), dbPath = 'artifacts/lab68/effects.sqlite', private readonly stepMs = 80) {
    mkdirSync(dirname(dbPath), { recursive: true }); this.db = new DatabaseSync(dbPath);
    this.db.exec('CREATE TABLE IF NOT EXISTS effects (business_key TEXT PRIMARY KEY, owner TEXT NOT NULL, job_id TEXT NOT NULL)');
  }
  private clock(owner: string) { return this.realNow() + (this.offsets.get(owner) ?? 0); }
  private enqueue(owner: string, key: string, source: Job['source'], coalesced = 1) {
    const compound = `${owner}:${key}`; const old = this.dedup.get(compound); if (old) return { id: old, duplicate: true };
    if (this.closing || this.jobs.size >= 100) throw new QueueError('Queue capacity reached.', 429);
    const job: Job = { id: randomUUID(), owner, key: compound, source, coalesced, state: 'queued', attempts: 0,
      dueAt: this.clock(owner), audit: ['Admitted only; no worker or billed run started.'] };
    this.jobs.set(job.id, job); this.dedup.set(compound, job.id); return { id: job.id, duplicate: false };
  }
  webhook(body: Buffer, timestamp: string, signature: string) {
    if (!verifyLab68(this.secret, timestamp, signature, body, this.realNow())) throw new QueueError('Webhook signature or real-time freshness rejected.', 401);
    let input: z.infer<typeof lab68WebhookSchema>;
    try { input = lab68WebhookSchema.parse(JSON.parse(body.toString('utf8'))); } catch { throw new QueueError('Closed incident payload rejected.', 400); }
    return { accepted: true, ...this.enqueue(input.owner, `event:${input.eventId}`, 'webhook') };
  }
  fixture(owner: string, eventId: string, kind: 'valid' | 'bad-signature' | 'stale') {
    const body = Buffer.from(JSON.stringify({ owner, eventId, incident: 'fictional-finches' }));
    const timestamp = String(Math.floor(this.realNow() / 1000) - (kind === 'stale' ? 600 : 0));
    const signature = kind === 'bad-signature' ? '0'.repeat(64) : signLab68(this.secret, timestamp, body);
    return this.webhook(body, timestamp, signature);
  }
  schedule(owner: string, intervalSeconds: number) { const input = lab68ScheduleSchema.parse({ intervalSeconds });
    if (this.schedules.size >= 10) throw new QueueError('Schedule capacity reached.', 429);
    const schedule = { id: randomUUID(), owner, intervalMs: input.intervalSeconds * 1000,
      nextDue: this.clock(owner) + input.intervalSeconds * 1000 }; this.schedules.set(schedule.id, schedule); return this.snapshot(owner); }
  advance(owner: string, seconds: number) { lab68AdvanceSchema.parse({ seconds });
    if (!this.offsets.has(owner) && this.offsets.size >= 100) throw new QueueError('Clock capacity reached.', 429);
    this.offsets.set(owner, (this.offsets.get(owner) ?? 0) + seconds * 1000); return this.snapshot(owner); }
  tick(owner: string) { for (const schedule of this.schedules.values()) {
      if (schedule.owner !== owner || schedule.nextDue > this.clock(owner)) continue;
      const missed = Math.floor((this.clock(owner) - schedule.nextDue) / schedule.intervalMs) + 1;
      const occurrence = schedule.nextDue + (missed - 1) * schedule.intervalMs;
      this.enqueue(owner, `schedule:${schedule.id}:${occurrence}`, 'schedule', missed);
      schedule.nextDue += missed * schedule.intervalMs;
    } return this.snapshot(owner); }
  private own(owner: string, id: string) { const job = this.jobs.get(id);
    if (!job || job.owner !== owner) throw new QueueError('Job not found.', 404); return job; }
  handleTool(owner: string, event: { id: string; name: string; input: unknown }) {
    if (!/^sevt_[A-Za-z0-9_-]{1,80}$/.test(event.id) || event.name !== lab68ToolDefinition.name) throw new QueueError('Invalid custom-tool event.', 400);
    const input = lab68ToolInputSchema.parse(event.input); const job = this.own(owner, input.jobId);
    if (job.state !== 'running' || job.controller?.signal.aborted) throw new QueueError('Tool requires a live host claim.');
    const result = this.db.prepare('INSERT OR IGNORE INTO effects (business_key, owner, job_id) VALUES (?, ?, ?)').run(job.key, owner, job.id);
    return { type: 'user.custom_tool_result' as const, custom_tool_use_id: event.id, is_error: false,
      content: [{ type: 'text' as const, text: JSON.stringify({ recorded: Number(result.changes), businessKey: job.key }) }] };
  }
  async worker(owner: string, scenario: 'success' | 'failure') {
    if (this.closing || [...this.jobs.values()].some(job => job.owner === owner && job.state === 'running')) throw new QueueError('Worker already has a claim.');
    if ([...this.jobs.values()].filter(job => job.state === 'running').length >= 2) throw new QueueError('Worker capacity reached.', 429);
    const job = [...this.jobs.values()].find(item => item.owner === owner && ['queued', 'retry'].includes(item.state) && item.dueAt <= this.clock(owner));
    if (!job) throw new QueueError('No due job available.');
    // The claim and attempt increment happen before the first await.
    job.state = 'running'; job.attempts++; job.controller = new AbortController(); job.audit.push(`Claimed attempt ${job.attempts}.`);
    const timer = setTimeout(() => job.controller?.abort('deadline'), 2000); timer.unref();
    job.work = (async () => {
      try { await delay(this.stepMs, undefined, { signal: job.controller!.signal });
        if (scenario === 'failure') throw new Error('Authored worker failure.');
        const eventId = `sevt_${randomUUID().replaceAll('-', '')}`;
        const result = this.handleTool(owner, { id: eventId, name: lab68ToolDefinition.name,
          input: { jobId: job.id, summary: 'Fictional finch incident triaged.' } });
        job.audit.push(`Tool result ${result.custom_tool_use_id}; stable key ${job.key}.`); job.state = 'succeeded';
      } catch { if (job.controller!.signal.aborted) { job.state = 'cancelled'; job.audit.push('Host claim cancelled; no new effect.'); }
        else if (job.attempts >= 3) { job.state = 'dead-letter'; job.audit.push('Third failure moved to dead letter.'); }
        else { job.state = 'retry'; job.dueAt = this.clock(owner) + job.attempts * 1000; job.audit.push(`Retry due after ${job.attempts} second(s).`); }
      } finally { clearTimeout(timer); }
    })(); await job.work; return this.snapshot(owner);
  }
  cancel(owner: string, id: string) { const job = this.own(owner, id);
    if (job.state === 'running') job.controller?.abort('user');
    else if (['queued', 'retry'].includes(job.state)) { job.state = 'cancelled'; job.audit.push('Cancelled before a claim.'); }
    return this.snapshot(owner); }
  snapshot(owner: string) { return { source: 'offline-host-queue', scheduleClock: this.clock(owner), advancedSeconds: (this.offsets.get(owner) ?? 0) / 1000,
    signatureClock: 'real host time; unaffected by advance', jobs: [...this.jobs.values()].filter(job => job.owner === owner)
      .map(({ controller: _controller, work: _work, owner: _owner, ...job }) => job),
    schedules: [...this.schedules.values()].filter(schedule => schedule.owner === owner).map(({ owner: _owner, ...schedule }) => schedule),
    effects: this.db.prepare('SELECT business_key, job_id FROM effects WHERE owner=?').all(owner), providerCalls: 0 }; }
  async close() { this.closing = true; for (const job of this.jobs.values()) job.controller?.abort('shutdown');
    await Promise.allSettled([...this.jobs.values()].map(job => job.work)); this.db.close(); }
}

export function createLab68Router(store = new Lab68Queue()) {
  const router = Router(); const reply = async (response: Response, action: () => unknown | Promise<unknown>, status = 200) => {
    try { response.status(status).json(await action()); } catch (error) { response.status(error instanceof QueueError ? error.status : 400)
      .json(apiError('INVALID_REQUEST', error instanceof QueueError ? error.message : 'Closed queue input rejected.')); } };
  // Raw bytes must reach signature verification before any JSON parser.
  router.post('/webhook', raw({ type: 'application/json', limit: '4kb' }), (request, response) => {
    if (!Buffer.isBuffer(request.body)) { response.status(400).json(apiError('INVALID_REQUEST', 'Raw JSON bytes required.')); return; }
    void reply(response, () => store.webhook(request.body, String(request.headers['x-lab68-timestamp'] ?? ''),
      String(request.headers['x-lab68-signature'] ?? '')), 202);
  });
  router.use(json({ strict: true, limit: '2kb' }));
  router.use((request, response, next) => { const host = request.headers.host ?? '', owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Local owner-scoped queue required.')); return; }
    response.set('Cache-Control', 'no-store'); next(); });
  const owner = (request: Request) => request.headers['x-lab-owner'] as string;
  router.get('/facts', (_request, response) => response.json({ source: 'offline-host-queue', providerCalls: 0,
    toolDefinition: lab68ToolDefinition, builtInTools: false, mcp: false, skills: false, maxJobs: 100,
    note: 'Triggers only admit jobs. One explicit worker click claims one job; no provider is called.' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab68-scheduled-event-driven.ts', 'server/concepts/68-scheduled-event-driven.ts'] }));
  router.get('/state', (request, response) => response.json(store.snapshot(owner(request))));
  router.post('/schedules', (request, response) => void reply(response, () => store.schedule(owner(request), lab68ScheduleSchema.parse(request.body).intervalSeconds)));
  router.post('/advance', (request, response) => void reply(response, () => store.advance(owner(request), lab68AdvanceSchema.parse(request.body).seconds)));
  router.post('/tick', (request, response) => void reply(response, () => { z.strictObject({}).parse(request.body); return store.tick(owner(request)); }));
  router.post('/fixtures/webhook', (request, response) => void reply(response, () => { const input = lab68FixtureSchema.parse(request.body);
    return store.fixture(owner(request), input.eventId, input.kind); }, 202));
  router.post('/worker', (request, response) => void reply(response, () => store.worker(owner(request), lab68WorkerSchema.parse(request.body).scenario)));
  router.post('/jobs/:id/cancel', (request, response) => void reply(response, () => { z.strictObject({}).parse(request.body);
    return store.cancel(owner(request), request.params.id as string); }));
  return { router, close: () => store.close() };
}
