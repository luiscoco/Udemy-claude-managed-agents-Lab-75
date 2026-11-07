"""Lab 38 step-by-step walkthrough authored from real captures of the running platform (offline: authored suggestion fixtures; live: a small script that derives follow-up suggestions from a real Managed Agents reply)."""
from lab_video_common import Deck
d=Deck(38,'Lab 38 Step by Step: Application Follow Up Suggestions, Offline and Live','Agent workflows');e=d.e
assert e['liveButtons']==0 and e['scenarios']==['normal','delayed','suppressed','stale','disabled']
assert e['status_started']=='0 suggestion(s); 1 explicit user send(s); auto-sends 0.' and e['status_checked']=='1 suggestion(s); 1 explicit user send(s); auto-sends 0.'
assert e['status_copied']=='Suggestion copied to input; no message sent.' and e['copied_draft']=='What observation detail would you like to check next?'
assert 'turn 2; response v2.' in e['sent'] and 'Explicit sends: 2. Auto-sends: 0.' in e['sent'] and e['status_delayed'].startswith('1 suggestion(s)')
assert 'No suggestion available. This is a valid outcome.' in e['suppressed'] and 'Enable suggestions' in e['disabled']
assert 'Copy: What observation detail' in e['stale-sent'] and 'Stale suggestion rejected: true.' in e['stale'] and 'No native prompt_suggestion event is assumed' in e['nolive']
live=d.transcript('live.raw.txt');L=' | '.join(live)
assert 'Lab38Suggestions.chat(live) → 422' in L and 'FOLLOW-UPS line: 3 untrusted candidates' in L and '(host test) → tool-granting text' in L
assert 'Suggestions shown: 3 · bound to turn 1 / v1 · auto-sends 0' in L and 'Copy suggestion 1 → draft only · explicit sends still 1' in L
assert 'Send message (lab38SendSchema ok) → user.message turn 2' in L and 'stale, rejected · no user message sent' in L
assert 'events.list: user.message ×2 · suggestion events ×0' in L and L.rstrip().endswith(': yes')
split=next(i for i,l in enumerate(live) if l.startswith('Copy suggestion'))
d.cover('CLAUDE MANAGED AGENTS · LAB 38 · AGENT WORKFLOWS','<h2>In this lab</h2><p>Offer optional suggestions.<br>Bind them to a turn.<br>Copy, never auto-send.<br>Reject stale ones.</p>',
 'Welcome to Lab thirty-eight, Application follow up suggestions. In this lecture, you will offer optional follow-up suggestions that the application owns, bind each one to a conversation, turn and response version, copy one into the input without sending it, and see an older suggestion rejected as stale. The app stays offline, and then a small script derives suggestions from a real Managed Agents reply, live in the terminal.')
d.overview('SUGGEST · COPY · SEND','Suggestions belong to the application',[
 ('ov-concepts','1 · CONCEPTS','Optional and bound','Conversation, turn<br>and response version','First, the concepts: a suggestion is optional application output, bound to a conversation, a turn and a response version.'),
 ('ov-send','2 · SEND','Copy, then send','Copying fills the draft;<br>Send is a new user turn','Second, copying a suggestion only fills the draft. Sending it is a separate, explicit user turn.'),
 ('ov-absent','3 · ABSENCE','Absent or stale','Delayed, suppressed, disabled;<br>stale ones are rejected','Third, delayed, suppressed and disabled suggestions, where absence is valid, and a stale suggestion that is rejected.'),
 ('ov-code','4 · LIVE AND CODE','A real reply, then code','App-made suggestions from<br>a live session; then TypeScript','Finally, a live terminal run that builds suggestions from a real session reply, and the TypeScript code behind the fixture.')],
 'No native prompt_suggestion event: the host decides what to offer.')
d.shot('lesson','Open Lab 38',{'lesson-title':'Open Lab thirty-eight, Application follow up suggestions.','lesson-objective':'The objective: offer optional application follow-up suggestions, bound to a conversation, turn and response version, without auto-sending, and without conflating their usage with the answer.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: optional follow-up suggestions, bound to a conversation, turn and response version.'),
 (2,'Core rule','Region two, the core rule: a suggestion is sent only after an explicit user selection, with the current binding.'),
 (3,'Keep the boundary clear','Region three: suggestions are optional, and separate from the answer. Showing one does not send a message.'),
 (6,'Put it to the test','Region six: explain why a suggestion may be absent, and why accepting one needs a separate send.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: start a normal offline conversation, and inspect the answer before checking suggestions.'),
 (2,'Run the comparison','Step two: copy a suggestion into the input, and confirm the explicit send count does not change.'),
 (3,'Inspect the boundary','Step three: press Send message, to submit it as a separate user turn.'),
 (4,'Follow the workflow','Step four: try delayed, suppressed and disabled suggestions. Absence is valid.')])
