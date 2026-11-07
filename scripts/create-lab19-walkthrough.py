"""Lab 19 step-by-step walkthrough authored from real captures of the running platform (offline session fixtures and one live two-turn session)."""
from lab_video_common import Deck
d=Deck(19,'Lab 19 Step by Step: Session Inventory and Explicit Branches, Offline and Live','Session inventory');e=d.e
assert 'Source: managed-api' in e['live_provider'] and 'Aurora Finch' in e['live_continued'] and 'State: archived' in e['live_archived']
d.cover('CLAUDE MANAGED AGENTS · LAB 19 · SESSION INVENTORY','<h2>In this lab</h2><p>Continue an owned session.<br>Page through its history.<br>Derive a fresh branch.<br>Rename, tag, archive, delete.</p>',
 'Welcome to Lab nineteen, Session inventory and explicit branches. In this lecture, you will keep an inventory of the sessions you own, page through their history, and derive a fresh conversation from an explicit summary, instead of pretending to fork hidden state. We will run the offline fixtures, and then a real session.')
d.overview('CONTINUE · INSPECT · DERIVE','A branch is a fresh session with an explicit summary',[
 ('ov-concepts','1 · CONCEPTS','Owned sessions','Continue, page, derive,<br>and manage what you own','First, the concepts: continue, inspect, derive, and manage the sessions you own.'),
 ('ov-offline','2 · OFFLINE','Session fixtures','Two turns · history · branch<br>rename · archive · delete','Second, the offline fixtures: two turns, history pages, a derived branch, and session management.'),
 ('ov-live','3 · LIVE','A real session','Two real turns and<br>provider history','Third, a real session with two turns, and its provider history.'),
 ('ov-code','4 · CODE','Read the TypeScript','events.list, update<br>and delete','Finally, the TypeScript code behind each operation.')],
 'The parent history stays intact when you derive a new conversation.')
d.shot('lesson','Open Lab 19',{'lesson-title':'Open Lab nineteen, Session inventory and explicit branches.','lesson-objective':'The objective: inventory owned Managed sessions, inspect bounded history pages, and derive a fresh conversation from an explicit host summary.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: inventory owned sessions, inspect history, and derive a fresh conversation.'),
 (2,'Core rule','Region two, the core rule. How is a summary-based conversation derived? By creating fresh context from an explicit host summary.'),
 (3,'Keep the boundary clear','Region three: a fresh summary handoff is distinct from retaining the original session history.'),
 (6,'Put it to the test','Region six: compare the parent and derived sessions, and the exact summary they share.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: start an offline session, and send a second turn to the same session.'),
 (2,'Run the comparison','Step two: inspect the inventory and history pages, then branch from a selected event boundary.'),
 (3,'Inspect the boundary','Step three: compare the parent and derived session IDs, and the exact summary handoff.'),
 (4,'Follow the workflow','Step four: rename and tag an idle session, then compare archive with explicit deletion.')])
d.shot('experiment','The session experiment',{'exp-rule':'Open Run the exercise. Continue an owned session, page through its events, or start a derived session with a visible summary.',
 'exp-mode':'The experiment mode is offline fixture.','exp-prompt':'The first prompt asks Claude to remember the fictional project name.','exp-start':'Click Start offline session.'})
d.shot('started','Offline · One owned session',{'started-title':'A new conversation, idle, with its own session ID.','started-events':'The host captured the user message and the agent reply.'})
d.shot('continued','Offline · A second turn',{'continued-title':'Change the prompt and click Send another turn. Same conversation, same session ID.','continued-events':'Now four events: two turns in one session.'})
d.shot('history-page','Offline · A history page',{'page-source':'The history page comes from host-captured events, with no omitted pages.','page-events':'Pages are bounded, so long histories never load all at once.'})
d.shot('boundary','Offline · Choose a boundary',{'boundary-events':'To branch, choose a host event boundary. Here, the first agent reply.'})
d.shot('derive','Offline · Derive a conversation',{'derive-prompt':'Enter a new request.','derive-button':'And click Derive conversation.'})
d.shot('derived','Offline · The derived session',{'derived-title':'The derived conversation has a new session ID.','derived-parent':'It records its parent and the selected boundary.',
 'derived-summary':'And the explicit summary handoff: exactly the events up to the boundary. No hidden state is copied.'})
