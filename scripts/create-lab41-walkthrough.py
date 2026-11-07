"""Lab 41 step-by-step walkthrough authored from real captures of the running platform (offline: an authored Managed-shaped session fixture; live: a small script that walks one real Managed Agents session through its whole lifecycle and compares each state with the lab's own model)."""
from lab_video_common import Deck
d=Deck(41,'Lab 41 Step by Step: Managed Session Lifecycle Comparison, Offline and Live','Sessions and context');e=d.e
assert e['liveButtons']==0 and e['scenarios']==['one-shot','retained','interrupt-continue','reconnect','archived-refusal']
assert e['ready']=='Ready. Offline Managed-shaped sessions do not contact Anthropic.'
assert e['status_oneshot']=='archived; 2 listed events; 1 created session; 0 reconnect creations.' and 'sessions.archive after idle' in e['oneshot']
assert e['status_retained']=='idle; 2 listed events; 1 created session; 0 reconnect creations.' and e['status_early-refusal']=='Archive first to inspect refusal.'
assert e['status_second']=='idle; 4 listed events; 1 created session; 0 reconnect creations.' and 'agent.message: The fictional project name is Aurora Notebook.' in e['second']
assert 'events.list hydrated history; no sessions.create' in e['reconnect'] and 'Reconnect creations: 0.' in e['reconnect']
assert 'status interrupted-idle.' in e['interrupt'] and 'user.interrupt; fixture idle confirmed; same session retained' in e['interrupt']
assert 'status archived.' in e['archived'] and 'Archive count: 1.' in e['archived'] and 'Archived session refused new send; no events.send' in e['archived']
assert e['status_inspect'].startswith('Resolved session sesn_fixture_') and e['status_inspect'].endswith('; 4 events.')
assert 'does not import that runtime' in e['historical'] and e['calls']=='Created sessions: 1. Reconnect creations: 0. Archive count: 1. Provider calls: 0.'
assert e['nolive']=='Offline Managed-shaped port; resolved fixture IDs and host actions, not billed provider evidence.'
live=d.transcript('live.raw.txt');L=' | '.join(live)
assert "Lab41Lifecycle 'retained' · status idle · providerCalls 0" in L and '· status idle | ' in L
assert 'session.status_running streamed · sessions.retrieve: running' in L and 'stop_reason end_turn · sessions.retrieve: idle · agent.message 1' in L
assert 'archived_at null · sessions.list shows it: yes' in L and 'user.message 1 · agent.message 1' in L
assert 'status terminated' in L and 'sessions.list default shows it: no · with include_archived: yes' in L
assert 'user.message after archive → refused 400 BadRequestError' in L and 'refused 409 Archived session refuses a new turn.' in L
assert 'Lifecycle states matching the lab model: 5 of 5 · sessions created 1 · user turns 1' in L and 'match NO' not in L
split=next(i for i,l in enumerate(live) if l.startswith('[4]'))
d.cover('CLAUDE MANAGED AGENTS · LAB 41 · SESSIONS AND CONTEXT','<h2>In this lab</h2><p>One-shot or retained.<br>Reconnect without a new session.<br>Archive after idle.<br>Refuse a send after archive.</p>',
 'Welcome to Lab forty one, Managed session lifecycle comparison. In this lecture, you will compare a one-shot session, a retained session, and a reconnect, using Managed session events, IDs, and archive evidence. The app stays offline, and then a small script walks one real Managed Agents session through its whole lifecycle, live, and compares every state with the lab\'s own model.')
d.overview('CREATE · TURN · ARCHIVE','One session, from create to archive',[
 ('ov-concepts','1 · CONCEPTS','Three workflows','One-shot, retained,<br>and reconnect','First, the concepts: one-shot, retained, and reconnect workflows, and the session evidence that tells them apart.'),
 ('ov-offline','2 · OFFLINE','The fixture lifecycle','Second turn, reconnect,<br>interrupt, archive, refusal','Second, the offline exercise: a second turn on the same session, a reconnect, an interrupt, an archive, and a refused send.'),
 ('ov-live','3 · LIVE','A real session lifecycle','Create, running, idle, list,<br>archive, refused send','Third, a live terminal run: one real session, observed in every state, and compared with the lab\'s own lifecycle model.'),
 ('ov-code','4 · CODE','The lifecycle rules','TypeScript guards<br>in lab41-lifecycle.ts','Finally, the TypeScript code that holds the lifecycle rules.')],
 'Reconnect lists the history of the same session: it never creates a new one.')
