"""Lab 40 step-by-step walkthrough authored from real captures of the running platform (offline: an authored host ledger fixture; live: a small script that interrupts a real Managed Agents turn and recovers with the lab's own rules)."""
from lab_video_common import Deck
d=Deck(40,'Lab 40 Step by Step: Safe Recovery Boundaries, Offline and Live','Sessions and context');e=d.e
assert e['liveButtons']==0 and e['scenarios']==['kept-turn','uncertain-send','queued-follow-up','pending-effect','clean-snapshot']
assert e['dry']=='Never truncate Managed event history or silently drop accepted commands and applied effects.'
assert e['status_kept']=='Inspect the ledger before choosing recovery.' and 'Remote events: 2.' in e['kept']
assert e['status_undo-refused']=='Undo cannot erase accepted commands, effects or remote events; continue or reconcile.' and 'Undo: refused.' in e['undo-refused']
assert 'Recovery: interrupt-confirmed-idle.' in e['interrupt'] and e['status_interrupt'].startswith('Fixture confirms idle')
assert e['status_uncertain']=='Reconcile uncertain send or pending effect before continuation.' and 'Recovery: none.' in e['uncertain']
assert 'Recovery: reconciliation-required.' in e['reconcile'] and e['status_queued']=='Continue the owned session and process the queued follow-up once.'
assert e['status_pending']=='Outstanding commands or effects require reconciliation before a fresh session.'
assert e['status_clean-undo']=='Only the versioned host draft was restored.' and 'Undo: restored-host-draft.' in e['clean-undo'] and e['calls']=='Provider calls: 0.'
live=d.transcript('live.raw.txt');L=' | '.join(live)
assert 'reply dropped (incomplete)' in L and 'status idle after' in L and '(confirmed idle)' in L
assert 'host-only undo → refused' in L and 'interrupt → interrupt-confirmed-idle' in L and 'continue → refused 409' in L
assert 'Blind resend of the turn 1 prompt: no' in L and 'Turn 2: completed · agent.message 1' in L and 'Turn 1: interrupted · agent.message 0' in L
assert 'first 10 IDs unchanged: yes' in L and 'Turn 1 prompt sent exactly once: yes' in L and 'Archived: yes · final status terminated' in L
split=next(i for i,l in enumerate(live) if l.startswith('Lab40Recovery'))
d.cover('CLAUDE MANAGED AGENTS · LAB 40 · SESSIONS AND CONTEXT','<h2>In this lab</h2><p>Read the host ledger.<br>Refuse unsafe undo.<br>Reconcile uncertain work.<br>Never drop accepted turns.</p>',
 'Welcome to Lab forty, Safe recovery boundaries. In this lecture, you will choose a recovery path from a host command and effect ledger, see why undo cannot erase accepted work, and why an uncertain send needs reconciliation, not a retry. The app stays offline, and then a small script interrupts a real Managed Agents turn and recovers it safely, live.')
d.overview('LEDGER · CHOOSE · RECOVER','Recover without erasing history',[
 ('ov-concepts','1 · CONCEPTS','The host ledger','Accepted commands and effects<br>decide what is safe','First, the concepts: a host command and effect ledger decides which recovery choices are safe.'),
 ('ov-cases','2 · CASES','Five recovery cases','Kept turn, uncertain send,<br>queued follow-up, pending effect','Second, five offline cases: a kept turn, an uncertain send, a queued follow-up, a pending effect, and a clean snapshot.'),
 ('ov-live','3 · LIVE','A real interrupted turn','Confirm idle, read events.list,<br>retry only when confirmed','Third, a live terminal run: a real turn is interrupted, the host reads the remote history, and retries only after explicit confirmation.'),
 ('ov-code','4 · CODE','The refusal rules','TypeScript guards<br>in lab40-recovery.ts','Finally, the TypeScript code that holds the refusal rules.')],
 'Managed event history is never truncated: recovery adds to it.')
d.shot('lesson','Open Lab 40',{'lesson-title':'Open Lab forty, Safe recovery boundaries.','lesson-objective':'The objective: choose recovery from a host command and effect ledger, without erasing remote history or dropping accepted work.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: choose recovery from a host command and effect ledger.'),
 (2,'Core rule','Region two, the core rule: before replaying work, recovery consults the host command and effect ledger.'),
 (3,'Keep the boundary clear','Region three: accepted work and observed effects determine the safe recovery choices.'),
 (6,'Put it to the test','Region six: explain how queued work changes the safe recovery boundary.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: build the kept-turn case, and compare remote event, command and effect IDs.'),
 (2,'Run the comparison','Step two: try host-only undo, and confirm that it refuses to erase accepted work.'),
 (3,'Inspect the boundary','Step three: compare an uncertain send and a pending effect. Both require reconciliation before continuation or retry.'),
 (4,'Follow the workflow','Step four: inspect a queued follow-up, and explain why a fresh derived session would lose accepted work.')])
