"""Lab 27 step-by-step walkthrough authored from real captures of the running platform (offline host task ledger fixture, plus a live terminal run against the Managed Agents API)."""
from lab_video_common import Deck
d=Deck(27,'Lab 27 Step by Step: Remote Work Beyond a Browser Connection, Offline and Live','Background tasks');e=d.e
assert 'Browser: detached' in e['detached'] and 'Task: running' in e['detached']
assert 'Observed event IDs: task-started, child-started, task-completed.' in e['reconnected'] and 'Provider creates: 1. Duplicate cards: 0.' in e['reconnected']
assert 'Stop evidence: confirmed-idle' in e['stopped'] and 'Task: closed. Remote: archived.' in e['oneshot']
live=d.transcript('live.raw.txt')
for key in ('Remote status right after detach: running','same session: yes · status idle','already seen, skipped by ID: 1',
 'agent.message: 1 (exactly once)','did not stop the remote work: reply produced after detach: yes','Archived: yes'):assert any(key in l for l in live),key
split=next(i for i,l in enumerate(live) if l.startswith('Waited'))
assert e['policy']=='Host policy disables background work.' and 'Live mode is unavailable until a configured Managed adapter is reviewed.' in e['nolive']
d.cover('CLAUDE MANAGED AGENTS · LAB 27 · BACKGROUND TASKS','<h2>In this lab</h2><p>Detach the browser.<br>Reconnect the same task.<br>Stop, then confirm idle.<br>Respect host policy.</p>',
 'Welcome to Lab twenty-seven, Remote work beyond a browser connection. In this lecture, you will open a slow task, detach the browser while it keeps running, reconnect to the same task without creating duplicates, stop work and confirm idle before closing, and see the host policy refuse background work. Then a small script makes real Managed Agents calls, so you can watch a live session keep working after the stream detaches.')
d.overview('DETACH · RECONNECT · STOP','The host ledger, not the browser, owns accepted work',[
 ('ov-concepts','1 · CONCEPTS','Remote task identity','Task, session, thread<br>and browser connection','First, the concepts: a task, its session and thread, and a separate browser connection.'),
 ('ov-offline','2 · OFFLINE · LIVE','Detach and reconnect','Same task, deduplicated IDs<br>plus a real terminal run','Second, the offline experiment: detach, reconnect, and check that nothing was duplicated. Then a live terminal run does the same with a real session.'),
 ('ov-stop','3 · STOP','Stop before close','Confirm idle,<br>then archive','Third, stopping a running task, and closing only after it is idle.'),
 ('ov-code','4 · CODE','Read the TypeScript','The host task ledger<br>and its routes','Finally, the TypeScript code behind the task ledger.')],
 'Detaching the browser changes only the connection state.')
d.shot('lesson','Open Lab 27',{'lesson-title':'Open Lab twenty-seven, Remote work beyond a browser connection.','lesson-objective':'The objective: track authored remote work in a host ledger across browser detach and reconnect, without creating duplicate sessions or task cards.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: the browser starts a task, the task continues after the browser detaches, and the host ledger tracks it.'),
 (2,'Core rule','Region two, the core rule: avoid duplicate sessions or task cards for accepted work.'),
 (3,'Keep the boundary clear','Region three: on reconnect, follow the host ledger rather than duplicating accepted work.'),
 (6,'Put it to the test','Region six: reconnect, and identify the evidence that the original task stopped.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: open a slow offline task, and note its separate task, session, thread, and browser identities.'),
 (2,'Run the comparison','Step two: detach the browser, and confirm the task keeps running.'),
 (3,'Inspect the boundary','Step three: reconnect the same task, and inspect the deduplicated event IDs and the unchanged create count.'),
 (4,'Follow the workflow','Step four: wait for the authored completion, then inspect the report, which stays unverified.')])
d.shot('experiment','The background task experiment',{'exp-rule':'Open Run the exercise. A host task ledger ties one task card to an owned session and thread. Detaching the browser changes only the connection state.',
 'exp-allow':'The host policy checkbox allows background work.','exp-open':'Open slow offline task starts an authored task. No provider call is made.'})
d.shot('detached','Offline · Detach the browser',{'detached-ids':'Open a slow task. It gets its own task, session, and primary thread identities.',
 'detached-state':'Detach the browser right away. The task is still running, the remote session is still running, and only the browser is detached.',
 'detached-events':'So far, two events were observed: task started and child started.','detached-status':'The status line confirms it: running, browser detached.'})
d.shot('reconnected','Offline · Reconnect the same task',{'reconnected-state':'While the browser was away, the task completed. Reconnect: the task is completed, the remote session is idle, and the browser is attached again.',
 'reconnected-counts':'One provider create, zero duplicate cards. Reconnect read the same entry.',
 'reconnected-events':'The replayed task started event has a stable ID, so it was not added twice, and the completed state did not roll back.',
 'reconnected-report':'The report is authored fixture text. It is not independently verified.','reconnected-status':'Completed, remote idle, browser attached.'})
d.shot('closed','Offline · Close the idle session',{'closed-state':'Because the remote session is idle, Close idle session is allowed. The task is closed, and the session is archived.',
 'closed-events':'The event history is unchanged.','closed-status':'Closed, remote archived.'})
d.shot('stopped','Offline · Stop and confirm idle',{'stopped-state':'Open another slow task, and stop it before it completes. The task is stopped, and the remote session is idle.',
 'stopped-counts':'The stop evidence is confirmed idle. Only now may the session be closed.',
 'stopped-events':'The events end with stop confirmed idle, not task completed.','stopped-status':'Stopped, remote idle.'})
