"""Lab 10 step-by-step walkthrough authored from real captures of the running platform (offline reports and one live two-turn session)."""
from lab_video_common import Deck
d=Deck(10,'Lab 10 Step by Step: Validated Reports and Interruption, Offline and Live','Validated reports and interruption');e=d.e
assert 'completed: verified' in e['live1_turn'] and 'completed: verified' in e['live2_turn'] and 'State: closed' in e['live_close'] and 'archived' in e['live_close']
d.cover('CLAUDE MANAGED AGENTS · LAB 10 · VALIDATED REPORTS','<h2>In this lab</h2><p>Validate JSON reports.<br>Allow one correction.<br>Interrupt and retain.<br>Close the idle session.</p>',
 'Welcome to Lab ten, Validated reports and interruption. In this lecture, you will validate the agent\'s final JSON report against a closed application schema, allow one corrective round, and control a retained session: interrupt it and keep it, or close it. We will run the fixtures and then a real two-turn session.')
d.overview('VALIDATE · CORRECT ONCE · CONTROL','A report passes only after application validation',[
 ('ov-concepts','1 · CONCEPTS','A closed schema','The final text must be<br>one valid JSON report','First, the concepts: the final text must be a JSON object that passes a closed application schema.'),
 ('ov-offline','2 · OFFLINE','Report fixtures','Valid · invalid · corrected<br>exhausted · interrupt','Second, the offline fixtures: valid, invalid, corrected, exhausted, and an interrupted hang.'),
 ('ov-live','3 · LIVE','Two real turns','Two verified reports<br>in one retained session','Third, a real session with two verified reports, then closed.'),
 ('ov-code','4 · CODE','Read the TypeScript','safeParse validation<br>one corrective attempt','Finally, the TypeScript code that validates and retries once.')],
 'Interrupt keeps a confirmed-idle session for reuse; Close archives it.')
d.shot('lesson','Open Lab 10',{'lesson-title':'Open Lab ten, Validated reports and interruption.',
 'lesson-objective':'The objective: validate final JSON reports with a closed application schema, and distinguish interrupt, local abort, and idle-session close.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: validate final JSON reports, and control the session with interrupt, abort, and close.'),
 (2,'Core rule','Region two, the core rule. What verifies a final JSON report? Validation against the closed application schema.'),
 (3,'Keep the boundary clear','Region three: application validation, not the model, decides whether the report satisfies its contract.'),
 (6,'Put it to the test','Region six: identify the stop action that keeps the same session available for another turn, and the evidence required before reuse.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: run the valid and invalid report fixtures, and inspect host verification.'),
 (2,'Run the comparison','Step two: run Corrected and Exhausted, to see the single corrective round limit.'),
 (3,'Inspect the boundary','Step three: run Hang, interrupt it, and confirm idle before sending another turn.'),
 (4,'Follow the workflow','Step four: disconnect locally or abort, and inspect remote cleanup separately.')])
d.shot('experiment','The report experiment',{'exp-rule':'Open Run the exercise. Reports are final JSON text checked by a closed application schema, and one corrective round is allowed.',
 'exp-schema':'Expand the closed report JSON schema.','exp-question':'The user question asks for a report about the fictional Aurora Finch notebook, returning only the JSON object.'})
d.shot('schema','The closed schema',{'schema-json':'The schema requires project, summary, risks, and next steps, and it is closed: no unexpected keys are allowed.'})
d.shot('valid','Offline · A valid report',{'valid-header':'Start the valid fixture. Turn one is completed and verified on the first attempt.','valid-body':'The validated report is rendered from the parsed JSON: project, summary, risks, and next steps.'})
d.shot('close-valid','Offline · Close the idle session',{'close-valid-evidence':'Before starting another report, click Close idle session. The run is closed, idle was confirmed, and cleanup ran. The server allows only one open run, so closing matters.'})
d.shot('invalid','Offline · An invalid report',{'invalid-header':'Now the invalid fixture. The turn failed.','invalid-body':'The validation errors are exact: summary must be a string, next steps needs at least one item, and an unexpected key was rejected.'})
d.shot('corrected','Offline · Corrected on the second attempt',{'corrected-header':'Corrected: the first report failed, the host sent one corrective message, and the second attempt verified.','corrected-body':'Attempts: two. Only the verified report is shown.'})
d.shot('exhausted','Offline · The corrective round is exhausted',{'exhausted-header':'Exhausted: the corrected attempt also failed, so the turn stops. There is only one corrective round.','exhausted-body':'No verified report, and the errors explain why.'})
d.shot('hang-interrupt','Offline · Interrupt and retain',{'hang-run-evidence':'Finally, Hang. While the agent is still working, click Interrupt and retain session. The run is idle, with idle confirmed: the session is kept.',
 'hang-buttons':'Because idle was confirmed, Send another turn is available. Interrupt keeps the session; Abort and Close do not.'})
