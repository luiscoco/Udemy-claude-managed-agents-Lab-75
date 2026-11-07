"""Lab 15 step-by-step walkthrough authored from real captures of the running platform (offline accounting fixtures and one live budgeted session)."""
from lab_video_common import Deck
d=Deck(15,'Lab 15 Step by Step: Usage and Session Budgets, Offline and Live','Usage and budgets');e=d.e
assert 'Source: managed-api' in e['live'] and 'Outcome: completed / end_turn' in e['live'] and 'Cleanup: archived' in e['live_close']
d.cover('CLAUDE MANAGED AGENTS · LAB 15 · USAGE AND BUDGETS','<h2>In this lab</h2><p>Read cumulative usage.<br>Keep scopes separate.<br>Enforce a session budget.<br>Raise a cap only explicitly.</p>',
 'Welcome to Lab fifteen, Usage and session budgets. In this lecture, you will read the usage a session reports, keep overlapping scopes separate instead of adding them up, and bound spending with a platform budget and host limits. We will run the offline accounting fixtures, and then a real budgeted session.')
d.overview('READ · SEPARATE · BOUND','Overlapping usage scopes are never added together',[
 ('ov-concepts','1 · CONCEPTS','Three scopes','Session totals, request spans<br>and thread attribution','First, the concepts: session totals, observed request spans, and thread attribution overlap.'),
 ('ov-offline','2 · OFFLINE','Accounting fixtures','Normal · duplicates · child<br>budget reached · raise','Second, the offline fixtures: a normal turn, duplicate events, child attribution, a reached budget, and an explicit raise.'),
 ('ov-live','3 · LIVE','One real session','A budgeted text-only turn<br>and its returned usage','Third, a real budgeted session and the usage it returned.'),
 ('ov-code','4 · CODE','Read the TypeScript','Budgets, retrieval<br>and threads','Finally, the TypeScript code that sets the budget and reads usage.')],
 'List cost is not a guaranteed invoice total.')
d.shot('lesson','Open Lab 15',{'lesson-title':'Open Lab fifteen, Usage and session budgets.','lesson-objective':'The objective: read cumulative session usage, separate overlapping scopes, and enforce platform budgets and bounded host turns.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: read cumulative usage, separate overlapping scopes, and enforce budgets and bounded host turns.'),
 (2,'Core rule','Region two, the core rule: keep the scopes separate, rather than summing overlapping totals.'),
 (3,'Keep the boundary clear','Region three: cumulative and overlapping scopes can double count when they are added blindly.'),
 (6,'Put it to the test','Region six: explain why intermediate usage differs from the final snapshot, and why list cost is not a guaranteed invoice total.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: compare an intermediate usage event with the retrieved idle-session snapshot.'),
 (2,'Run the comparison','Step two: repeat usage events, and inspect child attribution without double counting.'),
 (3,'Inspect the boundary','Step three: reach a local turn limit or the platform budget, then decide explicitly whether to raise the cap.'),
 (4,'Follow the workflow','Step four: explain the difference between intermediate and final usage, and between list cost and an invoice.')])
d.shot('experiment','The usage experiment',{'exp-rule':'Open Run the exercise. Session totals, observed request spans, and thread attribution overlap. Compare their scope; never add them together.',
 'exp-budget':'The creation budget is fifty US cents.','exp-turns':'The host also limits turns and messages.','exp-tools':'Zero tool calls are allowed, one context message, and at most one explicit budget raise.'})
d.shot('normal','Offline · A bounded session',{'normal-state':'Start the offline usage experiment. The session is idle after its turn.','normal-cap':'The cap is fifty cents, and one of three turns and messages is used.','normal-outcome':'The outcome is completed, at end of turn.'})
d.shot('normal-reading','Offline · An intermediate reading',{'normal-reading-scope':'The first reading came from a session usage event in the stream.','normal-reading-tokens':'Ten input tokens and five output tokens.',
 'normal-reading-cost':'With a list cost of three cents. These are fictional accounting fixtures.','normal-reading-delta':'It is the first observation, so there is no comparable change yet.'})
d.shot('retrieved','Offline · The retrieved snapshot',{'retrieved-scope':'Click Retrieve session usage. This reading comes from retrieving the idle session.','retrieved-tokens':'It reports more tokens than the intermediate event: fourteen input and eight output.',
 'retrieved-cost':'And four cents. An intermediate snapshot can differ from the later retrieved one.','retrieved-delta':'Deltas only compare the same identity, scope, and source.'})
d.shot('repeated','Offline · Duplicate events',{'repeated-dupes':'Close it, and run Repeated usage. Two duplicate usage events were ignored, so nothing was counted twice.','repeated-scope':'The session reading stays correct.'})
d.shot('child','Offline · Child attribution',{'child-note':'Now Child activity. The note is explicit: child attribution must never be summed with the overlapping session totals.'})
d.shot('child-thread','Offline · A thread reading',{'child-thread-scope':'Here is a thread reading.','child-thread-identity':'It belongs to the primary agent thread.',
 'child-thread-tokens':'Its tokens are part of the session totals, not extra.','child-thread-cost':'So its two cents are already inside the session cost.'})
