/**
 * Lab 32 live demo: a real Managed session plans with NO tools, the host validates the plan with the lab's
 * hash rule and capability list, and only after host approval (session idle) sessions.update grants ONE
 * restricted custom tool, append_checklist. The host checks the tool call against the approved plan before
 * appending to a local temporary notes.txt. Stale approval and a planning write are refused by the lab's own Lab32PlanGate.
 * One Managed session (agent_with_overrides, tools []), TWO short user turns, 120 s deadline, archived in finally.
 * Run from the repo root: node --env-file=.env --import tsx _live32.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Lab32PlanGate } from '../../server/lib/lab32-plan-gate.js';

const env = process.env;
const apiKey = env.ANTHROPIC_API_KEY?.trim(), agentId = env.CLAUDE_MANAGED_AGENT_ID?.trim();
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID?.trim();
if (!apiKey || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');
const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 30000 });
const sessions = client.beta.sessions;
const deadline = AbortSignal.timeout(120000);
const MAX_TOOL_CALLS = 2;
const short = (text: string, n = 70) => { const t = text.replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const abbrev = (hash: string) => `${hash.slice(0, 8)}…${hash.slice(-4)}`;

// Host gate: the same hash rule as server/lib/lab32-plan-gate.ts (version + text + action + path), one selected capability.
const SELECTED = ['append_checklist'];
type Plan = { version: number; text: string; action: string; path: string; line: string; hash: string };
function gate(version: number, text: string): { ok: true; plan: Plan } | { ok: false; reason: string } {
  const m = /^(\w+) (\S+) \| (.{1,80})$/.exec(text.trim());
  if (!m) return { ok: false, reason: 'plan is not in the required one-line format' };
  const [, action, path, line] = m as unknown as [string, string, string, string];
  if (!SELECTED.includes(action)) return { ok: false, reason: `${action} is outside the selected capabilities` };
  if (path !== 'notes.txt') return { ok: false, reason: `path ${path} is not notes.txt` };
  return { ok: true, plan: { version, text: text.trim(), action, path, line, hash: sha(JSON.stringify({ version, text: text.trim(), action, path })) } };
}

const appendTool = { type: 'custom' as const, name: 'append_checklist',
  description: 'Append exactly one approved checklist line to notes.txt. The host checks it against the approved plan.',
  input_schema: { type: 'object' as const, properties: { path: { type: 'string' }, line: { type: 'string' } }, required: ['path', 'line'] } };
const planPrompt = 'Plan only, do not execute. Fictional task: Aurora Finch wants one deployment checklist line added to notes.txt '
  + 'for her heron field notes. Reply with exactly one line in this format and nothing else: '
  + 'append_checklist notes.txt | <one checklist line, under 60 characters>';
const runPrompt = 'The host approved your plan and granted append_checklist. Execute the approved plan now: call append_checklist '
  + 'once with path notes.txt and the exact approved line, then reply "done".';

const dir = mkdtempSync(join(tmpdir(), 'lab32-live-')); const notes = join(dir, 'notes.txt');
const initial = 'Fictional deployment notes.\n'; writeFileSync(notes, initial);
let sessionId: string | undefined;
try {
  const session = await sessions.create({
    agent: { type: 'agent_with_overrides', id: agentId, tools: [], mcp_servers: [], skills: [],
      system: 'You write very short fictional plans. Follow the host format exactly.' },
    environment_id: environmentId, title: 'Lab 32 live plan gate',
    budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } },
  }, { signal: deadline });
  sessionId = session.id;
  console.log(`Session ${session.id} created · planning only: tools ${session.agent.tools.length}, MCP ${session.agent.mcp_servers.length}`);
  const stream = await sessions.events.stream(session.id, {}, { signal: deadline });
  const events = stream[Symbol.asyncIterator]();
  let approved: Plan | undefined, effects = 0, calls = 0;

  async function turn(prompt: string) {
    await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] }, { signal: deadline });
    let reply = '', toolUses = 0, started = false;
    for (;;) {
      const next = await events.next(); if (next.done) throw new Error('Stream ended before the turn finished.');
      const raw = next.value as unknown as { type: string; id?: string; name?: string; input?: Record<string, unknown>;
        content?: { type: string; text?: string }[]; stop_reason?: { type: string } };
      if (raw.type === 'session.status_running') started = true;
      if (raw.type === 'agent.message') { started = true; reply += (raw.content ?? []).map((b) => b.text ?? '').join(' '); }
      if (raw.type === 'agent.custom_tool_use' && raw.id) {
        started = true; toolUses++;
        const line = String(raw.input?.line ?? ''), path = String(raw.input?.path ?? '');
        let text: string, isError = true;
        if (++calls > MAX_TOOL_CALLS) text = 'Tool call cap reached.';
        else if (!approved) text = 'No approved plan.';
        else if (raw.name !== 'append_checklist' || path !== approved.path || line !== approved.line) text = 'Call does not match the approved plan.';
        else if (effects > 0) text = 'The approved action was already applied.';
        else { writeFileSync(notes, `${readFileSync(notes, 'utf8')}${line}\n`); effects = 1; isError = false; text = 'Appended the approved line.'; }
        console.log(`agent.custom_tool_use ${raw.name} "${short(line, 40)}" → host check: ${isError ? `denied (${text})` : 'matches approved plan, appended'}`);
        await sessions.events.send(session.id, { events: [{ type: 'user.custom_tool_result', custom_tool_use_id: raw.id,
          content: [{ type: 'text', text }], is_error: isError }] }, { signal: deadline });
      }
      if (raw.type === 'session.status_terminated') throw new Error('Session terminated.');
      if (raw.type === 'session.status_idle' && started && raw.stop_reason?.type !== 'requires_action')
        return { reply: reply.trim(), toolUses, stop: raw.stop_reason?.type ?? 'idle' };
    }
  }

  const t1 = await turn(planPrompt);
  console.log(`Turn 1 (plan only) → idle · stop ${t1.stop} · tool calls ${t1.toolUses}`);
  console.log(`  Agent plan: ${short(t1.reply, 88)}`);
  const decision = gate(1, t1.reply);
  if (!decision.ok) { console.log(`Host gate: plan v1 rejected (${decision.reason}); no tool is granted`); }
  else {
    approved = decision.plan;
    console.log(`Host gate: plan v1 · hash ${abbrev(approved.hash)} · capability ${approved.action} → approved`);
    const tampered = gate(1, `write_anywhere /etc/hosts | ${approved.line}`);
    console.log(`Host gate, tampered plan (write_anywhere) → ${tampered.ok ? 'approved' : `rejected: ${tampered.reason}`}`);
    const before = await sessions.retrieve(session.id, {}, { signal: deadline });
    const updated = await sessions.update(session.id, { agent: { tools: [appendTool] } }, { signal: deadline });
    console.log(`Status ${before.status} → sessions.update grants tools: ${updated.agent.tools.map((t) => ('name' in t ? t.name : t.type)).join(', ')}`);
    const t2 = await turn(runPrompt);
    console.log(`Turn 2 (execute) → idle · stop ${t2.stop} · tool calls ${t2.toolUses} · reply "${short(t2.reply, 30)}"`);
  }
  const text = readFileSync(notes, 'utf8');
  console.log(`notes.txt: ${text.trim().split('\n').length} lines · execution file effects ${effects} · hash changed ${sha(text) !== sha(initial) ? 'yes' : 'no'}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
  if (sessionId) {
    await sessions.archive(sessionId, {}, { timeout: 5000 });
    const after = await sessions.retrieve(sessionId, {}, { timeout: 5000 });
    console.log(`Session archived: ${after.archived_at ? 'yes' : 'no'}`);
  }
}
// Local only, no API call: the lab's own Lab32PlanGate refuses a stale approval and a planning-phase write.
const host = new Lab32PlanGate(), owner = 'lab32-live';
const run = host.run(owner, { mode: 'scripted', scenario: 'approval' });
const planningWrite = host.who(owner, { operation: 'attempt-write', runId: run.runId, phase: 'planning', tool: 'append_checklist' });
console.log(`Lab32PlanGate planning write → ${planningWrite.lastTool?.allowed ? 'allowed' : 'denied'}: ${planningWrite.lastTool?.reason}`);
try { host.decide(owner, { runId: run.runId, planVersion: 1, planHash: '0'.repeat(64), decision: 'approve' }); console.log('Lab32PlanGate stale approval → accepted'); }
catch (error) { console.log(`Lab32PlanGate stale approval → refused ${(error as { statusCode?: number }).statusCode}: ${(error as Error).message}`); }
host.close();
