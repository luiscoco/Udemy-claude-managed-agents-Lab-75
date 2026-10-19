import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Mount and inspect every real lesson without submitting exercise or provider actions.
for (const width of [1280, 390]) for (let lesson = 1; lesson <= 75; lesson++) {
  test(`Lab ${String(lesson).padStart(2, '0')} interface at ${width}px`, async ({ page }, info) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const failures: string[] = [], errors: string[] = [], posts: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() === 'POST') posts.push(new URL(request.url()).pathname); });
    async function inspect(view: string) {
      const observations = await page.locator('main').evaluate(main => {
        const visible = (node: Element) => node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden';
        const name = (node: Element) => node.getAttribute('aria-label')?.trim()
          || node.getAttribute('aria-labelledby')?.split(/\s+/).map(id => document.getElementById(id)?.textContent?.trim() ?? '').join(' ').trim()
          || ('labels' in node ? Array.from((node as HTMLInputElement).labels ?? []).map(label => label.textContent?.trim()).join(' ').trim() : '')
          || node.getAttribute('title')?.trim()
          || (node.matches('button, a, summary') ? node.textContent?.trim() : '');
        const unnamed = Array.from(main.querySelectorAll('button, input:not([type=hidden]), select, textarea')).filter(visible).filter(node => !name(node)).map(node => `${node.tagName.toLowerCase()}#${node.id || '(no id)'}`);
        const badLinks = Array.from(main.querySelectorAll<HTMLAnchorElement>('a[href]')).filter(visible).flatMap(link => {
          const url = new URL(link.href); if (url.origin !== location.origin) return [];
          const id = url.searchParams.get('lesson');
          return id !== null && (!/^\d+$/.test(id) || Number(id) < 1 || Number(id) > 75) ? [link.getAttribute('href')!] : [];
        });
        const ids = new Set<string>(), duplicates: string[] = [];
        for (const node of main.querySelectorAll('[id]')) { if (ids.has(node.id)) duplicates.push(node.id); ids.add(node.id); }
        const overflow = document.documentElement.scrollWidth > innerWidth + 1;
        const wide = overflow ? Array.from(main.querySelectorAll('*')).filter(visible).filter(node => node.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(node => `${node.tagName.toLowerCase()}.${node.className}`) : [];
        return { unnamed, badLinks, duplicates, overflow, wide };
      });
      if (observations.unnamed.length) failures.push(`${view}: unnamed controls: ${observations.unnamed.join(', ')}`);
      if (observations.badLinks.length) failures.push(`${view}: invalid lesson links: ${observations.badLinks.join(', ')}`);
      if (observations.duplicates.length) failures.push(`${view}: duplicate IDs: ${observations.duplicates.join(', ')}`);
      if (observations.overflow) failures.push(`${view}: horizontal page overflow: ${observations.wide.join(', ')}`);
    }
    try {
      await page.goto(`/?lesson=${lesson}`);
      // HTTP navigation can finish before React mounts on a shared Windows
      // runner. Bound startup separately, then keep every audit assertion.
      await page.locator('main h1').first().waitFor({ state: 'visible', timeout: 30000 });
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page.getByRole('region', { name: 'Worked experiment plan' })).toBeVisible();
      await page.getByText('Detailed guide', { exact: true }).click();
      await expect(page.locator('.lesson-guide')).toBeVisible();
      await expect(page.locator('.lesson-guide')).not.toBeEmpty();
      await inspect('Learn');
      await page.getByRole('tab', { name: 'Run the exercise', exact: true }).click();
      await expect(page.locator('[data-guide-exercise] h2').first()).toBeVisible();
      await expect(page.locator('[data-guide-exercise]')).not.toBeEmpty();
      await inspect('Exercise');
      await page.getByRole('tab', { name: 'TypeScript source', exact: true }).click();
      const panel = page.getByRole('tabpanel', { name: 'TypeScript source', exact: true });
      await expect(panel.locator('pre').first()).toBeVisible();
      const selector = panel.getByRole('combobox', { name: 'Source file' });
      const server = await selector.locator('option').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value).find(value => value.startsWith('server/')));
      if (!server) failures.push('Source: no server source option');
      else { await selector.selectOption(server); await expect(panel.locator('pre').first()).toBeVisible(); await expect(panel.locator('pre').first()).not.toBeEmpty(); }
      await inspect('Source');
      failures.push(...errors.map(error => `Runtime: ${error}`));
      if (posts.length) failures.push(`Unexpected execution requests: ${posts.join(', ')}`);
      if (failures.length) await page.screenshot({ path: `artifacts/learning-guide-ui-audit-${lesson}-${width}.png`, fullPage: true });
      expect(failures, `Lab ${lesson} at ${width}px`).toEqual([]);
    } finally {
      await mkdir('artifacts/learning-guide/ui-audit', { recursive: true });
      await writeFile(`artifacts/learning-guide/ui-audit/lab-${lesson}-${width}.json`, JSON.stringify({ lesson, width, failures, errors, posts, status: info.status }, null, 2));
    }
  });
}
