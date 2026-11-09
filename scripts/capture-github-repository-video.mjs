/** Read-only capture of the public student repository, with measured text anchors. */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root = 'https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75';
const out = path.resolve('presentations/github-repository-student-guide/repository');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const evidence = { repository: root, recordedAt: new Date().toISOString(), access: 'public read-only', screenshots: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, colorScheme: 'light' });
  for (const [id, suffix, label] of [
    ['repository', '/tree/main', 'Udemy-claude-managed-agents-Lab-75'],
    ['readme', '/blob/main/README.md', 'Claude Managed Agents Learning'],
    ['projects', '/blob/main/docs/managed-milestone-projects.md', 'Claude Managed Agents milestone projects'],
    ['workbook', '/blob/main/docs/student-build-prompts/README.md', 'Build the Claude Managed Agents learning platform from zero'],
  ]) {
    await page.goto(root + suffix, { waitUntil: 'domcontentloaded', timeout: 90000 });
    const target = id === 'repository'
      ? page.getByTestId('repo-name-link')
      : page.locator('article h1').filter({ hasText: label }).first();
    await target.waitFor({ timeout: 45000 });
    await target.evaluate(el => window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY - 180)));
    await page.waitForTimeout(800);
    const cue = await target.evaluate(el => {
      const range = document.createRange(); range.selectNodeContents(el); const r = range.getBoundingClientRect();
      return { text: el.innerText, rect: [r.x, r.y, r.width, r.height] };
    });
    if (cue.rect[1] < 100 || cue.rect[0] < 8 || cue.rect[0] + cue.rect[2] > 1912) throw Error(`Invalid capture anchor: ${id}`);
    await page.screenshot({ path: path.join(out, `${id}.png`) });
    evidence.screenshots.push({ id, url: page.url(), cue });
    await writeFile(path.join(out, 'capture-evidence.json'), JSON.stringify(evidence, null, 2));
    console.log(`Captured actual GitHub page: ${id}`);
  }
} finally { await browser.close(); }
