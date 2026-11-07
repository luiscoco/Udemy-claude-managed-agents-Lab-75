import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true, channel:'msedge'});
const page = await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
// Fail rather than permitting an accidental live session during this capture.
await page.route('**/api/c12/session', async (route) => {
  if (route.request().postDataJSON().mode !== 'scripted') throw new Error('Offline capture only.');
  await route.continue();
});
// Clone the selected elements into a fixed stage above the sticky header, optionally
// dropping nested parts and arranging them in columns, then screenshot only that stage.
// Optional css is scoped to the stage (used to lay the command cards out side by side).
async function capture(selectors, path, {width = 1100, columns = 1, remove = [], css = ''} = {}) {
  await page.evaluate(({selectors, width, columns, remove, css}) => {
    const stage = document.createElement('div'); stage.id = 'presentation-capture';
    Object.assign(stage.style, {position:'fixed', zIndex:'99999', top:'0', left:'0', width:`${width}px`, padding:'18px', background:'#fffdf7', color:'#18242a',
      display:'grid', gridTemplateColumns:`repeat(${columns}, minmax(0, 1fr))`, gap:'14px', alignItems:'start'});
    for (const selector of selectors) for (const element of document.querySelectorAll(selector)) {
      const copy = element.cloneNode(true); copy.style.margin = '0';
      for (const part of remove) copy.querySelectorAll(part).forEach((node) => node.remove());
      stage.append(copy);
    }
    if (css) { const style = document.createElement('style'); style.textContent = css; stage.append(style); }
    document.body.append(stage);
  }, {selectors, width, columns, remove, css});
  await page.locator('#presentation-capture').screenshot({path});
  await page.locator('#presentation-capture').evaluate((el) => el.remove());
  console.log(`Captured ${path}`);
}
const c12 = 'section[aria-labelledby="c12-heading"]';
// Command cards in two columns; the session lines above them span the full width.
// Captures stay narrow enough that 16 px text renders at 11 pt or more on the slide.
const cards = `#presentation-capture article.report-turn {margin:0}
  #presentation-capture article.report-turn h4 {margin-top:0}`;
const evidence = () => page.getByLabel('Queue evidence', {exact:true});
const evidenceLines = [`${c12} [aria-label="Queue evidence"]`];
const commandCards = [`${c12} [aria-label="Queue evidence"] article.report-turn`];
async function open() {
  await page.goto('http://127.0.0.1:5174/?lesson=12');
  await page.getByRole('tab', {name:'Run the exercise'}).click();
  await page.getByRole('button', {name:'Create offline session', exact:true}).waitFor();
}
async function create() {
  await page.getByRole('button', {name:'Create offline session', exact:true}).click();
  await evidence().getByText(/State: idle/).waitFor({timeout:30000});
}
async function close() {
  await page.getByRole('button', {name:'Close queue and clean up'}).click();
  await evidence().getByText(/State: closed/).waitFor({timeout:30000});
}
try {
  await open();
  // 0. Initial exercise view: heading, intro, session buttons and status.
  await capture([`${c12} > h2`, `${c12} > p:first-of-type`, `${c12} > .lab-controls:first-of-type`, `${c12} > p[role="status"]`],
    'presentations/lab12/assets/overview.png', {width:1100});

  // 1. A fresh offline session: the message controls are enabled, nothing has been sent yet.
  await create();
  await capture([c12], 'presentations/lab12/assets/controls.png',
    {width:1240, remove:['h2', ':scope > p:first-of-type', ':scope > .lab-controls:first-of-type', '[aria-label="Queue evidence"]', 'details'],
     css:'#presentation-capture #c12-text {height:64px}'});

  // 2. The two-message script: two commands, each with its own provider user event.
  await page.getByRole('button', {name:'Queue two-message script'}).click();
  await evidence().getByRole('heading', {name:'completed: completed', exact:true}).nth(1).waitFor({timeout:30000});
  await capture(commandCards, 'presentations/lab12/assets/script.png', {width:1240, columns:2, remove:['p:last-of-type'], css:cards});
  await close();

  // 3. Slow: a follow-up admitted while the first command is still running.
  await open(); await create();
  await page.locator('#c12-scenario').selectOption('slow');
  await page.getByRole('button', {name:'Queue message', exact:true}).click();
  await evidence().getByRole('heading', {name:/^submitting|^accepted/}).waitFor({timeout:30000});
  await page.locator('#c12-text').fill('Follow-up: name one risk for the same fictional notebook.');
  await page.getByRole('button', {name:'Queue message', exact:true}).click();
  await evidence().getByRole('heading', {name:'completed: completed', exact:true}).nth(1).waitFor({timeout:30000});
  // Agent event IDs are dropped: the timestamps are the evidence here.
  await capture(commandCards, 'presentations/lab12/assets/slow.png', {width:1240, columns:2, remove:['pre', 'p:last-of-type'], css:cards});
  await close();

  // 4. Hang: waiting work is cancelled before submission when the queue is closed.
  await open(); await create();
  await page.locator('#c12-scenario').selectOption('hang');
  await page.getByRole('button', {name:'Queue message', exact:true}).click();
  await evidence().getByRole('heading', {name:/^accepted/}).waitFor({timeout:30000});
  await page.locator('#c12-text').fill('Follow-up: name one risk for the same fictional notebook.');
  await page.getByRole('button', {name:'Queue message', exact:true}).click();
  await evidence().getByText(/Waiting commands: 1/).waitFor({timeout:30000});
  await close();
  // Session lines and command cards go on separate slides.
  await capture([`${c12} > p[role="status"]`, ...evidenceLines], 'presentations/lab12/assets/hang-session.png', {width:1100, remove:['article', 'details']});
  await capture(commandCards, 'presentations/lab12/assets/hang-commands.png', {width:1240, columns:2, remove:['p:last-of-type'], css:cards});
} finally { await browser.close(); }
