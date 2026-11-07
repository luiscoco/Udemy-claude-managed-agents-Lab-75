"""Lab 32 step-by-step walkthrough authored from real captures of the running platform (offline: the authored plan gate fixture; live: a small script making real Managed Agents calls)."""
from lab_video_common import Deck
d=Deck(32,'Lab 32 Step by Step: Plan Review and Execution Gate, Offline and Live','Plan gate');e=d.e
assert e['plan_status']=='pending; plan v1; 0 execution file effect(s).' and 'Execution session: none.' in e['plan']
assert 'Last tool: planning / append_checklist: denied — Planning phase is read-only.' in e['planning-write']
assert e['approved_status']=='executed; plan v1; 1 execution file effect(s).' and 'Approved fictional deployment checklist.' in e['approved'] and 'allowed — Host-checked approved action.' in e['approved']
assert 'write_anywhere: denied — Tool is outside the selected execution capabilities.' in e['unselected']
assert e['rejected_status']=='rejected; plan v1; 0 execution file effect(s).' and e['revised_status']=='pending; plan v2; 0 execution file effect(s).'
assert 'Reviewer feedback: Keep the checklist short.' in e['revised'] and e['stale_status']=='Stale plan version or hash; inspect the current plan.'
assert 'Live use needs separately configured Managed planning and execution agents' in e['nolive']
live=d.transcript('live.raw.txt');L=' | '.join(live)
assert 'planning only: tools 0, MCP 0' in L and 'Turn 1 (plan only) → idle · stop end_turn · tool calls 0' in L and 'Agent plan: append_checklist notes.txt |' in L
assert 'capability append_checklist → approved' in L and 'rejected: write_anywhere is outside the selected capabilities' in L
assert 'Status idle → sessions.update grants tools: append_checklist' in L and 'host check: matches approved plan, appended' in L
assert 'execution file effects 1 · hash changed yes' in L and 'Session archived: yes' in L
assert 'Lab32PlanGate planning write → denied: Planning phase is read-only.' in L and 'Lab32PlanGate stale approval → refused 409' in L
split=next(i for i,l in enumerate(live) if l.startswith('Status idle'))
d.cover('CLAUDE MANAGED AGENTS · LAB 32 · PLAN GATE','<h2>In this lab</h2><p>Plan with no write tools.<br>Review one hashed plan.<br>Refuse stale approvals.<br>Execute one checked action.</p>',
 'Welcome to Lab thirty-two, Plan review and execution gate. In this lecture, you will start a read-only planning phase, try a write that the host denies, approve a hashed plan and watch one checked file change, reject a plan, and see an older approval refused after a revision. The app stays offline, and then a small script makes the same gate live, on a real Managed Agents session.')
d.overview('PLAN · REVIEW · EXECUTE','A reviewed plan is not proof of execution',[
 ('ov-concepts','1 · CONCEPTS','Two separate phases','Read-only planning,<br>restricted execution','First, the concepts: planning and restricted execution are separate phases, with separate evidence.'),
 ('ov-offline','2 · OFFLINE','Approve, reject, revise','A denied planning write,<br>a hash-checked decision','Second, the offline gate: a denied planning write, one approval checked against the plan hash, a rejection, and a stale approval.'),
 ('ov-live','3 · LIVE','A real terminal run','No tools to plan;<br>one tool after approval','Third, a real terminal run: a Managed session plans with no tools, and gets one restricted tool only after the host approves.'),
 ('ov-code','4 · CODE','Read the TypeScript','The hash, the decision<br>and the tool check','Finally, the TypeScript code for the plan hash, the decision, and the tool check.')],
 'Plan text cannot grant tools or permission: the host decides.')
