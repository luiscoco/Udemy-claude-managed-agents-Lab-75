import { lab21Commands, expandLab21Command } from '../../shared/lab21-slash-commands.js';
import { Lab15Error, Lab15Sessions } from './lab15-sessions.js';

type Entry = { owner: string; mode: 'scripted' | 'live'; history: string[]; active: boolean; usable: boolean };
export class Lab21Commands {
  private entries = new Map<string, Entry>();
  constructor(private sessions = new Lab15Sessions()) {}
  commands() { return lab21Commands; }
  prepare(owner: string, mode: 'scripted' | 'live') {
    const snapshot = this.sessions.prepare(owner, { mode, prompt: 'Command session prepared.', scenario: 'normal', budgetCents: 50,
      maxTurns: 3, maxMessages: 3, deadlineSeconds: 30 });
    this.entries.set(snapshot.runId, { owner, mode, history: [], active: false, usable: true }); return snapshot;
  }
  private owned(runId: string, owner: string) {
    const entry = this.entries.get(runId);
    if (!entry || entry.owner !== owner) throw new Lab15Error(404, 'Unknown or unowned command session.');
    return entry;
  }
  async run(runId: string, owner: string, command: string, args: unknown, signal: AbortSignal) {
    const entry = this.owned(runId, owner);
    if (entry.active) throw new Lab15Error(409, 'A command is already running.');
    if (!entry.usable) throw new Lab15Error(409, 'This session is not reusable; close it before another command.');
    // Parse the exact host grammar before any provider action. No interpolation of executable text or paths.
    const expanded = expandLab21Command(command, args);
    if (expanded === null) {
      // Local actions are permitted only on an open, owned session; no provider port is touched.
      if (command === 'reset') entry.history = [];
      return { kind: 'local' as const, command, history: [...entry.history], providerSends: 0, expanded: null };
    }
    entry.active = true;
    try {
      const snapshot = await this.sessions.execute(runId, owner, { type: 'send', prompt: expanded }, signal, () => {});
      entry.usable = snapshot.state === 'idle';
      if (entry.history.length === 3) entry.history.shift();
      entry.history.push(`${command}: ${expanded}`);
      return { kind: 'model' as const, command, history: [...entry.history], providerSends: snapshot.messagesUsed,
        expanded, snapshot };
    } finally { entry.active = false; }
  }
  async close(runId: string, owner: string) {
    this.owned(runId, owner);
    const snapshot = await this.sessions.end(runId, owner);
    if (snapshot.state === 'closed') this.entries.delete(runId);
    return snapshot;
  }
  async shutdown() { await this.sessions.close(); this.entries.clear(); }
}
