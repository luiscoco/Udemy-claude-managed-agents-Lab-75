"""Lab 37 step-by-step walkthrough authored from real captures of the running platform (offline: an authored policy gate with an isolated worker; live: a small script sending a real Managed session's always_ask write requests to the lab's own policy gate)."""
from lab_video_common import Deck
d=Deck(37,'Lab 37 Step by Step: External Policy Decision Service, Offline and Live','Permissions and security');e=d.e
assert e['liveButtons']==0 and e['scenarios']==['preallowed','deny','timeout','malformed','host-refusal','allow'] and e['gates']==['isolated policy worker','local reviewer']
assert e['status_pending']=='pending; 0 confirmation(s), 0 checked file effect(s).' and e['status_deny']=='denied; 1 confirmation(s), 0 checked file effect(s).'
assert 'Gate: deny. Host: deny. File effects: 0.' in e['deny'] and '"deny_message": "External fixture policy denies the action."' in e['deny']
assert e['status_allow']=='allowed; 1 confirmation(s), 1 checked file effect(s).' and 'Approved checked write.' in e['allow']
assert 'Write /outside/notes.txt' in e['host-refusal'] and 'Gate: allow. Host: deny. File effects: 0.' in e['host-refusal'] and 'Host path limit refused the action.' in e['host-refusal']
assert e['status_malformed']=='malformed; 0 confirmation(s), 0 checked file effect(s).' and 'Invalid gate schema; no confirmation or file effect.' in e['malformed']
assert e['status_timeout']=='timed-out; 0 confirmation(s), 0 checked file effect(s).' and 'Policy gate unavailable; no confirmation or file effect.' in e['timeout']
assert 'Local reviewer made an explicit decision.' in e['reviewer'] and e['status_reviewer']=='denied; 1 confirmation(s), 0 checked file effect(s).'
assert e['status_preallowed']=='preallowed; 0 confirmation(s), 0 checked file effect(s).' and 'pending event none.' in e['preallowed']
assert e['status_canceled']=='canceled; 0 confirmation(s), 0 checked file effect(s).' and 'Provider calls: 0.' in e['nolive'] and 'fail closed' in e['failclosed']
live=d.transcript('live.raw.txt');L=' | '.join(live)
assert 'tools: read always_allow, write always_ask' in L and 'agent.tool_use write /workspace/notes.txt' in L and 'agent.tool_use write /outside/notes.txt' in L
assert 'policy service → worker allow · host path check allow' in L and 'policy service → timed-out (attempt 1)' in L
assert 'policy service → worker allow · host path check deny: Host path limit refused the action.' in L and 'user.tool_confirmation sent → deny' in L
assert 'agent.tool_result write: ok · File created: /workspace/notes.txt' in L and 'agent.tool_result write: is_error · Permission to use write has been rejected' in L
assert 'agent.tool_result read: is_error · cat: /outside/notes.txt: No such file or directory' in L
assert 'File effects: /workspace/notes.txt 1 · /outside/notes.txt 0 · confirmations sent: 2' in L and 'Session archived: yes' in L
split=next(i for i,l in enumerate(live) if l.startswith('Turn 2'))
def cue1(l):
 return ('lv-run' if l.startswith('PS ') else 'lv-allow' if l.endswith('host path check allow') else 'lv-retry' if 'timed-out (attempt 1)' in l
  else 'lv-deny' if 'host path check deny' in l else 'lv-rejected' if l.strip().startswith('agent.tool_result write: is_error') else None)
def cue2(l):
 return ('lv-read' if l.startswith('agent.tool_use read /workspace') else 'lv-ok' if l.strip().startswith('agent.tool_result read: ok')
  else 'lv-missing' if l.strip().startswith('agent.tool_result read: is_error') else 'lv-effects' if l.startswith('File effects') else 'lv-archived' if l.startswith('Session archived') else None)
