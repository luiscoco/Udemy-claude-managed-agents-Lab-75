import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true, channel:'msedge'});
const page = await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
// Never send a live (billed) request from this script.
await page.route('**/api/c13/**', async (route) => {
  const body = route.request().postDataJSON?.() ?? null;
  if (body && body.mode && body.mode !== 'scripted') throw new Error('Offline captures only.');
  await route.continue();
});
// Clone the selected elements into a fixed stage above the sticky header, optionally
// dropping nested parts and arranging them in columns, then screenshot only that stage.
async function capture(selectors, path, {width = 1100, columns = 1, template = null, remove = []} = {}) {
  await page.evaluate(({selectors, width, columns, template, remove}) => {
    const stage = document.createElement('div'); stage.id = 'presentation-capture';
    Object.assign(stage.style, {position:'fixed', zIndex:'99999', top:'0', left:'0', width:`${width}px`, padding:'18px', background:'#fffdf7', color:'#18242a',
      display:'grid', gridTemplateColumns:template ?? `repeat(${columns}, minmax(0, 1fr))`, gap:'14px', alignItems:'start'});
    // An array entry groups all of its matches into one grid cell.
    const cells = selectors.flatMap((entry) => Array.isArray(entry)
      ? [(() => { const group = document.createElement('div'); for (const sel of entry) document.querySelectorAll(sel).forEach((node) => group.append(node.cloneNode(true))); return group; })()]
      : [...document.querySelectorAll(entry)].map((node) => node.cloneNode(true)));
    for (const copy of cells) {
      copy.style.margin = '0';
      for (const part of remove) copy.querySelectorAll(part).forEach((node) => node.remove());
      // Wrap long tool results instead of clipping them at the stage edge.
      copy.querySelectorAll('pre').forEach((pre) => Object.assign(pre.style, {whiteSpace:'pre-wrap', overflowWrap:'anywhere'}));
      stage.append(copy);
    }
    document.body.append(stage);
  }, {selectors, width, columns, template, remove});
  await page.locator('#presentation-capture').screenshot({path});
  await page.locator('#presentation-capture').evaluate((el) => el.remove());
  console.log(`Captured ${path}`);
}
const c13 = 'section[aria-labelledby="c13-heading"]';
const evidence = `${c13} [aria-label="MCP evidence"]`;
const run = () => page.getByRole('button', {name:'Run offline MCP experiment'});
async function close() {
  await page.getByRole('button', {name:'Close MCP session'}).click();
  await page.getByText(/State: closed/).waitFor({timeout:30000});
}
try {
  await page.goto('http://127.0.0.1:5174/?lesson=13');
  await page.getByRole('tab', {name:'Run the exercise'}).click();
  await page.locator('#c13-scenario').waitFor();
  await page.getByText(/Setup metadata: MCP/).waitFor({timeout:10000});
  // Initial view, split in two so text stays legible: configuration, then scenario, plan and actions.
  await capture([`${c13} > h2`, `${c13} > p:first-of-type`, `${c13} > fieldset`], 'presentations/lab13/assets/overview.png', {width:1000});
  await capture([`${c13} > .lab-controls:first-of-type`, [`${c13} > label[for="c13-operation"]`, `${c13} > #c13-operation`], `${c13} > .lab-controls:nth-of-type(2)`],
    'presentations/lab13/assets/controls.png', {width:780});

  // Working scenario: real local handshakes, then the authored inspect plan.
  await run().click();
  await page.getByText(/Cleanup: retained/).waitFor({timeout:30000});
  await capture([`${evidence} > article:nth-of-type(1)`, `${evidence} > article:nth-of-type(2)`], 'presentations/lab13/assets/working.png', {width:1100, columns:2});

  // Challenge: reserve with the tool enabled, then disable inventory and try again.
  await page.getByLabel('Enable fictional stock reservation tool').check();
  await page.getByRole('button', {name:'Apply idle MCP configuration'}).click();
  await page.getByRole('status').filter({hasText:'Idle tools/server update applied'}).waitFor({timeout:30000});
  await page.locator('#c13-operation').selectOption('reserve');
  await run().click();
  await page.getByText(/reserve_stock: result observed/).waitFor({timeout:30000});
  await page.getByText(/Cleanup: retained/).waitFor({timeout:30000});
  const stock = [`${evidence} > h4:nth-of-type(4)`, `${evidence} > ul`];
  await capture([`${evidence} > article:nth-of-type(5)`, stock], 'presentations/lab13/assets/reserve-before.png', {width:1100, template:'minmax(0, 1.7fr) minmax(0, 1fr)'});
  await page.getByLabel('Enable inventory server').uncheck();
  await page.getByRole('button', {name:'Apply idle MCP configuration'}).click();
  await page.getByRole('status').filter({hasText:'Idle tools/server update applied'}).waitFor({timeout:30000});
  await run().click();
  await page.getByText(/Path: host-rejected/).waitFor({timeout:30000});
  await page.getByText(/Cleanup: retained/).waitFor({timeout:30000});
  await capture([`${evidence} > article:nth-of-type(6)`, stock], 'presentations/lab13/assets/reserve-after.png', {width:1100, template:'minmax(0, 1.7fr) minmax(0, 1fr)'});
  await close();

  // Unauthorized scenario: the inventory handshake fails with a real local HTTP 401.
  await page.getByLabel('Enable inventory server').check();
  await page.locator('#c13-scenario').selectOption('unauthorized');
  await page.getByRole('button', {name:'Create offline MCP session'}).click();
  await page.getByText(/State: idle/).waitFor({timeout:30000});
  await capture([`${evidence} > article:nth-of-type(1)`, `${evidence} > article:nth-of-type(2)`], 'presentations/lab13/assets/unauthorized.png', {width:1100, columns:2});
  // Release the retained session; the server allows only two at a time.
  await close();
} finally { await browser.close(); }
