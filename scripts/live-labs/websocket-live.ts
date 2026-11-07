// Run the actual Lab 66 router and live port over a real loopback WebSocket.
// Observe session-create response IDs without changing requests or responses.
import express from 'express';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import WebSocket from 'ws';
import Anthropic from '@anthropic-ai/sdk';
import {createLab66Router} from '../../server/concepts/66-realtime-websocket.js';
const originalFetch=globalThis.fetch,owned:string[]=[];let eventRequests=0,archived=false;
globalThis.fetch=async(...args:Parameters<typeof fetch>)=>{
 const response=await originalFetch(...args),input=args[0],init=args[1];
 const url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url);
 const method=init?.method??(input instanceof Request?input.method:'GET');
 if(method==='POST'&&url.pathname.endsWith('/sessions')&&response.ok){const value=await response.clone().json() as {id?:string};if(value.id?.startsWith('sesn_'))owned.push(value.id);}
 if(method==='POST'&&/\/sessions\/sesn_[^/]+\/events$/.test(url.pathname))eventRequests++;
 return response;
};
type Frame={kind:string;seq?:number;state?:string;source?:string;commandId?:string;runId?:string;duplicate?:boolean;text?:string};
const frames:Frame[]=[];let socket:WebSocket|undefined,socketError:Error|undefined;
const host=createLab66Router(),app=express();app.use('/api/c66',host.router);const server=createServer(app);host.attach(server);
const client=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY,maxRetries:0,timeout:15000});
async function wait(check:()=>boolean,ms=45000){const until=Date.now()+ms;while(!check()){if(socketError)throw socketError;if(Date.now()>until)throw Error('Bounded WebSocket wait expired');await delay(40);}}
function connect(url:string,origin:string,cookie:string){
 const ws=new WebSocket(url,{headers:{Origin:origin,Cookie:cookie}});
 ws.on('message',data=>frames.push(JSON.parse(data.toString()) as Frame));ws.on('error',error=>{socketError=error;});return ws;
}
try{
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();if(!address||typeof address==='string')throw Error('Loopback address missing');
 const origin=`http://127.0.0.1:${address.port}`,url=`ws://127.0.0.1:${address.port}/api/c66/ws`;
 const ready=await originalFetch(`${origin}/api/c66/code`);const cookie=ready.headers.get('set-cookie')?.split(';')[0];if(!ready.ok||!cookie)throw Error('Local WebSocket authentication unavailable');
 socket=connect(url,origin,cookie);await wait(()=>frames.some(f=>f.kind==='ready'));
 const startId=randomUUID(),messageId=randomUUID();socket.send(JSON.stringify({kind:'start',commandId:startId,mode:'live',afterSeq:0}));
 await wait(()=>frames.some(f=>f.commandId===startId&&f.kind==='command-ack'));
 const runId=frames.find(f=>f.commandId===startId&&f.kind==='command-ack')!.runId;
 socket.send(JSON.stringify({kind:'message',commandId:messageId,runId,text:'Describe three fictional Aurora Finches in one short sentence.'}));
 await wait(()=>frames.some(f=>f.kind==='terminal'));const terminal=frames.find(f=>f.kind==='terminal')!;
 if(terminal.state!=='completed'||owned.length!==1||!frames.some(f=>f.kind==='chunk'&&f.source==='managed-api'))throw Error('Real WebSocket turn did not complete');
 const lastSeq=Math.max(...frames.map(f=>f.seq??0));
 socket.send(JSON.stringify({kind:'message',commandId:messageId,runId,text:'Describe three fictional Aurora Finches in one short sentence.'}));
 await wait(()=>frames.some(f=>f.commandId===messageId&&f.duplicate===true));
 socket.close();await new Promise<void>(resolve=>socket!.once('close',resolve));
 const before=frames.length;socket=connect(url,origin,cookie);await wait(()=>frames.slice(before).some(f=>f.kind==='ready'));
 socket.send(JSON.stringify({kind:'start',commandId:startId,mode:'live',afterSeq:Math.max(0,lastSeq-2)}));
 await wait(()=>frames.slice(before).some(f=>f.kind==='terminal'));
 const replay=frames.slice(before).filter(f=>f.seq!==undefined);
 if(!frames.slice(before).some(f=>f.kind==='command-ack'&&f.duplicate&&f.runId===runId)||owned.length!==1||eventRequests!==1)throw Error('Replay started another provider request');
 const session=await client.beta.sessions.retrieve(owned[0]);archived=Boolean(session.archived_at);if(!archived)throw Error('Real WebSocket session archive unconfirmed');
 console.log(`Real WebSocket turn: completed · Managed chunks observed · highest sequence ${lastSeq}`);
 console.log(`Duplicate command retained run true · replayed frames ${replay.length} · provider session creates ${owned.length} · event-send requests ${eventRequests}`);
 console.log('The actual Lab 66 host router streamed the real turn. Reconnection and replay did not send another model prompt.');
 console.log('Archived: yes · independently retrieved provider state');
}catch(error){console.error(`Live demonstration failed: ${String(error)}`);process.exitCode=1;}
finally{
 socket?.terminate();await host.close();await new Promise<void>(resolve=>server.close(()=>resolve()));
 for(const id of owned)if(!archived){try{const s=await client.beta.sessions.retrieve(id);if(s.archived_at){archived=true;break;}await client.beta.sessions.events.send(id,{events:[{type:'user.interrupt'}]},{timeout:10000});await client.beta.sessions.archive(id,{}, {timeout:15000});archived=Boolean((await client.beta.sessions.retrieve(id)).archived_at);}catch{process.exitCode=1;}}
 globalThis.fetch=originalFetch;
 await writeFile('presentations/managed-agents-lab66-walkthrough/terminal/websocket-diagnostic.json',JSON.stringify({source:'actual-lab66-router-live-port-and-observed-provider-metadata',createdSessions:owned.length,eventSendRequests:eventRequests,archiveConfirmed:archived,frames},null,2));
}
