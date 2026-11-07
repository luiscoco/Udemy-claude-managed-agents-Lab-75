"""Lab 21 step-by-step walkthrough authored from real captures of the running platform (offline command fixtures and one live model command)."""
from lab_video_common import Deck
d=Deck(21,'Lab 21 Step by Step: Host Commands and Prompt Expansion, Offline and Live','Host commands');e=d.e
assert 'Outcome: idle' in e['live'] and 'Aurora Finch' in e['live'] and 'archived' in e['live_closed']
d.cover('CLAUDE MANAGED AGENTS · LAB 21 · HOST COMMANDS','<h2>In this lab</h2><p>Own a command registry.<br>Expand commands exactly.<br>Reject bad input locally.<br>Keep local actions local.</p>',
 'Welcome to Lab twenty-one, Host commands and prompt expansion. In this lecture, your application owns a small command registry. A model command expands into one exact user message on a retained session, while local commands never reach the provider. We will run the offline fixtures, and then a real model command.')
d.overview('REGISTER · EXPAND · SEND','A model command is one exact user message',[
 ('ov-concepts','1 · CONCEPTS','A host registry','Model commands and<br>local commands','First, the concepts: the host registry has model commands and local commands.'),
 ('ov-offline','2 · OFFLINE','Command fixtures','Observation · checklist<br>invalid · unknown · inspect','Second, the offline fixtures: two model commands, invalid input, an unknown command, and local history.'),
 ('ov-live','3 · LIVE','One real command','The expanded message<br>sent to a real session','Third, one real model command on a live session.'),
 ('ov-code','4 · CODE','Read the TypeScript','Validated expansion<br>and one send','Finally, the TypeScript code that expands and sends.')],
 'These are host commands, not Claude Code slash commands.')
d.shot('lesson','Open Lab 21',{'lesson-title':'Open Lab twenty-one, Host commands and prompt expansion.','lesson-objective':'The objective: expand host-owned commands into exact user messages, and keep local commands away from the provider.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: the application owns the commands and their expansion.'),
 (2,'Core rule','Region two, the core rule: the host validates the expansion, and separates local actions from session messages.'),
 (3,'Keep the boundary clear','Region three: a local command never becomes a provider message.'),
 (6,'Put it to the test','Region six: compare provider send counts for model and local commands.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: prepare one bounded offline command session, and inspect the registry.'),
 (2,'Run the comparison','Step two: run a model command, and compare its exact expanded message with the session result.'),
 (3,'Inspect the boundary','Step three: try an invalid argument and an unknown command; both are rejected before any send.'),
 (4,'Follow the workflow','Step four: inspect and reset the local history, and compare the send counts.')])
d.shot('experiment','The command registry',{'exp-rule':'Open Run the exercise. The application owns this registry. A model command becomes an exact user message on a retained session; inspect and reset stay local.',
 'exp-registry':'Observation and checklist are model commands, with typed arguments and a template. Inspect and reset are local.'})
d.shot('prepared','Offline · Prepare a session',{'prepared-status':'Click Prepare offline session. No model message was sent.','prepared-session':'The session is prepared, with zero messages used.'})
d.shot('controls','Offline · Choose a command',{'controls-command':'Choose the observation command.','controls-species':'Pick a species from a fixed list.','controls-count':'A count.','controls-location':'And a location, also from a fixed list.'})
d.shot('observation','Offline · A model command',{'observation-kind':'Run host command. It is a model command.','observation-expanded':'Here is the exact expanded user message: species Aurora Finch, count three, location north marsh.',
 'observation-count':'One message used, and one provider send for this action.','observation-outcome':'The session is idle again, with the fixture reply.'})
