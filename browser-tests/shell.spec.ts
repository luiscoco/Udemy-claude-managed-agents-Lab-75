import { expect, test } from '@playwright/test';
const harness = '/browser-tests/harness.html';
test('runtime has Labs 01 to 20: Start link works and Lab 00 has no route', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('.sidebar')).toContainText('20 implemented lessons');
  await expect(page.getByRole('link', { name: /Start with Lab 01/ })).toBeVisible();
  for (const id of ['0', '00', '21', '75', 'bad', '', '0&lesson=0']) {
    await page.goto(`/?lesson=${id}`);
    await expect(page.getByRole('heading', { name: /That lesson.*available yet/ })).toBeVisible();
    expect(new URL(page.url()).search).toBe('');
  }
  for (const path of ['/facts', '/runs', '/stream']) {
    const response = path === '/facts' ? await request.get(`/api/c0${path}`) : await request.post(`/api/c0${path}`, { data: {} });
    expect(response.status()).toBe(404);
  }
});
test('Lab 01 Start, query initialization, history, search, ordering and theme', async ({ page }) => {
  await page.goto(harness);
  await page.getByRole('link', { name: 'Start with Lab 01' }).click();
  await expect(page.getByRole('heading', { name: 'Framework test lesson', exact: true })).toBeVisible();
  expect(new URL(page.url()).search).toBe('?lesson=1');
  await page.locator('.sidebar').getByRole('link', { name: 'Home' }).click();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Framework test lesson', exact: true })).toBeVisible();
  await page.goForward();
  const search = page.locator('.sidebar').getByRole('searchbox');
  for (const term of ['01', 'CONTRACTS', 'HOST POLICY']) { await search.fill(term); await expect(page.locator('.sidebar .lesson-link')).toHaveCount(1); }
  await search.fill('missing'); await expect(page.locator('.sidebar')).toContainText('No lessons match.');
  await search.fill(''); await page.locator('.sidebar').getByRole('button', { name: 'Lesson order' }).click();
  await expect(page.locator('.sidebar .lesson-link')).toBeVisible();
  const theme = await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button', { name: /Switch to .* theme/ }).click(); await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');
});
for (const width of [320, 390, 1280]) test(`shell fits ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 850 });
  for (const route of ['/', `${harness}?lesson=01`]) {
    await page.goto(route);
    if (route !== '/') await page.getByRole('tab', { name: 'TypeScript source' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
test('mobile drawer traps focus, restores focus and navigates', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 }); await page.goto(harness);
  await page.getByRole('button', { name: 'Menu' }).click();
  const dialog = page.getByRole('dialog'); await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(dialog.locator('summary')).toBeFocused();
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true); }
  await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();
  await page.getByRole('button', { name: 'Menu' }).click(); await dialog.getByRole('searchbox').fill('01');
  await dialog.getByRole('link', { name: '01 Framework test lesson' }).click();
  await expect(dialog).not.toBeVisible(); await expect(page.locator('main')).toBeFocused();
});

test('Home readiness reads, errors and cancellation never start an exercise', async ({ page }) => {
  let mode = 'ready'; let release!: () => void; const calls: string[] = [];
  await page.route('**/api/health', async route => {
    calls.push(route.request().method());
    if (mode === 'pending') await new Promise<void>(resolve => { release = resolve; });
    await route.fulfill({ status: mode === 'error' ? 503 : 200, json: {
      version: '0.1.0', readiness: 'ready', features: { scriptedLessons: false, liveAgentExecution: false },
    } }).catch(() => {});
  });
  await page.goto('/'); await page.getByRole('button', { name: 'Check backend' }).click();
  await expect(page.getByText('Backend ready.', { exact: true })).toBeVisible();
  await expect(page.locator('details[open] pre')).toContainText('"scriptedLessons": false');
  mode = 'error'; await page.getByRole('button', { name: 'Check backend' }).click();
  await expect(page.getByText('Backend returned HTTP 503.', { exact: true })).toBeVisible();
  mode = 'pending'; await page.getByRole('button', { name: 'Check backend' }).click();
  await expect.poll(() => typeof release).toBe('function');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByText('Health check cancelled.', { exact: true })).toBeVisible();
  release(); expect(calls).toEqual(['GET', 'GET', 'GET']);
});

test('Home does not substitute another registered lesson for Lab 01', async ({ page }) => {
  await page.goto('/browser-tests/harness.html?gap=1');
  await expect(page.locator('.sidebar')).toContainText('1 implemented lesson');
  await expect(page.getByRole('link', { name: /Start with/ })).toHaveCount(0);
  await expect(page.getByText('Lab 01 is coming next.', { exact: true })).toBeVisible();
});
