// Real local MCP and retrieval fixtures; no provider credentials or external messaging.
import {start} from './lab_capture_common.mjs';
const lab=Number(process.argv[2]);
if(![61,62].includes(lab))throw Error('Choose Lab 61 or 62');
const title=lab===61?'Exposing an agent as an MCP server':'Retrieval RAG through custom tools';
const c=await start(lab,'offline',new RegExp(`/api/c${lab}/`),['offline']);
const {page,evidence,top,shot,btn}=c;
const sec=page.locator(`section[aria-labelledby="lab${lab}-heading"]`);
const sp=text=>sec.locator('p').filter({hasText:text}).first();
evidence.captureComplete=false;evidence.stagedScenes=[];evidence.apiResults=[];
async function scene(id,title,targets){
 await top(targets[0][1],130);await shot(id,targets.map(([key,loc])=>[key,loc]));
 evidence.stagedScenes.push({id,title,narration:Object.fromEntries(targets.map(([key,,speech])=>[key,speech]))});await c.save();
}
async function act(button,path){
 const pending=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/c${lab}/${path}`&&r.request().method()==='POST',{timeout:20000});
 await btn(button).click();const response=await pending,data=await response.json();
 evidence.apiResults.push({path,status:response.status(),input:response.request().postDataJSON(),result:data});
 if(!response.ok()||data.providerCalls!==0)throw Error('Expected successful local fixture with zero provider calls: '+JSON.stringify(data));
 await page.waitForFunction(n=>!document.querySelector(`section[aria-labelledby="lab${n}-heading"] .lab-controls button`)?.disabled,lab);
 return data;
}
try{
 await c.intro(title);await c.open();
 const heading=c.h(title,2);
 await scene('experiment','Open the local experiment',[
  ['exp-rule',heading.locator('xpath=following-sibling::p[1]'),'Open Run the exercise. '+await heading.locator('xpath=following-sibling::p[1]').innerText()],
  ['exp-controls',sec.locator('.lab-controls'),'Choose an authored scenario. These local controls start no Managed model and send no external notification.'],
 ]);
 if(lab===61){
  const descriptions={normal:'The real loopback MCP client initializes, discovers one typed tool, observes progress and receives a checked structured report. Its agent-session identifier is a local fixture UUID, not a Managed session.',timeout:'The slow local review reaches the bounded server deadline. It produces no accepted structured report.',cancel:'The local client aborts its outstanding call and still closes the transport. This is local MCP cancellation, not proof about a remote Managed session.',concurrent:'A second call on the active MCP session is rejected. The local client closes the transport in its finally block.'};
  for(const scenario of Object.keys(descriptions)){
   await sec.locator('select').selectOption(scenario);const result=await act('Run local MCP client','demo');
   if(scenario==='normal'&&!result.structuredResponse)throw Error('Normal MCP report missing');
   if(scenario==='timeout'&&!result.timeout||scenario==='cancel'&&!result.cancellation||scenario==='concurrent'&&!result.concurrentRejected)throw Error('Expected local transport boundary missing');
   await scene(`transport-${scenario}`,`Local MCP transport · ${scenario}`,[
    [`${scenario}-transport`,sp('Transport request IDs:'),descriptions[scenario]],
    [`${scenario}-tool`,sp('Listed tool:'),'The transport exposes only review_support_refund with its closed input and output schemas. It exposes neither a shell nor a payment effect.'],
   ]);
   if(result.structuredResponse)await scene('mcp-report','Checked local report',[['mcp-structured',sec.locator('pre.lab-json'),'The typed report states fictional eligibility and amount. This is a host-authored local review, not an actual refund or a live model answer.']]);
  }
 }else{
  const descriptions={grounded:'The authored answer cites the current thirty-day Acme policy returned in this run and passes the host check.','fabricated-citation':'The claimed chunk identifier was never returned. The host rejects the fabricated citation.','wrong-policy':'Even a matching quote does not validate an answer that claims the archived sixty-day policy.','no-match':'With no matching evidence, the empty citation set fails the closed report schema. The fixture does not invent a policy.','hostile-note':'The imported instruction is retrieved as untrusted text. Its matching quote cannot authorize a three-hundred-sixty-five-day return policy.'};
  for(const [scenario,speech] of Object.entries(descriptions)){
   await sec.locator('select').selectOption(scenario);const result=await act('Run retrieval fixture','query');
   if(result.verification.verified!==(scenario==='grounded'))throw Error('Unexpected retrieval verification');
   await scene(`query-${scenario}`,`Citation verification · ${scenario}`,[[`${scenario}-verdict`,sp('Tool event:'),speech]]);
   if(result.retrieved.length)await scene(`retrieval-${scenario}`,`Filtered evidence · ${scenario}`,[[`${scenario}-retrieved`,sec.getByRole('heading',{name:'Filtered retrieval'}).locator('xpath=following-sibling::ol[1]'),'The host filters tenant and document version before lexical ranking. Only evidence returned in this run can support a citation. Imported prose remains data.']]);
   await scene(`answer-${scenario}`,`Authored answer · ${scenario}`,[[`${scenario}-answer`,sec.getByRole('heading',{name:'Answer and cited evidence'}).locator('xpath=following-sibling::p[1]'),'Compare this authored answer with the cited evidence and host verdict. Citation validity and policy correctness are separate checks.']]);
  }
 }
 await scene('scope','Keep the local evidence scoped',[['scope-rule',sec.locator('p').last(),await sec.locator('p').last().innerText()]]);
 await c.codeTour([1,2,3]);await c.knowledge();evidence.captureComplete=true;
}finally{await c.done();}
