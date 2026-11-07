"""Lab 04 step-by-step walkthrough authored from real captures of the running platform (offline review and two live runs)."""
from lab_video_common import Deck,card,cue,head
d=Deck(4,'Lab 04 Step by Step: Permissions, Offline and Live','Permissions');e=d.e
assert [r['decision'] for r in e['review_live1']][:3]==['allow','allow','deny'] and 'Status: reviewed' in e['live1_draft'] and e['live2_draft'] is None
d.cover('CLAUDE MANAGED AGENTS · LAB 04 · PERMISSIONS','<h2>In this lab</h2><p>Review paused tool calls.<br>Allow or deny once.<br>Test the decision rules.<br>Verify the files on disk.</p>',
 'Welcome to Lab four, Permissions. In this lecture, you will act as the human reviewer for an agent. When a tool call pauses, you will allow it or deny it, see exactly one confirmation reach the session, and verify on disk which changes really landed, first with offline fixtures and then with real Claude.')
d.overview('PAUSE · DECIDE · CONFIRM','A paused tool call is answered once by the host',[
 ('ov-concepts','1 · CONCEPTS','requires_action pauses','always_ask pauses a call<br>user.tool_confirmation answers it','First, the concepts: an always ask tool call pauses the session with requires action, and the host answers it with one user tool confirmation.'),
 ('ov-offline','2 · OFFLINE','Be the reviewer','Allow, allow, deny, deny<br>Decision log and tester','Second, you will review four offline calls, allowing two and denying two, and then test the decision rules.'),
 ('ov-live','3 · LIVE','Two real runs','Same decisions with Claude<br>Then deny the first write','Third, two real live runs: the same decisions with real Claude, and then a run where you deny the very first write.'),
 ('ov-code','4 · CODE','Read the TypeScript','The decide route<br>Confirmations to the session','Finally, the TypeScript code behind the decision route and the confirmation that reaches the session.')],
 'Preallowed tools never pause, so the absence of a review is not proof that a call was reviewed.')
d.shot('lesson','Open Lab 04',{'lesson-title':'Open Lab zero four, Permissions, in the Permissions and security group.',
 'lesson-objective':'The objective: approve or deny paused tool calls through a host review dialog. This is the Managed Agents equivalent of the Agent SDK\'s can use tool callback.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path. Read it before your first review.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one, the objective: a requires action pause, answered once with a user tool confirmation.'),
 (2,'Core rule','Region two, the core rule. How is a paused tool decision answered? With one correlated user tool confirmation.'),
 (3,'Keep the boundary clear','Region three, keep the boundary clear: the host\'s decision must match the paused action, and must never be sent twice.'),
 (6,'Put it to the test','Region six, put it to the test: deny one write with your own deny message, and explain how the agent responds. The message comes back as an error tool result, and the session keeps running.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: run the Review scenario offline. Approve the write and the first edit, deny the second edit, and deny the summary write.'),
 (3,'Inspect the boundary','Step three: try a short approval window and let one review expire, then cancel a run while a review is pending.'),
 (4,'Follow the workflow','Step four: use the decision tester to replay a decision and to send one with a wrong token, and compare the answers.')])
d.shot('mapping','Review tool calls before they run',{
 'mapping-rule':'Open Run the exercise. The Agent SDK calls can use tool. Managed Agents instead pauses an always ask call with requires action, and the host answers once with a user tool confirmation.',
 'mapping-table':'The table maps each term: allow and deny become a confirmation result, and a deny message is sent back to the agent. There is no updated input: a confirmation cannot change what the agent asked for.'})
d.shot('settings','Run settings',{
 'settings-approval':'The approval window sets how long a review stays open, thirty seconds by default. If you do not answer in time, the review expires.',
 'settings-deadline':'The local deadline limits how long the host waits for the whole turn.'})