d.shot('checklist','Offline · A second command',{'checklist-kind':'Now the checklist command.','checklist-expanded':'It expands to a three-item checklist request for north marsh.','checklist-count':'Two messages in the same session now.','checklist-outcome':'Idle again.'})
d.shot('invalid','Offline · Invalid arguments',{'invalid-status':'Click Try invalid args, which sends a traversal location. The host rejects the arguments.','invalid-session':'Still two messages: nothing was sent.'})
d.shot('unknown','Offline · Unknown command',{'unknown-status':'Try unknown command: rejected before any provider send.','unknown-session':'Still two messages.'})
d.shot('inspect','Offline · Inspect history',{'inspect-kind':'Inspect local history is a local command.','inspect-expanded':'Nothing is expanded.','inspect-count':'Zero provider sends.','inspect-history':'The history lists the two expanded model commands.'})
d.shot('reset','Offline · Reset history',{'reset-kind':'Reset local history is local too.','reset-expanded':'No expansion.','reset-count':'Zero sends.','reset-history':'The local history is now empty. The remote session is unchanged.'})
d.shot('closed','Offline · Close the session',{'closed-status':'Close the command session. The idle session is archived.','closed-session':'Closed, with two messages used.'})
d.live_disabled('Now real Claude. With live mode disabled, Run live does not call Claude.','Preparing is local; running a model command creates a billed Managed session.')
d.restart('Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live-run','Live · Prepare a live session',{'live-run-button':'Back in Lab twenty-one, click Run live. This prepares a live command session.'},note='LIVE RUN')
d.shot('live-prepared','Live · Prepared, nothing sent',{'live-prepared-status':'It is prepared. No model message was sent yet.','live-prepared-session':'Zero messages used.'},note='LIVE RUN')
d.shot('live-observation','Live · A real model command',{'live-observation-kind':'Run the observation command.','live-observation-expanded':'The same exact expanded message.',
 'live-observation-count':'One message, one provider send.','live-observation-outcome':'Claude formatted a field observation note for three Aurora Finches at north marsh, and left unknown details as placeholders.'},note='LIVE RUN')
d.shot('live-inspect','Live · Local history',{'live-inspect-kind':'Inspect local history.','live-inspect-expanded':'Nothing expanded.','live-inspect-count':'Zero provider sends: it stayed local.','live-inspect-history':'The history holds the one real command.'},note='LIVE RUN')
d.shot('live-closed','Live · Close and archive',{'live-closed-status':'Close the session. The real idle session was archived.','live-closed-session':'Closed, with one message used.'},note='LIVE RUN')
d.compare('Offline and live, compared','What did the commands prove?',[
 ('vs-expand','EXPAND','Exact messages','Typed arguments became<br>one exact user message','Typed arguments became one exact user message, offline and live.'),
 ('vs-reject','REJECT','Before sending','Invalid and unknown input<br>never reached the provider','Invalid and unknown input was rejected before any send.'),
 ('vs-local','LOCAL','Zero sends','Inspect and reset<br>never left the host','And local commands never left the host.')],'The registry is the application\'s, not Claude\'s.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the commands module to the command runner.'),
 (3,'POST /session','Section three prepares or closes the command session.'),
 (5,'POST /run','Section five runs a command: local, or expanded and sent.'),
 (6,'Return the module contract','Section six returns the router and its cleanup contract.')])
d.mapping('Where are slash commands?',[
 ('map-sdk','CLAUDE AGENT SDK','Slash commands','The SDK loads commands<br>from .claude/commands','In the Agent SDK, slash commands can be loaded from dot claude commands folders.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Host-owned commands','The host expands a command<br>into a user.message','Here, the application owns the registry, and a model command is simply an expanded user dot message on a retained session.'),
 ('map-port','THIS PLATFORM','The Lab 21 commands','server/lib/lab21-commands.ts','The code is in the Lab twenty-one commands module.')],'Expansion is in shared/lab21-slash-commands.ts; sending is in server/lib/lab21-commands.ts.')
d.port('port-expand','Source · Validated expansion',{'port-expand':'The observation command parses its arguments with a strict schema, then fills the exact template.'})
d.port('port-send','Source · Local or sent',{'port-local':'If nothing expands, the command is local, with zero provider sends.','port-send':'Otherwise, the exact expanded text is sent to the retained session.'})
d.knowledge('Finish with the knowledge check: what distinguishes a local command from a remote message?','The host must validate the expansion, and distinguish local actions from session messages.')
d.summary([('sum-own','OWN','The registry','Commands belong to the host.','You can now define a host-owned command registry.'),
 ('sum-expand','EXPAND','Exact messages','Validated, then sent once.','Expand a model command into one exact, validated message.'),
 ('sum-local','LOCAL','Zero sends','Inspect and reset stay local.','And keep local commands away from the provider.')],'Lab 22 · Project context')
d.finish()
