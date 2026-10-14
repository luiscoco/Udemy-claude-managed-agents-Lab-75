import { useEffect, useRef, useState } from 'react';
import { lab10FrameSchema, lab10JsonSchema, lab10Prompt, lab10SchemasSchema, lab10Scenarios, lab10SnapshotSchema } from '../../shared/lab10-structured-interrupt';
import type { Lab10Snapshot } from '../../shared/lab10-structured-interrupt';
import { request } from '../lib/api';
import { streamPost } from '../lib/sse';
import { redact } from '../lib/presentation';
import { LiveActionButton } from '../components/LiveActionButton';
import { CodeBlock } from '../components/CodeBlock';

export default function Concept10StructuredInterrupt(){
  const [prompt,setPrompt]=useState(lab10Prompt); const [scenario,setScenario]=useState<typeof lab10Scenarios[number]>('valid');
  const [correctiveRound,setCorrectiveRound]=useState(true);const [snapshot,setSnapshot]=useState<Lab10Snapshot>();const [pending,setPending]=useState(false);
  const [status,setStatus]=useState('Ready. Reports pass only after application schema validation.');const [schema,setSchema]=useState(JSON.stringify(lab10JsonSchema,null,2));const [liveReady,setLiveReady]=useState(false);
  const controller=useRef<AbortController|null>(null);const runId=useRef('');const owner=useRef(crypto.randomUUID());
  const headers={'X-Lab-Owner':owner.current};
  useEffect(()=>{void request('/api/c10/schemas',lab10SchemasSchema).then((value)=>setSchema(JSON.stringify(value.report,null,2))).catch(()=>{});
    void fetch('/api/managed/setup').then((r)=>r.json()).then((v:{liveReady?:boolean})=>setLiveReady(v.liveReady === true)).catch(()=>{});
    return()=>controller.current?.abort();},[]);
  async function refresh(){if(!runId.current)return;try{const value=await request(`/api/c10/run?runId=${runId.current}`,lab10SnapshotSchema,{headers});setSnapshot(value);setStatus(value.message);}catch(error){setStatus(error instanceof Error ? error.message : 'Inspection failed.');}}
  async function run(mode:'scripted'|'live',send=false){if(pending)return;const abort=new AbortController();controller.current=abort;setPending(true);
    try{const result=await streamPost(`/api/c10/${send ? 'send' : 'structured'}`,{mode,prompt,scenario:mode === 'live' ? 'valid' : scenario,correctiveRound,deadlineSeconds:30,budgetCents:50,...(send ? {runId:runId.current} : {})},
      {headers,signal:abort.signal,idleMs:25_000,deadlineMs:110_000,resultSchema:lab10SnapshotSchema,onEvent:(type,data)=>{if(type === 'progress'){const frame=lab10FrameSchema.parse(data);if(frame.kind === 'run'){runId.current=frame.runId;setStatus(`Turn started in ${frame.sessionId}.`);}if(frame.kind === 'validation')setStatus(`Application schema validation: attempt ${frame.attempt} ${frame.valid ? 'verified' : 'invalid'}.`);}}});
      if(result.kind === 'success'){setSnapshot(result.result);setStatus(result.result.message);}else{setStatus('Local waiting aborted. Inspect the run to see remote cleanup.');await refresh();}
    }catch(error){setStatus(error instanceof Error ? error.message : 'Run failed.');}finally{controller.current=null;setPending(false);}}
  async function control(action:'interrupt'|'abort'|'end'){if(!runId.current)return;try{const value=await request(`/api/c10/${action}`,lab10SnapshotSchema,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({runId:runId.current})});setSnapshot(value);setStatus(value.message);}catch(error){setStatus(error instanceof Error ? error.message : 'Control failed.');}}
  const closed=snapshot?.state === 'closed'; const turns=snapshot?.turns ?? [];
  return <section aria-labelledby="c10-heading"><h2 id="c10-heading">Validate reports and control a retained session</h2>
    <p>Reports are final JSON text checked by a closed application schema. One corrective round is allowed. Interrupt retains a confirmed-idle session; abort initiates cleanup; Close archives an idle session.</p>
    <details><summary>Closed report JSON Schema</summary><CodeBlock label="Application report schema" code={schema} lineNumbers={false}/></details>
    <fieldset disabled={pending}><legend>Report experiment</legend><label htmlFor="c10-prompt">User question</label><textarea id="c10-prompt" rows={3} value={prompt} maxLength={1000} onChange={(e)=>setPrompt(e.target.value)}/>
      <label htmlFor="c10-scenario">Offline scenario</label><select id="c10-scenario" value={scenario} onChange={(e)=>setScenario(e.target.value as typeof scenario)}>{lab10Scenarios.map((value)=><option key={value}>{value}</option>)}</select>
      <label><input type="checkbox" checked={correctiveRound} onChange={(e)=>setCorrectiveRound(e.target.checked)}/>Allow one corrective round</label></fieldset>
    <div className="lab-controls"><button disabled={pending || (!!snapshot && !closed)} onClick={()=>void run('scripted')}>Start offline report</button>
      <button disabled={pending || !snapshot || snapshot.state !== 'idle'} onClick={()=>void run(snapshot!.mode,true)}>Send another turn</button>
      <button disabled={!runId.current || closed} onClick={()=>void control('interrupt')}>Interrupt and retain session</button>
      <button disabled={!runId.current || closed} onClick={()=>void control('abort')}>Abort and clean up</button>
      <button disabled={!runId.current || pending || closed} onClick={()=>void control('end')}>Close idle session</button>
      {pending && <button onClick={()=>controller.current?.abort()}>Disconnect locally</button>}
      <button disabled={!runId.current} onClick={()=>void refresh()}>Inspect run state</button></div>
    <div className="lab-live"><LiveActionButton busy={pending || (!!snapshot && !closed)} available={liveReady} keyIsolated setup={liveReady ? 'Live base setup is ready. Start a billed text-only session.' : 'Live Managed setup is not ready.'} checkAvailability={async()=>liveReady} onRun={()=>void run('live')}/></div>
    <p role="status" aria-live="polite">{redact(status)}</p>
    {snapshot && <><p aria-label="Run evidence">Run: <code>{snapshot.runId}</code>. Session: <code>{snapshot.session.id}</code>. State: {snapshot.state}. Interruption: {snapshot.interruption}. Cleanup: {snapshot.cleanup}. Source: {snapshot.source}.</p>
      <table aria-label="Report verification"><thead><tr><th>Turn</th><th>State and outcome</th><th>Attempts</th><th>Validated report</th><th>Errors and usage</th></tr></thead><tbody>{turns.map((turn)=><tr key={turn.turnId}><td><code>{turn.turnId}</code></td><td>{turn.state}: {turn.outcome}</td><td>{turn.attempts}</td><td>{turn.report ? <pre>{JSON.stringify(turn.report,null,2)}</pre> : 'No verified report'}</td><td>{turn.errors.join('; ')}<br/>{turn.reportedUsage ? `${turn.reportedUsage.inputTokens} input / ${turn.reportedUsage.outputTokens} output tokens` : 'No measured usage'}</td></tr>)}</tbody></table>
      <p>Local cancellation does not prove a remote stop. An acknowledgment must be followed by idle confirmation before reuse or archive.</p></>}
  </section>;
}
