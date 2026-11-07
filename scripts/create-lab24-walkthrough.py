"""Lab 24 step-by-step walkthrough authored from real captures of the running platform (offline harness fixtures and one live terminal run of the real Messages and Managed loops)."""
from lab_video_common import Deck
d=Deck(24,'Lab 24 Step by Step: Who Owns the Agent Loop, Offline and Live','Agent loops');e=d.e
assert 'Final host stock: 5' in e['reject'] and 'Final host stock: 3' in e['reserve-managed-session']
live=d.transcript('live.raw.txt');raw=chr(10).join(live);split=next(i for i,l in enumerate(live) if l.startswith('== B'))
assert 'stop_reason tool_use' in raw and 'stop_reason end_turn' in raw and 'Model calls made by the app: 2' in raw and 'agent.custom_tool_use reserve_stock' in raw
assert 'session.status_idle (requires_action)' in raw and 'session.status_idle (end_turn)' in raw and 'Model calls made by the host: 0' in raw and 'Session archived: yes' in raw
d.cover('CLAUDE MANAGED AGENTS · LAB 24 · AGENT LOOPS','<h2>In this lab</h2><p>Compare three loop owners.<br>Keep one host handler.<br>Enforce host policy.<br>Cap the tool calls.</p>',
 'Welcome to Lab twenty-four, Who owns the agent loop. In this lecture, you will run the same fictional notebook reservation through three control flows: a manual Messages loop, the Messages SDK tool runner, and Managed session custom tools. The loop owner changes; the checked host effect does not. The app itself stays offline, so we finish with a real terminal run of a Messages loop and a Managed session.')
d.overview('SAME TASK · THREE LOOPS','Loop ownership changes; host responsibility does not',[
 ('ov-concepts','1 · CONCEPTS','Three owners','The application, the SDK<br>runner, or the Managed harness','First, the concepts: the application, the SDK tool runner, or the Managed harness can own the loop.'),
 ('ov-offline','2 · OFFLINE','Harness fixtures','Reserve 2 · Reject 5<br>Read then limit','Second, the offline runs: reserve two, reject five, and a one-call limit.'),
 ('ov-live','3 · LIVE','A real terminal run','Messages loop vs<br>Managed session, billed','Third, a real terminal run: the same reservation through the Messages API and a Managed session.'),
 ('ov-code','4 · CODE','Read the TypeScript','Typed adapters,<br>one host handler','Finally, the TypeScript code that adapts each loop to one host handler.')],
 'Fixture answers are not checked effects.')
d.shot('lesson','Open Lab 24',{'lesson-title':'Open Lab twenty-four, Who owns the agent loop.','lesson-objective':'The objective: compare who iterates the loop and who executes tools, across three harnesses.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: compare loop ownership across three harnesses.'),
 (2,'Core rule','Region two, the core rule: loop ownership and execution responsibility explain the difference.'),
 (3,'Keep the boundary clear','Region three: the host still validates and executes every tool call.'),
 (6,'Put it to the test','Region six: distinguish fixture answer text from the checked host stock.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: run Reserve two in all three harnesses, and compare the adapters and effects.'),
 (2,'Run the comparison','Step two: run Reject five, and confirm the host policy leaves the stock unchanged.'),
 (3,'Inspect the boundary','Step three: run Read then limit with a one-call cap.'),
 (4,'Follow the workflow','Step four: read the ownership notes, and separate answer text from the checked stock.')])
d.shot('experiment','The harness experiment',{'exp-rule':'Open Run the exercise. The same fictional notebook reservation runs through three control flows, and each invokes the same checked host handler.',
 'exp-harness':'Choose a harness.','exp-scenario':'A scenario.','exp-limit':'And a host call limit.'})
d.shot('ownership','The three owners',{'own-manual':'Manual: the application iterates, appends results, and cleans up.','own-runner':'Tool runner: the SDK iterates; a host callback validates and executes tools.',
 'own-managed':'Managed: the session harness iterates; the host answers custom tool pauses and archives sessions.'})
d.shot('reserve-manual-messages','Reserve 2 · Manual loop',{'reserve-manual-messages-head':'Reserve two in the manual Messages loop: reserved.','reserve-manual-messages-facts':'The application owns the loop. One tool call, and the stock is now three.',
 'reserve-manual-messages-trace':'The trace shows a Messages tool use adapted to the host.','reserve-manual-messages-effects':'The checked effect: five to three.'})
d.shot('reserve-messages-tool-runner','Reserve 2 · Tool runner',{'reserve-messages-tool-runner-head':'The same request in the SDK tool runner: reserved.','reserve-messages-tool-runner-facts':'The SDK owns the loop, and the stock is three.',
 'reserve-messages-tool-runner-trace':'Here the call arrives through a runner callback.','reserve-messages-tool-runner-effects':'The same checked effect: five to three.'})
d.shot('reserve-managed-session','Reserve 2 · Managed session',{'reserve-managed-session-head':'And with Managed session custom tools: reserved.','reserve-managed-session-facts':'The Managed harness owns the loop. Stock three.',
 'reserve-managed-session-trace':'The call is a Managed custom tool use.','reserve-managed-session-effects':'Again, five to three. Three owners, one identical host effect.'})
