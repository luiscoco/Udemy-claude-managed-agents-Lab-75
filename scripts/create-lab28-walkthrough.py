"""Lab 28 step-by-step walkthrough authored from real captures of the running platform (offline: authored loopback faults; live: a small script observing real Managed Agents API errors and reconciling a real create)."""
from lab_video_common import Deck
d=Deck(28,'Lab 28 Step by Step: Errors, Retries and Reconciliation, Offline and Live','Errors and retries');e=d.e
assert 'GET statuses: 429, 429, 200' in e['run_read-rate-limit'] and 'Read attempts: 3.' in e['run_read-rate-limit']
assert 'Reconcile: unknown-create-id' in e['run_missing-create-response'] and 'Mutation attempts: 1.' in e['run_missing-create-response']
assert 'Host effects: 1.' in e['run_tool-result-failure'] and 'History IDs e1, e1, e2 deduplicated to e1, e2.' in e['run_reconnect-duplicates']
assert 'Classification: local-disconnect' in e['run_disconnect'] and e['liveButtons']==0 and len(e['scenarios'])==11
live=d.transcript('live.raw.txt');L=' | '.join(live)
assert 'Retrieve unknown session → 404 NotFoundError · HTTP attempts 1 · not retryable' in L and 'Invalid API key → 401 AuthenticationError · HTTP attempts 1' in L
assert 'metadata keys → 400 BadRequestError' in L and 'Create sent once (HTTP attempts 1)' in L and '1 listed, 1 match' in L
assert 'Reconciled: found 1, no duplicate create' in L and 'Same session as the lost response: yes' in L and 'Archived: yes' in L and len(live)==12
cue=lambda l,rules:next((c for p,c in rules if l.startswith(p)),None)
d.cover('CLAUDE MANAGED AGENTS · LAB 28 · ERRORS AND RETRIES','<h2>In this lab</h2><p>Bound read retries.<br>Never resend a mutation blindly.<br>Reconcile uncertain outcomes.<br>Classify every fault.</p>',
 'Welcome to Lab twenty-eight, Errors, retries and reconciliation. In this lecture, you will inject authored faults into a local loopback server, see which requests may be retried, and reconcile uncertain mutations without creating duplicate effects. The app stays offline, and then a small script observes real API errors, and reconciles a real create, live.')
d.overview('CLASSIFY · RETRY · RECONCILE','Retry reads; reconcile mutations',[
 ('ov-concepts','1 · CONCEPTS','Fault classes','Transport, event, handler<br>and cleanup faults','First, the concepts: transport, event, handler, and cleanup faults.'),
 ('ov-retry','2 · RETRY','Bounded reads','Read rate limit:<br>three GET attempts','Second, a rate-limited read that is retried with a bound.'),
 ('ov-reconcile','3 · RECONCILE','Uncertain mutations','Missing create · tool result<br>reconnect duplicates','Third, uncertain mutations, which are reconciled, not resent.'),
 ('ov-code','4 · LIVE AND CODE','Real errors, then code','A live script run;<br>then the TypeScript','Finally, a live terminal run with real API errors and a real reconciliation, and the TypeScript code that sets zero retries on side-effecting calls.')],
 'An unseen acknowledgment does not prove that an operation failed.')
d.shot('lesson','Open Lab 28',{'lesson-title':'Open Lab twenty-eight, Errors, retries and reconciliation.','lesson-objective':'The objective: classify authored faults, bound read retries, and reconcile uncertain mutations without duplicate effects.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: transport, event, handler, and cleanup faults, with bounded reads and reconciliation.'),
 (2,'Core rule','Region two, the core rule: reconcile the outcome before risking a duplicate effect.'),
 (3,'Keep the boundary clear','Region three: a transport failure can leave a mutation outcome uncertain. The server may have applied it.'),
 (6,'Put it to the test','Region six: explain when reconnecting a known session is safer than creating another one.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: run Read rate limit, and inspect three bounded GET attempts.'),
 (2,'Run the comparison','Step two: run Missing create response, and explain why another create is unsafe without an ID.'),
 (3,'Inspect the boundary','Step three: run Tool result failure, and compare one host effect with the uncertain acknowledgment.'),
 (4,'Follow the workflow','Step four: run Reconnect duplicates, and inspect event ID deduplication.')])
