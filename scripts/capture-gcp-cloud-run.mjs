/** Real app screenshots plus clearly labelled snapshots of recorded CLI output/source. */
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const base = path.resolve('presentations/gcp-cloud-run-deployment');
const out = path.join(base, 'platform'); await mkdir(out, { recursive: true });
const rawDeployment = JSON.parse(await readFile('artifacts/gcp-deployment/evidence.json', 'utf8'));
if (rawDeployment.projectId !== 'learning-platform-agents-lab' || rawDeployment.region !== 'europe-west1'
    || !rawDeployment.cloudProvisioningComplete || rawDeployment.imageBuild?.status !== 'SUCCESS'
    || !rawDeployment.httpVerification?.complete || rawDeployment.httpVerification.checks.length !== 5
    || rawDeployment.httpVerification.checks.some(row => row.status !== 'passed')
    || rawDeployment.imageBuild.sourceSha256 !== '9c122418aaabcad2b47b7d005c35703ed6baab8171f558bc432ef96e720ff6dc') {
  throw Error('Verified Google Cloud deployment and all five HTTPS checks are required.');
}
const deployment = {origin: rawDeployment.service.origin, complete: true, runtimeAudit: {passwordProtected: true}};
if (deployment.origin !== 'https://cma-learning-video-78c93568-4yahrci5uq-ew.a.run.app') throw Error('Unexpected deployment origin.');
await mkdir(path.join(base, 'evidence'), {recursive: true});
await writeFile(path.join(base, 'evidence/deployment-evidence.json'), JSON.stringify(rawDeployment, null, 2));
const evidence = (process.argv.includes('--sources-only')||process.argv.includes('--source-inspector-only')) ? JSON.parse(await readFile(path.join(out,'capture-evidence.json'),'utf8')) : { origin: deployment.origin, screenshots: [], errors: [], requests: [], complete: false };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
let page;
try {
  let httpCredentials;
  if(deployment.runtimeAudit.passwordProtected){
    const access=JSON.parse(await readFile('artifacts/gcp-deployment/recording-access.json','utf8'));
    if(access.origin!==deployment.origin)throw Error('Recording credentials belong to another origin.');
    httpCredentials={username:access.username,password:access.password,origin:access.origin};
  }
  page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light', ...(httpCredentials?{httpCredentials}:{}) });
  page.on('pageerror', error => evidence.errors.push(error.message));
  await page.route('**/api/**', async route => {
    const request = route.request();
    if (request.method() === 'POST' && /\/api\/c1\/query$|\/api\/ai-tutor\/\d+$/.test(request.url())) {
      const body = request.postDataJSON();
      if (!['scripted', 'prepared'].includes(body?.mode)) {
        evidence.errors.push('Blocked a non-offline recording request.');
        await route.abort(); return;
      }
      evidence.requests.push({url: request.url(), mode: body.mode});
    }
    await route.continue();
  });
  const persist = () => writeFile(path.join(out, 'capture-evidence.json'), JSON.stringify(evidence, null, 2));
  async function snapshot(id, anchor, targets, kind = 'actual-application') {
    await anchor.waitFor({ state: 'visible', timeout: 60000 });
    if(kind==='actual-application'&&id==='source-inspector') await anchor.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
    else if (kind === 'actual-application') await anchor.evaluate(el => scrollTo(0, Math.max(0, el.getBoundingClientRect().top + scrollY - 220)));
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
    await page.setContent(`<html><style>*{box-sizing:border-box}body{margin:0;background:#101e30;color:#eaf3ff;font-family:Arial}header{padding:32px 70px;background:#183c5d;border-bottom:3px solid #ff9d6a}h1{margin:0;font-size:34px}small{font-size:19px;color:#bed5e9}pre{margin:30px 70px;font:24px/1.48 Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}footer{position:absolute;bottom:22px;left:70px;font-size:19px;color:#b7cde3}</style><header><h1>${escape(title)}</h1><small>Deployment evidence viewer · actual file excerpts or imported Google Cloud Shell results</small></header><pre>${lines}</pre><footer>${escape(provenance)}</footer></html>`);
    await snapshot(id, page.locator('[data-target]').first(), [['text', page.locator('[data-target]').first()]], 'actual-source-or-command-output');
  }
  if(process.argv.includes('--source-inspector-only')) {
    await page.goto(deployment.origin+'/?lesson=1',{waitUntil:'networkidle'});
    await page.getByRole('tab',{name:'TypeScript source',exact:true}).click();
    const firstLine=page.locator('.code-block:visible [data-code-line]').first();
    await firstLine.waitFor();await page.waitForTimeout(700);
    await snapshot('source-inspector',firstLine,[['source',firstLine]]);
    await persist();console.log('Refined the actual source inspector capture; completed workflow evidence retained.');
  } else {
  const driver = await readFile('gcp/cloudshell-deploy.py', 'utf8');
  const docker = (await readFile('Dockerfile', 'utf8')).split(/\r?\n/).slice(0, 10).join('\n');
  await documentShot('dockerfile', 'Actual Dockerfile · reviewed build stage', docker, 'RUN npm run build', 'Actual repository Dockerfile used by the successful cloud image build.');
  const buildConfig = JSON.parse(await readFile('gcp/cloudbuild.json', 'utf8'));
  await documentShot('gcp-build', 'Actual Cloud Build configuration', JSON.stringify(buildConfig, null, 2), 'gcp/verify-source.py', 'Actual source file: gcp/cloudbuild.json.');
  const excerpt = (first, last) => driver.slice(driver.indexOf(first), driver.indexOf(last, driver.indexOf(first)));
  await documentShot('gcp-roles', 'Dedicated build and runtime permissions', excerpt("    member = 'serviceAccount:'", "    access = read('recording-access.json')"), 'roles/artifactregistry.writer', 'Actual helper: permissions scoped to the tutorial bucket and repository.');
  await documentShot('gcp-staging', 'Use the dedicated source staging bucket', excerpt("    result = gc('builds', 'submit'", "    result = result[0]"), '--gcs-source-staging-dir', 'Actual corrected helper: source staging and logs use the dedicated bucket.');
  await documentShot('gcp-offline', 'Runtime configuration · paid model calls disabled', excerpt("    env = {'LEARNING_RECORDING_GATEWAY'", '    if not existing:'), 'AI_TUTOR_LIVE_ENABLED', 'Actual helper source; only the credential digest is supplied through Secret Manager.');
  await documentShot('gcp-scale', 'Cloud Run · one CPU, two GiB, maximum one instance', excerpt("            gc('run', 'deploy'", '        finally:'), "--max-instances=1", 'Actual Cloud Run deployment arguments; configuration settings are source evidence.');
  const recorded = 'Actual Google Cloud Shell results · ' + rawDeployment.recordedAt;
  for (const [id, title, value, target] of [
    ['image-build', 'Actual Cloud Build result · image build successful', rawDeployment.imageBuild, 'SUCCESS'],
    ['app-status', 'Actual Cloud Run deployment · ready HTTPS origin', {projectId: rawDeployment.projectId, region: rawDeployment.region, origin: rawDeployment.service.origin, ready: rawDeployment.service.ready}, 'true'],
    ['service-health', 'Actual service revision and scaling evidence', {latestReadyRevision: rawDeployment.service.latestReadyRevision, latestCreatedRevision: rawDeployment.service.latestCreatedRevision, scalingAnnotations: rawDeployment.service.scalingAnnotations, cloudProvisioningComplete: rawDeployment.cloudProvisioningComplete}, 'maxScale'],
    ['http-checks', 'Actual HTTPS checks · protected application', rawDeployment.httpVerification.checks, 'anonymous-app-denied'],
  ]) await documentShot(id, title, JSON.stringify(value, null, 2), target, recorded);
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
    await firstSourceLine.waitFor(); await page.waitForTimeout(900);
    await snapshot('source-inspector', firstSourceLine, [['source', firstSourceLine]]);
    await page.getByRole('tab', { name: 'AI Tutor', exact: true }).click();
    await page.getByRole('button', { name: 'Explain this exercise', exact: true }).click();
    await page.getByRole('button', { name: 'Ask the tutor', exact: true }).click();
    const answer = page.getByRole('region', { name: 'Tutor answer', exact: true }); await answer.waitFor();
    await snapshot('tutor-prepared', answer.locator('h2').first(), [['answer', answer.locator('h2').first()], ['mode', answer.locator('.ai-tutor-badge')]]);
    if (!await page.getByLabel('Answer mode', { exact: true }).locator('option[value="live"]').isDisabled()) throw Error('Paid tutor must remain disabled.');
    await page.getByRole('link', { name: 'Open notebook', exact: true }).click();
    const notebook = page.locator('#lesson-notebook-1'); await notebook.evaluate(el => el.open = true);
    await page.getByLabel('Notes for Lab 01', { exact: true }).fill('Google Cloud Run deployment verified: the Cloud Run HTTPS origin serves the course and API from the deployed container. The normal offline turn completed; the early-ended stream remained incomplete.');
    await page.getByRole('button', { name: 'Save note', exact: true }).click();
    await snapshot('notebook-saved', notebook, [['saved', page.getByRole('status', { name: 'Notebook status' })]]);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('link', { name: 'Open notebook', exact: true }).click(); await notebook.evaluate(el => el.open = true);
    if (!(await page.getByLabel('Notes for Lab 01', { exact: true }).inputValue()).includes('Google Cloud Run deployment verified')) throw Error('Browser note did not survive reload.');
    evidence.notebookPersistedAfterReload = true;
    await page.goto(deployment.origin, { waitUntil: 'networkidle' });
    await snapshot('final-application', page.locator('.portal-intro'), [['home', page.getByText('75 implemented lessons', { exact: true }).first()]]);
    if (evidence.errors.length) throw Error('Browser application errors recorded.');
    evidence.complete = true; evidence.recordedAt = new Date().toISOString(); evidence.cloudEvidenceRecordedAt = rawDeployment.recordedAt; await persist(); console.log('Real deployed app: two offline outcomes, source, prepared tutor, notebook persistence and final Home captured.');
  }
  }
} catch(error) {
  if(page){await page.screenshot({path:path.join(out,'capture-failure.png')});await writeFile(path.join(out,'capture-failure.txt'),await page.locator('body').innerText());}
  throw error;
} finally { await browser.close(); }
