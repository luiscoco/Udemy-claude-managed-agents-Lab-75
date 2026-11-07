"""Lab 30 step-by-step walkthrough authored from real captures of the running platform (offline host task board fixture and one live terminal run of a real Managed session against the same host board)."""
from lab_video_common import Deck
d=Deck(30,'Lab 30 Step by Step: Host Task Board and Completion Gates, Offline and Live','Task board gates');e=d.e
assert 'Agent claim: The agent claims the three-step plan is complete.' in e['started'] and '0/3 host tasks done' in e['started']
assert e['refusedText']=='Dependencies are incomplete.' and 'draft-checked' in e['draft'] and 'published-link' in e['publish']
assert e['replay']['before']==e['replay']['after'] and '"evidence":"review-approved"' in e['listText']
assert 'Live custom-tool execution needs a separately configured dedicated Managed agent.' in e['nolive']
live=d.transcript('live.raw.txt');raw=chr(10).join(live);split=next(i for i,l in enumerate(live) if l.startswith('Custom tool calls answered'))
assert "#1 update_task task_2 v1 'review-approved' → is_error: Dependencies are incomplete. · board v4" in raw and 'Completion needs checked evidence: draft-checked.' in raw
assert "update_task task_1 v1 'draft-checked' → ok, done · board v5" in raw and "update_task task_3 v1 'published-link' → ok, done · board v7" in raw
assert 'recorded result returned, no new result row · board v7 -> v7' in raw and 'Final host board (source of truth) v7: 3/3 done' in raw
assert 'stop: end_turn' in raw and 'Agent claim: Yes, the plan is complete' in raw and 'Session archived: yes' in raw
d.cover('CLAUDE MANAGED AGENTS · LAB 30 · TASK BOARD','<h2>In this lab</h2><p>Compare a claim with host state.<br>Hit a dependency gate.<br>Complete with evidence.<br>Replay an event safely.</p>',
 'Welcome to Lab thirty, Host task board and completion gates. In this lecture, you will start an offline task board, watch the host refuse a completion whose dependency is still open, complete each task with checked evidence, replay an event ID without a second effect, and list the tasks. The app itself stays offline, so we finish with a real terminal run, where a Managed agent works against the same host board.')
d.overview('CLAIM · GATE · EVIDENCE','An agent claim is a statement, not proof',[
 ('ov-concepts','1 · CONCEPTS','The host board','Task IDs, versions,<br>dependencies, evidence','First, the concepts: the host owns task IDs, versions, dependencies and evidence.'),
 ('ov-offline','2 · OFFLINE','Gate, evidence, replay','A refused completion, checked<br>evidence, one replayed event','Second, the offline board: a completion the host refuses, completions with checked evidence, and a replayed event that changes nothing.'),
 ('ov-live','3 · LIVE','A real terminal run','A Managed agent meets<br>the same host gates','Third, a real terminal run: a Managed agent calls the same board through custom tools, and the same gates answer.'),
 ('ov-code','4 · CODE','Read the TypeScript','The gate and the<br>event deduplication','Finally, the TypeScript code for the gates and the event deduplication.')],
 'Completion changes only when the host checks pass.')
d.shot('lesson','Open Lab 30',{'lesson-title':'Open Lab thirty, Host task board and completion gates.','lesson-objective':'The objective: use a host-owned task board and typed custom-tool inputs to enforce dependencies, versions and checked evidence, independently of agent claims.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: a human goal becomes a host task board, and completion is based on checked evidence, not agent claims.'),
 (2,'Core rule','Region two, the core rule: dependencies met, the expected version, and valid evidence.'),
 (3,'Keep the boundary clear','Region three: an agent claim is a statement, not proof. Completion changes only when the host checks pass.'),
 (6,'Put it to the test','Region six: try a plan change, and locate the gate that accepts or refuses it.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: start the three-step offline board, and compare the agent claim with the host task states.'),
 (2,'Run the comparison','Step two: attempt a completion before its dependencies are done, and inspect the correlated is underscore error result.'),
 (3,'Inspect the boundary','Step three: complete draft, review and publish with exact checked evidence, in order.'),
 (4,'Follow the workflow','Step four: replay a tool event ID, and confirm there is no second effect.')])
d.shot('experiment','The task board experiment',{'exp-rule':'Open Run the exercise. The host owns task IDs, versions, dependencies and completion evidence. A model claim cannot mark work complete without a validated tool result.',
 'exp-scenario':'Keep the three-step scenario.','exp-start':'And select Start offline board.'})
d.shot('started','Offline · The claim and the board',{'started-claim':'The agent claims the three-step plan is complete.',
 'started-table':'But the host board shows draft, review and publish all open, at version one. Review depends on draft, and publish depends on review.','started-status':'Zero of three host tasks are done.'})
d.shot('refused','Offline · A refused completion',{'refused-result':'Select Attempt review completion. The host records a correlated result for this event ID.',
 'refused-text':'The result text: dependencies are incomplete. The draft is still open.','refused-status':'The update task call was refused, and its effect was not applied.'})
d.shot('draft','Offline · Draft with evidence',{'draft-row':'Select Complete draft with evidence. Task one is done, at version two, with the evidence draft checked.',
 'draft-review':'Review is still open; the refused attempt changed nothing.','draft-result':'A new correlated result was recorded for this event.'})
d.shot('publish','Offline · Review and publish',{'publish-board':'Now attempt the review completion again, then complete publish. The board is at version seven.',
 'publish-review':'Review is done, with the evidence review approved.','publish-row':'And publish is done, with the evidence published link.'})
