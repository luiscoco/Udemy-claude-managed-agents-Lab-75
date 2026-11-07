"""Lab 12 step-by-step walkthrough authored from real captures of the running platform (offline queue fixtures and one live two-message session)."""
from lab_video_common import Deck
d=Deck(12,'Lab 12 Step by Step: Multiple Messages in One Session, Offline and Live','Multiple messages');e=d.e
assert 'managed-api' in e['live_session'] and e['live_states']==['completed: completed']*2 and 'Cleanup: archived' in e['live_close']
d.cover('CLAUDE MANAGED AGENTS · LAB 12 · MULTIPLE MESSAGES','<h2>In this lab</h2><p>Keep one session.<br>Admit messages to a queue.<br>Wait while busy.<br>Close and clean up.</p>',
 'Welcome to Lab twelve, Multiple messages in one session. In this lecture, you will keep one session open, admit several messages through a bounded host queue, and prove the order in which their turns ran. We will run the offline fixtures, and then a real two-message session.')
d.overview('ADMIT · ACCEPT · COMPLETE','Admission, acceptance and completion are different evidence',[
 ('ov-concepts','1 · CONCEPTS','A retained session','Many messages share<br>one session identity','First, the concepts: several messages can share one retained session.'),
 ('ov-offline','2 · OFFLINE','Queue fixtures','Normal · slow · oversized<br>idle update · hang close','Second, the offline fixtures: a normal message, a slow one with a follow-up, a rejection, an idle update, and closing pending work.'),
 ('ov-live','3 · LIVE','Two real turns','A two-message script<br>in one real session','Third, a real session that answers two queued messages in order.'),
 ('ov-code','4 · CODE','Read the TypeScript','Queue, send, update<br>and archive','Finally, the TypeScript code behind the queue.')],
 'A local command ID is not a provider user event ID, and neither one proves completion.')
d.shot('lesson','Open Lab 12',{'lesson-title':'Open Lab twelve, Multiple messages in one session.','lesson-objective':'The objective: admit several messages to one retained session, and keep admission, acceptance, and completion evidence separate.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'Retained session','Open the Concept map. Region one: multiple messages can share one session identity.'),
 (2,'Local admission','Region two: a local command ID means only that the host accepted the work.'),
 (3,'Wait while busy','Region three: a follow-up waits for completed, idle evidence from the previous turn.'),
 (6,'Explicit close','Region six: closing cancels waiting work, and reports cleanup.')])
d.regions('lab',[(1,'Create offline session','In the Lab walkthrough, step one: create an offline session, and note its session ID.'),
 (2,'Send one message','Step two: queue a normal message, and inspect both kinds of IDs.'),
 (3,'Queue while busy','Step three: choose Slow, then queue a follow-up.'),
 (4,'Verify ordering','Step four: verify the ordering. Both turns complete in the same retained session.')])
d.shot('experiment','The queue experiment',{'exp-rule':'Open Run the exercise. The host accepts a bounded queue. Provider acceptance returns a user event ID, and completion needs correlated lifecycle evidence.',
 'exp-create':'Click Create offline session.','exp-message':'The message asks for a one-sentence description of the fictional Aurora Finch notebook.'})
d.shot('session','Offline · One retained session',{'session-mode':'The session is an offline authored fixture, with no API calls.','session-state':'It has a session ID, it is idle, and no commands are waiting.','session-config':'No tools, and no MCP servers.'})
d.shot('one','Offline · One message, two kinds of ID',{'one-state':'Click Queue message. The command completed.','one-text':'Here is the message text.',
 'one-ids':'Notice the two identifiers: the local command ID from the host queue, and the provider user event ID returned on acceptance.','one-times':'The admitted, processing, and finished times record the lifecycle.','one-output':'And the agent reply.'})
d.shot('slow','Offline · A slow message',{'slow-state':'Now choose the Slow scenario, and click Queue two-message script. The first, slow message completed.','slow-text':'It is the same notebook question.',
 'slow-ids':'It has its own command and event IDs.','slow-times':'Note when it finished.'})
d.shot('followup','Offline · The follow-up waited',{'followup-state':'The follow-up completed too.','followup-text':'It asks for one next step.','followup-ids':'Again, separate command and event IDs.',
 'followup-times':'The proof of ordering is in the times: it was admitted together with the slow message, but processing only started when the slow turn finished.','followup-output':'Then it was answered.'})
d.shot('oversized','Offline · Rejected before admission',{'oversized-status':'Now paste a message that is too long, and queue it. The host rejects it immediately.',
 'oversized-text':'The text is more than one thousand characters.','oversized-count':'The counter shows the limit. Oversized input is rejected before admission, so nothing is sent.'})
d.shot('tools','Offline · An idle tools update',{'tools-rule':'Open Idle configuration. Tools and MCP updates apply only to an idle session. Model and effort need a new session.',
 'tools-preset':'Choose the read-only preset.','tools-apply':'And click Apply idle tools update.'})
