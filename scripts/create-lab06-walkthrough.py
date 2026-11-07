"""Lab 06 step-by-step walkthrough authored from real captures of the running platform (offline sessions and one live retained session)."""
import re
from lab_video_common import Deck
d=Deck(6,'Lab 06 Step by Step: Retained Sessions, Offline and Live','Sessions and retained context');e=d.e
sid=lambda s:re.search(r'sesn_\w+',s).group(0)
assert sid(e['live1']['identity'])==sid(e['live2']['identity']) and 'Aurora Finch' in e['live2']['history'] and 'archived' in e['liveClose']
d.cover('CLAUDE MANAGED AGENTS · LAB 06 · SESSIONS','<h2>In this lab</h2><p>Continue one session.<br>Compare a fresh session.<br>Reconnect without duplicates.<br>Close and archive.</p>',
 'Welcome to Lab six, Sessions and retained context. In this lecture, you will continue a conversation in the same managed session, compare it with a fresh session, reconnect without duplicating events, and finally close and archive the session, offline and then with real Claude.')
d.overview('ONE SESSION · MANY TURNS','Context lives in the session you continue',[
 ('ov-concepts','1 · CONCEPTS','Retained sessions','New creates a session<br>Continue reuses it','First, the concepts: New creates one remote session, and Continue sends another message to that same session.'),
 ('ov-offline','2 · OFFLINE','Continue, reconnect, close','Same session ID<br>Duplicates ignored','Second, the offline flow: continue, reconnect without duplicates, inspect the index, and close.'),
 ('ov-live','3 · LIVE','Real recall','Two turns in one session<br>Then archive it','Third, two real turns in one live session: Claude remembers the project name.'),
 ('ov-code','4 · CODE','Read the TypeScript','Create, stream, send<br>List history, archive','Finally, the TypeScript code that creates, continues, hydrates, and archives the session.')],
 'Recall comes from reusing the same session, not from the agent guessing.')
d.shot('lesson','Open Lab 06',{'lesson-title':'Open Lab zero six, Sessions and retained context.',
 'lesson-objective':'The objective: continue a conversation in the same server-owned managed session, compare it with fresh context, and reconnect without duplicating persisted events.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: continue the same session, compare it with a fresh one, and reconnect without duplicates.'),
 (2,'Core rule','Region two, the core rule. What preserves the same remote conversation? Continuing the owned retained session.'),
 (3,'Keep the boundary clear','Region three: retained context and reconnect deduplication are separate responsibilities.'),
 (6,'Put it to the test','Region six: ask a follow-up that depends on the first answer, and explain which ID proves session reuse.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: start a new offline session with the fictional project introduction.'),
 (2,'Run the comparison','Step two: select the follow-up and Continue, and confirm the session ID stays the same and the name is recalled.'),
 (3,'Inspect the boundary','Step three: start a fresh session with only the follow-up, and compare the answer.'),
 (4,'Follow the workflow','Step four: reconnect, and inspect the stream-before-history ordering and the duplicate counts.')])
d.shot('experiment','The session experiment',{'exp-rule':'Open Run the exercise. New creates one remote session. Continue retrieves that owned session, opens its stream, and sends another user message. Reconnect opens the stream before paging the history.',
 'exp-prompt':'The prompt starts with the introduction: remember that my fictional project is called Aurora Finch.',
 'exp-buttons':'Use these buttons: New offline, Continue, and Reconnect.'})
d.shot('new-identity','Offline · New session',{'new-ids':'Click New offline. The identity panel shows the conversation, the managed session ID, and the sent event.',
 'new-history':'The retained history holds the user message and the agent\'s reply: it will remember Aurora Finch.'})
d.shot('continue-identity','Offline · Continue the same session',{'continue-ids':'Now click Use follow-up, then Continue. Look at the managed session ID: it is the same session.',
 'continue-history':'The history now holds both turns, and the agent recalls the name Aurora Finch.'})
