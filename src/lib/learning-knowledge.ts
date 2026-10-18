import { knowledgeVersion, lessonKnowledgeCheck } from '../../shared/learning-quizzes';

export const knowledgeKey = (id: number) => `managed-learning-knowledge-${id}`;
export type KnowledgeAttempt = { version: 1; selected: number; checkedAt: string };
export function validKnowledgeAttempt(value: unknown): value is KnowledgeAttempt {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const attempt = value as Record<string, unknown>;
  return Object.keys(attempt).length === 3 && attempt.version === knowledgeVersion && Number.isInteger(attempt.selected)
    && Number(attempt.selected) >= 0 && Number(attempt.selected) < 3 && typeof attempt.checkedAt === 'string'
    && /^\d{4}-\d{2}-\d{2}T/.test(attempt.checkedAt) && Number.isFinite(Date.parse(attempt.checkedAt))
    && new Date(attempt.checkedAt).toISOString() === attempt.checkedAt;
}
export function readKnowledgeAttempt(storage: Pick<Storage, 'getItem'>, id: number): KnowledgeAttempt | null {
  try { const value: unknown = JSON.parse(storage.getItem(knowledgeKey(id)) ?? 'null'); return validKnowledgeAttempt(value) ? value : null; }
  catch { return null; }
}
export function knowledgePassed(id: number, attempt: KnowledgeAttempt | null) {
  return attempt !== null && attempt.version === knowledgeVersion && attempt.selected === lessonKnowledgeCheck(id).correctIndex;
}
