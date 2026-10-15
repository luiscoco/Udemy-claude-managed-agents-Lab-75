import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lab34FixedQuestion, lab34ReportSchema, lab34SnapshotSchema, lab34StyleNames } from '../../shared/lab34-output-styles.js';
import type { Lab34Snapshot } from '../../shared/lab34-output-styles.js';

export class Lab34Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
type Name = typeof lab34StyleNames[number];
const baseSystem = 'You are a read-only assistant for a fictional bird observation notebook. Do not use tools.';
const registry: Readonly<Record<Name, string>> = Object.freeze({
  concise: 'concise.md', explanatory: 'explanatory.md', 'review-v1': 'review-v1.md', 'review-v2': 'review-v2.md',
});
export function validateLab34Report(raw: string) {
  let value: unknown; try { value = JSON.parse(raw); } catch { return { valid: false, errors: ['Report is not JSON.'] }; }
  const parsed = lab34ReportSchema.safeParse(value);
  return { valid: parsed.success, errors: parsed.success ? [] : parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).slice(0, 6) };
}
export class Lab34Styles {
  private entries = new Map<string, { owner: string; snapshot: Lab34Snapshot; expiresAt: number }>(); private closed = false;
  constructor(private now = () => Date.now()) {}
  styles() { return lab34StyleNames.map(name => {
    const file = registry[name], text = readFileSync(fileURLToPath(new URL(`../../fixtures/lab34/styles/${file}`, import.meta.url)), 'utf8').trim();
    return { name, path: `fixtures/lab34/styles/${file}`, sha256: createHash('sha256').update(text).digest('hex'), instruction: text };
  }); }
  private get(owner: string, runId: string) { const entry = this.entries.get(runId);
    if (!entry || entry.owner !== owner) throw new Lab34Error(404, 'Unknown or unowned style run.');
    if (entry.snapshot.status === 'completed' && this.now() >= entry.expiresAt) entry.snapshot = { ...entry.snapshot, status: 'expired' };
    return entry; }
  compare(owner: string, style: string) {
    if (this.closed || this.entries.size >= 24) throw new Lab34Error(429, 'Style comparison capacity reached.');
    const selected = this.styles().find(item => item.name === style);
    if (!selected) throw new Lab34Error(400, 'Unknown trusted host style; no session was created.');
    const configuredSystem = `${baseSystem}\n\nTrusted output preference (${selected.name}; SHA-256 ${selected.sha256}):\n${selected.instruction}`;
    const answer = selected.name === 'concise' ? '• Date and time\n• Location\n• Count and observation notes' :
      selected.name === 'explanatory' ? 'Record the date and time to place the sighting. Add the location for later review. Note the count and observed behavior so the record can be checked.' :
      selected.name === 'review-v1' ? 'Completeness: include date, location and count.\nClarity: distinguish observed behavior from interpretation.' :
        'Completeness: include date, location and count.\nClarity: distinguish facts from interpretation.\nNext steps: verify any missing observation detail.';
    const report = JSON.stringify({ project: 'Aurora Finch', summary: 'A fictional observation note should record the sighting time, location, count and observed behavior.',
      nextSteps: ['Check missing fields before sharing.'] });
    const verified = validateLab34Report(report);
    const snapshot = lab34SnapshotSchema.parse({ source: 'authored-fixture', runId: randomUUID(), sessionId: randomUUID(),
      status: 'completed', style: selected.name, styleHash: selected.sha256, stylePath: selected.path, instruction: selected.instruction,
      configuredSystem, question: lab34FixedQuestion, capabilities: [], answer, reportValid: verified.valid, reportErrors: verified.errors,
      providerCalls: 0, note: 'Authored answer illustrates formatting only; it is not a live style-quality score. Report validation is a separate schema check.' });
    this.entries.set(snapshot.runId, { owner, snapshot, expiresAt: this.now() + 60_000 }); return snapshot;
  }
  inspect(owner: string, runId: string) { return this.get(owner, runId).snapshot; }
  closeRun(owner: string, runId: string) { const entry = this.get(owner, runId); entry.snapshot = { ...entry.snapshot, status: 'closed' }; return entry.snapshot; }
  close() { this.closed = true; this.entries.clear(); }
}
