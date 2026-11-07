// Read-only inspection of a bounded fictional retrieval demonstration. No model requests.
import Anthropic from '@anthropic-ai/sdk';
import {writeFile} from 'node:fs/promises';
import {searchKnowledge,verifyReport} from '../../server/retrieval/lab62.js';
import {lab62SearchSchema} from '../../shared/lab62-retrieval-rag.js';
const id=process.argv[2];if(!/^sesn_[A-Za-z0-9]+$/.test(id??''))throw Error('Supply the observed session ID');
const client=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY,maxRetries:0,timeout:15000});
const session=await client.beta.sessions.retrieve(id),page=await client.beta.sessions.events.list(id,{order:'asc',limit:100});
if(page.next_page)throw Error('Inspection bound exceeded');
const call=page.data.find(e=>e.type==='agent.custom_tool_use');
if(call?.type!=='agent.custom_tool_use'||call.name!=='search_knowledge')throw Error('Expected retrieval call missing');
const returned=searchKnowledge(lab62SearchSchema.parse(call.input),'acme').results;
const text=page.data.filter(e=>e.type==='agent.message').map(e=>e.content.filter(b=>b.type==='text').map(b=>b.text).join('')).join('');
const report=JSON.parse(text),checked=verifyReport(report,returned);
const diagnostic={source:'read-only-observed-session-and-unchanged-deterministic-host-search',sessionPreview:id.slice(0,10)+'…'+id.slice(-4),
 archived:Boolean(session.archived_at),status:session.status,report,returnedChunkIds:returned.map(c=>c.id),checked};
await writeFile('presentations/managed-agents-lab62-walkthrough/terminal/report-diagnostic.json',JSON.stringify(diagnostic,null,2));
console.log(JSON.stringify(diagnostic));
