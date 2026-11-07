// Capture Lab 29 (Images, documents and mounted files) for its step-by-step video.
// Usage: node scripts/capture-lab29-walkthrough.mjs offline   (this lab has no live mode: nothing is ever uploaded)
import {start} from './lab_capture_common.mjs';
const c=await start(29,process.argv[2],/\/api\/c29\/(inline|upload|disk)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
const status=page.getByLabel('Lab 29 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab29-heading"]');
const res=page.locator('section[aria-label="File evidence"]');const rp=t=>res.locator('p').filter({hasText:t}).first();
async function run(id,{name='aurora-finch.png',route='inline',payload='fixture'}={}){
 await page.getByLabel('Selected fixture').selectOption(name);await page.getByLabel('Delivery route').selectOption(route);
 if(route==='inline')await page.getByLabel('Payload scenario').selectOption(payload);
 await btn('Run offline comparison').click();await page.waitForTimeout(1500);evidence[id]={status:await status.innerText(),result:await res.count()?await res.innerText():null};}
try{
 await c.intro('Images, documents and mounted files');
 await open();const ex=c.h('Images, documents and mounted files',2);await top(ex,130);const inv=c.h('Authored fixtures');
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-fixtures',inv.locator('xpath=following-sibling::ul[1]')],['exp-status',status]]);
 await run('inline_png');await top(page.getByLabel('Delivery route'),200);
 await shot('controls',[['controls-fixture',page.getByLabel('Selected fixture')],['controls-route',page.getByLabel('Delivery route')],['controls-run',btn('Run offline comparison')],['controls-status',status]]);
 await top(res,110);await shot('inline-png',[['inline-png-file',rp('SHA-256')],['inline-png-blocks',res.locator('pre')],['inline-png-mount',rp('Uploaded file ID:')],['inline-png-calls',rp('Provider calls:')]]);
 await run('inline_pdf',{name:'field-note.pdf'});await top(res,110);await shot('inline-pdf',[['inline-pdf-file',rp('SHA-256')],['inline-pdf-blocks',res.locator('pre')]]);
 await run('inline_txt',{name:'observation.txt'});await top(res,110);await shot('inline-txt',[['inline-txt-file',rp('SHA-256')],['inline-txt-blocks',res.locator('pre')]]);
 await run('upload',{name:'field-note.pdf',route:'upload'});await top(res,110);
 await shot('upload',[['upload-blocks',res.locator('pre')],['upload-mount',rp('Uploaded file ID:')],['upload-note',rp('Provider calls:')]]);
 await run('disk',{name:'field-note.pdf',route:'disk'});await top(res,110);
 await shot('disk',[['disk-mount',rp('Uploaded file ID:')],['disk-agent',rp('Agent text:')],['disk-output',rp('Downloaded output:')]]);
 await run('malformed',{payload:'malformed'});await top(page.getByLabel('Payload scenario'),200);
 await shot('malformed',[['malformed-payload',page.getByLabel('Payload scenario')],['malformed-status',status]]);
 await run('oversized',{payload:'oversized'});await top(page.getByLabel('Payload scenario'),200);
 await shot('oversized',[['oversized-payload',page.getByLabel('Payload scenario')],['oversized-status',status]]);
 const nolive=sec.locator(':scope > p').filter({hasText:'Live upload is unavailable'});await top(nolive,400);await shot('no-live',[['no-live-text',nolive]]);
 await c.codeTour([1,3,4,5]);
 await c.knowledge();
}finally{await c.done();}
