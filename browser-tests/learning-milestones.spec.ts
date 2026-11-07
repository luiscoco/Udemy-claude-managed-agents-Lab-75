import { test, expect } from '@playwright/test';

test('milestone shortcut shows offline requirements and downloads a starter without running work', async ({ page }) => {
  let posts = 0; page.on('request', request => { if (request.method() === 'POST') posts++; });
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Learning overview sections' }).getByRole('button', { name: 'Milestone projects', exact: true }).click();
  const milestones = page.getByRole('region', { name: 'Build a milestone project', exact: true });
  await expect(milestones).toBeFocused(); await expect(milestones.locator('.learning-path-grid > article')).toHaveCount(3);
  const project = milestones.locator('article').filter({ has: page.getByRole('heading', { name: 'Event stream evidence viewer', exact: true }) });
  await project.getByText('Requirements and hints', { exact: true }).click();
  await expect(project).toContainText('Require an explicit terminal outcome');
  const pending = page.waitForEvent('download'); await project.getByRole('link', { name: 'Download Event stream evidence viewer starter', exact: true }).click();
  const download = await pending; expect(download.suggestedFilename()).toBe('event-viewer-starter.zip');
  const stream = await download.createReadStream(); const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).readUInt32LE(0)).toBe(0x04034b50);
  expect(posts).toBe(0);
});

test('milestones fit mobile and remain explicit local practice', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await page.getByRole('navigation', { name: 'Learning overview sections' }).getByRole('button', { name: 'Milestone projects', exact: true }).click();
  const milestones = page.getByRole('region', { name: 'Build a milestone project', exact: true });
  await expect(milestones).toContainText('Starters are intentionally incomplete');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await milestones.locator('article').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/learning-guide-milestones-mobile.png', fullPage: false });
});

test('optional walkthroughs explain all references and download a separate solution without execution', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let posts = 0; page.on('request', request => { if (request.method() === 'POST') posts++; });
  await page.goto('/');
  await page.getByRole('button', { name: 'Milestone projects', exact: true }).click();
  const projects = page.locator('.learning-milestones > .learning-path-grid > article');
  for (const [index, count] of [4, 3, 5].entries()) {
    const project = projects.nth(index);
    await project.getByText('Solution walkthrough and reference download', { exact: true }).click();
    await expect(project).toContainText(`${count} passed, 0 failed`);
    const pending = page.waitForEvent('download');
    await project.getByRole('link', { name: /Download .* reference$/ }).click();
    expect((await pending).suggestedFilename()).toMatch(/-reference\.zip$/);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await projects.last().locator('.milestone-walkthrough').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/learning-guide-walkthrough-mobile.png' });
  expect(posts).toBe(0);
});
