import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {samplePng} from './image-fixtures.mjs';
import {app} from '../server.mjs';
test('prepared Managed publishing shows coloured code, documents, styled graphics and mobile layout',async()=>{
 const api=app.listen(0,'127.0.0.1');await once(api,'listening');
 const root=fileURLToPath(new URL('..',import.meta.url));
 const vite=await createServer({root,server:{host:'127.0.0.1',port:0,proxy:{'/api':'http://127.0.0.1:'+api.address().port}}});let browser;
 try{
  await vite.listen();browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1450,height:900}});
  await page.goto('http://127.0.0.1:'+vite.httpServer.address().port+'/');
  assert.match(await page.locator('.prompt-library-heading').innerText(),/173 prompts in 17 sections/);
  assert.equal(await page.locator('#prompt-section option').count(),17);
  await page.locator('#prompt').fill('Explain Managed Agents tools with code');
  await page.getByRole('button',{name:/Try prepared answer/}).click();
  const answer=page.locator('.answer-body .code-block');await answer.waitFor();assert.match(await answer.innerText(),/beta.sessions.create/);
  assert.ok(await answer.locator('.hljs-keyword').count()>0);
  const documentResponse=page.waitForResponse(response=>response.url().endsWith('/api/artifacts')&&response.request().method()==='POST',{timeout:90000});
  await page.getByRole('button',{name:/Create Word and PDF/}).click();
  const document=await documentResponse;assert.equal(document.status(),201,await document.text());
  await page.locator('.paper .code-block').waitFor();
  await page.locator('#upload').setInputFiles({name:'style.png',mimeType:'image/png',buffer:samplePng()});
  await page.getByText('style.png is ready as a style reference',{exact:false}).waitFor();
  await page.getByLabel('Infographic SVG + PNG').check();
  const imageResponse=page.waitForResponse(response=>response.url().endsWith('/api/artifacts')&&response.request().method()==='POST',{timeout:90000});
  await page.getByRole('button',{name:/Create SVG and PNG/}).click();
  const image=await imageResponse;assert.equal(image.status(),201,await image.text());
  await page.locator('.visual-preview .large-image').waitFor();
  await page.setViewportSize({width:390,height:820});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
 }finally{await browser?.close();await vite.close();api.closeAllConnections();await new Promise(resolve=>api.close(resolve));}
});
