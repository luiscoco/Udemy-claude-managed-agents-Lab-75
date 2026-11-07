import {spawn} from 'node:child_process';import {chromium} from 'playwright';import {mkdir,writeFile} from 'node:fs/promises';import path from 'node:path';
const root=process.cwd(),base=path.resolve('presentations/agent-sdk-platform-architecture/github-repo/mini-projects'),out=path.resolve('presentations/agent-sdk-course-welcome/assets');await mkdir(out,{recursive:true});
const sources=[],children=[];let browser;
try{browser=await chromium.launch({channel:'msedge',headless:true});
for(const [i,id] of ['study-coach','agent-evaluation-studio','agent-publishing-studio'].entries()){
 const cwd=path.join(base,id),port=5691+i,api=5791+i;let log='';const env={...process.env,ANTHROPIC_API_KEY:'',PORT:String(api),PROJECT_API_PORT:String(api),PROJECT_MODE:'learner'};
 for(const args of [['server.mjs'],[path.join(base,'../node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(port),'--strictPort']]){const c=spawn(process.execPath,args,{cwd,env,windowsHide:true,stdio:['ignore','pipe','pipe']});children.push(c);for(const s of [c.stdout,c.stderr])s.on('data',d=>{log+=d.toString()});}
 for(let n=0;n<80;n++){try{const r=await fetch(`http://127.0.0.1:${port}`);const a=await fetch(`http://127.0.0.1:${api}/api/health`);if(r.ok&&a.ok)break;}catch{}if(n===79)throw Error(id+' failed: '+log.slice(-1500));await new Promise(r=>setTimeout(r,250));}
 const p=await browser.newPage({viewport:{width:1920,height:900},deviceScaleFactor:1});await p.goto(`http://127.0.0.1:${port}`,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);if(await p.getByLabel('Text size',{exact:true}).count())await p.getByLabel('Text size',{exact:true}).selectOption('100');await p.waitForTimeout(700);const body=await p.locator('body').innerText();if(/Internal Server Error|Failed to resolve import/.test(body))throw Error(body.slice(0,1000));await p.screenshot({path:path.join(out,id+'.png')});sources.push({id,url:p.url(),capturedAtUtc:new Date().toISOString(),liveEnabled:false,visibleText:body.slice(0,10000),viewport:{width:1920,height:900}});await p.close();console.log('Captured '+id);
}
await writeFile(path.join(out,'project-captures.json'),JSON.stringify(sources,null,2));
}finally{if(browser)await browser.close();for(const c of children)c.kill();}
