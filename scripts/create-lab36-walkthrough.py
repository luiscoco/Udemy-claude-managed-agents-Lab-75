"""Lab 36 step-by-step walkthrough authored from real captures of the running platform (offline: a loopback Managed-port emulator and a fixed host worker; live: a small script showing a real session's bash tool running in the cloud environment while the host only speaks HTTP)."""
from lab_video_common import Deck
d=Deck(36,'Lab 36 Step by Step: Remote Transport and Host Runners, Offline and Live','Configuration and hooks');e=d.e
assert e['liveButtons']==0 and e['scenarios']==['success','connection-failure','early-stream-close','handler-worker-failure','cancel-pending-cleanup']
assert e['ready']=='Ready. The loopback emulator makes no Anthropic call.' and 'does not prove a remote session stopped' in e['nolive']
assert e['status_success']=='completed; cleanup confirmed.' and 'created\nstream-open\nstream-complete\narchive-requested' in e['success']
assert e['status_connection-failure']=='connection-error; cleanup not-needed.' and 'session none' in e['connection-failure']
assert e['status_early-stream-close']=='incomplete; cleanup confirmed.' and 'stream-closed-early\ninterrupt-requested' in e['early-stream-close']
assert e['status_handler-worker-failure']=='worker-error; cleanup confirmed.' and 'Exit count: 1. Killed: false. Stderr redacted: true.' in e['handler-worker-failure']
assert e['status_cancel-pending-cleanup']=='canceled; cleanup pending.' and 'Local abort: true. Remote stop confirmed: false. Cleanup: pending.' in e['cancel-pending-cleanup']
live=d.transcript('live.raw.txt');L=' | '.join(live)
assert 'config cloud · networking limited · allowed_hosts 0 · packages 0' in L and 'agent.tool_use bash requested · command "uname -n && uname -sm && pwd"' in L
assert 'Host confirmation → allow (exact command)' in L and '  Linux x86_64' in live and 'Compare · OS: host Windows_NT vs remote Linux · cwd: host differs · hostname differs' in L
assert 'Host child processes spawned for bash: 0' in L and 'Stream events received over HTTP: 19' in L and 'Archived: yes · status terminated' in L
assert 'Host transport: 8 HTTP requests' in L and '  POST /v1/sessions/{id}/events ×2' in live
split=next(i for i,l in enumerate(live) if l.startswith('Turn finished'))+1
d.cover('CLAUDE MANAGED AGENTS · LAB 36 · CONFIGURATION AND HOOKS','<h2>In this lab</h2><p>Separate host and remote work.<br>Bound the event stream.<br>Handle worker failures.<br>Confirm remote cleanup.</p>',
 'Welcome to Lab thirty-six, Remote transport and host runners. In this lecture, you will see which work runs on the host and which belongs to the remote session: a bounded event stream, a fixed host worker, and remote cleanup that must be confirmed. The app stays offline, and then a small script runs a real Managed Agents session, live, to show where its bash tool really executes.')
d.overview('HOST · TRANSPORT · REMOTE','The host talks; the remote session works',[
 ('ov-concepts','1 · CONCEPTS','Host versus remote','The host speaks HTTP and events;<br>no Claude Code process is spawned','First, the concepts: the host bridge speaks HTTP and consumes events. It does not spawn a Claude Code process.'),
 ('ov-failures','2 · FAILURES','When the transport breaks','Connection failure, early close,<br>a failing host worker','Second, the failure cases: a connection failure, an early stream close, and a host worker that fails.'),
 ('ov-cleanup','3 · CLEANUP','Remote stop is not local','A local abort is not<br>a confirmed remote cleanup','Third, cancellation: a local abort does not prove that the remote session stopped.'),
 ('ov-code','4 · LIVE AND CODE','A real session, then code','Bash runs in the cloud environment;<br>then the TypeScript','Finally, a live terminal run where the bash tool executes in the cloud environment, and the TypeScript code behind the experiment.')],
 'Killing a host worker does not prove a remote session stopped.')
d.shot('lesson','Open Lab 36',{'lesson-title':'Open Lab thirty-six, Remote transport and host runners.','lesson-objective':'The objective: inspect the host H T T P and event boundary, bounded event consumption, a fixed host worker lifecycle, and remote cleanup, without spawning Claude Code.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: a browser U I calls a host bridge, which speaks H T T P to a remote session over a remote transport.'),
 (2,'Core rule','Region two, the core rule: the host worker lifecycle and the remote session cleanup are two separate lifecycles.'),
 (3,'Keep the boundary clear','Region three: the host bridge does not establish a spawned Claude Code process. No local Claude binary, and no tool alias.'),
 (6,'Put it to the test','Region six: identify which work runs on the host, and which belongs to the remote session.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: run the successful loopback fixture, and inspect the host request and remote lifecycle events.'),
 (2,'Run the comparison','Step two: compare a connection failure with an early stream close. Neither produces a verified completed turn.'),
 (3,'Inspect the boundary','Step three: run the handler worker failure, and confirm one child exit, with its private stderr withheld.'),
 (4,'Follow the workflow','Step four: cancel during a pending stream, and inspect the local abort and the unconfirmed remote cleanup.')])
