import { test, expect } from '@playwright/test';
test('shared live control handles missing key, pending/error checks, readiness and busy without a model backend', async ({ page }) => {
  let state = 'missing', posts = 0; let releaseCheck!: () => void, releaseRun!: () => void;
  await page.route('**/api/read-only-fixture/availability', async route => {
    if (state === 'pending') await new Promise<void>(resolve => { releaseCheck = resolve; });
    await route.fulfill({ status: state === 'failed' ? 503 : 200, json: { ready: state === 'ready' } });
  });
  await page.route('**/api/read-only-fixture/run', async route => { posts++; await new Promise<void>(resolve => { releaseRun = resolve; }); await route.fulfill({ json: { fixture: true, modelCalls: 0 } }); });
  await page.goto('/browser-tests/live-actions.html'); await page.getByRole('button', { name: 'Run live' }).click();
  await expect(page.getByText(/requires its isolated API key/)).toBeVisible(); expect(posts).toBe(0);
  await page.getByRole('button', { name: 'Check again' }).click(); await expect(page.getByRole('status')).toContainText('still unavailable');
  state = 'pending'; await page.getByRole('button', { name: 'Check again' }).click(); await expect(page.getByRole('button', { name: 'Checking…' })).toBeDisabled();
  await expect.poll(() => Boolean(releaseCheck)).toBe(true); state = 'failed'; releaseCheck(); await expect(page.getByRole('status')).toContainText('Could not check setup');
  state = 'ready'; await page.getByRole('button', { name: 'Check again' }).click(); await expect(page.getByRole('status')).toContainText('Setup is ready'); expect(posts).toBe(0);
  await page.getByRole('button', { name: 'Run live' }).click(); await expect(page.getByRole('button', { name: 'Run live' })).toBeDisabled(); await expect.poll(() => Boolean(releaseRun)).toBe(true);
  releaseRun(); await expect(page.getByRole('button', { name: 'Run live' })).toBeEnabled(); expect(posts).toBe(1);
});
for (const [id, path, button] of [[58, 'search', 'Search catalog'], [59, 'run', 'Run routing fixture'], [60, 'run', 'Start offline batch'], [61, 'demo', 'Run local MCP client']] as const)
  test(`Lab ${id} never starts work on navigation and blocks duplicate busy actions`, async ({ page }) => {
    let posts = 0, release!: () => void;
    await page.route(`**/api/c${id}/${path}`, async route => { posts++; await new Promise<void>(resolve => { release = resolve; }); await route.fulfill({ status: 503, json: { error: { message: 'Read-only fixture rejected exercise' } } }); });
    await page.goto(`/?lesson=${id}`); await page.getByRole('tab', { name: 'Run the exercise' }).click(); expect(posts).toBe(0);
    await page.getByRole('button', { name: button }).click(); await expect(page.getByRole('button', { name: button })).toBeDisabled(); await expect.poll(() => Boolean(release)).toBe(true);
    release(); await expect(page.getByRole('button', { name: button })).toBeEnabled(); expect(posts).toBe(1);
  });