d.shot('lesson','Open Lab 32',{'lesson-title':'Open Lab thirty-two, Plan review and execution gate.','lesson-objective':'The objective: review an immutable, host-validated plan before a separate restricted execution phase, with file effects checked independently of the plan text.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: review an immutable, host-validated plan before a separate restricted execution phase.'),
 (2,'Core rule','Region two, the core rule: a reviewed plan does not prove that execution succeeded. Execution effects require independent checks.'),
 (3,'Keep the boundary clear','Region three: planning and restricted execution are separate phases, with separate evidence.'),
 (6,'Put it to the test','Region six: request a revision, and verify that an older approval cannot authorize the new plan.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: start the planning fixture, and compare its initial and current file hashes. Planning has zero write effects.'),
 (2,'Run the comparison','Step two: try a planning write and an unselected execution tool, and inspect the host denials.'),
 (3,'Inspect the boundary','Step three: request a revision and try the older approval. The version and hash must fail.'),
 (4,'Follow the workflow','Step four: approve the current plan, and inspect the fresh execution session and one checked file change.')])
d.shot('experiment','The plan gate experiment',{'exp-rule':'Open Run the exercise. A read-only planning phase produces a versioned plan. The host checks one reviewer decision against its immutable hash, and approval starts a fresh restricted execution session.',
 'exp-scenario':'Keep the approval scenario.','exp-start':'And select Start plan.'})
d.shot('plan','Offline · Plan version one',{'plan-text':'Plan version one: append one fictional deployment checklist line to notes dot t x t, with the capability append underscore checklist. The text of this plan cannot grant tools or permission.',
 'plan-hash':'The host stores a hash of the plan version, text, action and path.','plan-sessions':'There is a planning session, and no execution session yet.'})
d.shot('planning-write','Offline · A planning write is denied',{'pw-tool':'Select Try planning write. The planning phase asks for append underscore checklist, and the host denies it: the planning phase is read-only.',
 'pw-effects':'Planning effects stay at zero, and the current file hash equals the initial hash.','pw-file':'The notes file holds only its original line.','pw-status':'The plan is still pending.'})
d.shot('approved','Offline · Approve the current plan',{'approved-sessions':'Select Approve current plan. The host now starts a separate execution session.',
 'approved-file':'One checklist line is appended to the notes file.','approved-tool':'The last tool is the execution phase append underscore checklist: allowed, as a host-checked approved action.',
 'approved-status':'The plan is executed, with one execution file effect.'})
d.shot('unselected','Offline · An unselected tool',{'unselected-tool':'Select Try unselected execution tool. Write anywhere is denied: it is outside the selected execution capabilities.',
 'unselected-effects':'Execution effects stay at one. Approval allowed one action, not every tool.'})
d.shot('rejected','Offline · Reject a plan',{'rejected-sessions':'Now start the rejection scenario, and select Reject plan. No execution session is created.',
 'rejected-effects':'Execution effects are zero, and the file hash is unchanged.','rejected-status':'The plan is rejected.'})
d.shot('revised','Offline · Request a revision',{'revised-title':'Start the revision scenario, and select Request revision. The plan is now version two.',
 'revised-text':'The reviewer feedback is part of the new plan text.','revised-hash':'So the hash changes too.'})
d.shot('stale','Offline · A stale approval',{'stale-button':'Select Try stale approval. It sends an approval for the older version and hash.',
 'stale-hash':'The current plan keeps its version two hash.','stale-status':'The host refuses it: stale plan version or hash. Inspect the current plan.'})
