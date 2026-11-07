import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true, channel:'msedge'});
const page = await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
// Clone the selected elements into a fixed stage above the sticky header, optionally
// dropping nested parts, arranging them in columns or editing the clone, then screenshot only
// that stage. Slides need 16 px text at 11 pt or more, so stages stay at most ~1245 px wide
// and ~445-530 px tall (see MIN_CAPTURE_PT in lesson-deck.py).
async function capture(selectors, path, {width = 1100, columns = 1, remove = [], edit = ''} = {}) {
  await page.evaluate(({selectors, width, columns, remove, edit}) => {
    const stage = document.createElement('div'); stage.id = 'presentation-capture';
    Object.assign(stage.style, {position:'fixed', zIndex:'99999', top:'0', left:'0', width:`${width}px`, padding:'18px', background:'#fffdf7', color:'#18242a',
      display:'grid', gridTemplateColumns:`repeat(${columns}, minmax(0, 1fr))`, gap:'14px', alignItems:'start'});
    for (const selector of selectors) for (const element of document.querySelectorAll(selector)) {
      const copy = element.cloneNode(true); copy.style.margin = '0';
      for (const part of remove) copy.querySelectorAll(part).forEach((node) => node.remove());
      stage.append(copy);
    }
    document.body.append(stage);
    if (edit) new Function('stage', edit)(stage);
  }, {selectors, width, columns, remove, edit});
  const stage = page.locator('#presentation-capture'); const box = await stage.boundingBox();
  // Clip to whole pixels inside the stage so no sliver of the page below shows at the bottom edge.
  await page.screenshot({path, clip:{x:box.x, y:box.y, width:Math.floor(box.width), height:Math.floor(box.height) - 1}});
  await stage.evaluate((el) => el.remove());
  console.log(`Captured ${path} (${Math.round(box.width)}x${Math.round(box.height)})`);
}
async function open(n) {
  await page.goto(`http://127.0.0.1:5174/?lesson=${n}`);
  await page.getByRole('tab', {name:'Run the exercise'}).click();
  await page.locator(`section[aria-labelledby="c${n}-heading"] fieldset`).waitFor();
}
try {
  await open(9);
  const c9 = 'section[aria-labelledby="c9-heading"]';
  // The form in two legible parts: the fixed question and variant, then the instruction texts and authored context.
  await capture([`${c9} > h2`, `${c9} > p:first-of-type`, `${c9} fieldset`], 'presentations/lab09/assets/overview.png',
    {remove:['label[for="c9-custom"]', '#c9-custom', 'label[for="c9-append"]', '#c9-append']});
  await page.locator(`${c9} details summary`).click();
  await capture([`${c9} fieldset`], 'presentations/lab09/assets/instructions.png',
    {remove:['label[for="c9-question"]', '#c9-question', 'label[for="c9-variant"]', '#c9-variant', 'legend']});
  await capture([`${c9} details`], 'presentations/lab09/assets/context.png', {width:780});
  await page.getByRole('button', {name:'Compare all offline variants'}).click();
  await page.getByRole('article', {name:'Base plus authored project context result'}).waitFor({timeout:30000});
  await page.getByRole('button', {name:'Compare all offline variants'}).waitFor({state:'visible'});
  await capture([`${c9} .lab-controls`, `${c9} p[role="status"]`], 'presentations/lab09/assets/actions.png');
  // Two variants per slide; the repeated question and usage lines are dropped, the composition JSON is captured separately.
  const variant = (label) => `${c9} article[aria-label="${label} result"]`;
  const trim = {width:1100, columns:2, remove:['.code-block', 'details', 'p:nth-of-type(2)', 'p:last-of-type']};
  await capture([variant('Base (omit system override)'), variant('Custom replacement')], 'presentations/lab09/assets/compare-replace.png', trim);
  await capture([variant('Base plus appended instructions'), variant('Base plus authored project context')], 'presentations/lab09/assets/compare-compose.png', trim);
  // The composition JSON of the Base variant, split into its requested and resolved halves.
  for (const half of ['requested', 'resolved'])
    await capture([`${variant('Base (omit system override)')} .code-block`], `presentations/lab09/assets/composition-${half}.png`,
      {width:780, remove:['button'], edit:`const pre = stage.querySelector('pre'); const value = JSON.parse(pre.textContent);
        pre.textContent = JSON.stringify({ ${half}: value.${half} }, null, 2);
        stage.querySelector('.code-toolbar span').textContent = '${half === 'requested' ? 'Requested composition' : 'Resolved session settings'}';`});

  await open(10);
  const c10 = 'section[aria-labelledby="c10-heading"]';
  await capture([`${c10} > h2`, `${c10} fieldset`], 'presentations/lab10/assets/overview.png');
  await page.getByRole('button', {name:'Start offline report'}).click();
  await page.getByText(/State: idle/).waitFor({timeout:30000});
  await capture([`${c10} .lab-controls`, `${c10} p[role="status"]`, `${c10} [aria-label="Run evidence"]`], 'presentations/lab10/assets/actions.png');
  await capture([`${c10} article.report-turn`], 'presentations/lab10/assets/report.png', {width:780, remove:['details', '.report-usage', 'dl.report-metadata']});
  await page.locator('#c10-scenario').selectOption('hang');
  await page.getByRole('button', {name:'Send another turn'}).click();
  await page.getByRole('button', {name:'Disconnect locally'}).waitFor();
  await page.getByRole('button', {name:'Interrupt and retain session'}).click();
  await page.getByText(/Interruption: idle-confirmed/).waitFor({timeout:30000});
  await page.getByRole('button', {name:'Disconnect locally'}).waitFor({state:'detached', timeout:30000});
  await capture([`${c10} [aria-label="Run evidence"]`, `${c10} article.report-turn:nth-of-type(2)`], 'presentations/lab10/assets/interrupt.png',
    {width:1100, remove:['.report-usage', 'dl.report-metadata']});
  // Release the retained run; the server allows only two at a time.
  await page.getByRole('button', {name:'Close idle session'}).click();
  await page.getByText(/State: closed/).waitFor({timeout:30000});
} finally { await browser.close(); }