d.shot('continue-outcome','Offline · Duplicates during hydration',{'continue-outcome-line':'The outcome is completed. Two duplicate events were ignored while the history was hydrated, so nothing was displayed twice.'})
d.shot('reconnect','Offline · Reconnect',{'reconnect-outcome':'Click Reconnect. The outcome is reconnected, and four duplicate persisted events were ignored.'})
d.shot('reconnect-evidence','Offline · Stream before history',{'reconnect-evidence-list':'The stream evidence shows the order: the stream is opened first, then the history is paged, and every persisted event that arrives twice is ignored.'})
d.shot('inspect','Offline · Inspect the server index',{'inspect-index':'Inspect server index shows two turns and four messages, bound to this exercise owner, with an expiry time.'})
d.shot('close','Offline · Close and archive',{'close-status':'Close and archive archives the confirmed-idle session. After that, Continue and Reconnect reject it.'})
d.shot('fresh-identity','Offline · A fresh session',{'fresh-ids':'For comparison, start a fresh session with only the follow-up question. It has a new session ID.',
 'fresh-history':'And the answer: no fictional project name was introduced in this session. Context did not travel to the new session.'})
d.live_disabled('Now let us test real recall. With live mode disabled, Run live does not call Claude.','Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend.')
d.restart('Restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live-ready','Live · Start a real session',{'live-prompt':'Select Use introduction, so the prompt asks Claude to remember the project name.','live-run':'Then click Run live. This creates a billed, retained session.'},note='LIVE RUN')
d.shot('live1-identity','Live · Turn 1',{'live1-ids':'The identity panel shows the real managed session. I have hidden part of its ID.',
 'live1-history':'Claude answers: Got it, your fictional project is Aurora Finch.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live2-identity','Live · Turn 2 in the same session',{'live2-ids':'Now select Use follow-up and click Continue. The managed session ID is unchanged: this is the same real session.',
 'live2-history':'And Claude recalls: your fictional project is called Aurora Finch. The context came from the retained session.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live2-outcome','Live · Duplicates ignored',{'live2-outcome-line':'The outcome is completed, and two duplicate events were ignored during hydration.'},note='LIVE RUN')
d.shot('live-close','Live · Archive the real session',{'live-close-status':'Finally, Close and archive. The real session was archived, so it no longer accepts new turns.'},note='LIVE RUN')
d.compare('Offline and live, compared','What did the sessions prove?',[
 ('cmp-same','SAME SESSION','Recall needs reuse','Same sesn_ ID both turns<br>Name recalled','Recall happened only in the same session ID, both offline and with real Claude.'),
 ('cmp-fresh','FRESH SESSION','No shared memory','A new session ID<br>Name unknown','A fresh session had a new ID and did not know the name.'),
 ('cmp-dedupe','DEDUPLICATION','Reconnect safely','Stream first, then history<br>Duplicates ignored','And reconnecting opened the stream before the history and ignored every duplicate.')],'The session ID is the evidence of reuse.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the sessions module to its conversation index and the live port.'),
 (3,'POST /close','Section three is the close route. It archives only a confirmed-idle session, and then marks the conversation closed.'),
 (4,'POST /query','Section four is the query route for new, continue, and reconnect actions.'),
 (6,'Decision and early response','Section six returns four hundred for an invalid request, such as continuing without a conversation ID.'),
 (7,'Return the module contract','Section seven returns the router and its cleanup contract.')])
d.mapping('Where is the resume option?',[
 ('map-sdk','CLAUDE AGENT SDK','resume a session ID','The SDK reloads a local<br>transcript and continues','In the Agent SDK, you resume a local session by passing its ID to the next query.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Send to the same session','sessions.events.send to sesn_<br>sessions.events.list for history','In Managed Agents, the session lives on the server: you send the next message to the same session, and list its events to rebuild the history.'),
 ('map-port','THIS PLATFORM','The live port','server/lib/lab06-port.ts','The calls are in the Lab six port.')],'The calls are in server/lib/lab06-port.ts.')
d.port('port-create','Live port · Create, stream and send',{'port-create':'sessions dot create creates the retained session with your agent and environment.',
 'port-stream':'Each turn opens the event stream first,','port-send':'then sends the user message to the same session ID.'})
d.port('port-history','Live port · History and archive',{'port-list':'sessions dot events dot list pages the persisted events to hydrate the history, which is where duplicates are detected.',
 'port-archive':'And archive closes the session when you are done.'})
d.knowledge('Finish with the knowledge check: what preserves the same remote conversation?','Continuing the owned retained session. Retained context and reconnect deduplication are separate responsibilities.')
d.summary([('sum-reuse','REUSE','Same session','Continue sends to the same sesn_.','You can now explain that context is kept by continuing the same session.'),
 ('sum-fresh','FRESH','New session','A new ID starts empty.','That a fresh session starts without that context.'),
 ('sum-close','CLOSE','Archive when done','Reconnect safely before that.','And how to reconnect without duplicates and archive the session when you are done.')],'Lab 07 · Tool policy and execution audit')
d.finish()
