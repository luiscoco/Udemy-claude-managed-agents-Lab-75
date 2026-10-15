import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lab32SnapshotSchema } from '../../shared/lab32-plan-mode.js';
import type { Lab32Decision, Lab32Run, Lab32Who } from '../../shared/lab32-plan-mode.js';

export class Lab32Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
type Status = 'pending' | 'rejected' | 'executed' | 'canceled' | 'expired';
type Tool = { phase: 'planning' | 'execution'; tool: string; allowed: boolean; reason: string };
type Entry = { owner: string; runId: string; scenario: Lab32Run['scenario']; status: Status; directory: string;
  planningSessionId: string; executionSessionId: string | null; planVersion: number; planHash: string; planText: string;
  decisionCount: number; executionFileEffects: number; initialFileHash: string; lastTool: Tool | null; expiresAt: number };
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const planText = (version: number) => `Plan v${version}: append one fictional deployment checklist line to notes.txt. Requested capability: append_checklist. The text of this plan cannot grant tools or permission.`;
const planHash = (version: number, text: string) => sha(JSON.stringify({ version, text, action: 'append_checklist', path: 'notes.txt' }));

export class Lab32PlanGate {
  private entries = new Map<string, Entry>(); private closed = false;
  constructor(private now = () => Date.now()) {}
  private file(entry: Entry) { return join(entry.directory, 'notes.txt'); }
  private get(owner: string, runId: string) {
    const entry = this.entries.get(runId);
    if (!entry || entry.owner !== owner) throw new Lab32Error(404, 'Unknown or unowned plan run.');
    if (entry.status === 'pending' && this.now() >= entry.expiresAt) entry.status = 'expired';
    return entry;
  }
  private view(entry: Entry) {
    const fileText = readFileSync(this.file(entry), 'utf8');
    return lab32SnapshotSchema.parse({ source: 'authored-fixture', runId: entry.runId, scenario: entry.scenario,
      status: entry.status, planningSessionId: entry.planningSessionId, executionSessionId: entry.executionSessionId,
      planVersion: entry.planVersion, planHash: entry.planHash, planText: entry.planText,
      selectedCapabilities: ['append_checklist'], decisionCount: entry.decisionCount,
      planningFileEffects: 0, executionFileEffects: entry.executionFileEffects, initialFileHash: entry.initialFileHash,
      currentFileHash: sha(fileText), fileText, lastTool: entry.lastTool, providerCalls: 0,
      note: 'Offline host gate. Planning has no write capability; only a fresh restricted execution phase can append the checked line.' });
  }
  run(owner: string, input: Lab32Run) {
    if (input.mode === 'live') throw new Lab32Error(422, 'Live planning requires separately configured read-only and restricted Managed agents.');
    if (this.closed || this.entries.size >= 16 || [...this.entries.values()].filter(e => e.owner === owner && e.status === 'pending').length >= 2)
      throw new Lab32Error(429, 'Plan capacity reached.');
    const directory = mkdtempSync(join(tmpdir(), 'managed-lab32-'));
    try {
      const initial = 'Fictional deployment notes.\n'; writeFileSync(join(directory, 'notes.txt'), initial, { flag: 'wx' });
      const text = planText(1);
      const entry: Entry = { owner, runId: randomUUID(), scenario: input.scenario, status: 'pending', directory,
        planningSessionId: randomUUID(), executionSessionId: null, planVersion: 1, planHash: planHash(1, text), planText: text,
        decisionCount: 0, executionFileEffects: 0, initialFileHash: sha(initial), lastTool: null, expiresAt: this.now() + 60_000 };
      this.entries.set(entry.runId, entry);
      if (input.scenario === 'planning-write') this.attempt(entry, 'planning', 'append_checklist');
      return this.view(entry);
    } catch (error) { rmSync(directory, { recursive: true, force: true }); throw error; }
  }
  inspect(owner: string, runId: string) { return this.view(this.get(owner, runId)); }
  private attempt(entry: Entry, phase: 'planning' | 'execution', tool: 'append_checklist' | 'write_anywhere') {
    let reason = 'Planning phase is read-only.'; let allowed = false;
    if (phase === 'execution') {
      if (entry.status !== 'executed' || !entry.executionSessionId) reason = 'No approved execution session.';
      else if (tool !== 'append_checklist') reason = 'Tool is outside the selected execution capabilities.';
      else if (entry.executionFileEffects > 0) reason = 'The approved action was already applied.';
      else { allowed = true; reason = 'Host-checked approved action.';
        const before = readFileSync(this.file(entry), 'utf8');
        writeFileSync(this.file(entry), `${before}Approved fictional deployment checklist.\n`);
        entry.executionFileEffects = 1;
      }
    }
    entry.lastTool = { phase, tool, allowed, reason }; return this.view(entry);
  }
  who(owner: string, input: Lab32Who) {
    const entry = this.get(owner, input.runId);
    if (input.operation === 'inspect') return this.view(entry);
    if (input.operation === 'cancel') { if (entry.status !== 'pending') throw new Lab32Error(409, `Plan is ${entry.status}.`);
      entry.status = 'canceled'; return this.view(entry); }
    return this.attempt(entry, input.phase, input.tool);
  }
  decide(owner: string, input: Lab32Decision) {
    const entry = this.get(owner, input.runId);
    if (entry.status !== 'pending') throw new Lab32Error(409, `Plan is ${entry.status}; decision is unavailable.`);
    if (entry.planVersion !== input.planVersion || entry.planHash !== input.planHash)
      throw new Lab32Error(409, 'Stale plan version or hash; inspect the current plan.');
    if (input.decision === 'revise') {
      if (!input.feedback) throw new Lab32Error(400, 'Revision feedback is required.');
      if (entry.planVersion >= 3) throw new Lab32Error(409, 'Revision limit reached.');
      entry.planVersion++; entry.planText = `${planText(entry.planVersion)} Reviewer feedback: ${input.feedback}`;
      entry.planHash = planHash(entry.planVersion, entry.planText); entry.expiresAt = this.now() + 60_000;
      return this.view(entry);
    }
    if (input.feedback) throw new Lab32Error(400, 'Feedback applies only to revision.');
    entry.decisionCount = 1;
    if (input.decision === 'reject') { entry.status = 'rejected'; return this.view(entry); }
    entry.status = 'executed'; entry.executionSessionId = randomUUID();
    return this.attempt(entry, 'execution', 'append_checklist');
  }
  close() { this.closed = true; for (const entry of this.entries.values()) rmSync(entry.directory, { recursive: true, force: true }); this.entries.clear(); }
}
