// Read-only inspection of the observed browser control and its actual saved PNG proof.
import Anthropic from '@anthropic-ai/sdk';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const id=process.argv[2];if(!/^sesn_[A-Za-z0-9]+$/.test(id??''))throw Error('Supply the observed session ID');
const client=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY,maxRetries:0,timeout:15000});
const session=await client.beta.sessions.retrieve(id),page=await client.beta.sessions.events.list(id,{order:'asc',limit:100});
if(page.next_page)throw Error('Inspection bound exceeded');
const text=page.data.filter(e=>e.type==='agent.message').map(e=>e.content.filter(b=>b.type==='text').map(b=>b.text).join('')).join('');
let strictJsonValid=true;try{JSON.parse(text);}catch{strictJsonValid=false;}
const candidates:Record<string,unknown>[]=[];
for(const event of page.data){
 const content=(event as unknown as {content?:{type:string;text?:string}[]}).content??[];
 for(const block of content)if(block.type==='text'&&block.text){try{const value=JSON.parse(block.text);if(value&&typeof value==='object'&&value.source==='playwright-mcp')candidates.push(value);}catch{}}
}
const png=await readFile('presentations/managed-agents-lab64-walkthrough/terminal/live-proof.png');
if(!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Saved browser proof is not PNG');
const diagnostic={source:'read-only-provider-events-and-saved-host-browser-proof',sessionPreview:id.slice(0,10)+'…'+id.slice(-4),archived:Boolean(session.archived_at),status:session.status,
 toolCalls:page.data.filter(e=>e.type==='agent.custom_tool_use').length,strictJsonValid,rawReport:text,
 hostBrowserResult:candidates.at(-1)??null,proof:{file:'live-proof.png',bytes:png.length,sha256:createHash('sha256').update(png).digest('hex')},eventTypes:page.data.map(e=>e.type)};
await writeFile('presentations/managed-agents-lab64-walkthrough/terminal/report-diagnostic.json',JSON.stringify(diagnostic,null,2));
console.log(JSON.stringify(diagnostic));
