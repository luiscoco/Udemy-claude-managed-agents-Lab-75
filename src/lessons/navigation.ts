import type { LessonMetadata } from '../../shared/lessons';

export const topicGroups = [
  'Managed Agents fundamentals', 'Sessions and events', 'Agents and environments',
  'Tools, MCP and skills', 'Usage and budgets', 'Advanced orchestration',
  'Permissions and security', 'Production and deployment',
] as const;

export function readRoute(search: string, registry: readonly LessonMetadata[]) {
  const values = new URLSearchParams(search).getAll('lesson');
  if (!values.length) return { lesson: undefined, invalid: false };
  const value = values[0]!;
  const lesson = values.length === 1 && /^\d{1,2}$/.test(value)
    ? registry.find(({ id }) => id === Number(value)) : undefined;
  return { lesson, invalid: !lesson };
}

export function routeHref(id?: number, current = window.location.href) {
  const url = new URL(current);
  url.searchParams.delete('lesson');
  if (id !== undefined) url.searchParams.set('lesson', String(id));
  return `${url.pathname}${url.search}${url.hash}`;
}

export function numericOrder<T extends LessonMetadata>(registry: readonly T[]): T[] {
  return [...registry].sort((a, b) => a.id - b.id);
}

export function searchLessons<T extends LessonMetadata>(registry: readonly T[], query: string): T[] {
  const term = query.trim().toLowerCase();
  return registry.filter((lesson) => [String(lesson.id), String(lesson.id).padStart(2, '0'),
    lesson.title, lesson.objective, lesson.topic].join(' ').toLowerCase().includes(term));
}
