import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { SavedTutorAnswer } from '../../shared/ai-tutor.js';

export class AiTutorStore {
  private readonly db: DatabaseSync;
  constructor(directory: string) {
    mkdirSync(directory, { recursive: true });
    this.db = new DatabaseSync(join(directory, 'ai-tutor.sqlite'));
    this.db.exec(`PRAGMA busy_timeout=3000;
      CREATE TABLE IF NOT EXISTS tutor_answers (
        id TEXT PRIMARY KEY, owner_hash TEXT NOT NULL, lesson INTEGER NOT NULL,
        payload TEXT NOT NULL, saved_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS tutor_answers_owner ON tutor_answers(owner_hash,lesson,saved_at DESC);`);
  }
  close() { this.db.close(); }
  list(owner: string, lesson: number): SavedTutorAnswer[] {
    const rows = this.db.prepare('SELECT payload FROM tutor_answers WHERE owner_hash=? AND lesson=? ORDER BY saved_at DESC,id DESC LIMIT 100').all(owner, lesson);
    return rows.map(row => JSON.parse(String(row.payload)) as SavedTutorAnswer);
  }
  save(owner: string, answer: Omit<SavedTutorAnswer, 'id' | 'savedAt'>): SavedTutorAnswer | null {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row = this.db.prepare('SELECT COUNT(*) AS count FROM tutor_answers WHERE owner_hash=? AND lesson=?').get(owner, answer.lesson);
      if (Number(row?.count) >= 100) { this.db.exec('ROLLBACK'); return null; }
      const saved = { ...answer, id: randomUUID(), savedAt: new Date().toISOString() };
      this.db.prepare('INSERT INTO tutor_answers(id,owner_hash,lesson,payload,saved_at) VALUES(?,?,?,?,?)')
        .run(saved.id, owner, saved.lesson, JSON.stringify(saved), saved.savedAt);
      this.db.exec('COMMIT'); return saved;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  delete(owner: string, lesson: number, id: string) {
    return this.db.prepare('DELETE FROM tutor_answers WHERE id=? AND owner_hash=? AND lesson=?').run(id, owner, lesson).changes === 1;
  }
}
