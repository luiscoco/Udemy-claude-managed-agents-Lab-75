// One actual isolated Python SDK turn, followed by independent archive verification.
import Anthropic from '@anthropic-ai/sdk';
import {writeFile} from 'node:fs/promises';
import {runLab70Python,selectLab70Python,pythonPin} from '../../server/lib/lab70-python.js';
let id:string|undefined,archived=false;
const client=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY,maxRetries:0,timeout:15000});
try{
 const probe=await runLab70Python({mode:'readiness'},{signal:AbortSignal.timeout(25000),deadlineMs:20000});
 const ready=probe.frames.find(f=>f.type==='readiness');
 if(ready?.type!=='readiness'||!ready.capable||ready.version!==pythonPin||probe.protocolError)throw Error('The selected isolated Python SDK is not ready; no model request started');
 console.log(`Isolated Python readiness: SDK ${ready.version} · API surface capable ${ready.capable} · provider requests 0`);
 const reply=await runLab70Python({mode:'live',operation:'one-shot',scenario:'normal',prompt:'Describe three fictional Aurora Finches in one short sentence.'},{signal:AbortSignal.timeout(60000),deadlineMs:45000});
 const session=reply.frames.find(f=>f.type==='session');if(session?.type==='session')id=session.id;
 const result=reply.frames.find(f=>f.type==='result');
 if(reply.protocolError||result?.type!=='result'||result.outcome!=='completed'||result.cleanup!=='archived'||!result.text.trim()||!id)throw Error('The actual Python SDK turn did not produce a completed archived result');
 archived=Boolean((await client.beta.sessions.retrieve(id)).archived_at);if(!archived)throw Error('Independent provider archive check failed');
 console.log(`Actual Python SDK turn: ${result.outcome} · JSON-lines valid · typed frames ${reply.frames.length} · non-empty response true`);
 console.log(`Worker cleanup ${result.cleanup} · stderr bytes ${reply.stderrBytes} · truncated ${reply.stderrTruncated} · forced process kill ${reply.killed}`);
 console.log('The selected project virtual environment ran the pinned Python SDK. Earlier browser workshop failure and retained-handle scenarios were standard-library offline fixtures, not additional live model turns.');
 console.log('Archived: yes · independently retrieved provider state');
 await writeFile('presentations/managed-agents-lab70-walkthrough/terminal/python-diagnostic.json',JSON.stringify({source:'actual-isolated-python-sdk-worker-and-independent-provider-state',pythonPin,interpreter:selectLab70Python(),readiness:ready,sessionPreview:id.slice(0,10)+'…'+id.slice(-4),archiveConfirmed:archived,frames:reply.frames,protocolError:reply.protocolError,stderrBytes:reply.stderrBytes,stderrTruncated:reply.stderrTruncated,killed:reply.killed},null,2));
}catch(error){console.error(`Live demonstration failed: ${String(error)}`);process.exitCode=1;}
finally{
 if(id&&!archived){try{await client.beta.sessions.events.send(id,{events:[{type:'user.interrupt'}]},{timeout:10000});await client.beta.sessions.archive(id,{}, {timeout:15000});archived=Boolean((await client.beta.sessions.retrieve(id)).archived_at);console.log(`Cleanup: ${archived?'archived':'unconfirmed'}`);}catch{console.error('Cleanup: archive unconfirmed');process.exitCode=1;}}
}