d.shot('oneshot','Offline · Completed one-shot',{'oneshot-state':'Run completed one-shot opens a task that has already completed, and closes it in the same request.',
 'oneshot-events':'Task started, child started, task completed.','oneshot-report':'The report is still unverified.','oneshot-status':'Closed, remote archived.'})
d.shot('policy','Offline · Host policy refuses background work',{'policy-status':'Now clear Allow host background work, and open a slow task again. The host refuses: host policy disables background work.'})
d.shot('no-live','Why the app stays offline',{'no-live-text':'There is no Run live button in this lab. The app stays offline, because native workflow runs need their own run-aware stop, and no Managed adapter is reviewed for it. So instead, we make the real calls from a small script in the terminal.'})
d.terminal('Live · Detach the event stream',[(l,'live-session' if l.startswith('Session sesn_') else 'live-detach' if l.startswith('Browser detached') else 'live-running' if 'right after detach' in l else None) for l in live[:split]],
 {'live-session':'The script creates one Managed session with no tools, using the existing agent and environment. It starts idle.',
  'live-detach':'It opens the event stream, sends one short prompt about fictional field notes, reads just one event, and closes the stream. That is our browser detaching.',
  'live-running':'Right after the detach, the remote session status is still running. Nobody is listening, and the work goes on.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · Reconnect and deduplicate',[(l,'live-reconnect' if l.startswith('Reconnect:') else 'live-dedupe' if 'skipped by ID' in l else 'live-once' if 'exactly once' in l else 'live-kept' if l.startswith('Closing the local stream') else 'live-archived' if l.startswith('Archived') else None) for l in live[split:]],
 {'live-reconnect':'After waiting two seconds, the script reconnects. Retrieve returns the same session ID, and the session is now idle.',
  'live-dedupe':'It lists nine events. The one event already seen before the detach is skipped by its ID, so eight are new.',
  'live-once':'After deduplication, there is one user message and exactly one agent message: the reply produced while detached.',
  'live-kept':'That reply was produced after the detach. Closing the local stream did not stop the remote work.',
  'live-archived':'Finally, the session was archived, and its final status is terminated.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the evidence prove?',[
 ('vs-detach','DETACH','Only the connection','The fixture task and the live<br>session both kept running','Offline, the fixture task kept running after the detach. Live, the real session status was still running after the stream closed.'),
 ('vs-reconnect','RECONNECT','Same identity','Same task offline;<br>same session ID live','Reconnect found the same task offline, and the same session ID live.'),
 ('vs-dedupe','DEDUPE','Stable event IDs','Replay added no duplicates;<br>one agent message live','And stable event IDs kept replay free of duplicates: offline, no duplicate cards; live, exactly one agent message.')],'The remote work belongs to the session, not to the stream that watches it.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the route module to its schemas and the task ledger.'),
 (3,'POST /open','Section three, post slash open, validates the request and calls ledger open.'),
 (5,'POST /oneshot','Section five, post slash oneshot, opens and closes a completed task.'),
 (6,'POST /call','Section six, post slash call, runs detach, reconnect, inspect, stop, or close on an owned task.')])
d.mapping('Where does background work live?',[
 ('map-sdk','CLAUDE AGENT SDK','Background tasks','run_in_background, with task<br>started and notification messages','In the Agent SDK, a command can run with run underscore in underscore background, and your local process receives task started and task notification messages.'),
 ('map-managed','CLAUDE MANAGED AGENTS','A remote session','The session keeps working;<br>reconnect and read its events','Here, work runs in a Managed Agents beta session, not the Agent SDK. The session keeps running when the browser leaves; you reconnect by reading its events, interrupt it, and archive it once idle.'),
 ('map-port','THIS PLATFORM','The Lab 27 ledger','server/lib/lab27-ledger.ts','On this platform, the host task ledger is in the Lab twenty-seven ledger module, using authored offline events.')],'The Agent SDK task events are not used here; the host ledger is in server/lib/lab27-ledger.ts.')
d.port('port-open','Source · Open a task, then deduplicate events',{'port-live-refused':'Open refuses any mode other than scripted. Live task control requires a configured Managed adapter, so no billed session is opened.',
 'port-policy':'If the host policy disables background work, open refuses with a four twenty-two error.',
 'port-dedupe':'Observe ignores an event whose ID was already seen, or any event after close. That is why replay never duplicates.'})
d.port('port-call','Source · Reconnect, stop, close',{'port-reconnect':'Reconnect only reattaches the browser, and replays an old running event with a stable ID.',
 'port-stop':'Stop clears the timer, and records stop confirmed idle.',
 'port-close':'Close throws a four oh nine error unless the remote session is idle. Then the task is closed and archived.'})
d.knowledge('Finish with the knowledge check: what should reconnect avoid creating?','Duplicate sessions or task cards. Reconnect should follow the host ledger rather than duplicate accepted work.')
d.summary([('sum-detach','DETACH','The browser is not the task','Only the connection changes.','You can now explain why detaching the browser leaves the remote task running.'),
 ('sum-reconnect','RECONNECT','Follow the ledger','Same task, no duplicates.','Reconnect to the same task, and use stable event IDs to avoid duplicates.'),
 ('sum-stop','STOP','Confirm idle first','Then close and archive.','And stop work and confirm idle before you close the session.')],'Lab 28 · Errors and retries')
d.finish()
