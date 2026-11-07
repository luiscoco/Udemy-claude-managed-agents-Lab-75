// Scene authoring around actual measured app captures; no provider credentials.
import {start} from './lab_capture_common.mjs';
export async function workshop(lab){
 const c=await start(lab,'offline',new RegExp(`/api/c${lab}/`),['offline']);
 const {page,evidence,top,shot,btn}=c,sec=page.locator(`section[aria-labelledby="lab${lab}-heading"]`);
 const status=page.getByLabel(`Lab ${lab} status`,{exact:true}),sp=text=>sec.locator('p').filter({hasText:text}).first();let owner;
 evidence.captureComplete=false;evidence.stagedScenes=[];evidence.apiResults=[];
 const redact=value=>Array.isArray(value)?value.map(redact):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([key,v])=>[key,/^(?:token|accessToken|refreshToken|authorization|cookie)$/i.test(key)&&typeof v==='string'?'[credential omitted]':redact(v)])):value;
 async function scene(id,title,targets){await top(targets[0][1],130);await shot(id,targets.map(([key,loc])=>[key,loc]));evidence.stagedScenes.push({id,title,narration:Object.fromEntries(targets.map(([key,,speech])=>[key,speech]))});await c.save();}
 async function api(button,suffix,expected=200){
  const pending=page.waitForResponse(r=>new URL(r.url()).pathname.startsWith(`/api/c${lab}/`)&&new URL(r.url()).pathname.endsWith(suffix)&&r.request().method()==='POST',{timeout:45000});
  await btn(button).click();const response=await pending,data=await response.json(),request=response.request();
  evidence.apiResults.push({path:new URL(response.url()).pathname,status:response.status(),input:redact(request.postDataJSON()),result:redact(data)});
  owner=request.headers()['x-lab-owner']??owner;
  if(response.status()!==expected)throw Error(`${button}: expected ${expected}, got ${response.status()}: ${JSON.stringify(redact(data))}`);
  if(data.providerCalls!==undefined&&data.providerCalls!==0)throw Error('Unexpected provider call in an offline fixture');
  await page.waitForTimeout(200);return data;
 }
 async function read(path){const response=await page.request.get(`${c.origin}/api/c${lab}/${path}`,{headers:owner?{'X-Lab-Owner':owner}:{}});if(!response.ok())throw Error('Host snapshot failed: '+response.status());return response.json();}
 async function settle(id){
  for(let n=0;n<200;n++){const result=await read(`runs/${id}`);if(result.state!=='running'){evidence.apiResults.push({path:`runs/${id}`,method:'GET',result:redact(result)});await page.waitForTimeout(400);return result;}await page.waitForTimeout(150);}
  throw Error('Run did not reach a bounded terminal state');
 }
 async function intro(title){await c.intro(title);await c.open();const heading=c.h(title,2);await scene('experiment','Open the host protocol experiment',[
  ['exp-rule',heading.locator('xpath=following-sibling::p[1]'),'Open Run the exercise. '+await heading.locator('xpath=following-sibling::p[1]').innerText()],
  ['exp-controls',sec.locator('.lab-controls').first(),'The guided controls use local authored scenarios. A real host protocol or worker process is separate from a live model request.'],
 ]);}
 async function finish(){await scene('scope','Record the host boundary',[['scope-rule',sec.locator('p').last(),await sec.locator('p').last().innerText()]]);await c.codeTour([1,2,3]);await c.knowledge();evidence.captureComplete=true;}
 return {...c,sec,status,sp,scene,api,read,settle,intro,finish};
}