d.shot('budget','Offline · The budget is reached',{'budget-state':'Next, Budget reached. The session is paused by its budget.','budget-cap':'The cap is still fifty cents.','budget-outcome':'The outcome is paused, with the budget reached stop reason.'})
d.shot('raise','Offline · An explicit raise',{'raise-rule':'Open Explicit budget raise. Raising a cap can resume paused work immediately. The host allows one increase, and never removes a cap or raises it automatically.',
 'raise-cap':'Set the new cap to one hundred cents.','raise-ack':'Tick the acknowledgement that raising the cap can resume billed work.','raise-button':'And click Raise budget and resume.'})
d.shot('raised','Offline · Resumed under the new cap',{'raised-state':'The session is idle again.','raised-cap':'The cap is now one dollar, and the resumed work used a second host turn.','raised-outcome':'And the turn completed.'})
d.live_disabled('Now real Claude. With live mode disabled, Run live does not call Claude.','Live mode creates a billed, budgeted session with at most three host turns, and zero tools.')
d.restart('Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live-limits','Live · Keep the limits',{'live-budget':'Back in Lab fifteen, keep the fifty cent creation budget.','live-turns':'And the three-turn host limit.','live-tools':'No tools are allowed.'},note='LIVE RUN')
d.shot('live-run','Live · Run one budgeted session',{'live-run-button':'Click Run live. This creates one billed, budgeted session.'},note='LIVE RUN')
d.shot('live-session','Live · The real session',{'live-state':'The real session is idle.','live-cap':'Its cap is fifty cents, and one turn was used.','live-outcome':'The outcome is completed, at end of turn.','live-response':'And here is Claude\'s three-step plan.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-stream','Live · Observed request spans',{'live-stream-scope':'The first reading comes from the observed model request spans.','live-stream-tokens':'A few input tokens and about two hundred forty output tokens.',
 'live-stream-cost':'Spans do not report active time or list cost.'},note='LIVE RUN')
d.shot('live-retrieved','Live · A thread attribution',{'live-retrieved-scope':'After retrieving the session usage, the last reading is the thread attribution.','live-retrieved-tokens':'The same tokens as the session, because it is the same work.',
 'live-retrieved-cost':'And the same one cent list cost. Adding it to the session total would double count.','live-retrieved-delta':'The comparable change is zero.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-close','Live · Close the session',{'live-close-state':'Click Close usage session. The state is closed.','live-close-cleanup':'And the real session was archived.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the usage prove?',[
 ('vs-scope','SCOPE','Overlapping totals','Session, spans and threads<br>describe the same work','Session totals, request spans, and thread attribution described the same work.'),
 ('vs-time','TIME','Snapshots change','Intermediate events differ<br>from the retrieved snapshot','Intermediate events could differ from the retrieved idle snapshot.'),
 ('vs-cap','CAP','Explicit spending','The budget pauses work;<br>a raise is deliberate','And the budget paused new work, which resumed only after a deliberate raise.')],'List cost is not a guaranteed invoice total.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the usage module to the accounting and session ports.'),
 (3,'POST /session','Section three starts a bounded session.'),
 (5,'POST /{operation}','Section five handles send, context, and usage.'),
 (6,'POST /{operation}','Section six handles the budget raise and the end of the session.')])
d.mapping('Where are usage and maxBudgetUsd?',[
 ('map-sdk','CLAUDE AGENT SDK','Result usage and options','total_cost_usd in the result,<br>maxBudgetUsd and maxTurns','In the Agent SDK, the result message reports cost and usage, and options like max budget and max turns bound a query.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Session budget and usage','budget.max_list_cost on the session;<br>usage on retrieve and threads','Here, the platform budget is a max list cost on the session, usage is read from the session and its threads, and the host enforces its own turn limits.'),
 ('map-port','THIS PLATFORM','The Lab 15 port','server/lib/lab15-port.ts','The code is in the Lab fifteen port.')],'Budgets, usage retrieval and the raise are in server/lib/lab15-port.ts.')
d.port('port-budget','Source · The session budget',{'port-budget':'The budget is a limit with a max list cost, in US cents.','port-create':'The session uses agent with overrides with no tools, and a short system prompt.'})
d.port('port-usage','Source · Read usage, raise the cap',{'port-retrieve':'Usage is read by retrieving the session.','port-threads':'Thread attribution comes from listing the session threads.','port-raise':'And a deliberate raise updates the session budget.'})
d.knowledge('Finish with the knowledge check: how should overlapping usage scopes be handled?','Keep them separate. Cumulative and overlapping scopes can double count when they are added blindly.')
d.summary([('sum-read','READ','Usage by scope','Session, spans, threads.','You can now read usage by its scope and source.'),
 ('sum-separate','SEPARATE','Never add overlaps','Avoid double counting.','Keep overlapping scopes separate, instead of adding them.'),
 ('sum-bound','BOUND','Budgets and limits','Raise a cap only deliberately.','And bound spending with a budget and host limits, raising a cap only deliberately.')],'Lab 16 · Environment provenance')
d.finish()