d.shot('experiment','The transport experiment',{'exp-rule':'Open Run the exercise. The host sends H T T P requests to a loopback Managed port emulator, and consumes a bounded event stream. A separate fixed child process stands for a host tool worker.',
 'exp-scenario':'Choose an offline scenario: success, connection failure, early stream close, handler worker failure, or cancel pending cleanup.','exp-run':'Start with success, and select Run transport experiment.',
 'exp-status':'The emulator makes no Anthropic call.'})
d.shot('success','Offline · A successful run',{'success-run':'The run creates a session on the emulator, and the outcome is completed.',
 'success-request':'The host request is post slash sessions, then get the session events. Three events arrive, and the queue peaks at one of four.',
 'success-life':'The remote lifecycle: created, stream open, stream complete, and archive requested.',
 'success-worker':'No host worker was started in this scenario.','success-cleanup':'Remote stop is confirmed, and cleanup is confirmed. Provider calls: zero.',
 'success-note':'This loopback transport is not a production remote sandbox.','success-status':'Completed, cleanup confirmed.'})
d.shot('connection-failure','Offline · Connection failure',{'connection-failure-run':'Now choose connection failure. There is no session at all, and the outcome is connection error.',
 'connection-failure-request':'Zero events were consumed.','connection-failure-life':'The remote lifecycle is empty: nothing was created remotely.',
 'connection-failure-worker':'No host worker started.','connection-failure-cleanup':'So there is nothing to clean up: cleanup is not needed.',
 'connection-failure-status':'Connection error, cleanup not needed.'})
d.shot('early-stream-close','Offline · Early stream close',{'early-stream-close-run':'Next, early stream close. A session exists, but the outcome is incomplete.',
 'early-stream-close-request':'Only one event arrived before the stream closed.','early-stream-close-life':'Because the turn was not verified as complete, the host requests an interrupt, then an archive.',
 'early-stream-close-worker':'No host worker was involved.','early-stream-close-cleanup':'The remote stop is confirmed, so cleanup is confirmed.',
 'early-stream-close-status':'Incomplete, cleanup confirmed.'})
d.shot('handler-worker-failure','Offline · Host worker failure',{'handler-worker-failure-run':'Now handler worker failure. The stream completes, but the outcome is worker error.',
 'handler-worker-failure-request':'All three events arrived.','handler-worker-failure-life':'The host still interrupts and archives the remote session.',
 'handler-worker-failure-worker':'The fixed host worker started, and exited once. It was not killed, and its private stderr is redacted.',
 'handler-worker-failure-cleanup':'Remote cleanup is confirmed separately, through the transport.','handler-worker-failure-status':'Worker error, cleanup confirmed.'})
d.shot('cancel-pending-cleanup','Offline · Cancel with pending cleanup',{'cancel-pending-cleanup-run':'Finally, cancel pending cleanup. The host cancels while the stream is still pending: the outcome is canceled.',
 'cancel-pending-cleanup-request':'One event arrived before the cancel.','cancel-pending-cleanup-life':'The host requested an interrupt, and closed its stream, but no archive followed.',
 'cancel-pending-cleanup-worker':'No host worker was involved.','cancel-pending-cleanup-cleanup':'Local abort is true, but remote stop is not confirmed, so cleanup stays pending.',
 'cancel-pending-cleanup-status':'Canceled, cleanup pending: a local abort is not a remote stop.'})
