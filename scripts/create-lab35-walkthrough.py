"""Lab 35 step-by-step walkthrough authored from real captures of the running platform (offline: an authored file-backed mirror; live: a small script mirroring a real Managed Agents session's events)."""
from lab_video_common import Deck
d=Deck(35,'Lab 35 Step by Step: Event Mirrors and Conversation Indexes, Offline and Live','Session stores');e=d.e
assert e['liveButtons']==0 and e['scenarios']==['normal','append-failure','missing-thread','restart','reconnect']
assert e['status_eager']=='complete; 2 persisted and 0 pending canonical event(s).' and e['status_reconcile']=='complete; 3 persisted and 0 pending canonical event(s).'
assert '(archived)' in e['archived'] and e['status_batched']=='incomplete; 0 persisted and 2 pending canonical event(s).'
assert e['status_flushed']=='complete; 2 persisted and 0 pending canonical event(s).' and e['status_crash']=='incomplete; 0 persisted and 0 pending canonical event(s).'
assert 'Append failure: true' in e['append-failure'] and e['reset']=='Local conversation mirror reset.' and 'does not restore a transcript into a live session' in e['nolive']
live=d.transcript('live.raw.txt');L=' | '.join(live)
assert 'Sync 1: 2 pages of events.list (limit 5) → 10 events mirrored' in L and 'mirror IDs and order match: yes' in L
assert 'Sync 2 (same session again): 0 new events · mirror still 10' in L and 'archived_at set · status terminated' in L
assert 'Local mirror after archive: 10 events, unchanged' in L and 'Send to archived session → refused: 400' in L and 'local mirror folder deleted (yes)' in L
split=next(i for i,l in enumerate(live) if l.startswith('Remote list'))
d.cover('CLAUDE MANAGED AGENTS · LAB 35 · SESSION STORES','<h2>In this lab</h2><p>Mirror canonical events.<br>Compare eager and batched.<br>Survive a crash honestly.<br>Never own remote state.</p>',
 'Welcome to Lab thirty-five, Event mirrors and conversation indexes. In this lecture, you will keep a bounded local copy of canonical session events, compare eager and batched flushing, see what a crash loses, and learn why the mirror never owns the remote session. The app stays offline, and then a small script mirrors the events of a real Managed Agents session, live.')
d.overview('MIRROR · FLUSH · RECOVER','A local copy, never the remote authority',[
 ('ov-concepts','1 · CONCEPTS','Host mirrors','Canonical events by thread,<br>indexed by session ID','First, the concepts: a host mirror stores canonical events by thread and indexes an owned session ID.'),
 ('ov-flush','2 · FLUSH','Eager or batched','Persisted versus pending;<br>a crash loses pending records','Second, eager and batched flushing: what is persisted, what is pending, and what a crash loses.'),
 ('ov-remote','3 · REMOTE','Remote stays in charge','Reconcile without duplicates;<br>archive cannot be undone locally','Third, reconciling without duplicates, and an archived session that a mirror cannot resume.'),
 ('ov-code','4 · LIVE AND CODE','Real events, then code','A live mirror of a real session;<br>then the TypeScript','Finally, a live terminal run that mirrors a real session, and the TypeScript code behind the mirror.')],
 'The mirror owns its bounded local copy, not the remote session.')
d.shot('lesson','Open Lab 35',{'lesson-title':'Open Lab thirty-five, Event mirrors and conversation indexes.','lesson-objective':'The objective: persist a bounded local mirror of canonical session events by thread, without claiming ownership of remote Managed session state.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: persist a bounded local mirror of canonical events, by thread.'),
 (2,'Core rule','Region two, the core rule: the mirror owns its bounded local copy, not remote session authority.'),
 (3,'Keep the boundary clear','Region three: a local event mirror must not claim ownership of remote state.'),
 (6,'Put it to the test','Region six: compare flush strategies, and identify which records survive a simulated crash.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: start eager and batched mirrors, and compare persisted versus pending events.'),
 (2,'Run the comparison','Step two: simulate a crash and restart before flushing a batch, and identify the lost pending records.'),
 (3,'Inspect the boundary','Step three: try an append failure, and reconcile canonical history without duplicates.'),
 (4,'Follow the workflow','Step four: inspect the archived-session case. The mirror cannot invent history or restore a sandbox.')])