d.cover('CLAUDE MANAGED AGENTS · LAB 37 · PERMISSIONS AND SECURITY','<h2>In this lab</h2><p>Pause on an exact action.<br>Ask a host policy service.<br>Check the path yourself.<br>Fail closed on errors.</p>',
 'Welcome to Lab thirty-seven, External policy decision service. In this lecture, a paused tool action is sent to a host-only policy service. You will see allow, deny, malformed and timeout decisions, and why an independent host path check can still refuse an allowed action. The app stays offline, and then a small script sends a real Managed Agents session\'s write requests to the same policy gate, live.')
d.overview('PAUSE · DECIDE · CONFIRM','One exact action, one checked confirmation',[
 ('ov-concepts','1 · CONCEPTS','A host-only gate','The exact paused action,<br>plus independent path checks','First, the concepts: an approval binds to the exact paused action, and never replaces the host\'s own path checks.'),
 ('ov-decide','2 · DECIDE','Allow, deny, fail closed','Worker or local reviewer;<br>malformed and timeout fail closed','Second, the decisions: an isolated worker or a local reviewer decides, and malformed or missing answers fail closed.'),
 ('ov-host','3 · HOST','The host has the last word','A valid allow can still<br>be refused by the path limit','Third, precedence: a fixed host path limit overrides a valid allow from the gate.'),
 ('ov-code','4 · LIVE AND CODE','Real pauses, then code','A live terminal run with<br>always_ask writes; then TypeScript','Finally, a live terminal run where a real session pauses on always ask writes, and the TypeScript code behind the gate.')],
 'The policy service decides; the host still checks, and sends one correlated confirmation.')
d.shot('lesson','Open Lab 37',{'lesson-title':'Open Lab thirty-seven, External policy decision service.','lesson-objective':'The objective: ask a host-only policy service about an exact paused action, and send one correlated confirmation only after a valid gate decision and an independent path check.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: ask a host-only policy service about an exact paused action, and send one correlated confirmation.'),
 (2,'Core rule','Region two, the core rule: a policy-service approval binds to the exact paused action, plus independent path checks.'),
 (3,'Keep the boundary clear','Region three: a gate decision is scoped, and does not replace independent host checks.'),
 (6,'Put it to the test','Region six: return an invalid gate response, and inspect the prevented effect.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: start a preallowed observation. No gate request or confirmation is needed.'),
 (2,'Run the comparison','Step two: run the worker deny, and inspect the exact s-e-v-t I D, the deny message, and the unchanged fixture file.'),
 (3,'Inspect the boundary','Step three: try malformed output and a timeout. Neither can produce a confirmation or a file effect.'),
 (4,'Follow the workflow','Step four: run host refusal. The worker allows, but the fixed host path limit denies.')])
d.shot('experiment','The policy gate experiment',{'exp-rule':'Open Run the exercise. A built-in always ask action pauses on an exact s-e-v-t I D. A host-only gate returns a closed decision, and an independent path check can still refuse it.',
 'exp-scenario':'Six offline scenarios: preallowed, deny, timeout, malformed, host refusal, and allow.','exp-gate':'The gate source is the isolated policy worker, or a local reviewer.',
 'exp-start':'Each scenario starts with Start policy review.'})
d.shot('preallowed','Offline · Preallowed observation',{'preallowed-run':'Start with preallowed. The run has no pending event: nothing paused.',
 'preallowed-action':'The action is a preallowed observation, so there is no gate request.','preallowed-status':'Status preallowed: zero confirmations, and zero file effects.'})
d.shot('pending','Offline · A paused write',{'pending-run':'Now choose deny, with the isolated policy worker. The run pauses on one exact pending event, an s-e-v-t I D.',
 'pending-action':'The paused action is a Write to slash workspace slash notes dot t x t.','pending-ask':'Select Ask policy worker.','pending-status':'Until then, the action is pending, with zero confirmations.'})
d.shot('deny','Offline · The worker denies',{'deny-gate':'The worker returns deny, so the host decision is deny, and there are zero file effects.',
 'deny-confirmation':'Exactly one user dot tool confirmation is built, bound to the same s-e-v-t I D, with result deny and the worker\'s deny message.',
 'deny-evidence':'The evidence: a valid gate deny, an independent host check, and one correlated confirmation.','deny-status':'Status denied: one confirmation, zero checked file effects.'})
