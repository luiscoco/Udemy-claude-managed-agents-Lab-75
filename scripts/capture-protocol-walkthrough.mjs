import {workshop} from './walkthrough-scenes.mjs';
const lab=Number(process.argv[2]);if(lab<66||lab>70)throw Error('Choose Lab 66 through 70');
const titles={66:'Real-time frontends over WebSocket',67:'A multi-tenant SaaS architecture',68:'Scheduled and event-driven agents',69:'Desktop and IDE host integration',70:'Python client for Managed Agents'};
const w=await workshop(lab),{page,evidence,sec,status,sp,scene,api,btn}=w;
if(lab===66){
 evidence.webSocketFrames=[];
 page.on('websocket',socket=>{
  if(!socket.url().includes('/api/c66/ws'))return;
  for(const [event,direction] of [['framesent','sent'],['framereceived','received']])socket.on(event,frame=>{try{const data=JSON.parse(String(frame.payload));if(direction==='sent'&&data.kind==='start'&&data.mode!=='offline')throw Error('Only offline WebSocket starts are permitted');evidence.webSocketFrames.push({direction,data});}catch(error){if(String(error).includes('Only offline'))throw error;}});
 });
}
try{
 await w.intro(titles[lab]);
 if(lab===66){
  await status.filter({hasText:'WebSocket connected.'}).waitFor();
  await btn('Start guided run').click();await status.filter({hasText:/^Run .* ready/}).waitFor();
  const first=evidence.webSocketFrames.find(f=>f.direction==='sent'&&f.data.kind==='start').data;
  await scene('ws-start','Create one guided host run',[['ws-start-status',status,'The WebSocket start command creates one host run. It has not sent a model prompt or made a provider call.'],['ws-mode',sp('Mode:'),'The visible mode is offline and replay is bounded to sixty-four events.']]);
  await sec.locator('input').fill('Three fictional Aurora Finches observed.');await btn('Send message').click();await status.filter({hasText:/^completed:/}).waitFor();
  await scene('ws-stream','Observe actual WebSocket frames',[['ws-frames',sec.locator('ol'),'The real socket carries sequenced authored chunks, a correlated local tool result and a terminal event. These are fixture words, not live model tokens.']]);
  await btn('Duplicate command').click();await status.filter({hasText:'Duplicate command acknowledged'}).waitFor();
  await scene('ws-duplicate','Acknowledge the same command again',[['ws-duplicate-status',status,'The same command identifier resolves to the existing run. Replayed sequence numbers are ignored by the frontend rather than displayed twice.']]);
  await btn('Disconnect').click();await status.filter({hasText:'Disconnected;'}).waitFor();await btn('Reconnect and replay').click();await status.filter({hasText:'Duplicate command acknowledged'}).waitFor();
  const starts=evidence.webSocketFrames.filter(f=>f.direction==='sent'&&f.data.kind==='start');if(starts.at(-1).data.commandId!==first.commandId||starts.at(-1).data.afterSeq<=0)throw Error('Reconnect did not retain start identity and sequence');
  await scene('ws-reconnect','Reconnect from the last acknowledged sequence',[['ws-reconnect-status',status,'Reconnection retains the original start command and asks for frames after the last acknowledged sequence. Disconnecting alone did not create or cancel another run.'],['ws-reconnect-mode',sp('Mode:'),'The frontend retains its sequence and existing buffered display while the host owns run lifetime.']]);
  await btn('Start guided run').click();await status.filter({hasText:/^Run .* ready/}).waitFor();await btn('Cancel').click();await status.filter({hasText:/^cancelled:/}).waitFor();
  await scene('ws-cancel','Cancel a guided run before sending',[['ws-cancel-status',status,'The host confirms cancellation before any message. This local fixture has no remote Managed session whose cleanup could be inferred.']]);
 }else if(lab===67){
  await api('Simulate both sign-ins','/auth');await status.filter({hasText:'Synthetic Alice/Acme'}).waitFor();
  await scene('tenant-auth','Two synthetic principals',[['tenant-auth-status',status,'The host maps synthetic Alice to Acme and Bob to Birch. Tokens stay in the application; this selector is not a production identity provider.']]);
  await sec.locator('select').selectOption('hold');await api('Run both tenants','/runs');await api('Try another Acme run','/runs',429);
  await scene('tenant-concurrency','Refuse an extra active tenant run',[['tenant-concurrency-status',status,'Both tenants can reserve illustrative units independently, while another active Acme run is refused by the host admission gate.']]);
  await btn('Probe Birch as Acme').click();await status.filter({hasText:'Cross-tenant probes completed'}).waitFor();const checks=await sec.locator(':scope > ul li').allInnerTexts();if(checks.length!==5||checks.some(text=>!text.includes('HTTP 404')))throw Error('Expected five cross-tenant refusals');
  await scene('tenant-cross','Five ownership refusals',[['tenant-cross-checks',sec.locator(':scope > ul'),'Acme cannot inspect Birch run, session, source or transcript, or cancel its work. All five probes receive the same not-found refusal.']]);
  await api('Cancel own Acme run','/cancel');await sec.locator('article').first().filter({hasText:'state: cancelled'}).waitFor();
  await scene('tenant-cancel','Cancel only the authenticated tenant run',[['tenant-cancel-quota',sec.locator('article').first(),'The owning principal can cancel its own run. The ledger releases the reservation independently of a usage charge.']]);
  await sec.locator('article').last().filter({hasText:'state: completed'}).waitFor({timeout:15000});
  for(const scenario of ['failure','normal']){
   await sec.locator('select').selectOption(scenario);await api('Run both tenants','/runs');const state=scenario==='failure'?'failed':'completed';
   for(const article of await sec.locator('article').all())await article.filter({hasText:`state: ${state}`}).waitFor();
   await scene(`tenant-${scenario}`,`Tenant ledger · ${scenario}`,[[`${scenario}-acme`,sec.locator('article').first(),'Inspect the authenticated tenant state and its reserved, released and charged illustrative units. These are authored accounting values, not measured provider billing.']]);
   await scene(`tenant-${scenario}-birch`,`Independent Birch ledger · ${scenario}`,[[`${scenario}-birch`,sec.locator('article').last(),'The other tenant retains its own project, run state and reservation ledger. Production identity and distributed durable storage remain separate requirements.']]);
  }
 }else if(lab===68){
  await api('Create 5-second schedule','/schedules');await api('Advance scheduling clock 60 seconds','/advance');const tick=await api('Tick and coalesce','/tick');
  if(tick.jobs.length!==1||tick.jobs[0].coalesced<12||tick.effects.length!==0)throw Error('Expected one coalesced admission without an effect');
  await scene('queue-coalesce','Coalesce missed schedule intervals',[['queue-coalesced',sec.locator('article').first(),'The explicit scheduling-clock advance admits one coalesced job for at least twelve missed intervals. A trigger is admission, not a worker execution or provider call.']]);
  for(const attempt of [1,2,3]){
   const result=await api('Run one failed worker','/worker');if(result.jobs[0].attempts!==attempt||result.jobs[0].state!==(attempt===3?'dead-letter':'retry'))throw Error('Unexpected bounded retry state');
   await scene(`queue-attempt-${attempt}`,`Failed worker attempt ${attempt}`,[[`attempt-${attempt}-job`,sec.locator('article').first(),attempt===3?'The third authored failure moves the job to dead letter. It records no fictional effect.':'The host records the attempt and schedules a bounded retry instead of claiming success.']]);
   if(attempt<3)await api(attempt===1?'Advance 1 second':'Advance 2 seconds','/advance');
  }
  const admitted=await api('Admit signed incident','/fixtures/webhook',202);const duplicate=await api('Admit signed incident','/fixtures/webhook',202);if(admitted.duplicate||!duplicate.duplicate||admitted.id!==duplicate.id)throw Error('Expected stable event admission');
  await scene('queue-admitted','Admission and duplicate acknowledgment',[['queue-admitted-status',status,'HTTP two hundred two acknowledges the existing admitted event. It does not execute a job or increase its effect count.']]);
  await api('Bad signature','/fixtures/webhook',401);await scene('queue-signature','Refuse an invalid signature',[['queue-signature-status',status,'The host rejects a bad signature before accepting an incident payload.']]);
  await api('Stale signed request','/fixtures/webhook',401);await scene('queue-freshness','Refuse a stale signed request',[['queue-stale-status',status,'Signature freshness uses real host time independently of the advanced scheduling clock. A valid old signature is still refused.']]);
  const completed=await api('Run one successful worker','/worker');if(completed.effects.length!==1)throw Error('Expected one claimed fictional effect');
  await scene('queue-effect','Execute one claimed job',[['queue-worker',sec.locator('article').last(),'Only a live host claim permits the closed custom tool to record the fictional effect under its stable business key.']]);
  await sec.locator('input').fill('incident-002');await api('Admit signed incident','/fixtures/webhook',202);const cancelled=await api('Cancel next pending job','/cancel');if(cancelled.jobs.at(-1).state!=='cancelled'||cancelled.effects.length!==1)throw Error('Cancellation changed effect count');
  await scene('queue-cancel','Cancel pending work without an effect',[['queue-cancelled',sec.locator('article').last(),'The pending job is cancelled before a worker claim. The already-recorded effect remains separate and no second effect appears.']]);
 }else if(lab===69){
  const start=async()=>{const run=await api('Start guided review','/runs',202);return w.settle(run.id);};
  let run=await start();if(!run.patch||run.state!=='completed')throw Error('Expected authored patch');
  await sec.getByRole('heading',{name:'Proposed replacement'}).waitFor();
  await scene('document-proposal','A proposed patch does not apply itself',[['document-base',sp('Host document version:'),'The host supplies explicit document identity, version and content hash.'],['document-context',sec.locator('pre').first(),'The local document remains unchanged while a replacement is only proposed.']]);
  await scene('document-patch','Review the authored replacement',[['document-replacement',sec.locator('pre').last(),'This replacement is an authored fixture, not an editor extension execution or a live model edit.']]);
  const applied=await api('Apply reviewed patch','/document/apply');if(applied.version!==2)throw Error('Reviewed patch did not advance the local version');
  await scene('document-applied','Apply only through the host guard',[['document-applied-version',sp('Host document version:'),'The explicit review action applies the replacement only after identity, correlation, version and hash checks.']]);
  run=await start();await api('Change local document','/document/change');await api('Apply reviewed patch','/document/apply',409);
  await scene('document-conflict','Refuse an obsolete patch',[['document-conflict-status',status,'A local edit changed the document after the proposal. The version and hash guard refuses the stale replacement.']]);
  await sec.locator('select').selectOption('transport-failure');run=await start();if(run.state!=='error')throw Error('Expected transport failure');
  await scene('document-transport','Record a guided transport failure',[['document-transport-status',status,'The authored transport failure leaves no accepted patch. This browser workshop does not prove execution in a VS Code extension host.']]);
  await sec.locator('select').selectOption('hang');const pending=await api('Start guided review','/runs',202);await api('Cancel review','/cancel');run=await w.settle(pending.id);if(run.state!=='cancelled')throw Error('Expected cancelled review');
  await scene('document-cancel','Cancel the active correlation',[['document-cancelled',sp(/^Run:/),'The host cancels the active review and records its cleanup. A later proposal cannot apply under a cancelled correlation.']]);
 }else{
  const facts=await api('Check Python readiness','/probe');evidence.pythonReadiness=facts;
  await scene('python-readiness','Inspect the actual isolated interpreter',[['python-capability',sp('Python pin:'),'This local probe reports the selected interpreter and installed package capability. It installs nothing and makes no provider request.']]);
  const selects=sec.locator('select');
  for(const scenario of ['normal','custom-tool','malformed-stdout','stderr-flood','missing-python','hang']){
   await selects.nth(1).selectOption(scenario);const pending=await api('Start offline Python','/runs',202);
   if(scenario==='hang')await api('Cancel Python worker','/cancel');
   const run=await w.settle(pending.id);if(['normal','custom-tool','stderr-flood'].includes(scenario)&&run.state!=='completed')throw Error('Offline Python control failed: '+JSON.stringify(run));
   if(['malformed-stdout','missing-python'].includes(scenario)&&run.state!=='error')throw Error('Expected Python refusal');
   await scene(`python-${scenario}`,`Real Python worker · ${scenario}`,[[`${scenario}-run`,sp(/^Run:/),'This is an actual local Python process with authored protocol data, not a live Python SDK model call. Inspect its bounded terminal state.']]);
   if(run.frames.length)await scene(`frames-${scenario}`,`JSON-lines frames · ${scenario}`,[[`${scenario}-frames`,sec.locator('ol'),'The Node host parses bounded typed JSON-lines. A malformed, missing or cancelled terminal frame cannot prove a completed remote session.']]);
   if(run.reply)await scene(`protocol-${scenario}`,`Process evidence · ${scenario}`,[[`${scenario}-protocol`,sp('Protocol:'),'Inspect protocol validity, stderr byte bounds, truncation and local process termination separately from any remote cleanup claim.']]);
  }
  await selects.nth(1).selectOption('normal');
  for(const operation of ['retained-start','retained-turn','close']){
   await selects.nth(0).selectOption(operation);const pending=await api('Start offline Python','/runs',202);const run=await w.settle(pending.id);if(run.state!=='completed')throw Error('Retained Python fixture failed');
   await scene(`python-${operation}`,`Owned offline handle · ${operation}`,[[`${operation}-sessions`,sec.getByRole('heading',{name:'Owned retained sessions'}).locator('xpath=following-sibling::ul[1]'),'The host maps this owner to the fixture session handle and its confirmed state. This offline retained protocol does not create a Managed session.']]);
  }
 }
 await w.finish();
}finally{await w.done();}