d.shot('experiment','The suggestion experiment',{'exp-rule':'Open Run the exercise. Suggestions are bound to a conversation, turn and response version. Copying one fills the input only, and a separate Send action submits it.',
 'exp-scenario':'Choose an offline scenario: normal, delayed, suppressed, stale, or disabled.','exp-start':'Start with normal, and select Start conversation.'})
d.shot('started','Offline · The answer comes first',{'started-conv':'The conversation starts at turn one, response version one.',
 'started-answer':'The agent answer is an authored fixture about a fictional Aurora Finch note.','started-none':'No suggestion yet. The host has not checked for one, and that is a valid outcome.',
 'started-sends':'One explicit send so far, the opening message. Auto-sends: zero.','started-status':'Zero suggestions.'})
d.shot('checked','Offline · Check suggestions',{'checked-copy':'Select Check suggestions. One suggestion appears, as a Copy button: What observation detail would you like to check next?',
 'checked-usage':'Answer usage and suggestion usage are reported separately, both from the authored fixture. Provider calls: zero.','checked-status':'One suggestion, still one explicit send.'})
d.shot('copied','Offline · Copy fills the draft only',{'copied-draft':'Select the Copy button. The suggestion text lands in Your next message, as a draft.',
 'copied-sends':'Explicit sends are still one, and auto-sends zero.','copied-status':'The status says it plainly: suggestion copied to input, no message sent.'})
d.shot('sent','Offline · Send is a new user turn',{'sent-conv':'Now select Send message. The conversation moves to turn two, response version two.',
 'sent-answer':'The fixture answers the follow-up question.','sent-none':'The old suggestion is cleared, because it belonged to turn one.',
 'sent-sends':'Explicit sends: two. Auto-sends: still zero.','sent-status':'Only the user pressing Send created that turn.'})
d.shot('delayed','Offline · Delayed suggestion',{'delayed-copy':'In the delayed scenario, the suggestion becomes available about a second after the answer, so the check waits briefly before it appears.',
 'delayed-status':'One suggestion, one explicit send.'})
d.shot('suppressed','Offline · Suppressed suggestion',{'suppressed-none':'In the suppressed scenario, Check suggestions returns nothing. No suggestion is a valid outcome.',
 'suppressed-status':'Zero suggestions.'})
d.shot('disabled','Offline · Suggestions disabled',{'disabled-toggle':'In the disabled scenario, suggestions start switched off: the button offers Enable suggestions.',
 'disabled-none':'Checking returns no suggestion.','disabled-status':'Zero suggestions, and the conversation still works.'})
d.shot('stale-sent','Offline · A suggestion outlives its turn',{'stale-sent-conv':'In the stale scenario, copy and send the suggestion. The conversation moves to turn two, response version two.',
 'stale-sent-copy':'But this scenario keeps showing the old suggestion, which was bound to turn one.','stale-sent-status':'One suggestion, two explicit sends.'})
d.shot('stale','Offline · Stale suggestion rejected',{'stale-none':'Select Check suggestions. The old suggestion does not match the current turn and response version, so it is removed.',
 'stale-flag':'Stale suggestion rejected: true. No user message was sent for it.','stale-status':'Zero suggestions, still two explicit sends.'})
d.shot('closed','Offline · Close the conversation',{'closed-check':'Select Close conversation. Check suggestions and the other actions are now disabled.',
 'closed-none':'A closed conversation offers no suggestions.','closed-status':'The counts stay as they were.'})
