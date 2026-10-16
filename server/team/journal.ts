import { createHash } from 'node:crypto';
import { open, readFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
type Entry = { seq: number; type: string; data: unknown; previous: string; hash: string };
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export class Journal {
  private entries: Entry[] = []; private tail = Promise.resolve();
  constructor(readonly path: string) {}
  async load() {
    const text = await readFile(this.path, 'utf8'); if (!text.endsWith('\n') || text.length > 8_000_000) throw new Error('Corrupt journal framing.');
    const entries: Entry[] = []; for (const line of text.trimEnd().split('\n')) { const entry = JSON.parse(line) as Entry;
      if (entry.seq !== entries.length + 1 || entry.previous !== (entries.at(-1)?.hash ?? '') || entry.hash !== digest({ seq: entry.seq, type: entry.type, data: entry.data, previous: entry.previous })) throw new Error('Journal chain inconsistent.'); entries.push(entry); }
    this.entries = entries; return this.snapshot();
  }
  append(type: string, data: unknown) { const work = this.tail.then(async () => {
    const body = { seq: this.entries.length + 1, type, data: structuredClone(data), previous: this.entries.at(-1)?.hash ?? '' }; const entry = { ...body, hash: digest(body) };
    await mkdir(dirname(this.path), { recursive: true }); const file = await open(this.path, 'a'); try { await file.writeFile(JSON.stringify(entry) + '\n'); await file.sync(); } finally { await file.close(); }
    this.entries.push(entry); return structuredClone(entry);
  }); this.tail = work.then(() => {}, () => {}); return work; }
  snapshot() { return structuredClone(this.entries); }
}
