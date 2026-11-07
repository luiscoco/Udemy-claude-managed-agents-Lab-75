"""Lab 20 step-by-step walkthrough authored from real captures of the running platform (offline lifecycle fixtures and one live custom-tool session)."""
from lab_video_common import Deck
d=Deck(20,'Lab 20 Step by Step: Lifecycle Events and Host Interceptors, Offline and Live','Lifecycle events');e=d.e
assert 'Source: managed-api' in e['live'] and 'Outcome: verified' in e['live'] and 'Status: reviewed' in e['live'] and 'Cleanup: archived' in e['live']
d.cover('CLAUDE MANAGED AGENTS · LAB 20 · LIFECYCLE EVENTS','<h2>In this lab</h2><p>Observe provider events.<br>Audit host decisions.<br>Check the actual effect.<br>Validate the final report.</p>',
 'Welcome to Lab twenty, Lifecycle events and host interceptors. In this lecture, you will correlate the events the provider streams with the decisions your host makes and the effects its custom tools actually cause, without treating observed events as SDK hook callbacks.')
d.overview('OBSERVE · DECIDE · VERIFY','Observing an event is not intercepting it',[
 ('ov-concepts','1 · CONCEPTS','Three records','Provider events, host audit<br>and the actual effect','First, the concepts: provider events, the host audit, and the actual file effect are three separate records.'),
 ('ov-offline','2 · OFFLINE','Lifecycle fixtures','Pass · deny · fail · exception<br>deadline · validation','Second, six offline fixtures, from a passing policy to a failed final validation.'),
 ('ov-live','3 · LIVE','One real edit','A custom tool call,<br>audited and verified','Third, a real custom tool call, audited by the host and verified.'),
 ('ov-code','4 · CODE','Read the TypeScript','Interceptors around<br>the custom tool','Finally, the TypeScript code around the custom tool.')],
 'A post-execution observation can never block an effect that already happened.')
d.shot('lesson','Open Lab 20',{'lesson-title':'Open Lab twenty, Lifecycle events and host interceptors.','lesson-objective':'The objective: correlate Managed lifecycle events with host interceptor decisions and actual custom tool effects, without treating observations as SDK hook callbacks.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: correlate lifecycle events, host decisions, and actual effects.'),
 (2,'Core rule','Region two, the core rule. Are observed lifecycle events SDK hook callbacks? No: distinguish events, host decisions, and effects.'),
 (3,'Keep the boundary clear','Region three: observing an event does not establish host interception or enforcement.'),
 (6,'Put it to the test','Region six: identify which boundary prevented or attempted each execution.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: run the passing policy, and compare the provider events, the host audit, and the draft file.'),
 (2,'Run the comparison','Step two: run denied pre-execution, tool failure, and interceptor exception.'),
 (3,'Inspect the boundary','Step three: use the virtual-time deadline fixture, and inspect cleanup.'),
 (4,'Follow the workflow','Step four: run final validation failure, and distinguish a completed turn from a rejected report.')])
d.shot('experiment','The lifecycle experiment',{'exp-rule':'Open Run the exercise. Compare the observed Managed events with the application audit. A post-execution event cannot block an effect that already happened.',
 'exp-scenario':'Choose one of six offline scenarios.','exp-prompt':'The prompt asks Claude to use edit file once to change the draft status to reviewed.'})
d.shot('passing','Offline · A passing policy',{'passing-facts':'Run the passing policy. The outcome is verified.','passing-draft':'And the draft now says reviewed.'})
d.shot('passing-events','Offline · Provider events',{'passing-events-provider':'The provider event projection shows what the stream reported: running, a custom tool use for edit file, then idle, waiting for the result.'})
d.shot('passing-audit','Offline · The host audit',{'passing-audit-audit':'The host audit is a separate record: the interceptor allowed the call, the handler ran, the effect was executed, and the final validation passed.',
 'passing-audit-note':'Provider frames and host audit are separate.'})
d.shot('passing-draft','Offline · The actual effect',{'passing-draft-file':'Inspect draft dot M D. The file itself confirms the effect.'})
d.shot('denied','Offline · Denied before execution',{'denied-facts':'Now Denied pre-execution. The outcome is a host policy denial.','denied-draft':'And the draft still says draft.'})
d.shot('denied-audit','Offline · Why it was denied',{'denied-audit-audit':'The audit shows why: the pre-execution policy prevented the handler, so nothing ran.','denied-audit-note':'The denial happened before execution, at the host.'})
d.shot('failure-audit','Offline · A tool failure',{'failure-audit-audit':'Tool failure is different: the policy allowed the call and the handler ran, but the old text was not found, so no edit was applied.','failure-audit-note':'The attempt happened; the effect did not.'})
d.shot('exception-audit','Offline · An interceptor exception',{'exception-audit-audit':'Interceptor exception: the instrumentation failed closed, before any session was created or any tool ran.',
 'exception-audit-note':'That is a host instrumentation failure, not a provider or tool error.'})
