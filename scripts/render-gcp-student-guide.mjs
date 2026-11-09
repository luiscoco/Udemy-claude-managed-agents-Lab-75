import { chromium } from 'playwright';
import { copyFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const browser = await chromium.launch({channel: 'msedge', headless: true});
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.resolve('gcp/STUDENT-GUIDE.html')).href);
  await page.pdf({path: path.resolve('gcp/STUDENT-GUIDE.pdf'), format: 'A4', printBackground: true,
    margin: {top: '16mm', bottom: '16mm', left: '16mm', right: '16mm'}});
  await copyFile('gcp/STUDENT-GUIDE.pdf', 'videos/gcp-cloud-run-deployment/student-deployment-guide.pdf');
  console.log('Rendered PDF deployment guide.');
} finally { await browser.close(); }
