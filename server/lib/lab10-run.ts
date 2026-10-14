import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { lab10ReportSchema, lab10SnapshotSchema } from '../../shared/lab10-structured-interrupt.js';
import type { Lab10ParsedRequest, Lab10Snapshot, Lab10Turn } from '../../shared/lab10-structured-interrupt.js';
import type { Lab01Session } from '../../shared/lab01-events.js';
import type { Lab10Port } from './lab10-port.js';
import { raceAbort } from './lab01-run.js';
import { createEventConsumer } from './session-events.js';

export class Lab10Error extends Error { constructor(public readonly status:number, message:string){super(message);} }
type Emit = (frame:unknown)=>void;
type Job = { turn:Lab10Turn; controller:AbortController; work:Promise<void> };
export interface Lab10Entry { runId:string; owner:string; mode:'scripted'|'live'; port:Lab10Port; session:Lab01Session;
  state:Lab10Snapshot['state']; turns:Lab10Turn[]; jobs:Set<Job>; tail:Promise<void>; control:Promise<Lab10Snapshot>|null;
  interruption:Lab10Snapshot['interruption']; cleanup:Lab10Snapshot['cleanup']; closing:boolean; expiresAt:number; message:string }

export function validateLab10Text(text:string) {
  let raw:unknown; try {raw=JSON.parse(text);} catch {return {report:null,errors:['The final message must be one valid JSON object.']};}
  const result=lab10ReportSchema.safeParse(raw);
  return result.success ? {report:result.data,errors:[]} : {report:null,errors:result.error.issues.slice(0,20).map((issue)=>`${issue.path.join('.') || 'report'}: ${issue.message}`.slice(0,300))};
}

