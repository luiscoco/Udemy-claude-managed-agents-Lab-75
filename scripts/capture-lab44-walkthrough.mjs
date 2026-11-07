// Capture Lab 44 (Host telemetry and provider event traces) for its step-by-step video.
// Usage: node scripts/capture-lab44-walkthrough.mjs offline
// This lab is offline only: the page has no Run live button and every snapshot reports "Provider calls: 0".
// The export buttons are never clicked: any request to /api/c44/export-* is aborted by this script.
import {start} from './lab_capture_common.mjs';
const c=await start(44,process.argv[2],/\/api\/c44\/(tracing|rich|privacy|collector)$/,['offline']);const {page,btn,top,shot,open,evidence}=c;
await page.route('**/api/c44/export-*',r=>{evidence.errors.push('Blocked export request '+r.request().url());return r.abort();});
const status=page.getByLabel('Lab 44 status',{exact:true});const sec=page.locator('section[aria-labelledby="lab44-heading"]');
const sp=t=>sec.locator('p').filter({hasText:t}).first();const scenario=page.getByLabel('Offline scenario');const record=page.getByLabel('Record fictional content');
const list=name=>c.h(name,3).locator('xpath=following-sibling::ul[1]');const spans=()=>list('Host OpenTelemetry spans');
const spanItem=name=>spans().locator('li').filter({hasText:name}).first();
const ids=()=>sp('; thread ');const coll=()=>sp('Host collector:');const remote=()=>sp('Remote OTLP export observed');
const idle=()=>page.waitForFunction(()=>[...document.querySelectorAll('section[aria-labelledby="lab44-heading"] button')].some(b=>b.textContent==='Run trace fixture'&&!b.disabled),null,{timeout:30000});
async function post(route,click){const [r]=await Promise.all([page.waitForResponse(r=>r.url().endsWith('/api/c44/'+route)&&r.request().method()==='POST',{timeout:30000}),click()]);await idle();await page.waitForTimeout(300);return r.status();}
async function run(s){await scenario.selectOption(s);const code=await post('tracing',()=>btn('Run trace fixture').click());if(code!==200)throw Error('tracing HTTP '+code);}
async function snap(id,extra,anchor=ids()){await top(anchor,130);evidence[id]=await sec.innerText();evidence[`status_${id}`]=await status.innerText();
 const b=await status.boundingBox();await shot(id,b&&b.y>90&&b.y+b.height<1060?[...extra,[`${id}-status`,status]]:extra);}
try{
 if(!process.env.SKIP_INTRO)await c.intro('Host telemetry and provider event traces');
 await open();const ex=c.h('Host telemetry and provider event traces',2);await top(ex,130);
 await sp('LAB44_AZURE_EXPORT_ENABLED').or(sp('export starts only')).waitFor({timeout:30000});
 evidence.liveButtons=await page.getByRole('button',{name:'Run live'}).count();evidence.scenarios=await scenario.locator('option').allInnerTexts();evidence.ready=await status.innerText();
 await shot('experiment',[['exp-rule',ex.locator('xpath=following-sibling::p[1]')],['exp-scenario',scenario],['exp-record',record.locator('xpath=..')],['exp-run',btn('Run trace fixture')]]);
 const child=sp('Claude Code child telemetry');await top(child,500);evidence.nolive=await child.innerText();
 await shot('no-live',[['no-live-ready',status],['no-live-text',child]]);
 await run('successful-tool');evidence.calls=await coll().innerText();
 await snap('success',[['success-ids',ids()],['success-collector',coll()],['success-root',spanItem('express.request')],['success-tool',spanItem('host.custom-tool')]]);
 const prov=list('Provider event evidence');
 await snap('provider',[['provider-events',prov],['provider-remote',remote()],['provider-evidence',list('Evidence')]],c.h('Provider event evidence',3));
 await run('denied-tool');
 await snap('denied',[['denied-collector',coll()],['denied-approval',spanItem('host.approval.wait')],['denied-cleanup',spanItem('host.cleanup')]]);
 await run('failed-tool');
 await snap('failed',[['failed-collector',coll()],['failed-tool',spanItem('host.custom-tool')]]);
 await run('missing-provider-span');
 const none=sp('No provider model-span signal observed.');
 await snap('missing',[['missing-none',none],['missing-evidence',list('Evidence')]],c.h('Provider event evidence',3));
 await post('privacy',()=>record.check());await run('successful-tool');
 await snap('record',[['record-tool',spanItem('host.custom-tool')],['record-remote',remote()],['record-evidence',list('Evidence').locator('li').last()]],spanItem('host.approval.wait'));
 await post('privacy',()=>record.uncheck());
 await post('collector',()=>btn('Inspect collector').click());await top(status,300);evidence.collector=await status.innerText();await shot('collector',[['collector-status',status]]);
 const remoteSetup=sp('LAB44_REMOTE_EXPORT_ENABLED'),azureSetup=sp('LAB44_AZURE_EXPORT_ENABLED');await top(c.h('Remote collector setup',3),130);
 evidence.remoteSetup=await remoteSetup.innerText();evidence.azureSetup=await azureSetup.innerText();
 evidence.exportDisabled=[await btn('Export redacted host trace').isDisabled(),await btn('Export authored trace to Azure Monitor').isDisabled()];
 await shot('setup',[['setup-remote',remoteSetup],['setup-remote-btn',btn('Export redacted host trace')],['setup-azure',azureSetup],['setup-azure-btn',btn('Export authored trace to Azure Monitor')]]);
 await c.codeTour([1,3,5,6]);
 await c.knowledge();
}finally{await c.done();}
