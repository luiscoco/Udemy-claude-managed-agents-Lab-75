// Capture Lab 16 (Environment and configuration provenance) for its step-by-step video.
// Usage: node scripts/capture-lab16-walkthrough.mjs offline|live
// "live" runs exactly one billed session with the approved field-guide.txt file mount.
import {start} from './lab_capture_common.mjs';
const c=await start(16,process.argv[2],/\/api\/c16\/env-run$/);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Configuration experiment status',{exact:true});
const prov=c.h('Host and remote provenance');const precedence=prov.locator('xpath=following-sibling::p[1]');
const report=c.h('Session and mount evidence');
async function done(timeout=120000){await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(b=>b.textContent==='Cancel experiment'),null,{timeout});await page.waitForTimeout(1000);}
async function reportShot(id){await top(report,110);evidence[id]=await report.locator('xpath=..').innerText();
 await shot(id,[[`${id}-mount`,report.locator('xpath=following-sibling::p[1]')],[`${id}-session`,report.locator('xpath=following-sibling::p[2]')],[`${id}-message`,report.locator('xpath=following-sibling::p[last()]')]]);}
try{
 if(c.mode==='offline'){
  await c.intro('Environment and configuration provenance');
  await open();const ex=c.h('Trace settings to their source');await top(ex,130);
  await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-user',page.getByLabel('User region override',{exact:true})],['exp-session',page.getByLabel('Session region override',{exact:true})],['exp-scenario',page.getByLabel('Offline scenario',{exact:true})]]);
  const man=c.h('Approved manifest and readiness');await top(man,110);
  await shot('manifest',[['man-credentials',man.locator('xpath=following-sibling::p[1]')],['man-example',man.locator('xpath=following-sibling::p[2]')],['man-files',man.locator('xpath=following-sibling::ul[1]')]]);
  await btn('Resolve host settings').click();await precedence.waitFor();await page.waitForTimeout(800);evidence.resolve_user=await prov.locator('xpath=..').innerText();
  await top(prov,110);await shot('resolve-user',[['user-precedence',precedence],['user-card',page.locator('article.provenance-card').first()]]);
  await page.getByLabel('Session region override',{exact:true}).selectOption('north');await btn('Resolve host settings').click();await page.waitForTimeout(1500);
  evidence.resolve_session=await prov.locator('xpath=..').innerText();await top(prov,110);
  await shot('resolve-session',[['session-precedence',precedence],['session-card',page.locator('article.provenance-card').first()]]);
  await btn('Compare three layers').click();const layers=c.h('Layer comparison');await layers.waitFor();await page.waitForTimeout(800);evidence.layers=await layers.locator('xpath=following-sibling::ol[1]').innerText();
  await top(layers,300);await shot('layers',[['layers-list',layers.locator('xpath=following-sibling::ol[1]')]]);
  await page.getByLabel('Session region override',{exact:true}).selectOption('');
  await btn('Run offline environment exercise').click();await done();await reportShot('winning');
  await page.getByLabel('Offline scenario',{exact:true}).selectOption('missing-credential');await btn('Run offline environment exercise').click();await done();
  evidence.missing_cred=await prov.locator('xpath=..').innerText();await top(prov,110);
  await shot('missing-cred',[['cred-precedence',precedence],['cred-card',page.locator('article.provenance-card').filter({hasText:/credential|API key/i}).first().or(page.locator('article.provenance-card').nth(1))]]);
  await page.getByLabel('Offline scenario',{exact:true}).selectOption('absent-remote-mount');await btn('Run offline environment exercise').click();await done();await reportShot('absent');
  await page.getByLabel('Offline scenario',{exact:true}).selectOption('winning-host-layer');
  const cand=page.getByLabel('Candidate path',{exact:true});const res=page.getByLabel('Path policy result',{exact:true});
  for(const [v,id] of [['/mnt/session/uploads/field-guide.txt','path-allowed'],['/etc/passwd','path-outside'],['../field-guide.txt','path-traversal']]){
   await cand.selectOption(v);await btn('Inspect host path policy').click();await page.waitForTimeout(1200);evidence[id]=await res.innerText();
   await top(cand,200);await shot(id,[[`${id}-candidate`,cand],[`${id}-result`,res]]);
  }
  await c.liveDisabled();
  await c.codeTour([1,3,5,7]);
  await c.knowledge();
 }else{
  await open();const man=c.h('Approved manifest and readiness');await top(man,110);
  await shot('live-manifest',[['live-man-credentials',man.locator('xpath=following-sibling::p[1]')],['live-man-files',man.locator('xpath=following-sibling::ul[1]')]]);
  const run=btn('Run live');await top(page.getByLabel('User question'),200);
  await shot('live-question',[['live-question-text',page.getByLabel('User question')],['live-run-button',run]]);
  await run.click();await page.waitForTimeout(1000);await done(200000);
  const all=await report.locator('xpath=..').innerText().catch(async()=>await status.innerText());evidence.live=all;
  if(!/Source: managed-api/.test(all))throw Error('Not live: '+(await status.innerText()));
  await reportShot('live-report');
  const table=report.locator('xpath=following-sibling::div[1]');await top(table,110);await shot('live-answer',[['live-answer-text',table]]);
 }
}finally{await c.done();}
