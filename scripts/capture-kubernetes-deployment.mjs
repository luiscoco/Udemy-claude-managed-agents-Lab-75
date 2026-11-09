/** Real app screenshots plus clearly labelled snapshots of recorded CLI output/source. */
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const base = path.resolve('presentations/kubernetes-desktop-deployment');
const out = path.join(base, 'platform'); await mkdir(out, { recursive: true });
const deployment = JSON.parse(await readFile(path.join(base, 'evidence/deployment-evidence.json'), 'utf8'));
const evidence = process.argv.includes('--sources-only') ? JSON.parse(await readFile(path.join(out,'capture-evidence.json'),'utf8')) : { origin: deployment.origin, screenshots: [], errors: [], requests: [], complete: false };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light' });
  page.on('pageerror', error => evidence.errors.push(error.message));
  page.on('request', request => {
    if (request.method() === 'POST' && /\/api\/c1\/query$|\/api\/ai-tutor\/\d+$/.test(request.url())) {
      const body = request.postDataJSON();
      if (!['scripted', 'prepared'].includes(body.mode)) throw Error('Only offline actions are allowed in this deployment recording.');
      evidence.requests.push({ url: request.url(), mode: body.mode });
    }
  });
  const persist = () => writeFile(path.join(out, 'capture-evidence.json'), JSON.stringify(evidence, null, 2));
  async function snapshot(id, anchor, targets, kind = 'actual-application') {
    await anchor.waitFor({ state: 'visible', timeout: 60000 });
    if (kind === 'actual-application') await anchor.evaluate(el => scrollTo(0, Math.max(0, el.getBoundingClientRect().top + scrollY - 220)));
    await page.waitForTimeout(200);
    const cues = [];
    for (const [cid, locator] of targets) {
      const item = await locator.evaluate(el => {
        const range = document.createRange(); range.selectNodeContents(el); const r = range.getBoundingClientRect();
        return { text: el.innerText || el.value, rect: [r.x, r.y, r.width, r.height] };
      });
      const [x, y, w, h] = item.rect;
      if (x < 8 || y < 100 || x+w > 1912 || y+h > 1072 || w < 4) throw Error(`Offscreen ${id}/${cid}: ${JSON.stringify(item)}`);
      cues.push({ id: `${id}-${cid}`, ...item });
    }
    await page.screenshot({ path: path.join(out, id + '.png') });
    evidence.screenshots=evidence.screenshots.filter(row=>row.id!==id);
    evidence.screenshots.push({ id, kind, url: page.url(), cues }); await persist(); console.log(`Captured ${id}`);
  }
  const escape = text => text.replace(/[&<>\"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
  async function documentShot(id, title, text, targetText, provenance) {
    const lines = text.split(/\r?\n/).map(line => `<div>${line.includes(targetText) && !line.startsWith('$') ? `<span data-target>${escape(line)}</span>` : escape(line) || ' '}</div>`).join('');
    await page.setContent(`<html><style>*{box-sizing:border-box}body{margin:0;background:#101e30;color:#eaf3ff;font-family:Arial}header{padding:32px 70px;background:#183c5d;border-bottom:3px solid #ff9d6a}h1{margin:0;font-size:34px}small{font-size:19px;color:#bed5e9}pre{margin:30px 70px;font:24px/1.48 Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}footer{position:absolute;bottom:22px;left:70px;font-size:19px;color:#b7cde3}</style><header><h1>${escape(title)}</h1><small>Deployment evidence viewer Â· actual file or recorded Kubernetes command output</small></header><pre>${lines}</pre><footer>${escape(provenance)}</footer></html>`);
    await snapshot(id, page.locator('[data-target]').first(), [['text', page.locator('[data-target]').first()]], 'actual-source-or-command-output');
  }
  for (const [id, file, start, end, target] of [
    ['manifest-config', 'k8s/platform.yaml', 0, 18, 'MANAGED_LIVE_ENABLED'],
    ['manifest-storage', 'k8s/platform.yaml', 19, 29, 'storage: 2Gi'],
    ['manifest-deployment', 'k8s/platform.yaml', 35, 58, 'imagePullPolicy'],
    ['manifest-probes', 'k8s/platform.yaml', 69, 85, 'startupProbe'],
    ['manifest-mounts', 'k8s/platform.yaml', 89, 106, 'mountPath: /app/artifacts'],
    ['manifest-service', 'k8s/platform.yaml', 107, 121, 'ClusterIP'],
    ['dockerfile', 'Dockerfile', 0, 9, 'RUN npm run build'],
  ]) {
    const content = await readFile(file, 'utf8');
    await documentShot(id, file, content.split(/\r?\n/).slice(start,end).join('\n'),target,'Actual reviewed course file; no private configuration');
  }
  for (const [id,step,target,max] of [
    ['engine','01-engine','Engine:',18],['cluster','02-cluster-status','State:',18],
    ['nodes','22-readable-node','Ready',18],['storage','04-storage','default',18],
    ['build','05-build','exit 0',20],['image','06-image','claude-learning-platform',18],
    ['import','08-import-image','exit 0',20],['dry-run','10-dry-run','dry run',18],
    ['apply','11-apply','platform',18],['rollout','12-rollout','successfully rolled out',18],
    ['resources','13-resources','Bound',18],['logs','14-logs','Backend ready',18],
    ['runtime-audit','15-runtime-audit','privateFilesAbsent',18],
    ['volume-write','16-volume-write','Wrote a teaching proof',18],
    ['replace','18-replace-pod','deleted',18],['ready','19-replacement-ready','condition met',18],
    ['volume-read','20-volume-read','PASS:',18],['final-resources','21-final-resources','Bound',18],
  ]) {
    const row=deployment.commands.find(item=>item.id===step&&item.status==='passed');
    if(!row){if(step==='08-import-image')continue;throw Error('Missing result: '+step);}
    const text=await readFile(path.join(base,'evidence',step+'.txt'),'utf8');
    await documentShot(id,'Real result · '+step,text.split(/\r?\n/).slice(-max).join('\n'),target,'Actual recorded command · exit 0 · '+row.finishedAt);
  }
  await documentShot('port-forward','Local browser access',(await readFile(path.join(base,'evidence/port-forward.txt'),'utf8')).split(/\r?\n/).slice(0,9).join('\n'),'Forwarding from','Actual running loopback port-forward; output excerpt; no public endpoint');
  if (process.argv.includes('--sources-only')) { await persist(); console.log('Source/preflight capture complete.'); }
  else {
    if (!deployment.complete) throw Error('Deployment must pass before recording the application.');
    await page.goto(deployment.origin, { waitUntil: 'networkidle' });
    await snapshot('deployed-home', page.locator('.portal-intro'), [['home', page.getByText('75 implemented lessons', { exact: true }).first()]]);
    await page.getByRole('button', { name: 'Check backend', exact: true }).click();
    await snapshot('backend-health', page.locator('#health-heading'), [['health', page.locator('#health-heading')]]);
    await page.goto(deployment.origin + '/?lesson=1', { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'Run the exercise', exact: true }).click();
    await snapshot('offline-controls', page.getByRole('button', { name: 'Run offline fixture', exact: true }), [['run', page.getByRole('button', { name: 'Run offline fixture', exact: true })]]);
    await page.getByRole('button', { name: 'Run offline fixture', exact: true }).click();
    const outcome = page.getByRole('group', { name: 'Turn outcome', exact: true });
    await outcome.filter({ hasText: 'completed' }).waitFor();
    evidence.normalOutcome = await outcome.innerText();
    await snapshot('offline-complete', outcome, [['outcome', outcome.locator('p').first()]]);
    await page.getByLabel('Offline scenario', { exact: true }).selectOption('stream-ended');
    await page.getByRole('button', { name: 'Run offline fixture', exact: true }).click();
    await outcome.filter({ hasText: 'incomplete' }).waitFor();
    evidence.incompleteOutcome = await outcome.innerText();
    await snapshot('offline-incomplete', outcome, [['outcome', outcome.locator('p').first()]]);
    await page.getByRole('tab', { name: 'TypeScript source', exact: true }).click();
    const firstSourceLine=page.locator('.code-block:visible [data-code-line]').first();
    await snapshot('source-inspector', firstSourceLine, [['source', firstSourceLine]]);
    await page.getByRole('tab', { name: 'AI Tutor', exact: true }).click();
    await page.getByRole('button', { name: 'Explain this exercise', exact: true }).click();
    await page.getByRole('button', { name: 'Ask the tutor', exact: true }).click();
    const answer = page.getByRole('region', { name: 'Tutor answer', exact: true }); await answer.waitFor();
    await snapshot('tutor-prepared', answer.locator('h2').first(), [['answer', answer.locator('h2').first()], ['mode', answer.locator('.ai-tutor-badge')]]);
    if (!await page.getByLabel('Answer mode', { exact: true }).locator('option[value="live"]').isDisabled()) throw Error('Paid tutor must remain disabled.');
    await page.getByRole('link', { name: 'Open notebook', exact: true }).click();
    const notebook = page.locator('#lesson-notebook-1'); await notebook.evaluate(el => el.open = true);
    await page.getByLabel('Notes for Lab 01', { exact: true }).fill('Kubernetes deployment verified: localhost:8090 serves the application and API. The normal offline turn completed; the early-ended stream remained incomplete.');
    await page.getByRole('button', { name: 'Save note', exact: true }).click();
    await snapshot('notebook-saved', notebook, [['saved', page.getByRole('status', { name: 'Notebook status' })]]);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('link', { name: 'Open notebook', exact: true }).click(); await notebook.evaluate(el => el.open = true);
    if (!(await page.getByLabel('Notes for Lab 01', { exact: true }).inputValue()).includes('Kubernetes deployment verified')) throw Error('Browser note did not survive reload.');
    evidence.notebookPersistedAfterReload = true;
    await page.goto(deployment.origin, { waitUntil: 'networkidle' });
    await snapshot('final-application', page.locator('.portal-intro'), [['home', page.getByText('75 implemented lessons', { exact: true }).first()]]);
    if (evidence.errors.length) throw Error('Browser application errors recorded.');
    evidence.complete = true; await persist(); console.log('Real deployed app: two offline outcomes, source, prepared tutor, notebook persistence and final Home captured.');
  }
} finally { await browser.close(); }
