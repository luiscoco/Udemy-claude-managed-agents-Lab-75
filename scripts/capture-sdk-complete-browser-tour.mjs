import {chromium} from 'playwright';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
const project='agent-sdk-complete-browser-tour-v3';const out=path.resolve('presentations',project,'capture');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const manifest={project,origin:'http://127.0.0.1:3100',mocked:false,viewport:{width:1920,height:1080},browserPresentation:'85% zoom; wider responsive main area; original app content',scenes:[],errors:[]};
const context=await browser.newContext({viewport:manifest.viewport,recordVideo:{dir:path.join(out,'raw'),size:manifest.viewport},reducedMotion:'reduce'});const page=await context.newPage();
page.on('pageerror',e=>manifest.errors.push(String(e)));let start=Date.now();
const style='html{zoom:.85}main{max-width:2100px}.nav{position:sticky;top:8px;z-index:20;background:#eaf5ff}pre{scrollbar-width:none}.diagram img{min-width:0;width:auto;height:auto;max-width:100%;max-height:980px;margin:auto}';
async function navigate(url){
 await page.goto(manifest.origin+url,{waitUntil:'networkidle'});await page.addStyleTag({content:style});await page.waitForTimeout(200);
}
async function capture(label,locator,narration,extra={}){
 const n=manifest.scenes.length+1;const element=page.locator(locator).first();await element.waitFor({state:'visible'});
 let zoom=.85;await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);
 for(let i=0;i<4;i++){
  const b=await element.boundingBox();if(b.height<880)break;zoom=Math.max(.62,zoom*870/b.height);await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);
 }
 await element.evaluate(el=>{const nav=document.querySelector('.nav');const gap=(nav?.getBoundingClientRect().height||70)+30;window.scrollTo(0,el.getBoundingClientRect().top+scrollY-gap)});
 await page.waitForTimeout(300);const box=await element.boundingBox();
 const visible=box.x>=0&&box.y>=0&&box.x+box.width<=1922&&box.y+box.height<=1082;
 if(!visible)throw Error('Section is not fully visible: '+label+' '+JSON.stringify(box));
 const title=element.locator('h1,h2,h3').first();const heading=await title.count()?await title.boundingBox():box;
 const screen=path.join(out,`scene-${String(n).padStart(2,'0')}.png`);await page.screenshot({path:screen});
 const at=(Date.now()-start)/1000;await page.mouse.move(box.x+Math.min(60,box.width/2),box.y+Math.min(40,box.height/2),{steps:12});await page.waitForTimeout(1600);
 manifest.scenes.push({scene:n,label,url:page.url(),selector:locator,narration,zoom,box,heading,wholeSectionVisible:visible,startSeconds:at,endSeconds:(Date.now()-start)/1000,screenshot:path.basename(screen),...extra});
 await writeFile(path.join(out,'capture-manifest.json'),JSON.stringify(manifest,null,2));console.log(`Captured ${n}: ${label} (${Math.round(zoom*100)}% zoom)`);
}
try{
 await navigate('/');start=Date.now();
 await capture('Application lab overview','header.hero','Welcome to this real application tour for the free Claude Agent SDK course. We will visit every application section, then run the file-discovery agent and inspect its actual result.');
 await capture('Install, configure, run','.flow','The application begins with three steps: install the SDK, configure the environment, and ask which files are in the sample workspace.');
 await navigate('/learn.html');
 const lessons=[
 ['Install the SDK','Create a TypeScript project and install the Agent SDK and its runtime dependencies. This learning goal connects project setup to a working first example.'],
 ['Set the key in the same shell','Set the API key in the process environment used to start the application. A different terminal does not automatically inherit a later shell assignment.'],
 ['Ask the first question','The first question is deliberately simple: What files are here? You can concentrate on how the query runs and how its answer arrives.'],
 ['Choose a working directory','The working directory is the sample workspace. It defines which folder the question refers to, so the agent is not asked to search the entire computer.'],
 ['Observe a real tool call','Observe the actual Glob tool call. Making a tool available and pre-approving its use are separate parts of the agent configuration.'],
 ['Check completion','Check the final result, not only the presence of text or tool activity. The application distinguishes a successful outcome from an error or limit result.']];
 for(let i=0;i<lessons.length;i++)await capture('Learning goal: '+lessons[i][0],`.card:nth-child(${i+1})`,lessons[i][1]);
 await capture('Choose your language','.step','This application implements the lesson in TypeScript. The language section helps students understand the concrete project they will run and how it relates to the SDK.');
 await navigate('/run.html');
 const setup=[
 ['Install the SDK and choose TypeScript','Follow the installation commands from top to bottom: create a project, enable modules, install the SDK and TypeScript tooling, and prepare a small sample folder.'],
 ['Set your API key in the same shell','Configure the API key in your own terminal. The page demonstrates checking whether the key is present without printing the secret value.'],
 ['Run the sample and print results','Run the terminal sample to print tool activity, the assistant response, and the final outcome. Keep the terminal open for the process you started.'],
 ['Optional environment file','The environment-file workflow is optional and explicit. The plain sample and the command that loads the local environment file have different startup behavior.'],
 ['Run the web application','Start the web server and open its local address. This browser interface runs the same lesson query and shows its result as it arrives.'],
 ['Inspect the standalone sample','Inspect the standalone sample and use the suggested checks to connect the prompt, working directory, and discovered file paths.'],
 ['Troubleshooting','The troubleshooting table covers configuration, authentication, runtime setup, working-directory mistakes, limit results, and occupied ports. Match the observed symptom to the relevant check.']];
 for(let i=0;i<setup.length;i++)await capture('Setup: '+setup[i][0],`.step:nth-of-type(${i+1})`,setup[i][1]);
 await navigate('/architecture.html');
 await capture('Before the first message','.step','The architecture starts before a model response: the host checks configuration and input, selects the working directory, and defines the limited tools for this lesson.');
 await capture('Complete UML workflow','.diagram','Here is the complete application workflow. Trace the request from the student through the host and SDK to Claude, then follow the tool result and final messages back.');
 const workflow=[
 ['Ask the question','The student submits the sample question. The browser begins a request to the local application.'],
 ['Check configuration and input','The host checks the inherited key and validates the input before starting the SDK operation.'],
 ['Create the query','The host calls query with the prompt and lesson options. Those options select the sample workspace.'],
 ['Send the prompt and tool definition','The SDK sends the task with the available Glob tool definition. The model now knows which file-discovery operation it may request.'],
 ['Request Glob discovery','Claude requests a Glob search. This tool request is progress toward the answer, not the final success signal.'],
 ['Run Glob in the sample workspace','The tool executes against the selected sample workspace and discovers matching file paths.'],
 ['Return matching paths','The tool returns the matched paths to the SDK. The answer should be based on this evidence.'],
 ['Send the tool result to Claude','The SDK provides the tool result to Claude so it can formulate a response grounded in the discovered files.'],
 ['Produce the final answer','Claude produces the user-facing answer. The host still needs to inspect the SDK outcome.'],
 ['Yield SDK messages','The SDK yields tool, assistant-text, and result messages. The application handles those message categories explicitly.'],
 ['Render safe text','The host prints results or forwards selected events to the browser, where the interface renders safe text.'],
 ['Compare and check status','Finally, compare the answer with the host reference and check the final status. This closes the workflow with evidence of completion.']];
 for(let i=0;i<workflow.length;i++)await capture('Workflow '+(i+1)+': '+workflow[i][0],`.workflow-step:nth-of-type(${i+2})`,workflow[i][1]);
 await navigate('/walkthrough.html');
 const code=[
 ['Standalone sample','The standalone sample brings the core flow together: import the SDK, establish the lesson options, create a query, consume its messages, and close the conversation.'],
 ['Install the TypeScript project','This code step ties the project commands to the actual dependencies. The SDK performs agent execution, while the TypeScript tooling runs the example.'],
 ['Pass the process environment','The startup check reads the inherited environment. It reports a missing configuration without exposing the API key.'],
 ['Set the working directory and Glob','The lesson options restrict the example to a small directory and Glob. They also bound turns and spending and disable unrelated configuration sources.'],
 ['Ask the exact question','The query receives the lesson prompt and options. One query can include multiple model turns while it works toward a final answer.'],
 ['Consume and close','The asynchronous loop consumes SDK messages. It prints relevant text and tool activity, checks the final result, and closes the conversation in the cleanup path.'],
 ['Forward browser events','The web application forwards selected events to the browser. This connects the backend SDK operation to the live interface without exposing raw runtime configuration.'],
 ['Compare the evidence','The final code step compares the assistant answer with real local evidence. The reference list and the agent-discovered result serve different purposes.']];
 for(let i=0;i<code.length;i++)await capture('Code: '+code[i][0],`.step:nth-of-type(${i+1})`,code[i][1]);
 await navigate('/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 await capture('Run the real example','.workspace','Now try the real application. Enter the sample question and use Run query. The interface shows the prompt, the permitted tool, and the sample working directory.');
 const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/query')&&r.request().method()==='POST');
 const liveStart=(Date.now()-start)/1000;await page.locator('#prompt').fill('What files are here?');await page.locator('#run').click();const response=await responsePromise;const events=(await response.text()).trim().split('\n').map(JSON.parse);await page.waitForFunction(()=>document.querySelector('#status').textContent!=='Running',{timeout:100000});
 const result=events.find(e=>e.type==='result');const answer=await page.locator('#answer').innerText();
 if(result?.status!=='success'||!events.some(e=>e.type==='tool'&&e.name==='Glob'))throw Error('Expected real Glob and final success');
 for(const f of ['notes.txt','todo.md','src/hello.ts'])if(!answer.replaceAll('\\','/').includes(f))throw Error('Missing real file '+f);
 manifest.liveRun={events,answer,status:'success',startSeconds:liveStart,endSeconds:(Date.now()-start)/1000,mocked:false};
 await capture('Actual answer and final result','.workspace','The actual run has completed. Glob discovered the sample files, and the interface shows a successful final result. Compare the three returned paths with the host reference.');
 await capture('SDK event evidence','.workspace details','The event list records initialization, the Glob call, assistant text, and the final SDK result. Use this sequence to distinguish intermediate activity from completion.');
 await page.locator('a[href="/learn.html"]').first().click();await page.addStyleTag({content:style});
 await capture('Continue learning in the free course','header.hero','Explore the application yourself, follow the setup instructions, and trace the code one step at a time. Start with the free Claude Agent SDK course on Udemy.');
 const raw=await page.video().path();await context.close();await copyFile(raw,path.join(out,'complete-browser-recording.webm'));manifest.rawVideo='complete-browser-recording.webm';
 if(manifest.errors.length)throw Error('Browser errors');await writeFile(path.join(out,'capture-manifest.json'),JSON.stringify(manifest,null,2));console.log('Completed '+manifest.scenes.length+' application-only scenes; real SDK query passed.');
}catch(e){manifest.error=String(e);await writeFile(path.join(out,'capture-manifest.json'),JSON.stringify(manifest,null,2));throw e;}finally{await browser.close();}