export class Lab10Runs {
  readonly entries=new Map<string,Lab10Entry>();
  private creating=0; private closed=false;
  private readonly creations=new Set<Promise<void>>();
  constructor(private readonly capacity=2, private readonly pollMs=50, private readonly now=()=>Date.now()){}
  async create(owner:string,input:Lab10ParsedRequest,port:Lab10Port) {
    if(this.closed || this.creating + [...this.entries.values()].filter((e)=>e.state !== 'closed').length >= this.capacity) throw new Lab10Error(429,'Close an existing run before starting another.');
    this.creating++;
    let created!:()=>void;const creation=new Promise<void>((resolve)=>{created=resolve;});this.creations.add(creation);
    try {const session=await port.create();
      if(session.toolCount || session.mcpServerCount) {await port.archive(session.id).catch(()=>{}); throw new Lab10Error(422,'The lesson requires cleared tools, MCP servers, skills and orchestration.');}
      const entry:Lab10Entry={runId:randomUUID(),owner,mode:input.mode,port,session,state:'idle',turns:[],jobs:new Set(),tail:Promise.resolve(),control:null,
        interruption:'not-needed',cleanup:'not-needed',closing:false,expiresAt:this.now()+15*60_000,message:'Fresh text-only session created.'};
      // Keep a bounded set of closed checkpoints; never evict a live session without cleanup.
      for(const [id,item] of this.entries) if(this.entries.size >= 20 && item.state === 'closed') this.entries.delete(id);
      this.entries.set(entry.runId,entry); return entry;
    } finally {this.creating--;created();this.creations.delete(creation);}
  }
  read(id:string,owner:string) {const entry=this.entries.get(id); if(!entry) throw new Lab10Error(404,'Unknown run ID.'); if(entry.owner !== owner) throw new Lab10Error(403,'This run belongs to another exercise owner.');
    if(entry.expiresAt <= this.now() && entry.state !== 'closed') {void this.stop(entry,true); throw new Lab10Error(409,'Run expired; cleanup was requested.');} entry.expiresAt=this.now()+15*60_000; return entry;}
  snapshot(e:Lab10Entry):Lab10Snapshot {return lab10SnapshotSchema.parse({runId:e.runId,mode:e.mode,source:e.port.source,session:e.session,state:e.state,
    turns:e.turns,queueDepth:[...e.jobs].filter((job)=>job.turn.state === 'queued').length,interruption:e.interruption,cleanup:e.cleanup,
    effectiveCapabilities:{tools:0,mcpServers:0,skills:0,multiagent:false},message:e.message});}
  enqueue(e:Lab10Entry,input:Lab10ParsedRequest,signal:AbortSignal,emit:Emit) {
    if(this.closed || e.closing || e.control || e.state === 'closed' || e.state === 'cleanup-pending') throw new Lab10Error(409,'This run is stopping, closed or awaiting remote cleanup.');
    if(input.mode !== e.mode) throw new Lab10Error(400,'Use the mode recorded for this run.');
    if(e.jobs.size >= 3) throw new Lab10Error(429,'Per-session send queue is full (one active turn plus two queued).');
    if(e.turns.length >= 20) throw new Lab10Error(409,'Turn history limit reached. Close this run.');
    const turn:Lab10Turn={turnId:randomUUID(),state:'queued',outcome:'pending',attempts:0,report:null,errors:[],text:'',reportedUsage:null}; const controller=new AbortController();
    const job:Job={turn,controller,work:Promise.resolve()}; e.turns.push(turn); e.jobs.add(job);
    let seq=0; const frame=(value:object)=>emit({...value,seq:++seq}); frame({kind:'run',runId:e.runId,turnId:turn.turnId,sessionId:e.session.id});
    const abort=()=>{controller.abort('aborted'); void this.stop(e,true);}; signal.addEventListener('abort',abort,{once:true}); if(signal.aborted) abort();
    const previous=e.tail;
    job.work=(async()=>{try {await previous; if(controller.signal.aborted || e.closing) {turn.state=controller.signal.reason === 'interrupt' ? 'interrupted' : 'aborted';turn.outcome=turn.state;return;}
      e.state='running'; turn.state='running'; e.port.prepare?.(input); const timer=setTimeout(()=>controller.abort('deadline'),input.deadlineSeconds*1000);
      const usage={scope:'model-request spans from this stream' as const,requests:0,inputTokens:0,outputTokens:0,cacheCreationTokens:0,cacheReadTokens:0}; const usageSeen=new Set<string>();
      try {for(let attempt=1;attempt<=2;attempt++) {turn.attempts=attempt; const consumer=createEventConsumer();
        const events=await raceAbort(e.port.open(e.session.id,controller.signal),controller.signal);
        const prompt=attempt === 1 ? input.prompt : 'Your report failed application schema validation. Return one corrected JSON object with project, summary, risks and nonempty nextSteps; no extra properties. This is the only corrective round.';
        await raceAbort(e.port.send(e.session.id,prompt,controller.signal),controller.signal); const iterator=events[Symbol.asyncIterator]();
        try {for(;;) {const next=await raceAbort(iterator.next(),controller.signal); if(next.done) break;
          const event=next.value; if(e.port.source === 'managed-api' && event.type === 'span.model_request_end' && !usageSeen.has(event.id)) {usageSeen.add(event.id);usage.requests++;usage.inputTokens+=event.model_usage.input_tokens;usage.outputTokens+=event.model_usage.output_tokens;usage.cacheCreationTokens+=event.model_usage.cache_creation_input_tokens;usage.cacheReadTokens+=event.model_usage.cache_read_input_tokens;}
          const pushed=consumer.push(event); for(const item of pushed.frames) frame(item); if(pushed.done) break;
        }} finally {if(iterator.return) await raceAbort(iterator.return(),controller.signal).catch(()=>{});}
        const outcome=consumer.finish(); const messages=consumer.snapshot().messages;
        turn.text=(messages.at(-1)?.text ?? '').slice(0,16000);
        if(outcome.kind !== 'completed') {turn.state='failed';turn.outcome=outcome.kind === 'incomplete' ? 'incomplete' : 'error';turn.errors=['The turn did not reach a confirmed end_turn.']; break;}
        const validated=validateLab10Text(turn.text); turn.errors=validated.errors; frame({kind:'validation',attempt,valid:!!validated.report,errors:validated.errors});
        if(validated.report) {turn.report=validated.report;turn.state='completed';turn.outcome='verified';break;}
        if(!input.correctiveRound || attempt === 2) {turn.state='failed';turn.outcome=attempt === 2 ? 'exhausted' : 'invalid';break;}
      }} catch {const reason=controller.signal.reason; turn.report=null;turn.state=reason === 'interrupt' ? 'interrupted' : reason === 'deadline' ? 'deadline' : controller.signal.aborted ? 'aborted' : 'failed';
        turn.outcome=turn.state === 'failed' ? 'error' : turn.state as 'interrupted'|'deadline'|'aborted';turn.errors=['The turn stopped before a verified report was accepted.'];
      } finally {clearTimeout(timer);turn.reportedUsage=usage.requests ? usage : null;}
      if(controller.signal.reason === 'deadline') await this.stop(e,true);
      else if(!e.closing && !e.control && (e.state as Lab10Snapshot['state']) !== 'cleanup-pending') {
        const status=await e.port.status(e.session.id).catch(()=>'unknown'); if(status === 'idle') e.state='idle'; else await this.stop(e,true);
      }
    } finally {signal.removeEventListener('abort',abort);e.jobs.delete(job);e.message=`Turn ${turn.turnId}: ${turn.outcome}. Report verification is application schema validation.`;}})();
    e.tail=job.work.catch(()=>{}); return {turnId:turn.turnId,work:job.work};
  }
  async stop(e:Lab10Entry,archive:boolean):Promise<Lab10Snapshot> {
    if(e.state === 'closed') return this.snapshot(e);
    if(e.control) {const current=await e.control; return archive && current.state !== 'closed' ? this.stop(e,true) : current;}
    if(archive) e.closing=true; e.state='stopping';
    for(const job of e.jobs) {job.controller.abort(archive ? 'aborted' : 'interrupt'); if(job.turn.state === 'queued') {job.turn.state=archive ? 'aborted' : 'interrupted';job.turn.outcome=archive ? 'aborted' : 'interrupted';}}
    const work=(async()=>{let status=await e.port.status(e.session.id).catch(()=>'unknown');
      if(status !== 'idle') {try {await e.port.interrupt(e.session.id);e.interruption='acknowledged';}catch{e.interruption='unconfirmed';}
        for(let i=0;i<5;i++) {status=await e.port.status(e.session.id).catch(()=>'unknown'); if(status === 'idle') break; await delay(this.pollMs);}}
      if(status !== 'idle') {e.interruption='unconfirmed';e.cleanup=archive ? 'pending' : 'not-needed';e.state='cleanup-pending';e.message='Interrupt acknowledgment did not confirm idle. Remote stop is unconfirmed.';return this.snapshot(e);}
      e.interruption='idle-confirmed';
      if(archive) {try{await e.port.archive(e.session.id);e.state='closed';e.cleanup=e.port.source === 'authored-fixture' ? 'simulated' : 'archived';e.message='Idle was confirmed and the session was archived. Future sends are rejected.';}catch{e.state='cleanup-pending';e.cleanup='pending';e.message='Idle confirmed; archive is pending.';}}
      else {e.state='idle';e.message='Idle confirmed after interrupt. The session is retained for another turn.';}
      return this.snapshot(e);
    })(); e.control=work; try{return await work;}finally{e.control=null;}
  }
  async end(e:Lab10Entry){if(e.state === 'closed') return this.snapshot(e); if(e.jobs.size || e.control || await e.port.status(e.session.id).catch(()=>'unknown') !== 'idle') throw new Lab10Error(409,'Close requires confirmed idle with no pending sends. Interrupt first.');return this.stop(e,true);}
  async sweep(){await Promise.allSettled([...this.entries.values()].filter((e)=>e.expiresAt <= this.now() && e.state !== 'closed').map((e)=>this.stop(e,true)));}
  async close(){this.closed=true;await Promise.allSettled([...this.creations]);await Promise.allSettled([...this.entries.values()].filter((e)=>e.state !== 'closed').map((e)=>this.stop(e,true)));await Promise.allSettled([...this.entries.values()].map((e)=>e.tail));}
}
