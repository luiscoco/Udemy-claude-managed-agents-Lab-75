import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

test('the concept sections and ten coach prompts are selectable without sending', async () => {
 const root=fileURLToPath(new URL('..',import.meta.url));
 const api=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:'0',ANTHROPIC_API_KEY:''},stdio:['ignore','pipe','pipe'],windowsHide:true});
 let vite,browser;
 try{
  const port=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Study Coach server did not start')),30000);
   api.stdout.on('data',chunk=>{const match=String(chunk).match(/http:\/\/127\.0\.0\.1:(\d+)/);if(match){clearTimeout(timer);resolve(Number(match[1]));}});
   api.once('error',reject);
  });
  vite=await createServer({root,server:{host:'127.0.0.1',port:0,proxy:{'/api':`http://127.0.0.1:${port}`}}});
  await vite.listen();
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:820}});
  await page.goto(`http://127.0.0.1:${vite.httpServer.address().port}/`);
  assert.equal(await page.locator('#guide-section option').count(),18);
  assert.match(await page.locator('.concept-panel h3').innerText(),/LLM/);
  assert.equal(await page.locator('.guide-prompts .prompt-button').count(),10);
  await page.getByRole('button',{name:'Test the concept',exact:true}).click();
  assert.match(await page.locator('textarea').first().inputValue(),/LLM/);
  await page.locator('#guide-section').selectOption('retrieval-data');
  assert.ok((await page.locator('.concept-panel h3').innerText()).length>5);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
 }finally{
  await browser?.close();
  await vite?.close();
  api.kill();
 }
});
