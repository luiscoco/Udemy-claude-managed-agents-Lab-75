import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true, channel:'msedge'});
const page = await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
// Clone the selected elements into a fixed stage above the sticky header, optionally
// dropping nested parts (by selector, or paragraphs by leading text) and arranging them
// in columns, then screenshot only that stage.
async function capture(selectors, path, {width = 1100, columns = 1, remove = [], drop = []} = {}) {
  await page.evaluate(({selectors, width, columns, remove, drop}) => {
    const stage = document.createElement('div'); stage.id = 'presentation-capture';
    Object.assign(stage.style, {position:'fixed', zIndex:'99999', top:'0', left:'0', width:`${width}px`, padding:'18px', background:'#fffdf7', color:'#18242a',
      display:'grid', gridTemplateColumns:`repeat(${columns}, minmax(0, 1fr))`, gap:'14px', alignItems:'start'});
    for (const selector of selectors) for (const element of document.querySelectorAll(selector)) {
      const copy = element.cloneNode(true); copy.style.margin = '0';
      for (const part of remove) copy.querySelectorAll(part).forEach((node) => node.remove());
      // Long session IDs and paths wrap inside narrow columns instead of overflowing them.
      copy.querySelectorAll('code').forEach((node) => { node.style.overflowWrap = 'anywhere'; });
      copy.querySelectorAll('p').forEach((node) => { if (drop.some((text) => node.textContent.startsWith(text))) node.remove(); });
      stage.append(copy);
    }
    document.body.append(stage);
  }, {selectors, width, columns, remove, drop});
  await page.locator('#presentation-capture').screenshot({path});
  const box = await page.locator('#presentation-capture').boundingBox();
  await page.locator('#presentation-capture').evaluate((el) => el.remove());
  console.log(`Captured ${path} (${Math.round(box.width)}x${Math.round(box.height)})`);
}
const c11 = 'section[aria-labelledby="c11-heading"]';
async function runOffline(variant, scenario) {
  await page.locator('#c11-variant').selectOption(variant);
  await page.locator('#c11-scenario').selectOption(scenario);
  await page.getByRole('button', {name:'Run offline skill experiment'}).click();
  await page.getByRole('button', {name:'Cancel experiment'}).waitFor({state:'detached', timeout:30000});
}
async function mark(name, test) {
  // Tag direct children of the lesson section chosen by a predicate, so capture() can select them.
  await page.evaluate(({c11, name, test}) => {
    const section = document.querySelector(c11); const pick = new Function('el', `return ${test}`);
    for (const el of section.querySelectorAll('[data-capture]')) el.removeAttribute('data-capture');
    for (const el of section.children) if (pick(el)) el.setAttribute('data-capture', name);
  }, {c11, name, test});
}
const A = 'presentations/lab11/assets/';
// One result card per slide: drop the repeated evidence note, cleanup line and per-version detail.
const result = {width:780, remove:['details', '.agent-message', 'h5'], drop:['Metadata is configuration', 'Interruption:', 'Resolved version:']};
try {
  await page.goto('http://127.0.0.1:5174/?lesson=11');
  await page.getByRole('tab', {name:'Run the exercise'}).click();
  await page.getByText(/Configured pins:/).waitFor({timeout:30000});

  // Initial exercise view: heading and the experiment form, in its default state.
  await capture([`${c11} > h2`, `${c11} > fieldset`], A + 'overview.png', {width:1200});

  // Authored bundle and pin readiness, then the host preview of SKILL.md.
  await page.locator('#c11-variant').selectOption('with-skill');
  await page.getByRole('button', {name:'Preview authored instructions'}).click();
  await page.getByText(/Host preview loaded/).waitFor({timeout:30000});
  await mark('pins', "el.tagName === 'P' && /^(Local bundle|Bundle manifest)/.test(el.textContent) || el.tagName === 'UL' || el.tagName === 'H3' && el.textContent.startsWith('Authored')");
  await capture(['[data-capture="pins"]'], A + 'pins.png', {width:1200});
  await mark('preview', "el.classList.contains('code-block') || el.getAttribute('role') === 'status'");
  await capture(['[data-capture="preview"]'], A + 'preview.png', {width:1200, remove:['button']});

  // The same pinned skill with successful reads, then with metadata only (no reads).
  await runOffline('with-skill', 'reads');
  await capture([`${c11} article.report-turn`], A + 'reads.png', result);
  await page.getByRole('button', {name:'Clear comparisons'}).click();
  await runOffline('with-skill', 'metadata-only');
  await capture([`${c11} article.report-turn`], A + 'metadata-only.png', result);
  await page.getByRole('button', {name:'Clear comparisons'}).click();

  // All five variants in fresh sessions (With pinned skill is shown above): the two unattached
  // variants side by side, then each revision on its own slide.
  await page.locator('#c11-scenario').selectOption('reads');
  await page.getByRole('button', {name:'Compare all offline variants'}).click();
  await page.getByRole('article', {name:'Revised pinned version result'}).waitFor({timeout:30000});
  await page.getByRole('button', {name:'Cancel experiment'}).waitFor({state:'detached', timeout:30000});
  await capture([`${c11} article[aria-label="Without skill result"]`, `${c11} article[aria-label="Missing skill ID result"]`], A + 'compare-unattached.png', {...result, width:1240, columns:2});
  await capture([`${c11} article[aria-label="Absent reference result"]`], A + 'absent-reference.png', result);
  await capture([`${c11} article[aria-label="Revised pinned version result"]`], A + 'revised-version.png', result);
  await page.getByRole('button', {name:'Clear comparisons'}).click();
} finally { await browser.close(); }