d.shot('experiment','The event mirror experiment',{'exp-rule':'Open Run the exercise. A file-backed host mirror stores canonical s-e-v-t events by thread, and indexes an owned session ID. It cannot recreate a remote sandbox or resume an archived session.',
 'exp-scenario':'Choose an offline scenario: normal, append failure, missing thread, restart, or reconnect.','exp-flush':'Choose the flush strategy: eager or batched.','exp-start':'Start with normal and eager, and select Start mirror.'})
d.shot('eager','Offline · Eager mirror',{'eager-session':'The mirror creates a conversation, indexed to a remote fixture session that is idle.',
 'eager-counts':'With eager flushing, two events are persisted and none are pending. Provider calls: zero.','eager-events':'Both events sit on the main thread: the user turn, and the agent reply.',
 'eager-status':'The mirror is complete.'})
d.shot('reconcile','Offline · Reconcile history',{'reconcile-counts':'Select Reconcile history. Now three events are persisted.',
 'reconcile-events':'Event one was already stored, so it is not duplicated. Only event two is new, from the worker thread.','reconcile-status':'The mirror is still complete.'})
d.shot('archived','Offline · Archive the remote fixture',{'archived-session':'Select Archive remote fixture. The remote session is now archived.',
 'archived-buttons':'Reconcile history is disabled: a mirror cannot resume an archived session.','archived-note':'The local mirror neither owns the remote session nor restores its sandbox.',
 'archived-status':'The local copy keeps its three events.'})
d.shot('batched','Offline · Batched mirror',{'batched-counts':'Now start a normal mirror with batched flushing. Zero events are persisted, and two are pending in memory.',
 'batched-events':'No persisted events yet.','batched-status':'Until the batch is flushed, the mirror is incomplete.'})
d.shot('flushed','Offline · Flush the batch',{'flushed-counts':'Select Flush batch. Both pending events are now persisted.','flushed-events':'The same two canonical events, written to the thread file.',
 'flushed-status':'The mirror is complete again.'})
d.shot('crash','Offline · Crash before the flush',{'crash-counts':'Start the restart scenario, batched, and select Simulate crash and restart before flushing. The two pending events are gone.',
 'crash-events':'Nothing was persisted.','crash-status':'The mirror honestly reports itself as incomplete. Only the remote session still holds those events.'})
d.shot('append-failure','Offline · Append failure',{'append-counts':'Now start the append failure scenario, eager. The append fails, so zero events are persisted.',
 'append-events':'The mirror has no events, and the remote state is unchanged.','append-failure-status':'The mirror is marked incomplete, rather than pretending to be in sync.'})