d.shot('experiment','The fault experiment',{'exp-rule':'Open Run the exercise. Reads may retry with a bound. Create, send, confirm, result, and interrupt use zero SDK retries.',
 'exp-select':'Choose one of eleven offline fault scenarios.','exp-run':'Then select Run offline fault.','exp-status':'The faults use a local loopback server, and do not contact Anthropic.'})
d.shot('rate-limit','Offline · Read rate limit',{'rate-limit-class':'Read rate limit. The source is an authored loopback fixture, classified as a transient read.',
 'rate-limit-attempts':'Three read attempts, and zero mutation attempts.','rate-limit-reconcile':'Retry is allowed for the bounded read only.',
 'rate-limit-evidence':'The GET returned four twenty-nine twice, then two hundred. Duplicate history event IDs collapse to e one and e two.','rate-limit-guidance':'Only the bounded GET was retried.'})
d.shot('missing-create','Offline · Missing create response',{'missing-create-class':'Missing create response, classified as an uncertain create. No session ID is known.',
 'missing-create-attempts':'Exactly one mutation attempt.','missing-create-reconcile':'Reconcile: unknown create ID. Retry is not allowed, and cleanup is pending.',
 'missing-create-evidence':'The POST reached the server, but the response disappeared before an ID was observed.','missing-create-guidance':'So do not resend create. Search an owned inventory or the logs, and without a confirmed ID, quarantine the attempt.'})
d.shot('tool-result','Offline · Tool result failure',{'tool-result-class':'Tool result failure, classified as an uncertain result, on a known session.',
 'tool-result-attempts':'One mutation attempt, and one host effect.','tool-result-reconcile':'It is reconciled with the host ledger. No automatic retry.',
 'tool-result-evidence':'The host effect key was applied once, even though the result acknowledgment was lost.','tool-result-guidance':'Inspect the session history and the idempotency ledger before any deliberate resend.'})
d.shot('reconnect','Offline · Reconnect duplicates',{'reconnect-class':'Reconnect duplicates, classified as reconciled, on the known session.',
 'reconnect-attempts':'Zero mutations, and two host effects.','reconnect-reconcile':'Reconcile from the known session history.',
 'reconnect-evidence':'The history IDs e one, e one, e two are deduplicated to e one and e two.','reconnect-guidance':'Resume the known session. Do not create a replacement task.'})
for s,name,cls,extra in [('invalid','Invalid','Invalid is classified as invalid.','Reconcile is not needed, and nothing is retried.'),
 ('auth','Auth','Auth is classified as denied.','No retry, and no reconciliation.'),
 ('event-error','Event error','An event error is classified as a remote error.','The host does not retry it.'),
 ('handler-error','Handler error','A handler error stays a handler error.','Again, no retry.'),
 ('cancel','Cancel','Cancel is classified as canceled.','No retry, but cleanup is pending.'),
 ('eof','EOF','An early end of stream is classified as an incomplete stream.','No retry, and nothing to reconcile.')]:
 d.shot(s,f'Offline · {name}',{f'{s}-class':cls,f'{s}-reconcile':extra,f'{s}-evidence':'The evidence records the authored fault.'})
d.shot('disconnect','Offline · Disconnect',{'disconnect-class':'Finally, disconnect, classified as a local disconnect.','disconnect-remote':'Whether the remote stopped is unconfirmed.',
 'disconnect-evidence':'The browser stream closed. The remote session status was not observed.','disconnect-guidance':'Reconnect a known session, and inspect its status and history before interpreting the outcome.'})