d.shot('experiment','The recovery experiment',{'exp-rule':'Open Run the exercise. Inspect accepted commands, uncertain sends and pending effects before choosing recovery. Managed event history cannot be truncated.',
 'exp-scenario':'Choose an offline case: kept turn, uncertain send, queued follow-up, pending effect, or clean snapshot.','exp-dry':'Dry check shows the rule, with no provider call.','exp-build':'Build recovery case creates the authored host ledger for the chosen case.'})
d.shot('dry','Offline · Dry check',{'dry-status':'Select Dry check. The rule: never truncate Managed event history, or silently drop accepted commands and applied effects.'})
d.shot('kept','Offline · The kept-turn case',{'kept-run':'Build the kept-turn case. The run has version one, a retained fixture session, and two remote events.',
 'kept-commands':'The host command ledger holds one processed command: the first user turn.','kept-effects':'The effect ledger holds one applied effect: a saved observation.',
 'kept-events':'And here are the two remote event IDs.','kept-status':'The status says: inspect the ledger before choosing recovery.'})
d.shot('undo-refused','Offline · Host-only undo is refused',{'undo-refused-recovery':'Select Try host-only undo. Undo: refused. The host draft stays at version two.',
 'undo-refused-evidence':'The evidence adds: undo refused, remote history untouched.','undo-refused-status':'Undo cannot erase accepted commands, effects or remote events. Continue, or reconcile.'})
d.shot('interrupt','Offline · Interrupt and confirm idle',{'interrupt-recovery':'Now choose interrupt. Recovery: interrupt confirmed idle.',
 'interrupt-buttons':'The choice is recorded once, so the recovery buttons are now disabled.','interrupt-status':'The fixture confirms idle: the retained owned session can be reused after ledger review.'})
d.shot('uncertain','Offline · An uncertain send',{'uncertain-commands':'Build the uncertain send case. The second command is uncertain: a later send with an unknown receipt.',
 'uncertain-recovery':'Select continue. Recovery stays at none.','uncertain-status':'Continuation is refused: reconcile the uncertain send, or pending effect, first.'})
d.shot('reconcile','Offline · Reconcile',{'reconcile-recovery':'Select reconcile. Recovery: reconciliation required.',
 'reconcile-status':'Inspect external receipt and effect evidence. Do not retry an uncertain send, or duplicate an effect.'})
d.shot('queued','Offline · A queued follow-up',{'queued-commands':'The queued follow-up case holds an accepted follow-up, still queued.',
 'queued-recovery':'Select continue. Recovery: continued.','queued-status':'Continue the owned session, and process the queued follow-up once. A fresh session would lose it.'})
d.shot('pending','Offline · A pending effect',{'pending-effects':'The pending effect case has a write call awaiting host confirmation.',
 'pending-recovery':'Select fresh derived. Recovery stays at none.','pending-status':'Refused: outstanding commands or effects require reconciliation before a fresh session.'})
d.shot('clean-undo','Offline · A clean snapshot',{'clean-commands':'Finally, the clean snapshot case has no accepted command.','clean-events':'And no remote event IDs.',
 'clean-recovery':'Here host-only undo succeeds: restored host draft, back to version one.','clean-undo-status':'Only the versioned host draft was restored.'})
d.shot('no-live','The app stays offline',{'no-live-calls':'The app stays offline in this lab: there is no Run live button, and every snapshot reports zero provider calls.',
 'no-live-text':'Its confirmed idle interrupt is authored evidence only. So now we make the real calls from a small script, in the terminal of the project: interrupt a real turn, and recover with the lab\'s own rules.'})
