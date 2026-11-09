import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const project = 'ai-tutor-live-lab';
const out = path.resolve('presentations', project, 'platform');
let previousAttempts = [];
await mkdir(out, { recursive: true });
if (!process.argv.includes('--execute-authorized-live')) throw Error('Pass --execute-authorized-live to record the two requested paid demonstrations.');
try {
  const prior = JSON.parse(await readFile(path.join(out, 'capture-evidence.json'), 'utf8'));
  if (prior.complete) { console.log('Completed capture retained; no paid requests repeated.'); process.exit(0); }
  if (prior.liveRequests?.length) {
    if (!process.argv.includes('--resume-reviewed-capture')) throw Error('Partial live capture exists. Inspect its evidence before authorizing another paid request.');
    previousAttempts = [...(prior.previousAttempts ?? []), { reason: 'Completed provider response; browser heading selector failed before save. Original answer retained.', liveRequests: prior.liveRequests }];
  }
} catch (error) { if (error.code !== 'ENOENT') throw error; }
const evidence = { project, origin: 'http://127.0.0.1:5174', viewport: { width: 1920, height: 1080 }, browserZoom: 1,
  shots: [], liveRequests: [], previousAttempts, preparedRequests: 0, savedOperations: [], errors: [], complete: false };
const persist = () => writeFile(path.join(out, 'capture-evidence.json'), JSON.stringify(evidence, null, 2));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: evidence.viewport, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light' });
  const page = await context.newPage();
  page.on('pageerror', error => evidence.errors.push(error.message));
  page.on('request', request => {
    if (request.method() !== 'POST' || !/\/api\/ai-tutor\/\d+$/.test(request.url())) return;
    const body = request.postDataJSON();
    if (body.mode === 'live') { evidence.liveRequests.push({ model: body.model, question: body.question, consent: body.consent, requestedAt: new Date().toISOString() }); void persist(); }
    else evidence.preparedRequests++;
  });
  const button = name => page.getByRole('button', { name, exact: true });
  const answer = page.getByRole('region', { name: 'Tutor answer', exact: true });
  async function shot(id, anchor, targets) {
    await anchor.waitFor({ state: 'visible', timeout: 60000 });
    await anchor.evaluate(el => window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + scrollY - 230)));
    await page.waitForTimeout(300);
    const cues = [];
    for (const [name, locator] of targets) {
      const box = await locator.evaluate(el => {
        const range = document.createRange(); range.selectNodeContents(el);
        const r = el.matches('select,input,textarea') ? el.getBoundingClientRect() : range.getBoundingClientRect();
        return { text: el.matches('select') ? el.selectedOptions[0].text : el.innerText || el.value,
          rect: [r.x, r.y, r.width, r.height] };
      });
      const [x, y, w, h] = box.rect;
      if (x < 8 || y < 100 || x + w > 1912 || y + h > 1072 || w < 4 || h < 4) throw Error(`Offscreen text target ${id}/${name}: ${JSON.stringify(box)}`);
      cues.push({ id: `${id}-${name}`, ...box });
    }
    await page.screenshot({ path: path.join(out, `${id}.png`) });
    evidence.shots.push({ id, url: page.url(), cues }); await persist(); console.log(`Captured ${id}`);
  }
  await page.goto(evidence.origin + '/?lesson=1', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'AI Tutor', exact: true }).click();
  await shot('open-tutor', page.locator('.ai-tutor h2').first(), [['heading', page.locator('.ai-tutor h2').first()], ['topics', button('Explain this exercise')]]);
  await shot('prepared-mode', page.getByLabel('Answer mode', { exact: true }), [['mode', page.getByLabel('Answer mode', { exact: true })], ['ask', button('Ask the tutor')]]);
  await button('Ask the tutor').click(); await answer.waitFor();
  await shot('prepared-answer', answer.locator('h2'), [['answer', answer.locator('h3').first()], ['badge', answer.locator('.ai-tutor-badge')]]);
  await button('Steps to complete it').click(); await button('Ask the tutor').click();
  const stepsHeading = answer.getByRole('heading', { name: 'Your steps', exact: true });
  await stepsHeading.waitFor();
  await shot('prepared-steps', stepsHeading, [['steps', stepsHeading]]);
  await button('Simple code example').click(); await button('Ask the tutor').click();
  await answer.locator('pre').waitFor();
  await shot('prepared-code', answer.locator('pre'), [['code', answer.locator('[data-code-line]').first()]]);
  if (await answer.locator('.syntax-keyword').count() === 0) throw Error('Expected highlighted TypeScript code.');
  await button('Concepts and code').click();
  await page.getByLabel('Answer mode', { exact: true }).selectOption('live');
  const model = page.getByLabel('Claude model', { exact: true });
  await model.locator('option[value="claude-haiku-4-5-20251001"]').waitFor({ state: 'attached' });
  const catalog = await model.locator('option').evaluateAll(nodes => nodes.filter(x => x.value).map(x => ({ id: x.value, name: x.textContent })));
  evidence.catalog = catalog; await persist();
  await model.selectOption('claude-haiku-4-5-20251001');
  await shot('choose-model', model, [['model', model]]);
  const firstQuestion = 'For Lab 01, explain why visible agent text does not prove a Managed Agents turn completed. Use three short bullet points and one TypeScript example of at most six lines. Keep the whole answer under 140 words. Clearly label illustrative code.';
  await page.getByLabel('Question for AI Tutor', { exact: true }).fill(firstQuestion);
  await shot('focused-question', page.getByLabel('Question for AI Tutor', { exact: true }), [['question', page.getByLabel('Question for AI Tutor', { exact: true })]]);
  const consent = page.getByRole('checkbox', { name: /I authorize one paid tutor answer/ });
  if (await button('Ask the tutor').isEnabled()) throw Error('Paid question enabled without consent.');
  await consent.check();
  await shot('paid-consent', consent, [['consent', page.locator('.ai-tutor-consent')], ['ask', button('Ask the tutor')]]);
  await context.storageState({ path: path.join(out, 'storage-state.json') });
  async function liveTurn() {
    const responsePromise = page.waitForResponse(r => /\/api\/ai-tutor\/1$/.test(r.url()) && r.request().method() === 'POST', { timeout: 60000 });
    await button('Ask the tutor').click(); const response = await responsePromise; const body = await response.json();
    Object.assign(evidence.liveRequests.at(-1), { status: response.status(), answer: body.answer, usage: body.usage, incomplete: body.incomplete ?? false });
    await writeFile(path.join(out, `live-response-${evidence.liveRequests.length}.json`), JSON.stringify(body, null, 2));
    await persist();
    if (!response.ok() || body.incomplete || !body.pendingToken) throw Error('Live answer did not complete; evidence retained; no automatic paid retry.');
    await button('Save this answer').waitFor();
    if (await consent.isChecked()) throw Error('Consent did not reset.');
  }
  await liveTurn();
  await shot('live-answer', answer.locator('h2').first(), [['heading', answer.locator('h2').first()], ['badge', answer.locator('.ai-tutor-badge')]]);
  await shot('live-code', answer.locator('pre'), [['code', answer.locator('[data-code-line]').first()]]);
  await shot('usage-and-save', button('Save this answer'), [['usage', answer.locator('p.muted').last()], ['save', button('Save this answer')]]);
  await button('Save this answer').click(); await page.getByText('Answer saved. You can reopen it below without another model request.', { exact: true }).waitFor();
  evidence.savedOperations.push('saved-first-live-answer'); await context.storageState({ path: path.join(out, 'storage-state.json') }); await persist();
  await shot('saved-confirmation', page.getByText('Answer saved. You can reopen it below without another model request.', { exact: true }), [['saved', page.getByText('Answer saved. You can reopen it below without another model request.', { exact: true })]]);
  await page.reload({ waitUntil: 'networkidle' }); await page.getByRole('tab', { name: 'AI Tutor', exact: true }).click();
  await page.locator('.ai-tutor-saved-list button').first().click();
  await shot('reopen-answer', page.getByRole('heading', { name: 'Saved answer', exact: true }), [['heading', page.getByRole('heading', { name: 'Saved answer', exact: true })], ['metadata', page.locator('.ai-tutor-saved-detail p.muted').first()]]);
  evidence.savedOperations.push('reopened-after-reload-without-new-live-request'); await persist();
  await page.getByLabel('Answer mode', { exact: true }).selectOption('live');
  await model.selectOption('claude-sonnet-4-6');
  await page.getByLabel('Question for AI Tutor', { exact: true }).fill('Give me one next-step hint for Lab 01. In under 80 words, tell me which lifecycle evidence to inspect and why an early stream ending is incomplete. Do not write code or solve the whole exercise.');
  await consent.check(); await shot('second-model', model, [['model', model]]);
  await liveTurn();
  await shot('second-answer', answer.locator('h2').first(), [['answer', answer.locator('h2').first()]]);
  await button('Save this answer').click();
  await page.getByText('Answer saved. You can reopen it below without another model request.', { exact: true }).waitFor();
  await shot('saved-library', page.getByRole('heading', { name: 'Saved AI Tutor answers', exact: true }), [['library', page.getByRole('heading', { name: 'Saved AI Tutor answers', exact: true })]]);
  await page.locator('.ai-tutor-saved-list button').first().click();
  await shot('remove-answer', button('Remove saved answer'), [['remove', button('Remove saved answer')]]);
  await button('Remove saved answer').click();
  await page.waitForFunction(() => document.querySelectorAll('.ai-tutor-saved-list button').length === 1);
  evidence.savedOperations.push('saved-second-answer', 'removed-second-answer-without-model-request');
  await page.goto(evidence.origin + '/?lesson=50', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'AI Tutor', exact: true }).click();
  await shot('lab50-context', page.locator('.ai-tutor h2').first(), [['lab', page.locator('.ai-tutor .phase-label').first()], ['heading', page.locator('.ai-tutor h2').first()]]);
  if (!await page.getByText('No saved answers for this lab yet.', { exact: true }).count()) throw Error('Saved answers should be scoped by lesson.');
  if (evidence.liveRequests.length !== 2 || evidence.errors.length) throw Error('Unexpected request count or browser error.');
  evidence.complete = true; await persist(); console.log('Complete: three prepared questions, two real live answers, save/reopen/remove verified.');
} finally { await browser.close(); }