d.shot('no-live','The app stays offline',{'no-live-text':'The app stays offline in this lab: there is no Run live button, and this local emulator is not a production remote sandbox. So now we make the real calls from a small script, in the terminal of the project, to see where the work of a real session runs.'})
d.terminal('Live · Where does bash really run?',[(l,'lv-host' if l.startswith('Host runner') else 'lv-env' if l.startswith('Environment ') else 'lv-session' if l.startswith('Session sesn_') else 'lv-confirm' if l.startswith('Host confirmation') else 'lv-result' if l.strip()=='Linux x86_64' else None) for l in live[:split]],
 {'lv-host':'The script first prints the host: Windows, x sixty-four, running in the project folder of the clone.',
  'lv-env':'It retrieves the configured environment through the A P I: config cloud, networking limited, with zero allowed hosts and zero packages. No secrets are printed.',
  'lv-session':'It creates one session in that environment, with only the bash tool, set to always ask.',
  'lv-confirm':'The agent asks for bash with the exact command, u name dash n, u name dash s m, and p w d. The host approves only that exact command, with a user tool confirmation event.',
  'lv-result':'The tool result comes back over the stream: host name v m, Linux x eighty-six sixty-four, and working directory slash. The command ran in the remote environment.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · The host only speaks HTTP',[(l,'lv-compare' if l.startswith('Compare') else 'lv-spawn' if l.startswith('Host child') else 'lv-events' if l.startswith('Stream events') else 'lv-archived' if l.startswith('Archived') else 'lv-transport' if l.startswith('Host transport') else None) for l in live[split:]],
 {'lv-compare':'Compared with the host: Windows versus Linux, and a different working directory and host name. Two different machines.',
  'lv-spawn':'The host spawned zero child processes for bash. The tool never ran on this machine.',
  'lv-events':'All the host received was nineteen events over H T T P, including one tool use and one tool result.',
  'lv-archived':'The script archives the session in a finally block. Archived: yes, status terminated.',
  'lv-transport':'The whole transport: eight H T T P requests. Retrieve the environment and agent, create the session, open the event stream, send two events, archive, and retrieve.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the real session prove?',[
 ('vs-where','WHERE','The work runs remotely','Emulator on the host;<br>live: Linux in the cloud environment','Offline, the emulator runs on the host. Live, the bash command ran in the cloud environment, on Linux, not on Windows.'),
 ('vs-transport','TRANSPORT','HTTP and events only','POST sessions, GET events;<br>live: eight real requests','In both cases, the host only sends requests and consumes events: live, eight real H T T P requests.'),
 ('vs-cleanup','CLEANUP','Confirm remote cleanup','Interrupt and archive;<br>live: archived, terminated','And cleanup is a remote action: the real session was archived, and its status is terminated.')],'Host worker failures and pending cleanup are emulated in the app; the live run shows the real host and remote split.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect this router to the transport schemas and the Lab thirty-six runner.'),
 (3,'POST /dry','Section three, post slash dry, describes the host request only: post sessions, get events, and zero provider calls.'),
 (4,'POST /run','Section four, post slash run, validates the request and runs the transport experiment.'),
 (6,'POST /alias','Section six, post slash alias, is refused: a local Claude tool alias is not required by Managed Agents.')])
d.mapping('Where does the agent run?',[
 ('map-sdk','CLAUDE AGENT SDK','A local Claude Code process','The SDK spawns the CLI;<br>tools run on your machine','In the Agent SDK, your program spawns a Claude Code process, and its tools run on your own machine.'),
 ('map-managed','CLAUDE MANAGED AGENTS','A remote session','Runs in a cloud environment;<br>the host speaks HTTP and events','This platform uses Managed Agents beta sessions, not the Agent SDK. The session runs in the configured cloud environment, and the host only speaks H T T P and events.'),
 ('map-port','THIS PLATFORM','The Lab 36 runner','server/lib/lab36-transport.ts','Here, the Lab thirty-six runner models that transport with a loopback emulator and one fixed host worker.')],'No Claude Code process is spawned: the transport lives in server/lib/lab36-transport.ts.')
d.port('port-transport','Source · HTTP calls and bounded streams',{'port-call':'Every host call is a fetch with a method, a fixture token, and a three second timeout.',
 'port-bound':'The event stream is bounded: more than sixteen kilobytes is an error.','port-queue':'And more than four queued events exceeds the host bound.'})
d.port('port-worker','Source · The fixed host worker',{'port-spawn':'The handler worker is one fixed Node script, spawned without a shell, and with a minimal environment.',
 'port-stderr':'Its stderr is never shown: it is only marked as redacted.','port-worker-stop':'A worker error still interrupts the remote session through the transport.'})
d.port('port-cleanup','Source · Remote stop and cleanup',{'port-live-refused':'A live run is refused here: it needs a configured Managed agent and an opt in.',
 'port-cancel':'On cancel, the host aborts locally, then asks the remote side to stop.','port-cleanup':'Cleanup is confirmed only when the remote stop and the archive are both confirmed. Otherwise it stays pending.'})
d.knowledge('Finish with the knowledge check: what should host worker inspection distinguish?','Host lifecycle and remote session cleanup. Correct: the host bridge does not establish a spawned Claude Code process.')
d.summary([('sum-host','HOST','Know what runs locally','HTTP, events, a fixed worker.','You can now tell host work, the transport and a fixed worker, from remote work.'),
 ('sum-bound','BOUND','Bound and verify','No verified turn, no completion.','Bound the event stream, and never treat an early close or a connection failure as a completed turn.'),
 ('sum-cleanup','CLEANUP','Confirm remote cleanup','A local abort is not a remote stop.','And confirm remote cleanup through the API: a local abort alone proves nothing remotely.')],'Lab 37 · External policy decision service')
d.finish()
