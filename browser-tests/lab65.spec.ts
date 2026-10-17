import { test, expect } from '@playwright/test';
test('Lab 65 identifies missing external setup and never sends on inspection', async ({ page }) => {
  let notifications = 0;
  page.on('request', request => { if (request.method() === 'POST' && request.url().includes('/api/c65/run') && request.postDataJSON()?.action === 'notify') notifications++; });
  await page.goto('/?lesson=65'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Notification setup' })).toBeVisible();
  await expect(page.getByText('Missing: LAB65_SLACK_WEBHOOK_URL.', { exact: true })).toBeVisible();
  for (const channel of ['slack', 'teams', 'email']) await expect(page.getByRole('button', { name: `Send ${channel} notification`, exact: true })).toBeDisabled();
  expect(notifications).toBe(0);
});

test('Lab 65 local reviewer approves only a notified immutable proposal', async ({ page }) => {
  await page.goto('/?lesson=65'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Human approval over Slack, Teams or email', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Preview proposal' }).click();
  await expect(page.getByRole('status', { name: 'Lab 65 status' })).toContainText('Pending proposal');
  await expect(page.getByText('Executed effects: 0.')).toBeVisible();
  await expect(page.getByText(/Model provider calls: 0\. External notification requests are separate/)).toBeVisible();
  await page.getByRole('button', { name: 'Notify locally' }).click();
  await expect(page.getByRole('status', { name: 'Lab 65 status' })).toContainText('no message sent');
  await page.getByRole('button', { name: 'Tamper action' }).click();
  await expect(page.getByRole('status', { name: 'Lab 65 status' })).toContainText('Changed action blocked: true');
  await page.getByRole('button', { name: 'Approve as reviewer' }).click();
  await expect(page.getByRole('status', { name: 'Lab 65 status' })).toContainText('effects: 1');
  await expect(page.getByText('Executed effects: 1.')).toBeVisible();
  await page.getByRole('button', { name: 'Duplicate click' }).click();
  await expect(page.getByRole('status', { name: 'Lab 65 status' })).toContainText('Proposal already decided (approved); no additional effect executed.');
  await expect(page.getByText('Executed effects: 1.')).toBeVisible();
});