d.shot('allow','Offline · The worker allows',{'allow-gate':'Run the allow scenario and ask the worker. Gate allow, host allow, and one file effect.',
 'allow-fixture':'Only now does the fixture file change: approved checked write.','allow-confirmation':'The confirmation carries result allow, and no deny message.',
 'allow-status':'Status allowed: one confirmation, one checked file effect.'})
d.shot('malformed','Offline · Malformed gate output',{'malformed-gate':'Now the malformed scenario. The worker returns an invalid decision, so the gate and host decisions stay none.',
 'malformed-evidence':'The evidence says: invalid gate schema, no confirmation, and no file effect.','malformed-status':'Status malformed. The gate failed closed.'})
d.shot('timeout','Offline · The worker times out',{'timeout-gate':'In the timeout scenario, the worker never answers within three seconds. There is still no decision.',
 'timeout-evidence':'Policy gate unavailable: no confirmation, and no file effect.','timeout-status':'Status timed out. An unavailable gate also fails closed.'})
d.shot('host-refusal','Offline · Host path refusal',{'refusal-action':'Now host refusal. The paused Write targets slash outside slash notes dot t x t.',
 'refusal-gate':'The worker allows, but the host decision is deny. The fixed host path limit overrides a valid gate allow.',
 'refusal-confirmation':'The confirmation is deny, with the deny message: host path limit refused the action.','host-refusal-status':'Status denied, with zero file effects.'})
d.shot('reviewer-pending','Offline · A local reviewer',{'reviewer-buttons':'Switch the gate source to local reviewer. Now the reviewer buttons are enabled, and Ask policy worker is not.',
 'reviewer-pending-status':'The action waits for the reviewer.'})
d.shot('reviewer','Offline · The reviewer denies',{'reviewer-gate':'Select Reviewer denies. The local reviewer is an alternate gate: gate deny, host deny.',
 'reviewer-confirmation':'One confirmation, deny, with the message: local reviewer made an explicit decision.','reviewer-status':'Status denied, with zero file effects.'})
d.shot('canceled','Offline · Cancel a pending action',{'canceled-gate':'Finally, start a deny run and select Cancel pending. No gate or host decision is made.',
 'canceled-evidence':'The pending decision is canceled, without an effect.','canceled-status':'Status canceled: zero confirmations.'})
d.shot('no-live','The app stays offline',{'no-live-text':'The app stays offline in this lab: there is no Run live button, the snapshot is an authored fixture, and provider calls are zero. Fixed host path limits override a valid gate allow.',
 'no-live-rule':'Malformed and unavailable results fail closed, and the gate cannot rewrite confirmation inputs. So now we make the real calls from a small script, in the terminal of the project.'})