d.shot('no-live','The app stays offline',{'no-live-text':'The app stays offline in this lab: there is no Run live button, no native prompt suggestion event is assumed, and the fixture does not start a separately billed suggestion session. So now we make the real calls from a small script, in the terminal of the project.'})
d.terminal('Live · A real answer, app-made suggestions',[(l,'lv-refused' if l.startswith('Lab38Suggestions') else 'lv-session' if l.startswith('Session sesn_') else 'lv-line' if 'FOLLOW-UPS line' in l else 'lv-rejected' if '(host test)' in l else 'lv-shown' if l.startswith('Suggestions shown') else None) for l in live[:split]],
 {'lv-refused':'First, the script asks the lab\'s own Lab38Suggestions class for a live chat. It refuses with four twenty-two, before any API call: live suggestion generation needs a separately budgeted session.',
  'lv-session':'So the script creates one Managed Agents session itself, with zero tools, and sends one short user turn: a fictional Aurora Finch field note. The real answer comes back with stop reason end turn.',
  'lv-line':'The reply ends with a follow-ups line. The host treats those three candidates as untrusted text, and strips them from the answer it shows.',
  'lv-rejected':'Each candidate goes through the lab\'s suggestion schema, five to one hundred twenty characters, plus a host filter: questions only, no tool or permission words. All three real candidates pass. A host test candidate that tries to enable the bash tool is rejected.',
  'lv-shown':'Three suggestions are shown, bound to turn one, response version one. Auto-sends: zero.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · Explicit send, then stale',[(l,'lv-copy' if l.startswith('Copy suggestion') else 'lv-send' if l.startswith('Send message') else 'lv-stale' if l.startswith('Old suggestion') else 'lv-events' if l.startswith('events.list') else 'lv-archived' if l.startswith('Archived') else None) for l in live[split:]],
 {'lv-copy':'Copying suggestion one only fills the draft. Explicit sends are still one.',
  'lv-send':'Then the send is validated with the lab\'s send schema, at the current turn and response version, and goes out as a new user message: turn two. The agent answers the follow-up.',
  'lv-stale':'Another suggestion from turn one is now stale against turn two, so it is rejected, and no user message is sent.',
  'lv-events':'Events dot list confirms it: exactly two user messages, both explicit, and zero suggestion events. Suggestions never reached the API as anything but a normal user turn.',
  'lv-archived':'Finally, the session is archived in a finally block.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the real session prove?',[
 ('vs-owner','OWNER','The application','Fixture text offline;<br>host-checked candidates live','Offline, the suggestion is authored fixture text. Live, the host turned real reply text into suggestions, and filtered them. Either way, the application owns them.'),
 ('vs-send','SEND','Only explicit','Copy changes the draft;<br>two user.message events','In the app and in the API, copying sent nothing. Only Send created a turn: events dot list shows two user messages.'),
 ('vs-stale','STALE','Bound to a turn','Turn one suggestion,<br>rejected at turn two','And a suggestion bound to an older turn was rejected in both, before any message.')],'The Managed API has no suggestion event: it only sees normal user turns.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect this module to the suggestion schemas and the delegated implementation.'),
 (4,'POST /chat','Section four, post slash chat, validates the request and starts a conversation.'),
 (6,'POST /send','Section six, post slash send, validates an explicit user send, with its expected turn and response version.'),
 (7,'POST /when','Section seven, post slash when, can wait briefly, and then asks whether a suggestion is available.')])
d.mapping('Where do follow-up suggestions come from?',[
 ('map-sdk','CLAUDE AGENT SDK','Prompt suggestions','The original lesson:<br>suggested next prompts','The original Agent SDK lesson was called Prompt suggestions: suggested next prompts for the user.'),
 ('map-managed','CLAUDE MANAGED AGENTS','No suggestion event','The session sees only<br>normal user.message turns','This platform uses Managed Agents beta sessions, not the Agent SDK. No native prompt suggestion event is assumed: a sent suggestion is just a user message.'),
 ('map-port','THIS PLATFORM','The Lab 38 host','server/lib/lab38-suggestions.ts','Here, the Lab thirty-eight host binds, checks and rejects suggestions, with authored fixtures.')],'No Agent SDK suggestion feature is installed: the logic is in server/lib/lab38-suggestions.ts.')
d.port('port-when','Source · Absent or stale',{'port-absent':'A closed, disabled, suppressed or not-yet-available conversation simply returns no suggestion.',
 'port-stale':'A suggestion whose turn or response version no longer matches is removed, and marked stale rejected.'})
d.port('port-send','Source · Only an explicit, current send',{'port-bind':'A send must name the current turn and response version, and a chosen suggestion must still match its binding and its text. Otherwise, no user message is sent.',
 'port-explicit':'Only then does the send count go up, and the turn and response version advance.'})
d.port('port-offline','Source · Offline, never auto-sent',{'port-autosend':'Every snapshot reports auto-sends as zero.',
 'port-live':'And a live chat is refused with four twenty-two: it needs a separately budgeted Managed session.'})
d.knowledge('Finish with the knowledge check: when should a follow-up suggestion be sent?','Only after an explicit user selection, with the current binding. Suggestions are optional, and bound to conversation, turn and response version.')
d.summary([('sum-optional','OPTIONAL','Offer, never require','Absence is a valid outcome.','You can now offer optional follow-up suggestions, where absence is a valid outcome.'),
 ('sum-send','SEND','Copy, then send','Only an explicit user turn.','Copying fills the draft. Only an explicit send creates a user turn, never an auto-send.'),
 ('sum-bound','BOUND','Bound to a turn','Stale suggestions are rejected.','And every suggestion is bound to its turn and response version, so stale ones are rejected.')],'Lab 39 · Trusted configuration and untrusted checkouts')
d.finish()
