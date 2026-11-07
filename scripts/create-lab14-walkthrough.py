"""Lab 14 step-by-step walkthrough authored from real captures of the running platform (offline model fixtures and one live low-effort session)."""
from lab_video_common import Deck
d=Deck(14,'Lab 14 Step by Step: Models and Supported Effort, Offline and Live','Models and effort');e=d.e
assert 'Source: managed-api' in e['live'] and 'Resolved: claude-sonnet-5-5 / low; configuration matches: true' in e['live'] and 'Cleanup: archived' in e['live']
assert 'Nothing was sent' in e['invalid']
d.cover('CLAUDE MANAGED AGENTS · LAB 14 · MODELS AND EFFORT','<h2>In this lab</h2><p>Choose a model and effort.<br>Verify the resolved configuration.<br>Compare fresh sessions.<br>Bound any fallback.</p>',
 'Welcome to Lab fourteen, Models and supported effort. In this lecture, you will choose a model and an effort level for a fresh session, verify what the session actually resolved, and allow at most one budgeted fallback. We will run the offline fixtures, and then a real session.')
d.overview('REQUEST · RESOLVE · FALL BACK ONCE','Requested settings must match resolved metadata',[
 ('ov-concepts','1 · CONCEPTS','Fresh sessions','Model and effort are set<br>when a session is created','First, the concepts: model and effort are fixed when a session is created, so each comparison uses a fresh session.'),
 ('ov-offline','2 · OFFLINE','Model fixtures','Low · medium · high<br>invalid · fallback · uncertain','Second, the offline fixtures: three effort levels, an invalid combination, a fallback, and uncertain work.'),
 ('ov-live','3 · LIVE','One real session','Sonnet 5.5 at low effort<br>with returned usage','Third, a real session with Sonnet five point five at low effort.'),
 ('ov-code','4 · CODE','Read the TypeScript','Model overrides<br>and resolved snapshot','Finally, the TypeScript code that requests and verifies the configuration.')],
 'A fallback is allowed only after a reconciled failure, with its own budget.')
d.shot('lesson','Open Lab 14',{'lesson-title':'Open Lab fourteen, Models and supported effort.','lesson-objective':'The objective: compare supported model and effort settings in fresh sessions, with resolved metadata, public responses, and explicit fallback budgets.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: compare supported model and effort settings in fresh sessions.'),
 (2,'Core rule','Region two, the core rule: record the resolved model settings, and explicit fallback budgets.'),
 (3,'Keep the boundary clear','Region three: requested settings, resolved metadata, and bounded fallback attempts all matter.'),
 (6,'Put it to the test','Region six: change effort while keeping the prompt and model fixed, and explain why uncertain work blocks a fallback.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: hold the prompt and model fixed, and compare low, medium, and high effort offline.'),
 (2,'Run the comparison','Step two: reject incompatible values, and inspect the resolved model snapshot.'),
 (3,'Inspect the boundary','Step three: simulate unavailable and uncertain primary models, with one explicitly budgeted host fallback.'),
 (4,'Follow the workflow','Step four: change the supported effort in fresh sessions, and explain why uncertain work blocks a fallback.')])
d.shot('experiment','The model experiment',{'exp-rule':'Open Run the exercise. Keep the prompt and model fixed, change effort in a fresh session, and observe the responses, the resolved configuration, and the usage.',
 'exp-model':'Choose a model.','exp-effort':'Choose an effort level.','exp-budget':'Each fresh session gets an explicit budget in US cents.'})
d.shot('catalog','Offline · The capability catalog',{'catalog-sdk':'The server owns a capability catalog, checked against the documentation. Setup does not verify account access.',
 'catalog-models':'It lists the supported efforts for each model. A model is only live-ready once you declare it in the Lab fourteen models setting.'})
d.shot('high','Offline · Requested and resolved',{'high-head':'Run the offline experiment at low, medium, and high effort. Each run is a fresh session; here is the high one.',
 'high-config':'The requested model and effort match the resolved ones, so the configuration is verified.','high-usage':'Offline fixtures report no usage: they are not measurements.'})
d.shot('comparisons','Offline · Effort comparisons',{'cmp-note':'The comparison table keeps each run separate. Fixture responses cannot establish model quality or performance.',
 'cmp-table':'Three rows: the same prompt and model, three effort levels, three different sessions.'})
d.shot('invalid','Offline · An unsupported combination',{'invalid-model':'Now choose Claude Sonnet four point six.','invalid-effort':'And x high effort, which that model does not support.'})
d.shot('invalid-status','Offline · Rejected before sending',{'invalid-status-text':'The host rejects the configuration. Nothing was sent.'})
d.shot('fallback','Offline · An explicit fallback',{'fallback-check':'Switch back to Sonnet five point five, and allow one host fallback after a reconciled failure.',
 'fallback-policy':'The fallback is the other model, with the same effort and prompt, in a separate fresh session with its own budget. The combined limit is shown up front.'})
