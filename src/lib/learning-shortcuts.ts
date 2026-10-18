export function openLearningSection(id: string) {
  const section = document.getElementById(id);
  if (!section) return;
  for (let parent: HTMLElement | null = section; parent; parent = parent.parentElement) {
    if (parent instanceof HTMLDetailsElement) parent.open = true;
  }
  section.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  section.focus({ preventScroll: true });
}