d.shot('lesson','Open Lab 41',{'lesson-title':'Open Lab forty one, Managed session lifecycle comparison.','lesson-objective':'The objective: compare one-shot, retained and reconnect workflows, using current Managed session events, IDs, and archive evidence.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: one-shot, retained, and reconnect workflows, side by side.'),
 (2,'Core rule','Region two, the core rule: reusing the same owned session keeps event continuity. A different session starts fresh.'),
 (3,'Keep the boundary clear','Region three: each workflow requires explicit session evidence, such as the resolved session ID, listed history, and archive evidence.'),
 (6,'Put it to the test','Region six: describe the Managed event sequence for continuing an idle session.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: start one-shot, and inspect the sent user event, the streamed agent event, idle confirmation, and archive.'),
 (2,'Run the comparison','Step two: start retained mode, and send a second turn using the same session ID.'),
 (3,'Inspect the boundary','Step three: reconnect by listing history, and confirm that no additional session is created.'),
 (4,'Follow the workflow','Step four: interrupt an idle retained session, and continue or archive it after the fixture idle confirmation.')])
d.shot('experiment','The lifecycle experiment',{'exp-rule':'Open Run the exercise. The resolved IDs, listed events, and archive evidence all come from a fixture adapter.',
 'exp-scenario':'Choose an offline workflow: one-shot, retained, interrupt continue, reconnect, or archived refusal.','exp-start':'Start workflow runs the chosen workflow.',
 'exp-status':'Ready. Offline Managed-shaped sessions do not contact Anthropic.'})
d.shot('oneshot','Offline · A one-shot session',{'oneshot-run':'Start the one-shot workflow. One resolved session, and its status is already archived.',
 'oneshot-counts':'One created session, zero reconnect creations, an archive count of one, and zero provider calls.',
 'oneshot-seq':'The event sequence: sessions dot create, events dot send with a streamed agent reply, a confirmed idle, and then sessions dot archive after idle.',
 'oneshot-history':'The listed history holds one user message, the fictional project Aurora Notebook, and one agent message.','oneshot-status':'The status: archived, two listed events, one created session.'})
d.shot('no-live','The app stays offline',{'no-live-calls':'The app stays offline in this lab: there is no Run live button, and every snapshot reports zero provider calls.',
 'no-live-text':'These are resolved fixture IDs and host actions, not billed provider evidence. So later, we make the real calls from a small script, in the terminal of the project.'})
d.shot('retained','Offline · A retained session',{'retained-run':'Now start the retained workflow. The same first turn runs, but the session stays idle.',
 'retained-seq':'There is no archive step: the host keeps owning this session.','retained-status':'Idle, two listed events, one created session.'})
d.shot('early-refusal','Offline · Refusal needs an archive first',{'early-buttons':'Select send after archive while the session is still idle.',
 'early-refusal-status':'The app answers: archive first to inspect refusal. Nothing was refused yet, because nothing is archived.'})
d.shot('second','Offline · A second turn, same session',{'second-seq':'Select second turn. A second events dot send goes to the same session, and idle is confirmed again.',
 'second-history':'The history now has four events. The second answer is: the fictional project name is Aurora Notebook. The session remembered it.',
 'second-status':'Still one created session: four listed events.'})
d.shot('reconnect','Offline · Reconnect',{'reconnect-seq':'Select reconnect. Events dot list hydrates the history: no sessions dot create.',
 'reconnect-counts':'Reconnect creations stay at zero. Reconnect means the same session, not a new conversation.'})
d.shot('interrupt','Offline · Interrupt',{'interrupt-run':'Select interrupt. The status becomes interrupted idle.',
 'interrupt-seq':'User dot interrupt, the fixture confirms idle, and the same session is retained.'})
d.shot('archived','Offline · Archive, then a refused send',{'archived-run':'Now select archive. The status is archived.','archived-counts':'The archive count is one.',
 'archived-seq':'The sequence records sessions dot archive after idle.',
 'archived-refused':'Then select send after archive. The archived session refuses the new send, and no events dot send is made.'})
d.shot('inspect','Offline · Inspect state',{'inspect-users':'Inspect state resolves the run again. Two user event IDs, two agent event IDs, all on one session.',
 'inspect-status':'Resolved session, four events.'})
