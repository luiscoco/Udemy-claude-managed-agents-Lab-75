/** Reveal only the hidden part of an explanation; never reset an already visible paragraph. */
export function revealGuideTarget(target: HTMLElement, player: HTMLElement | null, behavior: ScrollBehavior = 'instant') {
  const bounds = target.getBoundingClientRect();
  const header = document.querySelector('.topbar')?.getBoundingClientRect();
  const top = Math.max(0, header?.bottom ?? 0) + 16;
  let bottom = window.innerHeight - 16;
  const overlay = player?.getBoundingClientRect();
  if (overlay && overlay.right > bounds.left && overlay.left < bounds.right && overlay.top > top + 64) {
    bottom = Math.min(bottom, overlay.top - 12);
  }
  // Large explanations cannot fit at once. Keep their beginning readable.
  const delta = bounds.top < top || bounds.height > bottom - top
    ? bounds.top - top
    : bounds.bottom > bottom ? bounds.bottom - bottom : 0;
  if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior });
}
