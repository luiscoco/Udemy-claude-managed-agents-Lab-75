import { expect,test } from '@playwright/test';
async function open(page:import('@playwright/test').Page){await page.goto('/?lesson=10');await page.getByRole('tab',{name:'Run the exercise'}).click();}
test('report correction is bounded and invalid output never becomes verified',async({page})=>{
  await open(page);await expect(page.getByLabel('Application report schema',{exact:true})).toContainText('"additionalProperties": false');await page.getByLabel('Offline scenario').selectOption('corrected');await page.getByRole('button',{name:'Start offline report'}).click();
  const table=page.getByRole('table',{name:'Report verification'});await expect(table).toContainText('completed: verified');await expect(table).toContainText('Aurora Finch');await expect(table.locator('tbody tr td').nth(2)).toHaveText('2');
  await page.getByRole('button',{name:'Close idle session'}).click();await expect(page.getByLabel('Run evidence')).toContainText('State: closed');
  await page.getByLabel('Offline scenario').selectOption('exhausted');await page.getByRole('button',{name:'Start offline report'}).click();
  await expect(table).toContainText('failed: exhausted');await expect(table).toContainText('No verified report');await expect(table.locator('tbody tr td').nth(2)).toHaveText('2');
  await page.getByRole('button',{name:'Close idle session'}).click();
});
test('interrupt preserves session identity for a later turn; Close ends future sends',async({page})=>{
  await open(page);await page.getByLabel('Offline scenario').selectOption('hang');await page.getByRole('button',{name:'Start offline report'}).click();
  await expect(page.getByRole('button',{name:'Interrupt and retain session'})).toBeEnabled();await page.getByRole('button',{name:'Interrupt and retain session'}).click();
  const evidence=page.getByLabel('Run evidence');await expect(evidence).toContainText('idle-confirmed');await expect(page.getByRole('table',{name:'Report verification'})).toContainText('interrupted');
  const session=(await evidence.textContent())!.match(/Session: (sesn_[^.]+)/)![1];
  await page.getByLabel('Offline scenario').selectOption('valid');await page.getByRole('button',{name:'Send another turn'}).click();
  await expect(page.getByRole('table',{name:'Report verification'})).toContainText('completed: verified');await expect(evidence).toContainText(session!);
  await page.getByRole('button',{name:'Close idle session'}).click();await expect(evidence).toContainText('State: closed');await expect(page.getByRole('button',{name:'Send another turn'})).toBeDisabled();
});