d.shot('tools-status','Offline · The update is confirmed',{'tools-status-text':'The update is confirmed: read only, the MCP server list is cleared, and the model is unchanged.','tools-config':'The session now reports read-only tools.'})
d.shot('close','Offline · Close and clean up',{'close-state':'Click Close queue and clean up. The state is closed.','close-cleanup':'And the cleanup ran.'})
d.shot('hang-close','Offline · Close pending work',{'hang-state':'In a new session, choose Hang and queue the two-message script, then close while the first turn is still running.',
 'hang-interrupt':'The host interrupted the session and confirmed idle.','hang-first':'The running turn was cancelled.','hang-second':'And the waiting follow-up was cancelled before submission. It never reached the provider.'})
d.live_disabled('Now real Claude. With live mode disabled, Run live does not call Claude.','The live setup needs the base agent, the environment, the server API key, and the live opt-in.')
d.restart('Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live-run','Live · Create a real session',{'live-run-button':'Back in Lab twelve, click Run live. This creates one billed session. Messages are then admitted through the queue controls.'},note='LIVE RUN')
d.shot('live-session','Live · A real retained session',{'live-mode':'The mode is live Managed Agents, from the managed API.','live-state':'The real session is idle, with nothing waiting.','live-config':'The resolved model and effort, with no tools and no MCP servers.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live1','Live · Turn 1',{'live1-state':'Click Queue two-message script. The first message completed.','live1-text':'The notebook question.','live1-ids':'With a real provider user event ID.',
 'live1-times':'Admitted, processing, finished.','live1-output':'And Claude\'s one-sentence answer.'},note='LIVE RUN')
d.shot('live2','Live · Turn 2 waited its turn',{'live2-state':'The follow-up completed too.','live2-text':'It asks for one next step.','live2-ids':'With its own user event ID.',
 'live2-times':'It was admitted at the same moment, but processing started only after turn one finished. Same session, strict order.','live2-output':'And Claude\'s next step builds on the first answer.'},note='LIVE RUN')
d.shot('live-close','Live · Close and archive',{'live-close-state':'Finally, close the queue. The state is closed.','live-close-cleanup':'And the real session was archived.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the queue prove?',[
 ('cmp-ids','IDENTITY','Two kinds of ID','Local command ID<br>and provider user event','Each message had a local command ID and, once accepted, a separate provider user event ID.'),
 ('cmp-order','ORDER','One turn at a time','Follow-ups wait for<br>completed idle evidence','The follow-up always waited until the previous turn finished, offline and live.'),
 ('cmp-close','CLOSE','Explicit cleanup','Waiting work is cancelled<br>before submission','And closing cancelled waiting work before it ever reached the provider.')],'Completion requires correlated lifecycle evidence, not admission.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the streaming input module to the queue and the session port.'),
 (3,'POST /session','Section three creates a retained session, offline or live.'),
 (4,'POST /events','Section four streams queue snapshots to the browser.'),
 (5,'POST /{action}','Section five handles send, script, tools, context, and end.')])
d.mapping('Where is streaming input?',[
 ('map-sdk','CLAUDE AGENT SDK','An async iterable prompt','The SDK streams user<br>messages into one query','In the Agent SDK, streaming input passes an async iterable of user messages into one query.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Events into a session','user.message events<br>sent to a retained session','Here, each message is a user dot message event sent to a retained session, and the host serializes them through its own queue.'),
 ('map-port','THIS PLATFORM','The Lab 12 port','server/lib/lab12-port.ts','The calls are in the Lab twelve port.')],'Session creation, events and idle updates are in server/lib/lab12-port.ts.')
d.port('port-create','Source · Create the retained session',{'port-retrieve':'The host retrieves the base agent first.',
 'port-create':'Then it creates the session with agent with overrides: no tools, no MCP servers, no skills, an optional model and effort, and a budget.'})
d.port('port-send','Source · Stream, send, update, archive',{'port-stream':'It opens the event stream for the session.','port-send':'Each queued message is sent as a user dot message event.',
 'port-update':'An idle tools update uses sessions dot update.','port-archive':'And closing archives the session.'})
d.knowledge('Finish with the knowledge check: are local admission and provider acceptance identical?','No. A retained-session queue needs separately correlated admission and outcome evidence.')
d.summary([('sum-retain','RETAIN','One session','Many messages, one identity.','You can now explain how several messages share one retained session.'),
 ('sum-admit','ADMIT','Separate evidence','Admission, acceptance, completion.','Why admission, acceptance, and completion are separate evidence.'),
 ('sum-close','CLOSE','Explicit cleanup','Cancel waiting work.','And how closing cancels waiting work and reports cleanup.')],'Lab 13 · MCP connections')
d.finish()
