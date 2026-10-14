import { expect, test } from '@playwright/test';
test('four fresh instruction variants keep the same question and expose resolved settings', async ({page}) => {
  await page.goto('/?lesson=9'); await page.getByRole('tab',{name:'Run the exercise'}).click(); await page.getByRole('button',{name:'Compare all offline variants'}).click();
  await expect(page.locator('article')).toHaveCount(4);
  const base=page.getByRole('article',{name:'Base (omit system override) result'}); await expect(base).toContainText('omitted; inherited base');
  const custom=page.getByRole('article',{name:'Custom replacement result'}); await expect(custom).toContainText('explicit replacement');
  const context=page.getByRole('article',{name:'Base plus authored project context result'}); await expect(context).toContainText('community bird observation notebook'); await expect(context).toContainText('aurora-finch-v1');
  for(const item of await page.locator('article').all()) { await expect(item).toContainText('What is Aurora Finch'); await expect(item).toContainText('Usage: not reported'); }
});
