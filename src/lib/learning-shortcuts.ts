import { routeHref } from '../lessons/navigation';

export const lessonSections = [
  { key: 'notebook', label: 'Notebook' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'exercise', label: 'Exercise' },
] as const;
export type LessonSection = typeof lessonSections[number]['key'];
export const lessonSectionId = (lessonId: number, section: LessonSection) => `lesson-${section}-${lessonId}`;
export function lessonSectionHref(lessonId: number, section: LessonSection) {
  const url = new URL(routeHref(lessonId), window.location.href);
  url.hash = lessonSectionId(lessonId, section);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function openLearningSection(id: string) {
  const section = document.getElementById(id);
  if (!section) return;
  if (section instanceof HTMLButtonElement && ['exercise', 'tutor'].includes(section.dataset.lessonShortcut ?? '')) section.click();
  for (let parent: HTMLElement | null = section; parent; parent = parent.parentElement) {
    if (parent instanceof HTMLDetailsElement) parent.open = true;
  }
  section.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  section.focus({ preventScroll: true });
}