d.shot('replay','Offline · Replay the last event ID',{'replay-last':'Select Replay last event ID. No new result row appears; the last one is still the publish event.',
 'replay-status':'The host returns the recorded result. The board version stays at seven: no second effect.'})
d.shot('list','Offline · List tasks',{'list-result':'Select List tasks. The read is recorded as its own event.',
 'list-text':'Its result text lists all three tasks as done, each with its checked evidence.','list-status':'List tasks was accepted, and applied no effect.'})
d.shot('no-live','Why the app stays offline',{'no-live-note':'Provider calls: zero. Host state decides completion, and agent claims cannot bypass the gates.',
 'no-live-text':'This lab has no Run live button. Live custom-tool execution needs a separately configured, dedicated Managed agent, so the app makes no billed run. The app stays offline, and we now make the real calls from a small script in the terminal.'})
cue=lambda l,rules:next((c for c,f in rules if f(l)),None)
d.terminal('Live · A Managed agent meets the host gates',[(l,cue(l,[('la-cmd',lambda l:'_live30.ts' in l),('la-board',lambda l:l.startswith('Host board v4')),('la-session',lambda l:l.startswith('Session sesn_')),
 ('la-refused',lambda l:l.startswith('#1 ')),('la-evidence',lambda l:l.startswith('#3 ')),('la-done',lambda l:l.startswith('#7 '))])) for l in live[:split]],
 {'la-cmd':'Run the script with node, in the cloned repo. It builds the host board with the same Lab thirty board module.',
  'la-board':'The host board is at version four: draft, review and publish, zero of three done.',
  'la-session':'One Managed session uses the existing agent, overriding its tools with two custom tools: list tasks and update task. One user message asks it to try review first.',
  'la-refused':'The agent asks to complete review. The session pauses with requires action, the host gate refuses, dependencies are incomplete, and the script sends an is underscore error tool result. The board stays at version four.',
  'la-evidence':'After listing the tasks, the agent tries draft with made-up evidence. The host refuses again, and the error names the checked evidence: draft checked.',
  'la-done':'With the right evidence, draft, review and publish are accepted in order. Publish also needed a second try, and the board reaches version seven.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · Host state, replay and cleanup',[(l,cue(l,[('lb-count',lambda l:l.startswith('Custom tool calls answered')),('lb-claim',lambda l:l.startswith('Agent claim')),
 ('lb-replay',lambda l:'recorded result returned' in l),('lb-board',lambda l:l.startswith('Final host board')),('lb-archived',lambda l:l.startswith('Session archived'))])) for l in live[split:]],
 {'lb-count':'The host answered seven custom tool calls, after seven requires action pauses, and the turn ended with end turn.',
  'lb-claim':'The agent claims the plan is complete. That is still only a statement.',
  'lb-replay':'Then the host replays the last real update task event ID, with the same input. The recorded result comes back, no new result row, and the board stays at version seven.',
  'lb-board':'The host board, the source of truth, agrees this time: three of three done, each with its checked evidence.',
  'lb-archived':'Finally, the script archived the session.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','Same gates, real agent',[
 ('vs-gate','GATE','Review before draft','Refused offline and live:<br>Dependencies are incomplete','Offline and live, review before draft was refused with the same message: dependencies are incomplete.'),
 ('vs-evidence','EVIDENCE','Checked markers','The live agent guessed twice;<br>the host refused both','The live agent guessed wrong evidence twice, and the host refused both, until the checked markers matched.'),
 ('vs-replay','REPLAY','One effect per event','Board v7 -> v7<br>offline and live','Replaying an event ID left the board at version seven, offline and live.')],'The agent claim matched the board only because the host gates passed.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the task board module to its routes.'),
 (3,'POST /run','Section three starts an offline board with the selected scenario.'),
 (5,'POST /tools','Section five handles a custom tool call against the host board.')])
d.mapping('Who owns the task list?',[
 ('map-sdk','CLAUDE AGENT SDK','TodoWrite','The agent writes its own<br>task list as it works','In the Agent SDK, the agent tracks its own work with the TodoWrite tool.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Host-owned board','Custom tools: update_task,<br>list_tasks, get_task','This platform uses Managed Agents beta sessions, not the Agent SDK. The host owns the board, and the agent can only change it through custom tools.'),
 ('map-port','THIS PLATFORM','The Lab 30 board','server/lib/lab30-board.ts','The code is in the Lab thirty board module.')],'Gates, evidence checks and event deduplication are in server/lib/lab30-board.ts.')
d.port('port-dedupe','Source · One effect per event ID',{'port-dedupe':'Each event ID is fingerprinted. A replay with the same input returns the recorded result; conflicting input is rejected.',
 'port-result':'A rejected tool call becomes an is underscore error result, with no effect applied.'})
d.port('port-gate','Source · The completion gate',{'port-version':'An update must name the current task version.',
 'port-deps':'Completion is refused while any dependency is not done.','port-evidence':'And the evidence must match the checked marker for that task.'})
d.knowledge('Finish with the knowledge check: what establishes task completion on the host board?','The host board validates completion independently of agent claims.')
d.summary([('sum-claim','CLAIM','Claims are not proof','The host board decides.','You can now treat an agent claim as a statement, not proof.'),
 ('sum-gate','GATE','Dependencies and evidence','Checked before completion.','Explain how dependencies, versions and evidence gate completion.'),
 ('sum-replay','REPLAY','One effect per event','Replays return the record.','And show that a replayed event ID applies no second effect.')],'Lab 31 · Host questions and correlated answers')
d.finish()