d.shot('deadline','Offline · A virtual deadline',{'deadline-facts':'Deadline uses virtual time: five ticks, no real wait, and no session.','deadline-draft':'The draft is unchanged.'})
d.shot('validation','Offline · Final validation failure',{'validation-facts':'Final validation failure: the provider turn completed, but the outcome is a final validation error.','validation-draft':'Even though the draft was edited.'})
d.shot('validation-audit','Offline · A rejected report',{'validation-audit-audit':'The audit shows the effect executed, and then the application report was rejected.','validation-audit-note':'No unbounded corrective turn was started.'})
d.live_disabled('Now real Claude. With live mode disabled, Run live does not call Claude.','Live mode also uses the Lab seven custom-tool agent, and runs only the passing policy.')
d.restart('Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live-run','Live · Run the passing policy',{'live-prompt':'Back in Lab twenty, keep the explicit edit file prompt.','live-run-button':'Click Run live. This creates one billed session.'},note='LIVE RUN')
d.shot('live-head','Live · Verified',{'live-head-facts':'The real run is verified, and the session was archived.','live-head-draft':'The draft now says reviewed.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-events','Live · Real provider events',{'live-events-provider':'The real event projection: running, thread events, model spans, Claude\'s edit file call, idle while waiting for the result, the host\'s custom tool result, and Claude\'s final message.'},note='LIVE RUN')
d.shot('live-audit','Live · The host audit',{'live-audit-audit':'The host audit tells the other side: the policy allowed the call, the handler ran and edited the draft, the effect was executed, and the final validation passed.',
 'live-audit-note':'Two records, correlated by event ID.'},note='LIVE RUN')
d.compare('Offline and live, compared','What did the records prove?',[
 ('vs-events','EVENTS','What was reported','The stream shows tool uses<br>and lifecycle states','The provider events showed what was requested and when.'),
 ('vs-audit','AUDIT','What the host decided','Allow, deny, run, fail,<br>or fail closed','The host audit showed what the host decided, and whether a handler ran.'),
 ('vs-effect','EFFECT','What actually changed','The draft file and the<br>final validation','And only the file and the final validation proved the effect.')],'Observed events are not SDK hook callbacks.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the lifecycle module to the run controller.'),
 (3,'POST /run','Section three runs a lifecycle scenario, offline or live.'),
 (4,'Decision and early response','Section four handles the decision and the early response.'),
 (6,'POST /reset','Section six resets a fixture.')])
d.mapping('Where are PreToolUse and PostToolUse?',[
 ('map-sdk','CLAUDE AGENT SDK','Hook callbacks','PreToolUse and PostToolUse<br>run inside the SDK loop','In the Agent SDK, hook callbacks like pre tool use and post tool use run inside the agent loop on your machine.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Events and host code','Stream events, plus host<br>interceptors around custom tools','Here, you observe stream events, and your own host interceptors wrap the custom tools you execute.'),
 ('map-port','THIS PLATFORM','The Lab 20 controller','server/lib/lab20-run.ts','The code is in the Lab twenty run controller.')],'Interceptors, audit and the custom-tool port are in server/lib/lab20-run.ts.')
d.port('port-interceptor','Source · Interceptors fail closed',{'port-exception':'If an interceptor throws, the run stops before any port exists.','port-preflight':'Otherwise, the pre-execution audit record is accepted first.'})
d.port('port-port','Source · The custom-tool port',{'port-port':'Live runs reuse the Lab seven custom-tool port.'})
d.port('port-respond','Source · Return the result',{'port-respond':'The host returns each handler result with a user dot custom tool result event.'})
d.knowledge('Finish with the knowledge check: are observed lifecycle events SDK hook callbacks?','No. Observing an event does not establish host interception or enforcement.')
d.summary([('sum-observe','OBSERVE','Provider events','What was reported.','You can now read provider lifecycle events.'),
 ('sum-decide','DECIDE','Host interceptors','Allow, deny, fail closed.','Explain what the host interceptors decided.'),
 ('sum-verify','VERIFY','Actual effects','Files and validation.','And verify the actual effect separately.')],'Lab 21 · Host commands')
d.finish()