d.terminal('Live · Real always_ask writes, decided by the gate',[(l,cue1(l)) for l in live[:split]],
 {'lv-run':'The script reads the agent and environment I Ds from dot env. It creates one session whose toolset sets write to always ask, and read to always allow. Then it asks for two writes.',
  'lv-allow':'The first write, to slash workspace slash notes dot t x t, pauses with evaluated permission ask. The script sends it to the lab\'s own policy gate: the worker allows, the host path check allows, and a user dot tool confirmation with allow goes back.',
  'lv-retry':'For the second write, the first gate run timed out, with no confirmation. The worker did not answer within three seconds, so the script asked the gate again.',
  'lv-deny':'On the retry, the worker allows, but the host path check denies: host path limit refused the action. The confirmation sent back is deny.',
  'lv-rejected':'The first write created the file. The second tool result is an error: permission to use write has been rejected.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · Zero effect for the denied write',[(l,cue2(l)) for l in live[split:]],
 {'lv-read':'In turn two, the agent reads both paths. Read is always allow, so evaluated permission is allow, and no confirmation is needed.',
  'lv-ok':'Slash workspace slash notes dot t x t contains the heron note: the allowed write took effect.',
  'lv-missing':'Slash outside slash notes dot t x t does not exist: no such file or directory.',
  'lv-effects':'So the file effects are one for the allowed path, and zero for the denied path, with two confirmations sent.',
  'lv-archived':'Finally, the session is archived in a finally block.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the real session prove?',[
 ('vs-pause','PAUSE','A real always_ask pause','Two write requests paused<br>with evaluated_permission ask','Like the fixture, a real always ask write pauses on its own s-e-v-t event, until the host answers.'),
 ('vs-gate','GATE','Same gate, real event ID','Worker allow, host check deny;<br>one confirmation per event','The same policy gate decided, and its confirmation was bound to the real tool use I D. The host path limit still overrode an allow.'),
 ('vs-effect','EFFECT','Denied means no effect','The denied path does not exist;<br>a timeout gave no confirmation','And a denied write had no effect. A timed-out gate run produced no confirmation at all.')],'The gate and its worker are host code: the Managed API only sees the confirmation.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the router to the policy schemas and the gate.'),
 (3,'POST /run','Section three, post slash run, validates the request and starts a paused policy run.'),
 (5,'POST /decide','Section five, post slash decide, asks the worker or reviewer, for one exact event I D.'),
 (7,'POST /failures','Section seven, post slash failures, cancels a pending decision without an effect.')])
d.mapping('Where does the permission decision come from?',[
 ('map-sdk','CLAUDE AGENT SDK','canUseTool or a prompt tool','A callback in your process<br>returns allow or deny','In the Agent SDK, a can use tool callback, or a permission prompt tool, in your own process returns allow or deny for each tool call.'),
 ('map-managed','CLAUDE MANAGED AGENTS','always_ask and confirmations','The session pauses; the host sends<br>user.tool_confirmation','This platform uses Managed Agents beta sessions, not the Agent SDK. An always ask tool pauses the session, and the host answers with a user dot tool confirmation for that exact tool use I D.'),
 ('map-port','THIS PLATFORM','The Lab 37 policy gate','server/lib/lab37-policy-gate.ts','Here, the Lab thirty-seven policy gate is that external decision service: an isolated worker, a schema check, and a host path check.')],'No Agent SDK canUseTool is installed: the gate is in server/lib/lab37-policy-gate.ts.')
d.port('port-worker','Source · An isolated, bounded worker',{'port-spawn':'The worker runs as a separate Node process, without a shell, and with a minimal environment.',
 'port-timeout':'If it does not answer within three seconds, it is killed, and the decision times out.','port-bounded':'Any non-zero exit, oversized or unterminated output is rejected: no bounded decision.'})
d.port('port-precedence','Source · Host precedence',{'port-path':'The host checks the path itself: only slash workspace slash notes dot t x t is allowed.',
 'port-host':'The host decision is allow only when the path is allowed and the gate said allow. Otherwise it is deny.',
 'port-confirm':'The confirmation is a user dot tool confirmation, bound to the exact event I D.'})
d.port('port-exact','Source · Exact and once',{'port-live-refused':'In the app, a live run is refused: it needs a dedicated Managed always ask session, which is what our script created.',
 'port-event':'A decision for a different event I D is rejected.','port-once':'And a decision that was already consumed cannot be made again.'})
d.knowledge('Finish with the knowledge check: what must a policy-service approval bind to?','The exact paused action, plus independent path checks. A gate decision is scoped, and does not replace independent host checks.')
d.summary([('sum-pause','PAUSE','Bind to the exact action','One sevt_ ID, one confirmation.','You can now bind a policy decision to one exact paused action, and send one correlated confirmation.'),
 ('sum-closed','FAIL CLOSED','No answer, no effect','Malformed or timed out: deny.','Malformed and unavailable gate results fail closed, with no confirmation and no effect.'),
 ('sum-host','HOST','The host checks too','A path limit overrides an allow.','And the host keeps its own path limits: a valid gate allow can still be refused.')],'Lab 38 · Application follow up suggestions')
d.finish()