d.shot('reject','Reject 5 · Host policy',{'reject-head':'Now Reject five: rejected.','reject-facts':'One tool call, but the stock stays at five.','reject-trace':'The fixture asked to reserve five units.',
 'reject-effects':'The host policy allows only one or two units, so nothing changed.'})
d.shot('limit','Read then limit',{'limit-head':'Read then limit, with a host call limit of one.','limit-facts':'One tool call, stock still five.','limit-trace':'The read ran, then the host stopped the reservation at the call-count limit.',
 'limit-effects':'Only the read-only stock check happened.'})
d.shot('answer','Answer text is not the effect',{'answer-text':'The fixture answer says the host stopped at the limit. But it is the checked stock, not the answer, that proves it.'})
d.shot('live-disabled','Why the app stays offline',{'live-unavailable':'Run live is never available in this app lab.',
 'live-instructions':'The app never provisions or bills a reviewed agent with these custom tools. So the app stays offline, and we now make the real calls from a small script in the terminal.'})
cue=lambda l,rules:next((c for c,f in rules if f(l)),None)
d.terminal('Live · The application owns the Messages loop',[(l,cue(l,[('la-cmd',lambda l:'_live24.ts' in l),('la-use',lambda l:l.startswith('tool_use block')),('la-host',lambda l:l.startswith('App runs host')),
 ('la-second',lambda l:l.startswith('messages.create #2')),('la-count',lambda l:l.startswith('Model calls made by the app'))])) for l in live[:split]],
 {'la-cmd':'Run the script with node, in the cloned repo. Part A uses the Messages API directly.',
  'la-use':'The first messages dot create call stops with stop reason tool use. The response holds a tool use block, reserve stock, two notebook units. Claude does not run it: the application must.',
  'la-host':'So the application runs the same host handler as the lab. Reservation accepted, stock five to three.',
  'la-second':'Then the application calls messages dot create again, with one tool result, and the model ends its turn.',
  'la-count':'The application made both model calls and ran the tool. It owned the loop.'},note='LIVE RUN · REAL API CALLS')
d.terminal('Live · The Managed harness owns the session loop',[(l,cue(l,[('lb-session',lambda l:l.startswith('Session sesn_')),('lb-tool',lambda l:l.strip().endswith('agent.custom_tool_use reserve_stock')),
 ('lb-host',lambda l:l.startswith('Host handler')),('lb-model',lambda l:l.startswith('Model requests run by the platform')),('lb-archived',lambda l:l.startswith('Session archived'))])) for l in live[split:]],
 {'lb-session':'Part B creates one Managed session with the existing agent, overriding its tools with only the reserve stock custom tool. The host sends one user message, and makes no model call.',
  'lb-tool':'The platform starts running, makes its own model request, and emits agent dot custom tool use. The session goes idle with requires action.',
  'lb-host':'The host answers that one pause with the same handler, five to three, and sends user dot custom tool result. The platform resumes its own loop, and ends with end turn.',
  'lb-model':'The platform ran two model requests. The host made zero model calls, and answered one tool call.',
  'lb-archived':'Finally, the script archived the session.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','Who owned the loop, for real?',[
 ('vs-messages','MESSAGES','The application','Two model calls and<br>one tool run by the app','With the Messages API, the application made both model calls and ran the tool itself.'),
 ('vs-managed','MANAGED','The platform','Two model requests<br>inside the session','In the Managed session, the platform ran both model requests, and paused only for the custom tool.'),
 ('vs-host','HOST','Same checked effect','Stock 5 to 3<br>offline and live','In every case, offline and live, the host handler checked the effect: stock five to three.')],'Loop ownership moved; the host effect boundary did not.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the harness module to the SDK contracts.'),
 (3,'POST /run','Section three runs one harness scenario.'),
 (4,'Decision and early response','Section four handles the decision and the early response.'),
 (5,'Decision and early response','Section five completes the response.')])
d.mapping('Who runs query()?',[
 ('map-sdk','CLAUDE AGENT SDK','The SDK runs the loop','query() iterates and runs<br>tools in your process','In the Agent SDK, query runs the agent loop, and executes tools, in your own process.'),
 ('map-managed','CLAUDE MANAGED AGENTS','The session runs the loop','The harness iterates; the host<br>answers custom tool pauses','Here, the Managed session harness iterates in the cloud, and your host answers custom tool pauses.'),
 ('map-port','THIS PLATFORM','The Lab 24 harnesses','server/lib/lab24-harnesses.ts','The comparison is in the Lab twenty-four harnesses module.')],'Loop owners and typed adapters are in server/lib/lab24-harnesses.ts.')
d.port('port-owners','Source · Owners and adapters',{'port-owners':'Each harness has a named loop owner.','port-type':'And each is adapted to its own call type before the same host handler runs.'})
d.knowledge('Finish with the knowledge check: what distinguishes the compared agent loops?','Loop ownership and execution responsibility explain the architectural difference.')
d.summary([('sum-owner','OWNER','Who iterates','Application, SDK, or harness.','You can now identify who owns each agent loop.'),
 ('sum-host','HOST','Who executes','The host checks every effect.','Explain why the host still checks every tool effect.'),
 ('sum-proof','PROOF','Checked stock','Not the answer text.','And prove an effect with checked state, not answer text.')],'Lab 25 · Context and compaction')
d.finish()