d.shot('dialog-write','Offline · The review dialog',{
 'dialog-write-title':'Run the Review scenario offline. The first paused call opens the review dialog: the agent wants to write the draft file.',
 'dialog-write-guard':'The host guard checks the container path before you decide. This path is inside the outputs folder, so it can be allowed.',
 'dialog-write-buttons':'Click Allow. Then allow the first edit as well.'})
d.shot('dialog-deny','Offline · Deny with a message',{
 'dialog-deny-title':'The second edit asks to replace the reviewer notes. This time we deny it.',
 'dialog-deny-message':'Type a deny message. It is sent to the agent, so make it useful: say what not to do.',
 'dialog-deny-button':'Then click Deny. We also deny the summary write, whose guard warns that an allow would be refused.'})
d.shot('offline-decisions','Offline · The decision log',{
 'offline-asked':'After the turn, panel one lists the calls that paused for review: one write, two edits, and the summary write.',
 'offline-log':'The decision log records each decision, who made it, how long it took, and that each confirmation was sent exactly once.'})
d.shot('offline-denials','Offline · Denials and the agent reply',{
 'offline-denial-list':'The two denials are listed: the second edit and the summary write, both denied by the host.',
 'offline-message':'And the authored agent acknowledges the deny message and does not retry the call.'})
d.shot('offline-files','Offline · Verify the file on disk',{'offline-draft':'On disk, only the allowed changes landed: Status: reviewed, while the reviewer notes line is unchanged, because the second edit was denied.'})
d.shot('offline-outcome','Offline · The turn completes',{'offline-result':'The turn completed with end turn: the pauses were not the end of the turn.','offline-cleanup':'And the outputs were applied to the offline sandbox.'})
d.shot('tester','The decision tester',{'tester-rule':'Now use the decision tester. A decision applies only once, and only within its own run.',
 'tester-results':'Replaying the last decision returns four hundred and nine: the approval was already consumed. A wrong token returns four hundred and four: unknown run or decision.'})
d.shot('preallowed','Preallowed calls never pause',{'preallowed-never':'Run the Preallowed only scenario: read and glob are always allow, so they never pause.',
 'preallowed-asked':'Nothing reached the reviewer. Remember: no review is not the same as an approved review.'})
d.live_disabled('Now let us review real tool calls. With live mode disabled, Run live does not call Claude.','Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend.')
d.restart('In the backend PowerShell window, stop the server with Control C and run npm dot cmd run dev colon server again.','Wait for Backend ready. The frontend keeps running.')
d.shot('live1-dialog','Live · Claude asks to write',{'live1-dialog-title':'Click Run live. This time the review dialog shows a real call from Claude: write the draft file.',
 'live1-dialog-guard':'The host guard says it can be allowed.','live1-dialog-buttons':'We make the same decisions as offline: allow the write, allow the first edit, deny the second edit.'},)
d.shot('live1-decisions','Live · Real decisions',{'live1-asked':'Claude made three calls that paused: the write and two edits.',
 'live1-log':'The decision log shows allow, allow, deny, each confirmation sent once, with the real reviewer latency.'})
d.shot('live1-denials','Live · Claude receives the denial',{'live1-denial-list':'The second edit was denied by the host.',
 'live1-message':'Claude\'s text shows it working through the files and respecting the decision.'})
d.shot('live1-files','Live · Verify the real file',{'live1-draft':'The output file was downloaded from the real container: Status: reviewed, with the reviewer notes line unchanged. Exactly the allowed changes, verified on disk.'})
d.shot('live1-outcome','Live · Run 1 outcome',{'live1-result':'The turn completed with end turn.','live1-cleanup':'The session was archived and the outputs were downloaded.'})
d.shot('live2-dialog','Live · Run 2: deny the first write',{'live2-dialog-title':'For run two, change one thing: deny the very first write.',
 'live2-dialog-guard':'The guard would allow it, but the reviewer decides.','live2-dialog-buttons':'Type a deny message, Do not write this file, and click Deny.'})