d.live_disabled('Now real Claude. With live mode disabled, Run live does not call Claude.','Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend.')
d.restart('Restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live-ready','Live · Start a real report',{'live-question':'Keep the report question.','live-run':'Click Run live. This starts a billed, text-only, retained session.'},note='LIVE RUN')
d.shot('live1-evidence','Live · A real retained run',{'live1-run-evidence':'The run evidence shows the real session in idle state, with source managed API.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live1','Live · Turn 1 verified',{'live1-header':'Turn one is completed and verified on the first attempt.','live1-body':'Claude\'s JSON passed the closed schema, so the host rendered the validated report.'},note='LIVE RUN')
d.shot('live2','Live · Turn 2 in the same session',{'live2-header':'Now change the question to ask for an updated report with one more risk, and click Send another turn. Turn two runs in the same session, and it is verified too.','live2-body':'Two validated reports, one retained session.'},note='LIVE RUN')
d.shot('live-close','Live · Close the idle session',{'live-close-evidence':'Finally, Close idle session. The state is closed, idle was confirmed, and the real session was archived.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the reports prove?',[
 ('cmp-schema','SCHEMA','Validation decides','Only schema-valid JSON<br>becomes a report','Only JSON that passed the closed schema became a report, offline and live.'),
 ('cmp-once','ONCE','One correction','Corrected verifies on attempt 2<br>Exhausted stops','One corrective round can fix a report; after that, the turn stops.'),
 ('cmp-control','CONTROL','Interrupt or close','Interrupt keeps the session<br>Close archives it','And interrupt kept a confirmed-idle session for another turn, while close archived it.')],'Always confirm idle before reusing or archiving a session.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the reports module to the report schema and the run controller.'),
 (3,'POST /{action}','Section three handles the structured and send actions, which start a report or send another turn.'),
 (4,'POST /{action}','Section four handles the control actions: interrupt, abort, and end.'),
 (5,'Return the module contract','Section five returns the router and its cleanup contract.')])
d.mapping('Where is outputFormat?',[
 ('map-sdk','CLAUDE AGENT SDK','Structured output options','The SDK can request<br>a JSON schema output','In the Agent SDK, you can ask for structured output with a JSON schema option.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Validate the final text','The host parses the JSON<br>and checks a closed schema','Here, the host validates the agent\'s final text itself, against a closed application schema, and asks for one correction if it fails.'),
 ('map-port','THIS PLATFORM','The run controller','server/lib/lab10-run.ts','The logic is in the Lab ten run controller.')],'Validation and the corrective round are in server/lib/lab10-run.ts.')
d.port('port-validate','Source · Validate the report',{'port-validate':'The report is validated with safe parse against the closed report schema. Only a successful parse produces a report.'})
d.port('port-corrective','Source · One corrective round',{'port-attempts':'The turn loops over at most two attempts.',
 'port-corrective-prompt':'The first attempt sends your question; the second sends a corrective message that explains the validation failure.',
 'port-exhausted':'If the second attempt also fails, the outcome is exhausted, and no report is accepted.'})
d.knowledge('Finish with the knowledge check: what verifies a final JSON report?','Validation against the closed application schema. Application validation determines whether the final report satisfies its contract.')
d.summary([('sum-validate','VALIDATE','The schema decides','A closed schema, checked by the host.','You can now explain that the host, not the model, verifies a report against a closed schema.'),
 ('sum-correct','CORRECT','One more attempt','Then the turn stops.','That one corrective round is allowed, and then the turn stops.'),
 ('sum-control','CONTROL','Interrupt or close','Confirm idle first.','And how interrupt, abort, and close differ, always confirming idle first.')],'Lab 11 · Managed skills')
d.finish()