d.shot('no-live','The app stays offline',{'no-live-text':'The app stays offline in this lab: live use needs separately configured planning and execution agents, and this exercise makes no provider call. So now we make the real calls from a small script, in the terminal of the project.'})
d.terminal('Live · Plan with no tools, host gate',[(l,'lv-created' if l.startswith('Session sesn_') else 'lv-turn1' if l.startswith('Turn 1') else 'lv-plan' if l.strip().startswith('Agent plan') else 'lv-approved' if l.startswith('Host gate: plan v1') else 'lv-tampered' if l.startswith('Host gate, tampered') else None) for l in live[:split]],
 {'lv-created':'The script creates one session with agent with overrides, and no tools: zero tools and zero MCP servers. This is the planning phase.',
  'lv-turn1':'The first turn asks for a plan only. The session returns to idle, with stop reason end turn, and zero tool calls.',
  'lv-plan':'The agent replies with one plan line: append underscore checklist, notes dot t x t, and the checklist line it proposes.',
  'lv-approved':'The host gate hashes plan version one, with the same rule as the lab, and checks the capability. Approved.',
  'lv-tampered':'A tampered plan that asks for write anywhere is rejected locally: it is outside the selected capabilities.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · Grant one tool, execute, check',[(l,'lv-grant' if l.startswith('Status idle') else 'lv-tool' if l.startswith('agent.custom_tool_use') else 'lv-notes' if l.startswith('notes.txt') else 'lv-archived' if l.startswith('Session archived') else 'lv-stale' if l.startswith('Lab32PlanGate stale') else None) for l in live[:1]+live[split:]],
 {'lv-grant':'Only after approval, while the session is idle, sessions dot update grants a single tool: append underscore checklist.',
  'lv-tool':'In the second turn, the agent calls append underscore checklist. The host checks the call against the approved plan, and appends the line.',
  'lv-notes':'The notes file now has two lines: one execution file effect, and the file hash changed.',
  'lv-archived':'The script archives the session in a finally block. Archived: yes.',
  'lv-stale':'Locally, the lab\'s own plan gate denies a planning write, and refuses a stale approval: four hundred nine, stale plan version or hash.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the real session prove?',[
 ('vs-plan','PLAN','No tools to plan','Zero tools; zero<br>tool calls in turn one','Like the fixture, the real planning phase had no write capability: zero tools, and zero tool calls.'),
 ('vs-gate','REVIEW','The host decides','A hashed plan; a tampered<br>capability is rejected','The host hashed the plan and checked its capability. Plan text could not grant a tool.'),
 ('vs-exec','EXECUTE','One checked effect','One granted tool;<br>one appended line','Execution got one restricted tool, and the host checked the single file effect.')],
 'The lab starts a fresh execution session; the script granted the tool on the same idle session.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the route to the plan gate and its schemas.'),
 (3,'POST /run','Section three starts a plan run.'),
 (5,'POST /decide','Section five validates one reviewer decision: approve, reject, or revise.'),
 (6,'POST /who','Section six handles inspect, cancel, and tool attempts.')])
d.mapping('Where is plan mode?',[
 ('map-sdk','CLAUDE AGENT SDK','Plan permission mode','permissionMode plan;<br>approve, then run tools','In the Agent SDK, plan mode is a permission mode: the agent plans without running tools, and you approve before it executes.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Host-granted tools','No tools to plan;<br>sessions.update when idle','This platform uses Managed Agents beta sessions, not the Agent SDK. There is no plan mode flag: the host plans with no tools, and grants tools only after approval.'),
 ('map-port','THIS PLATFORM','The Lab 32 gate','server/lib/lab32-plan-gate.ts','Here, the Lab thirty-two plan gate models that boundary with an authored fixture.')],
 'Plan hash, stale checks and the execution tool check are in server/lib/lab32-plan-gate.ts.')
d.port('port-plan','Source · Hash the plan, refuse live',{'port-hash':'The plan hash covers the version, the text, the action, and the path.',
 'port-live':'A live run is refused: it needs separately configured read-only and restricted agents.'})
d.port('port-tools','Source · Read-only planning, one tool',{'port-readonly':'Every planning attempt is denied, and an execution tool other than append underscore checklist is outside the selected capabilities.',
 'port-append':'Only the approved action appends the checked line, and records one execution file effect.'})
d.port('port-decide','Source · Stale, reject, execute',{'port-stale':'A decision with a different version or hash is refused as stale.',
 'port-reject':'A rejection ends the run with no execution.','port-execute':'Approval creates a new execution session, and attempts the single approved action.'})
d.knowledge('Finish with the knowledge check: does a reviewed plan prove that execution succeeded?','No. Planning and restricted execution are separate phases, with separate evidence.')
d.summary([('sum-plan','PLAN','Plan without tools','The plan cannot grant tools.','You can now keep planning read-only, so a plan cannot grant itself tools.'),
 ('sum-review','REVIEW','Hash the decision','Stale approvals fail.','Check every decision against the current plan version and hash.'),
 ('sum-exec','EXECUTE','Check the effect','One tool, one checked change.','And grant only the selected capability, then check the file effect independently.')],'Lab 33 · Human forms during tool work')
d.finish()
