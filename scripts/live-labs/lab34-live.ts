// Lab 34 live evidence: the same fixed question under two trusted host output styles, one fresh session each.
// Run from the repo root: node --env-file=.env --import tsx scripts/live-labs/lab34-live.ts
// Billed: two sessions (agent_with_overrides, no tools), one short user turn each. Both are archived in `finally`.
// The style text, its SHA-256 and the composed system come from the lab's own trusted host registry (Lab34Styles).
import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';
import { Lab34Styles, validateLab34Report } from '../../server/lib/lab34-styles.js';
import { lab34FixedQuestion } from '../../shared/lab34-output-styles.js';

const env = process.env;
const agentId = env.CLAUDE_MANAGED_AGENT_ID ?? env.MANAGED_AGENT_ID;
const environmentId = env.CLAUDE_MANAGED_ENVIRONMENT_ID ?? env.MANAGED_ENVIRONMENT_ID;
if (!env.ANTHROPIC_API_KEY?.trim() || !agentId || !environmentId) throw new Error('Set ANTHROPIC_API_KEY, CLAUDE_MANAGED_AGENT_ID and CLAUDE_MANAGED_ENVIRONMENT_ID.');

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 15000,
  openTelemetry: { propagation: false, traces: { enabled: false } } });
const sessions = client.beta.sessions;
const deadline = new AbortController(); const timer = setTimeout(() => deadline.abort(), 120_000);
const log = (line: string) => console.log(line);
const short = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 12);
const clip = (text: string, max = 88) => text.length > max ? text.slice(0, max - 3) + '...' : text;

const host = new Lab34Styles(); const catalog = host.styles();
const baseSystem = 'You are a read-only assistant for a fictional bird observation notebook. Do not use tools.';
// Host-side format checks: the style shapes the answer, but the host decides whether the shape is acceptable.
const checks: Record<string, { label: string; ok: (lines: string[]) => boolean }> = {
  concise: { label: '3 bullet lines', ok: lines => lines.length === 3 && lines.every(l => /^[-•*]\s/.test(l)) },
  'review-v2': { label: 'Completeness/Clarity/Next steps', ok: lines => ['Completeness', 'Clarity', 'Next steps']
    .every(h => lines.some(l => l.replace(/^[-•*#\s]+/, '').replace(/\*\*/g, '').startsWith(h))) },
};
const prompt = `${lab34FixedQuestion} Answer in at most 3 short lines. Then, on one final line, output only a JSON report `
  + 'with keys project ("Aurora Finch"), summary (one sentence) and nextSteps (array of 1-2 short strings). No code fences.';

const opened: string[] = [];
try {
  try { host.compare('live-script', 'missing-style'); } catch (error) {
    log(`Unknown style 'missing-style' → ${error instanceof Error ? error.message : String(error)} (no API call)`); }
  const base = await client.beta.agents.retrieve(agentId, {}, { timeout: 5000 });
  log(`Fixed question: ${lab34FixedQuestion}`);
  const hashes: string[] = [];
  for (const name of ['concise', 'review-v2'] as const) {
    const style = catalog.find(item => item.name === name)!;
    const system = `${baseSystem}\n\nTrusted output preference (${style.name}; SHA-256 ${style.sha256}):\n${style.instruction}`;
    const session = await sessions.create({ agent: { type: 'agent_with_overrides', id: base.id, version: base.version,
      tools: [], mcp_servers: [], skills: [], system }, environment_id: environmentId, title: `Lab 34 live style ${name}`,
      budget: { type: 'limit', max_list_cost: { amount: '25', currency: 'USD' } } }, { timeout: 10000 });
    opened.push(session.id); hashes.push(short(session.agent.system ?? ''));
    log(`Style ${name} · ${style.path} · sha256 ${style.sha256.slice(0, 12)}`);
    log(`  Session ${session.id} · tools ${session.agent.tools.length} · system ${short(session.agent.system ?? '')} `
      + `(${session.agent.system === system ? 'matches host' : 'DIFFERS'})`);
    const stream = await sessions.events.stream(session.id, {}, { signal: deadline.signal });
    let reply = '', stop = 'unknown', started = false;
    try {
      await sessions.events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] },
        { signal: deadline.signal, timeout: 10000 });
      for await (const event of stream) {
        if (event.type === 'session.status_running') started = true;
        if (event.type === 'agent.message') { started = true; reply += event.content.flatMap(b => b.type === 'text' ? [b.text] : []).join(''); }
        if (event.type === 'session.status_terminated') throw new Error(`Turn failed: ${event.type}`);
        if (event.type === 'session.status_idle' && started) { stop = event.stop_reason.type; break; }
      }
    } finally { stream.controller.abort(); }
    const lines = reply.split('\n').map(l => l.trim()).filter(Boolean);
    let jsonAt = -1; lines.forEach((l, i) => { if (l.startsWith('{')) jsonAt = i; });
    const answer = jsonAt >= 0 ? lines.slice(0, jsonAt) : lines; const report = jsonAt >= 0 ? lines.slice(jsonAt).join(' ') : '';
    log(`  Turn → status idle · stop ${stop} · ${answer.length} answer lines`);
    for (const line of answer.slice(0, 2)) log(`    ${clip(line)}`);
    const verdict = validateLab34Report(report);
    log(`  Format check (${checks[name].label}): ${checks[name].ok(answer) ? 'pass' : 'fail'} · `
      + `report schema: ${verdict.valid ? 'valid' : 'invalid: ' + clip(verdict.errors.join('; '), 40)}`);
  }
  log(`Same question, tools 0, same report schema; only the system differs: ${hashes[0]} ≠ ${hashes[1]}`);
} finally {
  clearTimeout(timer);
  for (const id of opened) {
    try { await sessions.archive(id, {}, { timeout: 10000 }); const s = await sessions.retrieve(id, {}, { timeout: 5000 });
      log(`Archived ${id}: ${s.archived_at ? 'yes' : 'no'}`);
    } catch (error) { log(`Archive failed for ${id}: ${error instanceof Error ? error.message : String(error)}`); }
  }
}