d.shot('reset','Offline · Reset the local mirror',{'reset-status':'Finally, Reset local mirror deletes the local copy. Only the local files are removed.'})
d.shot('no-live','The app stays offline',{'no-live-text':'The app stays offline in this lab: there is no Run live button, and the fixture does not restore a transcript into a live session. A second host must use the Managed API with an owned session ID. So now we make those real calls from a small script, in the terminal of the project.'})
d.terminal('Live · Mirror a real session',[(l,'lv-run' if l.startswith('PS ') else 'lv-session' if l.startswith('Session sesn_') else 'lv-turn' if l.startswith('One user turn') else 'lv-sync' if l.startswith('Sync 1') else 'lv-files' if 'Local files' in l else None) for l in live[:split]],
 {'lv-run':'The script reads the agent and environment IDs from dot env, and runs with node and t s x.',
  'lv-session':'It creates one session with no tools. The session starts idle.',
  'lv-turn':'It sends one short user turn, a fictional Aurora Finch field note, and waits until the session is idle again.',
  'lv-sync':'Sync one pages through events dot list, five events at a time: two pages, ten events mirrored. Every event type is stored, from the user message to session status idle.',
  'lv-files':'The local store is one events file with ten lines, and an index written atomically with a rename.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · Idempotent sync, remote in charge',[(l,'lv-match' if l.startswith('Remote list') else 'lv-again' if l.startswith('Sync 2') else 'lv-archived' if l.startswith('Archived remote') else 'lv-refused' if l.startswith('Send to archived') else 'lv-cleanup' if l.startswith('Cleanup') else None) for l in live[split:]],
 {'lv-match':'The full remote list also has ten events, and the mirror event IDs and order match: yes.',
  'lv-again':'A second sync of the same session adds zero new events. The mirror still holds ten: the sync is idempotent.',
  'lv-archived':'Then the script archives the remote session. Retrieve shows archived at set, and status terminated. The local mirror is unchanged, because it stores no session state.',
  'lv-refused':'Sending to the archived session is refused: four hundred, bad request error. The mirror cannot resume it.',
  'lv-cleanup':'Finally, the local mirror folder is deleted. The remote session remains the source of truth.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the real session prove?',[
 ('vs-copy','COPY','Canonical events only','Ten real sevt_ events,<br>same IDs and order','Like the fixture, the live mirror stores canonical events, and its IDs and order match the remote list.'),
 ('vs-dedupe','DEDUPE','No duplicates','Reconcile adds only new events;<br>a second sync adds zero','Reconcile in the app, and the second live sync, both skip events already stored.'),
 ('vs-archive','ARCHIVE','Remote is authoritative','Archived remotely;<br>the mirror cannot resume it','And archive is a remote state: the real API refused a new message, whatever the mirror holds.')],'Eager versus batched flushing and crash loss are host choices: the app shows them, the API does not.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect this module to the mirror schemas and the delegated implementation.'),
 (3,'POST /run','Section three, post slash run, validates the request and starts a mirror.'),
 (5,'POST /manage','Section five, post slash manage, runs flush, crash and restart, reconcile, and archive.'),
 (6,'POST /failures','Section six, post slash failures, turns the simulated append failure on and off.')])
d.mapping('Where does the session store live?',[
 ('map-sdk','CLAUDE AGENT SDK','A SessionStore adapter','Your process persists<br>and resumes the transcript','In the Agent SDK, a session store adapter in your own process persists the transcript, so a query can resume from it.'),
 ('map-managed','CLAUDE MANAGED AGENTS','The remote session','events.list is canonical;<br>a host keeps only a copy','This platform uses Managed Agents beta sessions, not the Agent SDK. The remote session owns its events, and a host continues it through the API, not by replaying a transcript.'),
 ('map-port','THIS PLATFORM','The Lab 35 mirror','server/lib/lab35-mirror.ts','Here, the Lab thirty-five mirror models that copy with an authored, file-backed fixture.')],'No Agent SDK SessionStore is installed: the mirror is in server/lib/lab35-mirror.ts.')
d.port('port-append','Source · Atomic index, safe appends',{'port-atomic':'The index is written to a temporary file, then renamed into place: an atomic write.',
 'port-append-fail':'A failing append marks the mirror incomplete, and throws, without touching remote state.','port-dedupe':'An event ID that is already stored is skipped, so reconcile never duplicates.'})
d.port('port-remote','Source · Offline only, eager or batched',{'port-live-refused':'A live run is refused: continuing a real session needs an owned session ID and a dedicated adapter.',
 'port-flush':'Eager flushing appends each event at once. Batched flushing keeps it pending in memory.'})
d.port('port-recover','Source · Crash and archive',{'port-crash':'On crash and restart, any pending events are lost, and the mirror is marked incomplete.',
 'port-archived':'And an archived remote session cannot be resumed by a mirror.'})
d.knowledge('Finish with the knowledge check: what does a local session mirror own?','Its bounded local copy, not remote session authority. A local event mirror must not claim ownership of remote state.')
d.summary([('sum-copy','COPY','Mirror canonical events','By thread, without duplicates.','You can now mirror canonical events by thread, and reconcile without duplicates.'),
 ('sum-flush','FLUSH','Know what is pending','A crash loses unflushed records.','Choose eager or batched flushing, knowing that a crash loses pending records.'),
 ('sum-remote','REMOTE','Remote is authoritative','The mirror never owns the session.','And keep the remote session as the source of truth: the mirror is only a copy.')],'Lab 36 · Remote transport and host runners')
d.finish()
