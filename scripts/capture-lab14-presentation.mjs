import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true, channel:'msedge'});
const page = await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
// Offline only: refuse any request that is not an authored fixture run.
await page.route('**/api/c14/run', async (route) => {
  if (route.request().postDataJSON().mode !== 'scripted') { await route.abort(); throw new Error('Offline captures only.'); }
  await route.continue();
});
// Clone the selected elements into a fixed stage above the sticky header, optionally
// dropping nested parts and arranging them in columns, then screenshot only that stage.
async function capture(selectors, path, {width = 1100, columns = 1, remove = []} = {}) {
  await page.evaluate(({selectors, width, columns, remove}) => {
    const stage = document.createElement('div'); stage.id = 'presentation-capture';
    Object.assign(stage.style, {position:'fixed', zIndex:'99999', top:'0', left:'0', width:`${width}px`, padding:'18px', background:'#fffdf7', color:'#18242a',
      display:'grid', gridTemplateColumns:`repeat(${columns}, minmax(0, 1fr))`, gap:'14px', alignItems:'start'});
    for (const selector of selectors) for (const element of document.querySelectorAll(selector)) {
      const copy = element.cloneNode(true); copy.style.margin = '0';
      // A cloned <select> forgets its chosen option; copy the live values across.
      const live = element.querySelectorAll('select'); copy.querySelectorAll('select').forEach((node, i) => {
        for (const option of node.options) option.toggleAttribute('selected', option.value === live[i].value); });
      // Headings lose their top margin so the stage does not start with empty space.
      if (/^H[1-6]$/.test(copy.tagName)) copy.style.marginTop = '0';
      copy.querySelectorAll(':scope > h4:first-child').forEach((node) => { node.style.marginTop = '0'; });
      for (const part of remove) copy.querySelectorAll(part).forEach((node) => node.remove());
      stage.append(copy);
    }
    document.body.append(stage);
  }, {selectors, width, columns, remove});
  await page.locator('#presentation-capture').screenshot({path});
  await page.locator('#presentation-capture').evaluate((el) => el.remove());
  console.log(`Captured ${path}`);
}
const c14 = 'section[aria-labelledby="lab14-heading"]';
const rows = () => page.locator(`${c14} tbody tr`).count();
// Each offline run adds one comparison row per attempt; wait for the rows and an idle form.
async function runOffline(expectedRows) {
  await page.getByRole('button', {name:'Run offline model experiment'}).click();
  await page.waitForFunction(({sel, n}) => document.querySelectorAll(`${sel} tbody tr`).length >= n, {sel:c14, n:expectedRows}, {timeout:30000});
  await page.getByRole('button', {name:'Run offline model experiment'}).waitFor({state:'visible'});
  await page.waitForFunction((sel) => !document.querySelector(`${sel} fieldset`).disabled, c14, {timeout:30000});
}
try {
  await page.goto('http://127.0.0.1:5174/?lesson=14');
  await page.getByRole('tab', {name:'Run the exercise'}).click();
  await page.getByText(/^SDK 0\.133\.0; documentation checked/).waitFor({timeout:10000});
  // The form is split across two captures so 16 px text stays legible on a slide.
  // Labels are removed from the last to the first so the indices do not shift.
  const fields = (...n) => n.map((i) => `:scope > label:nth-of-type(${i})`);
  await capture([`${c14} > h2`, `${c14} fieldset`], 'presentations/lab14/assets/overview.png', {width:1100, remove:fields(8, 7, 6, 4)});
  await page.getByLabel('Allow one host fallback after reconciled failure').check();
  await capture([`${c14} fieldset`, `${c14} .lab-controls`], 'presentations/lab14/assets/overview-run.png', {width:1100, remove:fields(5, 3, 2, 1)});
  await page.getByLabel('Allow one host fallback after reconciled failure').uncheck();
  // Same prompt and model; only effort changes between fresh sessions.
  for (const [i, effort] of ['low', 'medium', 'high'].entries()) {
    await page.getByLabel('Effort', {exact:true}).selectOption(effort);
    await runOffline(i + 1);
  }
  // Usage and elapsed-time lines are dropped: offline fixtures never measure them.
  const quiet = ['details', ':scope > p:nth-of-type(5)', ':scope > p:nth-of-type(4)'];
  await capture([`${c14} [aria-label="Model experiment evidence"] article`], 'presentations/lab14/assets/normal.png', {width:1200, remove:quiet});
  await capture([`${c14} .table-scroll`], 'presentations/lab14/assets/compare.png', {width:1240});

  // Primary unavailable with one budgeted host fallback: two attempts, two fresh sessions, one slide each.
  await page.getByLabel('Allow one host fallback after reconciled failure').check();
  await page.getByLabel('Offline scenario').selectOption('primary-unavailable');
  await runOffline(5);
  const attempts = `${c14} [aria-label="Model experiment evidence"] article`;
  await capture([`${c14} [aria-label="Model experiment evidence"] > p`, `${attempts}:nth-of-type(1)`], 'presentations/lab14/assets/fallback-primary.png', {width:1200, remove:quiet});
  await capture([`${attempts}:nth-of-type(2)`], 'presentations/lab14/assets/fallback-second.png', {width:1200, remove:quiet});

  // Mismatched resolved effort: the session is created but no prompt is sent and fallback is blocked.
  await page.getByLabel('Offline scenario').selectOption('mismatch');
  await runOffline(6);
  await capture([`${c14} [aria-label="Model experiment evidence"] > p`, `${attempts}`], 'presentations/lab14/assets/mismatch.png', {width:1200, remove:quiet});

  // Release the experiment slot; the server keeps at most two.
  await page.getByRole('button', {name:'Close and reconcile experiment'}).click();
  await page.getByRole('status', {name:'Model experiment status'}).getByText(/Experiment closed; known remote sessions reconciled/).waitFor({timeout:30000});
} finally { await browser.close(); }
