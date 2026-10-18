import { test, expect } from '@playwright/test';

test('notes and bookmarks persist and downloaded backup excludes unrelated browser values', async ({ page }) => {
  let posts = 0; page.on('request', request => { if (request.method() === 'POST') posts++; });
  await page.goto('/?lesson=65');
  const notebook = page.locator('.lesson-notebook'); await notebook.locator('summary').click();
  await notebook.getByRole('textbox', { name: 'Notes for Lab 65' }).fill('Observed one effect; check the duplicate guard.');
  await notebook.getByRole('button', { name: 'Save note', exact: true }).click();
  await notebook.getByRole('checkbox', { name: 'Bookmark this lesson for review' }).check();
  await page.reload(); await notebook.locator('summary').click();
  await expect(notebook.getByRole('textbox')).toHaveValue('Observed one effect; check the duplicate guard.');
  await expect(notebook.getByRole('checkbox')).toBeChecked();
  await notebook.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/learning-guide-notebook.png', fullPage: false });
  await page.evaluate(() => localStorage.setItem('unrelated-test-setting', 'not-in-learning-backup'));
  await page.locator('.sidebar').getByRole('link', { name: 'Home', exact: true }).click();
  const progress = page.getByRole('region', { name: 'Course progress' });
  await progress.getByText('Back up or restore my learning', { exact: true }).click();
  const downloadEvent = page.waitForEvent('download');
  await progress.getByRole('button', { name: 'Download learning backup', exact: true }).click();
  const download = await downloadEvent; const stream = await download.createReadStream();
  const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString('utf8'), backup = JSON.parse(text);
  expect(text).not.toContain('not-in-learning-backup');
  expect(backup.lessons.find((item: { lessonId: number }) => item.lessonId === 65).note).toContain('Observed one effect');
  expect(posts).toBe(0);
});

test('restore previews without mutation, supports cancellation and rejects invalid files', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const progress = page.getByRole('region', { name: 'Course progress' });
  await progress.getByText('Back up or restore my learning', { exact: true }).click();
  const input = progress.getByLabel('Choose a learning backup to preview');
  const backup = { version: 1, course: 'claude-managed-agents', exportedAt: new Date().toISOString(), lastLesson: 65,
    lessons: [{ lessonId: 65, checklist: [true, true, true, true], savedStep: 'evidence', visited: true, note: '<script>study only</script>', bookmarked: true }] };
  const file = { name: 'learning.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) };
  await input.setInputFiles(file);
  await expect(progress.getByRole('heading', { name: 'Restore preview' })).toBeVisible();
  await progress.locator('.backup-preview').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/learning-guide-backup.png', fullPage: false });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('managed-learning-note-65'))).toBeNull();
  await progress.getByRole('button', { name: 'Cancel restore', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('managed-learning-note-65'))).toBeNull();
  await input.setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"apiKey":"unexpected"}') });
  await expect(page.getByRole('status', { name: 'Learning backup status' })).toContainText('valid version 1');
  await expect(progress.getByRole('button', { name: 'Restore this backup' })).toHaveCount(0);
  await input.setInputFiles(file); await progress.getByRole('button', { name: 'Restore this backup', exact: true }).click();
  await expect(progress.locator('progress')).toHaveAttribute('value', '1');
  await expect(page.getByRole('status', { name: 'Learning backup status' })).toContainText('Restored learning state for 1 lesson.');
  await progress.getByText('Bookmarked lessons (1)', { exact: true }).click();
  await progress.getByRole('link', { name: /^Lab 65:/ }).click();
  const notebook = page.locator('.lesson-notebook'); await notebook.locator('summary').click();
  await expect(notebook.getByRole('textbox')).toHaveValue('<script>study only</script>');
  await expect(page.locator('script').filter({ hasText: 'study only' })).toHaveCount(0);
});