d.shot('historical','The historical model',{'historical-text':'The historical panel explains that older local-process examples owned a subprocess and local files. This comparison does not load that runtime, or claim compatibility with it.'})
d.terminal('Live · Create and one real turn',[(l,'lv-model' if l.startswith('Lab 41 model') else 'lv-create' if l.startswith('[1]') else 'lv-running' if l.startswith('[2]') else 'lv-idle' if l.startswith('[3]') else 'lv-match' if l.startswith('    model: stream') else None) for l in live[:split]],
 {'lv-model':'The script imports the lab\'s own Lab41Lifecycle class, and runs its retained workflow as the model: status idle, zero provider calls.',
  'lv-create':'Step one: sessions dot create returns a real session, with status idle. That matches the model.',
  'lv-running':'Step two: it opens the event stream, and sends one user message, about the fictional project Aurora Notebook. Session status running is streamed, and sessions dot retrieve also says running.',
  'lv-idle':'Step three: session status idle, with stop reason end turn. Retrieve says idle, and there is one agent message, after two point eight seconds.',
  'lv-match':'The model also streams one agent reply, and confirms idle twice: match, yes.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · List, archive and a refused send',[(l,'lv-list' if l.startswith('[4]') else 'lv-archive' if l.startswith('[5]') else 'lv-hidden' if l.startswith('    sessions.list default') else 'lv-refused' if l.startswith('[6]') else 'lv-total' if l.startswith('Lifecycle states') else None) for l in live[:1]+live[split:]],
 {'lv-list':'Step four, the reconnect view: retrieve says idle, with no archived at time, and sessions dot list shows the session. Events dot list holds one user message and one agent message, like the model. No new session is created.',
  'lv-archive':'Step five: sessions dot archive. Archived at now has a time stamp, and the real status is terminated. The model calls this state archived, with an archive count of one.',
  'lv-hidden':'After archive, the default sessions dot list no longer shows it. It appears only with include archived.',
  'lv-refused':'Step six: a user message after archive is refused by the API, with a four hundred bad request. The model refuses too, with four hundred nine: archived session refuses a new turn.',
  'lv-total':'Five of five lifecycle states match the lab model, with one session created, and one user turn.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the real session prove?',[
 ('vs-idle','IDLE','Confirmed, not assumed','Fixture idle is authored;<br>live idle was streamed and retrieved','The fixture authors its idle confirmation. Live, idle arrived on the stream with end turn, and sessions dot retrieve confirmed it.'),
 ('vs-reconnect','RECONNECT','The same session','No create; events.list<br>returns the same turn','In both, a reconnect lists the history of the same session. Nothing new is created.'),
 ('vs-archive','ARCHIVE','A final state','archived in the model;<br>archived_at + terminated live','And archive is final. The model says archived. The real API sets archived at, reports terminated, and refuses the next send with a four hundred.')],'The model is the same code: the live script imports Lab41Lifecycle from the app.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect this module to the Lab forty one schemas and the lifecycle class.'),
 (2,'Create the concept router','Section two creates the concept router, which accepts only the local origin and an experiment owner.'),
 (3,'POST /continue','Section three, post slash continue, validates one continuation action: second turn, interrupt, reconnect, archive, or send after archive.'),
 (4,'Decision and early response','Section four: an invalid action is answered early, with a four hundred, before the lifecycle class is called.')])
d.mapping('Who owns the session lifecycle?',[
 ('map-sdk','CLAUDE AGENT SDK','A local process','Your process owns<br>the loop and its transcript','In the Agent SDK, your own process owns the agent loop, and a session is a local transcript that you resume.'),
 ('map-managed','CLAUDE MANAGED AGENTS','A remote session','create, events.send, retrieve,<br>events.list, archive','This platform uses Managed Agents beta sessions, not the Agent SDK. The remote session has a lifecycle of its own: create, send, stream until idle, list, and archive.'),
 ('map-port','THIS PLATFORM','The Lab 41 lifecycle class','server/lib/lab41-lifecycle.ts','Here, the Lab forty one lifecycle class models that lifecycle with a fixture port, and enforces its rules.')],'No local process or JSONL compatibility is claimed: the rules live in server/lib/lab41-lifecycle.ts.')
d.port('port-turn','Source · A turn ends on confirmed idle',{'port-refuse':'A new turn is refused, with four hundred nine, when the session is archived.',
 'port-idle':'Otherwise the host streams events until session status idle.','port-retrieve':'And sessions dot retrieve must also confirm idle, or the turn fails.'})
d.port('port-archive','Source · Archive once',{'port-archive-once':'Archive is refused if the session is already archived.',
 'port-oneshot':'One-shot and archived refusal archive right after the first turn. Retained keeps the session.'})
d.port('port-reconnect','Source · Reconnect and refusal',{'port-reconnect-refused':'An archived session cannot reconnect.',
 'port-hydrate':'Reconnect only hydrates history with events dot list: no sessions dot create.','port-after-archive':'And a send after archive is recorded as refused, with no events dot send.'})
d.knowledge('Finish with the knowledge check: what distinguishes reconnect from a new conversation?','The answer: reusing the owned session and its event continuity. Retained, one-shot and reconnect workflows all require explicit session evidence.')
d.summary([('sum-workflows','WORKFLOWS','One-shot or retained','Archive after idle, or keep it.','You can now tell a one-shot session, archived after idle, from a retained session that the host keeps.'),
 ('sum-reconnect','RECONNECT','Same session, no create','events.list hydrates history.','A reconnect lists the history of the same session, and creates nothing new.'),
 ('sum-archive','ARCHIVE','Archive is final','The next send is refused.','And an archived session refuses the next send, offline in the model, and live in the real API.')],'Lab 42 · Bounded web research and citations')
d.finish()