d.terminal('Live · Interrupt a real turn',[(l,'lv-rule' if l.startswith('Lab 40 rule') else 'lv-running' if l.startswith('Turn 1 user.message') else 'lv-idle' if l.startswith('user.interrupt') else 'lv-dropped' if l.startswith('  Turn 1 sevt_') else None) for l in live[:split]],
 {'lv-rule':'The script imports the lab\'s own Lab40Recovery class, and prints its rule: never truncate history, or silently drop accepted work. Then it creates one session with no tools.',
  'lv-running':'Turn one asks for a six hundred word Aurora Finch field report. The session is running after one second.',
  'lv-idle':'The script sends user dot interrupt, and polls sessions dot retrieve: status idle after zero point two seconds. Idle is confirmed, not assumed.',
  'lv-dropped':'Recovery starts from the remote history, with events dot list. Turn one was accepted, it is in the history, and it was interrupted. With zero agent messages, its reply was dropped.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · Recover without a blind resend',[(l,'lv-choose' if l.startswith('Lab40Recovery · interrupt') else 'lv-uncertain' if l.startswith('If the receipt') else 'lv-noresend' if l.startswith('Blind resend') else 'lv-turns' if l.startswith('  Turn 2:') else 'lv-once' if l.startswith('Turn 1 prompt') else None) for l in live[:1]+live[split:]],
 {'lv-choose':'Now the lab\'s rules decide. Host-only undo is refused: accepted work cannot be erased. And interrupt gives interrupt confirmed idle: the owned session can be reused after ledger review.',
  'lv-uncertain':'If the receipt were unknown, continue would be refused, four hundred nine: reconcile the uncertain send first.',
  'lv-noresend':'So the host does not blindly resend the dropped prompt. It asks for explicit confirmation, and then sends a new, shorter turn two. It is idle after three point two seconds.',
  'lv-turns':'The history grew from ten to twenty events, and the first ten IDs are unchanged: it was only appended. Turn one stays interrupted, with no reply. Turn two completed, with one agent message.',
  'lv-once':'The original prompt was sent exactly once. Finally, the session is archived, and its status is terminated.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the real session prove?',[
 ('vs-idle','IDLE','Confirmed, not assumed','Fixture idle is authored;<br>live idle was polled','The fixture confirms idle by authoring it. Live, the script polled sessions dot retrieve until the session was really idle.'),
 ('vs-history','HISTORY','Only appended','Remote events stay;<br>ten IDs unchanged after retry','In both, history is never truncated: the real list kept its first ten event IDs, and only grew.'),
 ('vs-retry','RETRY','Never blind','Undo refused; a retry is<br>a new, confirmed turn','And no blind replay: undo is refused for accepted work, and the dropped request returns only as a new, confirmed turn.')],'The ledger rules are the same code: the live script imports Lab40Recovery from the app.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect this module to the Lab forty schemas and the recovery class.'),
 (4,'POST /build','Section four, post slash build, validates the request and builds a recovery case.'),
 (5,'POST /cases','Section five, post slash cases, records one recovery choice: continue, interrupt, fresh derived, or reconcile.'),
 (6,'POST /undo','Section six, post slash undo, tries a host-only undo with the expected version.')])
d.mapping('Where does recovery happen?',[
 ('map-sdk','CLAUDE AGENT SDK','Resume a local session','Your process reloads<br>the transcript and continues','In the Agent SDK, your own process resumes a session from its stored transcript, so an interrupted turn is your code\'s problem.'),
 ('map-managed','CLAUDE MANAGED AGENTS','The remote session','Interrupt, confirm idle,<br>read events.list, send a new turn','This platform uses Managed Agents beta sessions, not the Agent SDK. The remote session keeps the full event history. The host interrupts, confirms idle, reads events dot list, and sends a new turn.'),
 ('map-port','THIS PLATFORM','The Lab 40 recovery class','server/lib/lab40-recovery.ts','Here, the Lab forty recovery class holds the host ledger, and the rules for each recovery choice.')],'No Agent SDK resume is installed: the rules live in server/lib/lab40-recovery.ts.')
d.port('port-guards','Source · Refusal rules for each choice',{'port-continue':'Continue is refused while a send is uncertain, or an effect is pending.',
 'port-fresh':'A fresh derived session is also refused while any work is queued.','port-interrupt':'And interrupt cannot claim confirmed idle with unresolved work.'})
d.port('port-undo','Source · Host-only undo',{'port-undo-version':'Undo first checks the expected version of the host snapshot.',
 'port-undo-refused':'With any command, effect or remote event, undo is refused.','port-undo-restore':'Otherwise, only the versioned host draft is restored.'})
d.port('port-live','Source · The rule, and no live adapter',{'port-rule':'The dry check returns the rule: never truncate Managed event history, or silently drop accepted work.',
 'port-live-refused':'And a live build is refused: no live retained-session recovery adapter is configured. That is why the live run uses a separate script.'})
d.knowledge('Finish with the knowledge check: what should recovery consult before replaying work?','The host command and effect ledger. Accepted work and observed effects determine safe recovery choices.')
d.summary([('sum-ledger','LEDGER','Consult the ledger','Commands and effects first.','You can now consult the host command and effect ledger before choosing recovery.'),
 ('sum-undo','UNDO','Never erase accepted work','Undo restores only a host draft.','Undo restores only a versioned host draft, never accepted commands, effects or remote events.'),
 ('sum-retry','RETRY','No blind resend','Reconcile, confirm, then a new turn.','And an interrupted or uncertain turn is reconciled and confirmed, then retried as a new turn.')],'Lab 41 · Managed session lifecycle comparison')
d.finish()