d.shot('inventory','Offline · The inventory',{'inventory-list':'The owned inventory lists both conversations: the parent with two turns, and the derived one with its parent.'})
d.shot('parent','Offline · The parent is intact',{'parent-title':'Select the parent again.','parent-events':'Its history is intact. Deriving did not change it.'})
d.shot('renamed','Offline · Rename and tag',{'renamed-title':'Rename the idle session to Aurora field notebook, and tag it reviewed.','renamed-controls':'Rename, tag, archive, and delete work only on an idle session you own.'})
d.shot('archived','Offline · Archive',{'archived-status':'Click Archive idle session.','archived-title':'The state is archived. Its history remains available.'})
d.shot('deleted','Offline · Delete a separate fixture',{'deleted-status':'On a separate throwaway session, Delete selected idle session removes it.','deleted-inventory':'The inventory no longer lists it. Archive keeps a session; delete removes it.'})
d.live_disabled('Now real Claude. With live mode disabled, Run live does not call Claude.','Live mode creates one billed session; follow-up turns may add billed turns.')
d.restart('Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live-run','Live · Start a real session',{'live-prompt':'Back in Lab nineteen, keep the first prompt.','live-run-button':'Click Run live.'},note='LIVE RUN')
d.shot('live-started','Live · The first turn',{'live-started-title':'A real session, now idle.','live-started-events':'Claude confirms it will remember the project, Aurora Finch.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-continued','Live · Same session, second turn',{'live-continued-title':'Ask what the project is called, and send another turn. Same session ID.','live-continued-events':'Claude answers: Aurora Finch. The retained session kept the context.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-provider','Live · Provider history',{'live-page-source':'Click Retrieve provider metadata and events. The history page now comes from the managed API.','live-page-events':'The provider events match the host-captured ones.'},note='LIVE RUN')
d.shot('live-archived','Live · Archive',{'live-archived-status':'Finally, archive the idle session.','live-archived-title':'The real session is archived.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the inventory prove?',[
 ('vs-retain','RETAIN','Same session','A second turn kept<br>the context','A second turn in the same session kept its context, offline and live.'),
 ('vs-derive','DERIVE','Explicit summary','A new session gets only<br>the selected summary','A derived conversation got a new session and only the explicit summary.'),
 ('vs-manage','MANAGE','Owned and idle','Rename, tag, archive<br>or delete only when idle','And management actions worked only on owned, idle sessions.')],'Archive keeps a session; delete removes it.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the session management module to the inventory.'),
 (3,'POST /turn','Section three starts or continues a conversation.'),
 (6,'POST /sessions/:id/branch','Section six derives a new conversation from a selected boundary.'),
 (7,'POST /sessions/:id/{operation}','Section seven handles rename, tag, archive, and delete.')])
d.mapping('Where are resume and forkSession?',[
 ('map-sdk','CLAUDE AGENT SDK','resume and forkSession','The SDK resumes or forks<br>a local session transcript','In the Agent SDK, resume and fork session reuse a local session transcript.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Retained sessions','Send to the same session;<br>derive with a summary','Here, a retained session receives more events, and a branch is a new session that starts from an explicit host summary.'),
 ('map-port','THIS PLATFORM','The Lab 19 inventory','server/lib/lab19-sessions.ts','The code is in the Lab nineteen session inventory.')],'History, branching and management are in server/lib/lab19-sessions.ts.')
d.port('port-history','Source · Read the history',{'port-events':'History pages use sessions dot events dot list, with a small limit.','port-retrieve':'Provider metadata comes from sessions dot retrieve.'})
d.port('port-branch','Source · An explicit summary',{'port-summary':'A branch builds a summary from the selected events only.','port-prompt':'And sends it as the first message of a fresh session.'})
d.port('port-manage','Source · Manage the session',{'port-rename':'Rename uses sessions dot update with a title.','port-tag':'A tag is stored as session metadata.','port-delete':'And delete calls sessions dot delete.'})
d.knowledge('Finish with the knowledge check: how is a summary-based conversation derived?','By creating fresh context from an explicit host summary. It is distinct from retaining the original session history.')
d.summary([('sum-continue','CONTINUE','Retained sessions','Same ID, more turns.','You can now continue an owned session.'),
 ('sum-derive','DERIVE','Explicit branches','A summary, not hidden state.','Derive a fresh conversation from an explicit summary.'),
 ('sum-manage','MANAGE','The inventory','Rename, tag, archive, delete.','And manage your session inventory safely.')],'Lab 20 · Lifecycle events')
d.finish()