d.shot('unavailable','Offline · Primary unavailable',{'unavail-decision':'Run the primary unavailable scenario. The host fallback ran in a separately identified fresh session.',
 'unavail-a1':'Attempt one failed with an error.','unavail-a2':'Attempt two, the fallback, completed.'})
d.shot('uncertain','Offline · Uncertain work blocks fallback',{'uncertain-decision':'Now the uncertain scenario. The fallback is blocked, because the earlier remote work is uncertain and must be reconciled first.',
 'uncertain-a1':'Attempt one ended with an error.','uncertain-a1-detail':'There is no confirmed session ID, and the creation is uncertain. Starting another session could double the spend.'})
d.live_disabled('Now real Claude. With live mode disabled, Run live does not call Claude.','The setup also asks you to declare the account models you checked, in the Lab fourteen models setting.')
d.restart('Add CLAUDE underscore MANAGED underscore LAB14 underscore MODELS equals claude sonnet five five, set live mode to true, and restart the backend.','Wait for Backend ready.')
d.shot('live-config','Live · Choose the configuration',{'live-model':'Back in Lab fourteen, keep Claude Sonnet five point five.','live-effort':'Choose low effort.','live-budget':'With a budget of fifty US cents.'},note='LIVE RUN')
d.shot('live-catalog','Live · The model is declared',{'live-catalog-models':'The catalog now marks the declared model as ready.'},note='LIVE RUN')
d.shot('live-run','Live · Run one fresh session',{'live-run-button':'Click Run live. This starts one billed fresh session.'},note='LIVE RUN')
d.shot('live-session','Live · Requested equals resolved',{'live-head':'Attempt one completed.','live-session-id':'The session creation was confirmed, and the session was archived.',
 'live-resolved':'Requested: Sonnet five point five at low effort. Resolved: exactly the same. The configuration matches.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-answer','Live · The response',{'live-answer-text':'Claude gives three practical steps for safely syncing an offline notebook: back up, clean the entries, then sync and verify.'},note='LIVE RUN')
d.shot('live-usage','Live · Usage and time',{'live-usage-text':'The returned usage: a few input tokens, about two hundred forty output tokens, and the cache creation, from one request span.',
 'live-elapsed':'The host elapsed time includes setup and cleanup. The actual billed cost is not reported here.'},note='LIVE RUN')
d.compare('Offline and live, compared','What did the configuration prove?',[
 ('vs-resolved','RESOLVED','Verify, then send','The prompt is sent only when<br>resolved equals requested','The prompt was sent only after the resolved configuration matched the request.'),
 ('vs-fresh','FRESH','One session per setting','Model and effort change<br>only in a new session','Each model and effort setting used its own fresh session.'),
 ('vs-fallback','FALLBACK','Bounded and reconciled','One fallback, its own budget,<br>never after uncertain work','And a fallback ran at most once, with its own budget, and never after uncertain work.')],'Fixture timings and costs are not measurements of model quality.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the models module to the run controller and the catalog.'),
 (3,'POST /session','Section three runs a model experiment in a fresh session.'),
 (5,'POST /{operation}','Section five handles the session operations.'),
 (7,'POST /new-configuration','Section seven creates a new configuration, because model and effort cannot change in place.')])
d.mapping('Where are model and effort?',[
 ('map-sdk','CLAUDE AGENT SDK','Query options','model, effort and<br>fallbackModel options','In the Agent SDK, model, effort, and a fallback model are query options.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Session overrides','agent_with_overrides<br>with model id and effort','Here, the model and effort are set on the session with agent with overrides, and the host verifies the resolved snapshot. A fallback is a separate session the host decides to create.'),
 ('map-port','THIS PLATFORM','The Lab 14 port','server/lib/lab14-port.ts','The code is in the Lab fourteen port.')],'Model overrides and resolved verification are in server/lib/lab14-port.ts.')
d.port('port-create','Source · Request the configuration',{'port-overrides':'The session uses agent with overrides with the model ID and effort, no tools, and an explicit budget.','port-session':'Then the session is created.'})
d.port('port-resolved','Source · Verify before sending',{'port-resolved':'The host compares the resolved model, effort, budget, and capabilities with the request.','port-send':'Only then does it send the user message.'})
d.knowledge('Finish with the knowledge check: what should a model fallback record?','Requested settings, resolved metadata, and bounded fallback attempts all matter.')
d.summary([('sum-request','REQUEST','Model and effort','Set on a fresh session.','You can now request a model and effort for a fresh session.'),
 ('sum-verify','VERIFY','Resolved metadata','Match before sending.','Verify the resolved configuration before sending a prompt.'),
 ('sum-bound','BOUND','One fallback','Budgeted and reconciled.','And bound a fallback to one budgeted, reconciled attempt.')],'Lab 15 · Usage and budgets')
d.finish()
