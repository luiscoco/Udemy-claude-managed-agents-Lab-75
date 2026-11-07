import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true, channel:'msedge'});
const page = await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
// Clone the selected elements into a fixed stage above the sticky header, optionally
// dropping nested parts and arranging them in columns, then screenshot only that stage.
async function capture(selectors, path, {width = 1100, columns = 1, remove = []} = {}) {
  await page.evaluate(({selectors, width, columns, remove}) => {
    const stage = document.createElement('div'); stage.id = 'presentation-capture';
    Object.assign(stage.style, {position:'fixed', zIndex:'99999', top:'0', left:'0', width:`${width}px`, padding:'18px', background:'#fffdf7', color:'#18242a',
      display:'grid', gridTemplateColumns:`repeat(${columns}, minmax(0, 1fr))`, gap:'14px', alignItems:'start'});
    for (const selector of selectors) for (const element of document.querySelectorAll(selector)) {
      const copy = element.cloneNode(true); copy.style.margin = '0';
      for (const part of remove) copy.querySelectorAll(part).forEach((node) => node.remove());
      stage.append(copy);
    }
    document.body.append(stage);
  }, {selectors, width, columns, remove});
  await page.locator('#presentation-capture').screenshot({path});
  await page.locator('#presentation-capture').evaluate((el) => el.remove());
  console.log(`Captured ${path}`);
}
const c15 = 'section[aria-labelledby="lab15-heading"]', evidence = `${c15} [aria-label="Usage evidence"]`;
const out = 'presentations/lab15/assets';
// Each experiment runs one authored fixture scenario offline and is closed afterwards,
// because the server keeps at most one open experiment per owner.
async function start(scenario) {
  await page.goto('http://127.0.0.1:5174/?lesson=15');
  await page.getByRole('tab', {name:'Run the exercise'}).click();
  await page.getByLabel('Offline scenario', {exact:true}).selectOption(scenario);
  await page.getByRole('button', {name:'Start offline usage experiment'}).click();
}
async function close() {
  await page.getByRole('button', {name:'Close usage session'}).click();
  await page.locator(evidence).getByText(/State: closed/).waitFor({timeout:30000});
}
// Evidence lines kept per capture: drop later paragraphs first, then the nested readings.
const boundaries = (keep) => [`:scope > p:nth-of-type(n+${keep + 1})`, ':scope > h3 ~ h3', ':scope > article', ':scope > details', ':scope > pre'];
// Usage readings keep identity, tokens, cache and cost; web requests and the delta note are dropped.
const reading = [':scope > p:nth-of-type(n+5)'];
try {
  await page.goto('http://127.0.0.1:5174/?lesson=15');
  await page.getByRole('tab', {name:'Run the exercise'}).click();
  await page.locator(`${c15} > fieldset`).waitFor();
  await capture([`${c15} > h2`, `${c15} > p:first-of-type`, `${c15} > fieldset`], `${out}/overview.png`, {width:1000, remove:[':scope > p']});

  await start('repeated-usage');
  await page.locator(evidence).getByText(/State: idle/).waitFor({timeout:30000});
  await capture([`${c15} .lab-controls`, `${c15} p[role="status"]`, evidence], `${out}/actions.png`, {remove:boundaries(5)});
  // The intermediate stream event beside the later idle-session retrieval, then the observed spans alone.
  await capture([`${evidence} > article[aria-label="session session.usage usage"]`, `${evidence} > article[aria-label="session retrieval usage"]`], `${out}/readings.png`, {width:1150, columns:2, remove:reading});
  await capture([`${evidence} > article[aria-label="observed-request-spans model-request-end usage"]`], `${out}/spans.png`, {width:760, remove:reading});
  await close();

  await start('child-activity');
  await page.locator(evidence).getByText(/State: idle/).waitFor({timeout:30000});
  await capture([`${evidence} > article[aria-label="thread retrieval usage"]`], `${out}/threads.png`, {width:1150, columns:2, remove:reading});
  await close();

  await start('budget-reached');
  await page.locator(evidence).getByText(/State: budget-paused/).waitFor({timeout:30000});
  await page.getByRole('button', {name:'Retrieve session usage'}).click();
  await page.getByRole('button', {name:'Cancel experiment'}).waitFor({state:'detached', timeout:30000});
  await capture([`${c15} .lab-controls`, `${c15} p[role="status"]`, evidence], `${out}/paused.png`, {remove:boundaries(3)});
  await close();
} finally { await browser.close(); }