d.shot('live2-decisions','Live · One decision',{'live2-asked':'Only the write paused. Claude never attempted the edits, because they depended on the file.',
 'live2-log':'One decision: deny, confirmation sent once.'})
d.shot('live2-denials','Live · Claude follows the deny message',{'live2-denial-list':'The write was denied by the host.',
 'live2-message':'Claude reports that the write was denied, that nothing was created, and that it did not retry. The deny message guided its behavior.'})
d.shot('live2-files','Live · Nothing was written',{'live2-draft':'And the evidence agrees: the sandbox contains only the read-only uploads. No output file exists.'})
d.shot('live2-outcome','Live · Run 2 outcome',{'live2-result':'The turn still completed with end turn.','live2-cleanup':'And outputs: none. A completed turn with a denial is a normal, well-behaved result.'})
d.compare('Offline and live, compared','What did the reviews prove?',[
 ('cmp-once','ONCE','One confirmation per pause','Each pause answered once<br>Replay: 409 · Wrong token: 404','Each pause was answered exactly once, and the decision tester proved that a replay or a wrong token is rejected.'),
 ('cmp-files','FILES','The disk agrees','Allowed edits landed<br>Denied changes did not','The files on disk matched the decisions: allowed changes landed, denied ones did not.'),
 ('cmp-live','LIVE','Claude followed the decisions','Respected each deny message<br>Did not retry','And real Claude respected each deny message and did not retry the denied call.')],'Allow and deny answer one paused call; they cannot change the input.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the permissions module to its decision schema and the shared tool session.'),
 (3,'POST /decide','Section three is the decide route. It validates the decision, checks that the run and token match, and applies a decision only once, which is where the four hundred and nine and four hundred and four answers come from.'),
 (4,'POST /query','Section four is the query route that starts the run and streams its events.'),
 (6,'Decision and early response','Section six returns four hundred for invalid requests, including Agent SDK-only fields such as can use tool or updated input.'),
 (7,'Return the module contract','Section seven returns the router and its cleanup contract.')])
d.mapping('Where is canUseTool?',[
 ('map-sdk','CLAUDE AGENT SDK','canUseTool callback','Runs in your process<br>can return updatedInput','In the Agent SDK, can use tool is a callback in your own process, and it can even change the input.'),
 ('map-managed','CLAUDE MANAGED AGENTS','user.tool_confirmation','always_ask pauses the call<br>host sends allow or deny','In Managed Agents, an always ask call pauses the session, and the host sends a user tool confirmation with allow or deny and an optional deny message.'),
 ('map-port','THIS PLATFORM','The live port','lab04-port.ts builds the toolset<br>tool-session-port.ts confirms','The calls live in two files: the Lab four port and the shared tool session port.')],'The calls are in server/lib/lab04-port.ts and server/lib/tool-session-port.ts.')
d.port('port-spec','Live port · The Lab 04 toolset',{'port-spec':'The Lab four port defines the session: its toolset, where read and glob are always allow and write and edit are always ask, plus the deadline and budget.',
 'port-params':'These parameters are passed to the shared tool session port, which uploads the files and creates the session.'})
d.port('port-confirm','Live port · Send the confirmation',{'port-confirm':'And here is the confirmation: sessions dot events dot send with user tool confirmation events, each with the tool use ID, the result, and the deny message when denied.'})
d.knowledge('Finish with the knowledge check: how is a paused tool decision answered?','With one correlated user tool confirmation. Host decisions must match the paused action and avoid duplicate confirmation.')
d.summary([('sum-pause','PAUSE','always_ask pauses','The session waits for the host.','You can now explain that always ask pauses a call until the host answers.'),
 ('sum-once','ONCE','One confirmation','Allow or deny, never twice.','That the answer is one confirmation, allow or deny, sent only once.'),
 ('sum-disk','DISK','Verify the effects','The files show what landed.','And that the files on disk, not the dialog, show which changes really happened.')],'Lab 05 · Custom tools')
d.finish()
