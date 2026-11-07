import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnswerMarkdown} from './AnswerMarkdown.jsx';
import {DisplayControls} from './DisplayControls.jsx';
import {answerPreview} from './answer-preview.mjs';
import {recommendedEvents} from '../run-options.mjs';
import './style.css';
import './answer.css';
import './roadmap.css';
import './appearance.css';

function App(){
 const [catalog,setCatalog]=useState(null),[health,setHealth]=useState(null),[caseId,setCaseId]=useState('first-query');
 const [variant,setVariant]=useState('guided'),[runMode,setRunMode]=useState('prepared'),[depth,setDepth]=useState('guided');
 const [eventLimit,setEventLimit]=useState(100),[maxBudgetUsd,setMaxBudgetUsd]=useState(0.05),[specialistReview,setSpecialistReview]=useState(false);
 const [mcpMode,setMcpMode]=useState('none'),[customMcpName,setCustomMcpName]=useState(''),[customMcpUrl,setCustomMcpUrl]=useState(''),[customMcpTools,setCustomMcpTools]=useState('');
 const [question,setQuestion]=useState(''),[consent,setConsent]=useState(false),[mcpConsent,setMcpConsent]=useState(false);
 const [runs,setRuns]=useState([]),[selected,setSelected]=useState(null),[compareId,setCompareId]=useState(''),[checks,setChecks]=useState({}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [triedCaseIds,setTriedCaseIds]=useState(()=>new Set());
 useEffect(()=>{setConsent(false);setMcpConsent(false);},[caseId,variant,runMode,depth,eventLimit,maxBudgetUsd,specialistReview,mcpMode,customMcpName,customMcpUrl,customMcpTools,question]);
 const caseListRef=useRef(null);
 const current=useMemo(()=>catalog?.cases.find(row=>row.id===caseId),[catalog,caseId]);
 const caseIndex=catalog?.cases.findIndex(row=>row.id===caseId)??-1;
 const currentSection=catalog?.sections.find(row=>row.id===current?.section);
 const compare=runs.find(row=>row.id===compareId);
 const triedCases=catalog?.cases.filter(item=>triedCaseIds.has(item.id)).length??0;
 const liveRuns=runs.filter(row=>row.runMode==='live').length;
 const suggestedEvents=recommendedEvents(mcpMode,specialistReview);
 const turnLimited=selected?.subtype==='host_event_limit';
 const budgetLimited=selected?.subtype==='budget_reached';
 const failedRun=selected?.runMode==='live'&&selected?.isError&&!turnLimited&&!budgetLimited;
 const nextTurnChoice=turnLimited?[100,250,500,750,1000].find(value=>value>selected.eventLimit):undefined;
 useEffect(()=>{
  Promise.all([fetch('/api/cases'),fetch('/api/health'),fetch('/api/runs')]).then(async responses=>{
   if(responses.some(response=>!response.ok))throw Error('The evaluation server is unavailable.');
   return Promise.all(responses.map(response=>response.json()));
  }).then(async([data,status,history])=>{
   const recent=history.runs.reverse();
   const lastCase=data.cases.find(item=>item.id===recent[0]?.caseId)??data.cases[0];
   setCatalog(data);setHealth(status);setRuns(recent);setTriedCaseIds(new Set(history.triedCaseIds??recent.map(row=>row.caseId)));setCaseId(lastCase?.id??'first-query');setQuestion(lastCase?.question??'');
   if(recent[0]){const response=await fetch(`/api/runs/${recent[0].id}`);if(response.ok)setSelected(await response.json());}
  }).catch(e=>setError(e.message));
 },[]);
 useEffect(()=>{
  const list=caseListRef.current,active=list?.querySelector('.case-button.active');
  if(!list||!active)return;
  const top=active.getBoundingClientRect().top-list.getBoundingClientRect().top+list.scrollTop;
  if(top<list.scrollTop)list.scrollTop=top;
  else if(top+active.offsetHeight>list.scrollTop+list.clientHeight)list.scrollTop=top+active.offsetHeight-list.clientHeight;
 },[caseId,catalog]);
 function selectCase(item){setCaseId(item.id);setQuestion(item.question);setSelected(null);setChecks({});}
 function selectSection(id){const first=catalog.cases.find(item=>item.section===id);if(first)selectCase(first);}
 async function run(){
  setError('');setBusy(true);
  try{
   const payload={caseId,variant,runMode,depth,eventLimit,maxBudgetUsd,mcpMode,customMcpName,customMcpUrl,customMcpTools,question,specialistReview,consent,mcpConsent};
   const response=await fetch('/api/runs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
   const data=await response.json();
   if(!response.ok)throw Error(data.message??'Run failed.');
   setSelected(data);setRuns(rows=>[{...data,answerPreview:answerPreview(data.answer)},...rows].slice(0,40));setTriedCaseIds(previous=>new Set([...previous,data.caseId]));setConsent(false);setMcpConsent(false);setChecks({});
  }catch(e){setError(e.message);}finally{setBusy(false);setConsent(false);setMcpConsent(false);}
 }
 async function inspect(id){setError('');try{const response=await fetch(`/api/runs/${id}`);const data=await response.json();if(!response.ok)throw Error(data.message);const item=catalog?.cases.find(row=>row.id===data.caseId);if(item){setCaseId(item.id);setQuestion(item.question);}setSelected(data);setChecks({});}catch(e){setError(e.message);}}
 const sourceAdvice=current?.resource==='docs'?'Recommended: official Claude documentation MCP for current Managed API details. Enable it only for a live run.':current?.resource==='project'?'Recommended: a trusted project-specific HTTPS MCP server with only the exact read tools this case needs. Inspect the returned evidence.':'Recommended: no external server for this self-contained case. Connect a trusted source only when the question requires external evidence.';
 return <div className="app-shell">
  <header className="topbar"><div className="brand"><img className="milestone-brand-icon" src="/claude-icon.svg" alt="" width="40" height="40"/><div><strong>Agent Evaluation Studio</strong><small>Claude Managed Agents milestone project</small></div></div><div className="topbar-actions"><DisplayControls/><span className="mode-badge">{health?.mode==='reference'?'Reference preview':'Learner workspace'}</span></div></header>
  <main>
   <section className="intro"><div><span className="eyebrow">From first query to professional practice</span><h1>Learn, test, and improve your agent.</h1><p>Follow {catalog?.cases.length??0} focused cases across {catalog?.sections.length??0} learning sections, including structured outputs, sessions, testing, and hosting. Start with prepared examples, then inspect live Managed Agents evidence with explicit consent.</p></div><div className="intro-dashboard" aria-label="Learning roadmap overview"><div className="intro-metric"><strong>{catalog?.cases.length??0}</strong><span>guided cases</span></div><div className="intro-metric"><strong>{catalog?.sections.length??0}</strong><span>learning sections</span></div><div className="intro-metric"><strong>{triedCases}<small> / {catalog?.cases.length??0}</small></strong><span>cases tried</span></div><div className="intro-metric"><strong>{runs.length}</strong><span>recent runs</span></div><p>{liveRuns} live · {runs.length-liveRuns} prepared. The last 40 runs are shown; progress resets when this server restarts. Trying a case does not mark it mastered.</p></div></section>
   {error&&<div className="error" role="alert">{error}</div>}
   {turnLimited&&<div className="limit-notice" role="status"><strong>This live run stopped at its {selected.eventLimit}-event host limit.</strong><p>The answer below may be partial. Review its timeline and reported cost; a new live run needs fresh authorization.</p>{nextTurnChoice?<button type="button" onClick={()=>{setEventLimit(nextTurnChoice);setConsent(false);setMcpConsent(false);}}>Set {nextTurnChoice} events for a new run</button>:<p>Split the question into a smaller case before trying again.</p>}</div>}
   {budgetLimited&&<div className="limit-notice" role="status"><strong>This live run stopped at its budget ceiling.</strong><p>Review any partial answer and the reported cost. A new paid run needs fresh authorization; consider a smaller question first.</p></div>}
   {failedRun&&<div className="limit-notice failure" role="status"><strong>This live run did not complete.</strong><p>Inspect the result subtype and timeline below. Any displayed answer is partial evidence.</p></div>}
   <div className="workspace">
    <section className="panel case-panel" data-section={current?.section} aria-labelledby="cases-title">
     <div className="panel-heading"><span className="step">01</span><div><h2 id="cases-title">Choose a case</h2><p>Follow the roadmap from beginner to professional.</p></div></div>
     <p className="learning-cycle"><strong>For each case</strong> Read the concept → Try prepared → Inspect evidence → Check the criteria. A live comparison is optional.</p>
     <nav className="section-nav" aria-label="Learning roadmap">{catalog?.sections.map(section=><button type="button" key={section.id} className={current?.section===section.id?'active':''} aria-current={current?.section===section.id?'step':undefined} onClick={()=>selectSection(section.id)}><strong>{section.title}</strong><small>{section.level} · {catalog.cases.filter(item=>item.section===section.id&&triedCaseIds.has(item.id)).length} of {catalog.cases.filter(item=>item.section===section.id).length} tried</small></button>)}</nav>
     {currentSection&&<div className="section-summary"><strong>{currentSection.title}</strong><p>{currentSection.description}</p><span>{catalog.cases.filter(item=>item.section===currentSection.id).length} cases</span><a href={currentSection.guide} target="_blank" rel="noopener noreferrer">Read the official Managed Agents guide <span aria-hidden="true">↗</span></a></div>}
     <div className="case-list" ref={caseListRef}>{catalog?.cases.filter(item=>item.section===current?.section).map(item=><button type="button" className={'case-button'+(caseId===item.id?' active':'')} aria-pressed={caseId===item.id} key={item.id} onClick={()=>selectCase(item)}><span>CASE {String(item.number).padStart(2,'0')} · {item.category}</span><strong>{item.title}</strong><small>{item.question}</small></button>)}</div>
     <div className="case-stepper" aria-label="Case sequence"><strong>Case {current?.number??0} of {catalog?.cases.length??0}</strong><div><button type="button" disabled={caseIndex<=0} onClick={()=>selectCase(catalog.cases[caseIndex-1])}>← Previous case</button><button type="button" disabled={!catalog||caseIndex<0||caseIndex>=catalog.cases.length-1} onClick={()=>selectCase(catalog.cases[caseIndex+1])}>Next case →</button></div></div>
    </section>
    <section className="panel setup-panel" aria-labelledby="setup-title">
     <div className="panel-heading"><span className="step">02</span><div><h2 id="setup-title">Configure the run</h2><p>Change one variable at a time to evaluate its effect.</p></div></div>
     <label htmlFor="variant">System instruction</label><select id="variant" value={variant} onChange={event=>setVariant(event.target.value)}><option value="baseline">Baseline · brief answer</option><option value="guided">Guided · evidence-aware answer</option></select>
     <div className="instruction"><span>Instruction preview</span><p>{catalog?.variants[variant]}</p></div>
     <label htmlFor="question">Your question</label><textarea id="question" maxLength={2000} value={question} onChange={event=>setQuestion(event.target.value)} rows={3}/><p className="field-note">Live mode uses your edited question. Prepared mode shows the authored case answer.</p>
     <div className="option-row"><div><label htmlFor="depth">Answer depth</label><select id="depth" value={depth} onChange={event=>setDepth(event.target.value)}><option value="brief">Brief</option><option value="guided">Guided</option><option value="worked">Worked example</option></select></div><div><label htmlFor="turn-limit">Host event limit</label><select id="turn-limit" value={eventLimit} onChange={event=>setEventLimit(Number(event.target.value))}>{[100,250,500,750,1000].map(value=><option key={value} value={value}>{value} events</option>)}</select></div></div><p className="field-note">Recommended for this setup: {suggestedEvents} events. MCP retrieval and specialist review need room for tool calls and a final answer.</p>
     <label htmlFor="budget-limit">Managed session list-cost limit</label><select id="budget-limit" value={maxBudgetUsd} onChange={event=>setMaxBudgetUsd(Number(event.target.value))}><option value={0.05} disabled={specialistReview}>$0.05</option><option value={0.15}>$0.15</option><option value={0.3}>$0.30</option><option value={0.5}>$0.50</option></select><p className="field-note">Managed Agents enforces this session list-cost ceiling. An optional review splits this amount across two independent sessions.</p>
     <label className="specialist-check"><input type="checkbox" checked={specialistReview} onChange={event=>{const enabled=event.target.checked;setSpecialistReview(enabled);if(enabled){setEventLimit(value=>Math.max(value,recommendedEvents(mcpMode,true)));setMaxBudgetUsd(value=>Math.max(value,0.15));}}}/> Ask a independent reviewer session to review the live answer</label><p className="field-note">The reviewer has no tools. It can critique the answer but cannot independently verify an external source. It may add cost and uses its own Managed session.</p>
     <div className="source-box"><h3>External knowledge and MCP</h3><p className="resource-advice">{sourceAdvice}</p><label htmlFor="mcp-mode">Source for a live run</label><select id="mcp-mode" value={mcpMode} onChange={event=>{const next=event.target.value;setMcpMode(next);setEventLimit(value=>Math.max(value,recommendedEvents(next,specialistReview)));setMcpConsent(false);}}><option value="none">No external source</option><option value="docs">Official Claude documentation MCP</option><option value="custom">Trusted custom HTTPS MCP server</option></select>
      {mcpMode==='custom'&&<div className="custom-mcp"><label htmlFor="mcp-name">Server name</label><input id="mcp-name" value={customMcpName} onChange={event=>setCustomMcpName(event.target.value)} placeholder="project_docs"/><label htmlFor="mcp-url">HTTPS MCP endpoint</label><input id="mcp-url" type="url" value={customMcpUrl} onChange={event=>setCustomMcpUrl(event.target.value)} placeholder="https://your-server.example/mcp"/><label htmlFor="mcp-tools">Exact tool names, comma separated</label><input id="mcp-tools" value={customMcpTools} onChange={event=>setCustomMcpTools(event.target.value)} placeholder="search, read_page"/><p className="field-note">Use a server you trust. Only the named tools are auto-approved; do not put credentials in the URL.</p></div>}
      <p className="field-note">A configured source may improve a grounded answer, but the timeline must show an actual tool call before you claim it was used. Choose a specialist only when an independent critique is useful.</p>
     </div>
     <label htmlFor="run-mode">Run mode</label><select id="run-mode" value={runMode} onChange={event=>{setRunMode(event.target.value);setConsent(false);setMcpConsent(false);}}><option value="prepared">Prepared · no model or MCP call</option><option value="live">Live Managed Agents · paid call</option></select>
     {runMode==='live'&&<div className="consent-box"><p>{health?.liveAvailable?'A live Managed Agents run can incur a charge. Review the host event and session budget limits above.':'Live mode needs server credentials, agent/environment IDs and MANAGED_LIVE_ENABLED=true. Prepared mode is available now.'}</p><label className="check"><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)}/>I authorize this paid Managed run</label>{mcpMode!=='none'&&<label className="check"><input type="checkbox" checked={mcpConsent} onChange={event=>setMcpConsent(event.target.checked)}/>I authorize this run to connect to the selected external MCP server</label>}</div>}
     <button className="run-button" disabled={busy||!catalog||(runMode==='live'&&(!consent||!health?.liveAvailable||(mcpMode!=='none'&&!mcpConsent)))} onClick={run}>{busy?'Running…':runMode==='live'?'Run live case':'Run prepared case'} <span aria-hidden="true">→</span></button>
    </section>
    <section className="panel question-panel" aria-labelledby="question-title"><div className="panel-heading"><span className="step">03</span><div><h2 id="question-title">Review the case</h2><p>Know what good evidence looks like.</p></div></div>{current&&<><div className="question-box"><span>Question</span><p>{current.question}</p></div><p className="context">{current.context}</p><h3>Review criteria</h3><ul className="criteria">{current.criteria.map(text=><li key={text}><span aria-hidden="true">✓</span>{text}</li>)}</ul><p className="muted">Review each criterion yourself. A prepared result is teaching material, not a live model result.</p></>}</section>
   </div>
   <div className="results"><section className="panel result-panel"><div className="section-heading"><div><span className="eyebrow">Evidence</span><h2>Run inspector</h2></div>{selected&&<span className="result-type">{selected.runMode==='prepared'?'Prepared fixture':'Live Managed Agents'}</span>}</div>{selected?<><div className="result-meta"><span>{selected.caseTitle}</span><span>{selected.variant} instructions</span><span>{selected.durationMs} ms</span><span>{selected.modelCalls ?? "Unknown"} model requests</span></div><div className="source-evidence"><strong>Source:</strong> {selected.sourceLabel??'Not recorded'}{selected.runMode==='live'&&<> · <strong>MCP tool calls:</strong> {selected.mcpToolCalls??0} · <strong>Specialist calls:</strong> {selected.specialistCalls??0}</>}</div><div className="answer"><h3>Agent answer</h3><AnswerMarkdown text={selected.answer}/></div><div className="review"><h3>Your review</h3><p>Mark only the criteria supported by the answer or run events.</p>{(catalog?.cases.find(item=>item.id===selected.caseId)?.criteria??[]).map((criterion,index)=><label className="review-check" key={criterion}><input type="checkbox" checked={!!checks[index]} onChange={event=>setChecks(previous=>({...previous,[index]:event.target.checked}))}/>{criterion}</label>)}<strong>{Object.values(checks).filter(Boolean).length} of {(catalog?.cases.find(item=>item.id===selected.caseId)?.criteria??[]).length} criteria checked</strong></div><div className="timeline"><h3>Run timeline</h3><ol>{selected.events.map((event,index)=><li key={index}><span className="event-dot"/><div><strong>{event.label}</strong><p>{event.detail}</p></div></li>)}</ol><p className="result-subtype">Result: {selected.subtype}{selected.costUsd!==null&&selected.costUsd!==undefined?` · Cost $${Number(selected.costUsd).toFixed(4)}`:''}</p></div></>:<div className="empty"><span>◌</span><h3>No run selected yet</h3><p>Run a prepared case to inspect its answer, review criteria, and timeline.</p></div>}</section>
    <section className="panel history-panel"><div className="section-heading"><div><span className="eyebrow">Compare</span><h2>Run history</h2></div></div><p>Run another instruction variant for the same case, then inspect or compare.</p>{runs.length?<div className="history-list">{runs.map(row=><button key={row.id} onClick={()=>void inspect(row.id)} className={'history-item'+(selected?.id===row.id?' active':'')}><strong>{row.caseTitle}</strong><span>{row.variant} · {row.runMode}</span><small>{answerPreview(row.answerPreview)}</small></button>)}</div>:<p className="muted">Your runs will appear here.</p>}{selected&&runs.length>1&&<div className="compare"><label htmlFor="compare-run">Compare answer with</label><select id="compare-run" value={compareId} onChange={event=>setCompareId(event.target.value)}><option value="">Choose another run</option>{runs.filter(row=>row.id!==selected.id).map(row=><option value={row.id} key={row.id}>{row.caseTitle} · {row.variant} · {row.runMode}</option>)}</select>{compare&&<div className="compare-answer"><strong>{compare.variant} answer</strong><p>{answerPreview(compare.answerPreview)}</p></div>}</div>}</section>
   </div>
  </main><footer>Agent Evaluation Studio · Built with the Claude Managed Agents · Review evidence before claiming success.</footer>
 </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