d.shot('no-live','The app stays offline',{'no-live-text':'The app stays offline in this lab: there is no Run live button, and the server refuses live fault injection, because real faults would need a separately configured port. So we do not inject faults. Instead, a small script, in the terminal of the project, makes real calls, and observes the real error classes that the API returns.'})
d.terminal('Live · Real error classes',[(l,cue(l,[('PS ','lv-run'),('SDK retry','lv-policy'),('Retrieve unknown','lv-404'),('Invalid API key','lv-401'),('Create with 17','lv-400')])) for l in live[:6]],
 {'lv-run':'The script reads the agent and environment IDs from dot env, and runs with node and t s x. It sends no message, so there is no model turn.',
  'lv-policy':'First, the real SDK retry policy: max retries is two by default, and only four oh eight, four oh nine, four twenty-nine, five hundred errors and connection errors are retried. The client for side-effecting calls sets max retries to zero.',
  'lv-404':'Retrieving a made-up session ID returns four oh four, not found error, after one HTTP attempt. It is not retryable.',
  'lv-401':'A client with an obviously invalid API key gets four oh one, authentication error. Again, one attempt, and no retry.',
  'lv-400':'And a create with seventeen metadata keys, one more than the maximum of sixteen, is rejected with four hundred, bad request error.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · Reconcile an uncertain create',[(l,cue(l,[('Create sent once','lv-create'),('Response treated','lv-lost'),('List sessions','lv-list'),('Reconciled','lv-reconciled'),('Archived','lv-archived')])) for l in live[:1]+live[6:]],
 {'lv-create':'Now an uncertain create. The script creates one session, tagged with a unique metadata key, lab twenty-eight underscore request underscore I D. It is sent exactly once.',
  'lv-lost':'Then it acts as if the response was lost: no session ID was observed, so it does not resend create.',
  'lv-list':'Instead, it lists the sessions created in the last minute, and matches that metadata key: one listed, one match.',
  'lv-reconciled':'Reconciled: found one, no duplicate create. It is the same session as the lost response, and it is idle.',
  'lv-archived':'Finally, the script archives the session. Archived: yes.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the real API prove?',[
 ('vs-classes','CLASSIFY','Real error classes','404, 401 and 400<br>come from the API','The offline fixtures model the same classes that the real API returned: not found, authentication, and bad request.'),
 ('vs-retry','RETRY','Not retried','Each 4xx error:<br>one HTTP attempt','The SDK did not retry any of these errors: each one took a single HTTP attempt.'),
 ('vs-reconcile','RECONCILE','Find, do not resend','A unique metadata key<br>matched exactly once','And an uncertain create was reconciled by its unique metadata key, without a duplicate create.')],'The live run created one session, sent no message, and archived it.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the router to the schemas and the fault module.'),
 (2,'Create the concept router','Section two creates the concept router.'),
 (4,'POST /run','Section four runs one validated fault scenario.'),
 (5,'Return the module contract','Section five returns the router and its cleanup contract.')])
d.mapping('Where do errors and retries live?',[
 ('map-sdk','CLAUDE AGENT SDK','A local agent loop','Errors surface in your process<br>as result messages','In the Agent SDK, the agent loop runs in your process, and errors surface there as result messages.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Remote session mutations','Create and send with<br>maxRetries zero; read history','This platform uses Managed Agents beta sessions, not the Agent SDK. Create and send are remote mutations, so they use zero retries, and the host reconciles from session history.'),
 ('map-port','THIS PLATFORM','The Lab 28 fault module','server/lib/lab28-faults.ts','The code is in the Lab twenty-eight faults module.')],'Bounded reads, the host ledger and reconciliation are in server/lib/lab28-faults.ts.')
d.port('port-retry','Source · Zero retries and a ledger',{'port-zero-retries':'Side-effecting request options set max retries to zero.','port-ledger':'The host ledger applies each effect key only once.'})
d.port('port-bounded','Source · Bounded read, no live mode',{'port-bounded':'A read retries only on four twenty-nine or five oh three, up to a maximum number of attempts, with backoff.','port-live-throw':'And live mode throws: live fault injection needs a separately configured port.'})
d.port('port-reconcile','Source · Reconcile, do not resend',{'port-uncertain-create':'A missing create response records an unknown create ID, and says do not resend create.',
 'port-host-ledger':'A lost result acknowledgment reconciles with the host ledger.','port-known-session':'And reconnect duplicates are reconciled on the known session.'})
d.knowledge('Finish with the knowledge check: how should an uncertain mutation be retried?','Reconcile its outcome before risking a duplicate effect. A transport failure can leave the outcome uncertain.')
d.summary([('sum-retry','RETRY','Bounded reads','Only safe reads retry.','You can now retry only safe reads, with a bound.'),
 ('sum-reconcile','RECONCILE','Uncertain mutations','Never resend blindly.','Reconcile uncertain mutations instead of resending them.'),
 ('sum-classify','CLASSIFY','Every fault','A local disconnect is not a remote failure.','And classify each fault, keeping a local disconnect distinct from a remote failure.')],'Lab 29 · Images and files')
d.finish()
