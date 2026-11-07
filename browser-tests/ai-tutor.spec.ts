import { test, expect } from '@playwright/test';

test('prepared tutor works on both capstones without any live provider request', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  let models = 0; page.on('request', request => { if (request.url().endsWith('/api/ai-tutor/models')) models++; });
  for (const lesson of [50, 75]) {
    await page.goto(`/?lesson=${lesson}`);
    await page.getByRole('button', { name: 'Ask AI Tutor', exact: true }).click();
    await expect(page.getByRole('tab', { name: 'AI Tutor', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: 'AI Tutor', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Explain this exercise', exact: true }).click();
    await page.getByRole('button', { name: 'Ask the tutor', exact: true }).click();
    const answer = page.getByRole('region', { name: 'Tutor answer', exact: true });
    await expect(answer).toContainText(`Lab ${lesson}:`); await expect(answer).toContainText('Prepared guidance');
    await page.getByRole('button', { name: 'Simple code example', exact: true }).click();
    await page.getByRole('button', { name: 'Ask the tutor', exact: true }).click();
    await expect(answer.locator('pre')).toBeVisible(); await expect(answer).toContainText('server/');
    await page.getByRole('tab', { name: 'Learn', exact: true }).click();
    await page.getByRole('tab', { name: 'AI Tutor', exact: true }).click();
    await expect(answer.locator('pre')).toBeVisible();
  }
  expect(models).toBe(0); expect(errors).toEqual([]);
});

test('live UI resets consent, displays formatted answers and reopens saved answers without asking again', async ({ page }) => {
  let paid = 0; let saves = 0;
  const saved = { id: 'saved-test', lesson: 1, intent: 'explain', question: 'Explain this exercise', model: 'claude-test',
    answer: '## Model explanation\n\nRead the **host evidence**.\n\n```typescript\nconst done = true;\n```\n\n<script>window.TUTOR_UNSAFE = true</script>\n\n[Unsafe link](javascript:alert(1))',
    usage: { inputTokens: 100, outputTokens: 40 }, generatedAt: '2026-11-01T12:00:00Z', savedAt: '2026-11-01T12:00:01Z', contextHash: 'test', current: true };
  await page.route('**/api/ai-tutor/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (path.endsWith('/status')) { await route.fulfill({ json: { liveAvailable: true, savedAnswersAvailable: true, maxOutputTokens: 4096, message: '' } }); return; }
    if (path.endsWith('/models')) { await route.fulfill({ json: { models: [{ id: 'claude-test', name: 'Test Claude' }] } }); return; }
    if (path.endsWith('/saved') && request.method() === 'GET') { await route.fulfill({ json: { answers: saves ? [saved] : [] } }); return; }
    if (path.endsWith('/saved') && request.method() === 'POST') { saves++; await route.fulfill({ status: 201, json: { answer: saved } }); return; }
    if (path.endsWith('/saved/saved-test') && request.method() === 'DELETE') { saves = 0; await route.fulfill({ status: 204 }); return; }
    if (request.method() === 'POST') {
      const body = request.postDataJSON() as { consent: boolean; mode: string; model: string }; expect(body.consent).toBe(true); expect(body.model).toBe('claude-test');
      paid++; await route.fulfill({ json: { mode: 'live', model: 'claude-test', answer: saved.answer, usage: saved.usage, modelCalls: 1,
        ...(paid === 1 ? { pendingToken: 'test-token' } : { incomplete: true }), note: 'Test provider answer' } }); return;
    }
    await route.abort();
  });
  await page.goto('/?lesson=1'); await page.getByRole('tab', { name: 'AI Tutor', exact: true }).click();
  await page.getByLabel('Answer mode', { exact: true }).selectOption('live');
  await page.getByLabel('Claude model', { exact: true }).selectOption('claude-test');
  await expect(page.getByLabel('Claude model', { exact: true })).toHaveValue('claude-test');
  const ask = page.getByRole('button', { name: 'Ask the tutor', exact: true }); await expect(ask).toBeDisabled();
  const consent = page.getByRole('checkbox', { name: /I authorize one paid tutor/ }); await consent.check(); await ask.click();
  await expect(page.getByRole('region', { name: 'Tutor answer', exact: true })).toContainText('Model explanation'); await expect(consent).not.toBeChecked();
  await expect(page.getByRole('region', { name: 'Tutor answer' }).locator('pre')).toContainText('const done = true;');
  const keyword = page.getByRole('region', { name: 'Tutor answer', exact: true }).locator('.syntax-keyword').first();
  await expect(keyword).toHaveText('const');
  expect(await keyword.evaluate(element => getComputedStyle(element).color)).not.toBe(
    await keyword.evaluate(element => getComputedStyle(element.closest('code')!).color));
  expect(await page.evaluate(() => 'TUTOR_UNSAFE' in window)).toBe(false);
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save this answer', exact: true }).click(); await expect(page.getByText('Answer saved.', { exact: false })).toBeVisible();
  await page.reload(); await page.getByRole('tab', { name: 'AI Tutor', exact: true }).click();
  await page.locator('.ai-tutor-saved-list button').click(); await expect(page.getByRole('heading', { name: 'Saved answer', exact: true })).toBeVisible(); expect(paid).toBe(1);
  await page.getByRole('button', { name: 'Remove saved answer', exact: true }).click(); await expect(page.getByText('No saved answers for this lab yet.')).toBeVisible(); expect(paid).toBe(1);
  await page.getByLabel('Answer mode', { exact: true }).selectOption('live');
  await page.getByLabel('Claude model', { exact: true }).selectOption('claude-test');
  await consent.check(); await ask.click();
  await expect(page.getByRole('alert')).toContainText('Partial answer: Claude reached the output limit.');
  await expect(page.getByRole('region', { name: 'Tutor answer', exact: true })).toContainText('Model explanation');
  await expect(page.getByRole('button', { name: 'Save this answer', exact: true })).toHaveCount(0);
  await expect(consent).not.toBeChecked(); expect(paid).toBe(2);
});

test('tutor controls and prepared answer stay within a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lesson=1'); await page.getByRole('tab', { name: 'AI Tutor', exact: true }).click();
  await page.getByRole('button', { name: 'Steps to complete it', exact: true }).click(); await page.getByRole('button', { name: 'Ask the tutor', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Tutor answer', exact: true })).toBeVisible();
  const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(width.scroll).toBeLessThanOrEqual(width.viewport + 1);
});
