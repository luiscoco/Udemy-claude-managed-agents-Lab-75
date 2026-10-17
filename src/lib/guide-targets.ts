/** Locate visible exercise content without clicking, focusing or changing its values. */
export function guideControlTarget(root: HTMLElement, stepId: string): HTMLElement | undefined {
  const firstVisible = (scope: Element | null, selector: string) => [...(scope?.querySelectorAll<HTMLElement>(selector) ?? [])]
    .find(element => element.getClientRects().length > 0);
  const exercise = root.querySelector('[data-guide-exercise]');
  if (stepId === 'example') {
    const input = firstVisible(exercise, 'textarea, select, input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
    return input?.closest<HTMLElement>('fieldset, .lab-field, label') ?? input;
  }
  if (stepId === 'controls') return firstVisible(exercise, '.lab-controls') ?? firstVisible(exercise, 'button');
  if (stepId === 'evidence') return firstVisible(exercise, '[data-guide-evidence], [aria-label="Run results"], [aria-label="Results"], .agent-response, .report-turn');
  if (stepId === 'source') return firstVisible(root.querySelector('[data-guide-source]'), 'pre');
  return undefined;
}
