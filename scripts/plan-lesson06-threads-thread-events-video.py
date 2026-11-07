"""Lesson 6 narration with paragraph targets and bounded code-panel rows."""
from pathlib import Path
import hashlib,importlib.util,json
import cv2
from measured_video_text import MeasuredVideoText,at
from plan_lab_settings import SETTINGS

ROOT=Path(__file__).resolve().parents[1];NAME='lesson06-threads-thread-events';FOLDER=ROOT/'presentations'/NAME
OCR=json.loads((FOLDER/'.build/video/slides/ocr.json').read_text(encoding='utf-8-sig'));MEASURED=MeasuredVideoText(OCR)
spec=importlib.util.spec_from_file_location('paragraphs',ROOT/'scripts/refine-lesson-paragraph-highlights.py');PARAGRAPHS=importlib.util.module_from_spec(spec);spec.loader.exec_module(PARAGRAPHS)
ROWS=[];AUDIT=[]

def slide(n,*parts):
 image=cv2.imread(str(FOLDER/f'.build/video/slides/slide-{n:02}.png'));lines=PARAGRAPHS.lines_for(OCR[n-1],image);segments=[];proofs=[]
 for index,(selection,text) in enumerate(parts,1):
  measured,_=MEASURED.target(n,selection);target,visible=PARAGRAPHS.expand(measured,lines);cue=f'{n}-{index}'
  if n==6:
   # OCR occasionally splits code statements. Search the visible row inside its
   # actual code panel, never across the neighboring example or output column.
   for i,rect in enumerate(target['textRects']):
    best=max(lines,key=lambda line:PARAGRAPHS.intersection(rect,line['rect']))
    if not best['code']:continue
    x,y,w,h=rect
    for left,top,right,bottom in [(35,450,530,795),(565,455,1038,630),(1075,455,1540,934),(1565,500,1885,918)]:
     if left<=x<right and top<=y and y+h<=bottom:
      safe_right=min(right,980) if left==565 and y<490 else right
      target['textRects'][i]=[left,y,safe_right-left,h];break
  if segments and segments[-1]['target']==target:
   segments[-1]['text']+=' '+text;proofs[-1]['narration']=segments[-1]['text'];proofs[-1]['selectedPhrases'].append(selection)
  else:
   segments.append({'id':cue,'text':text,'target':target});proofs.append({'slide':n,'cue':cue,'narration':text,'visibleText':visible,'selectedPhrases':[selection],'selectionPolicy':'Complete local paragraph or bounded visible code row'})
 ROWS.append({'slide':n,'segments':segments});AUDIT.extend(proofs)

slide(1,
 (['Claude Managed','Agents','Threads and Thread Events'],'Welcome to Lesson six: Claude Managed Agents Threads and Thread Events.'),
 ('Luis Coco Enr','This presentation by Luis Coco Enriquez connects conversation branches with the events that describe their activity.'),
 ('Learn how threads work','We will begin with the relationship between a session and the threads inside it.'),
 ('Conversation','Then we will examine organizing distinct conversation paths without mixing their histories.'),
 ('Thread events','Next, we will distinguish reading stored events from receiving live updates.'),
 ('Track and manage','Finally, we will follow the methods and the TypeScript example through inspection, streaming, and lifecycle management.'),
 ('Master conversation threads and events','Keep two identifiers in mind throughout the lesson: the parent session and the particular thread you want to inspect.'))

slide(2,
 ('What is a thread?','The presentation describes a thread as a focused conversation branch inside a parent session.'),
 ('A thread is a conversation','It has a specific history associated with that branch of the interaction.'),
 ('A session is the container','The session remains the overall container for the interaction with the agent.'),
 ('Threads let you separate different','Threads help organize different conversation paths within that same container.'),
 ('Each thread maintains its own messages','The slide associates each branch with its own messages, context, and events.'),
 ('Why threads exist','The purpose is to make a multi path interaction easier to understand and manage.'),
 ('Organize parallel conversations','Different topics can be represented as distinct conversation branches.'),
 ('Keep topics isolated','Keeping those histories separate helps avoid confusing one topic with another.'),
 ('Preserve focused context','A focused branch gives the application a clearer view of the context relevant to that path.'),
 ('Make multi-path workflows easier','Alternative approaches can be explored without putting every message into one undifferentiated history.'),
 ('Mental model','The diagram shows the parent and branch relationship.'),
 ('Parent container for your','At the top is the session, which contains the overall interaction.'),
 ('about research','Thread A is a research branch with history focused on research topics.'),
 ('about debugging','Thread B is a troubleshooting branch focused on debugging and problem solving.'),
 ('about writing','Thread C is a drafting branch focused on writing and content.'),
 ('Threads are scoped to the same session','The branches belong to the same session while keeping their histories organized separately.'),
 ('When to use threads','The use cases apply that model to practical application needs.'),
 ('Run different task branches','Separate task branches help organize different work within one larger interaction.'),
 ('Separate user intents','Distinct user goals can be tracked as different paths.'),
 ('Explore multiple solutions','Alternative solutions can be compared without mixing all of their messages.'),
 ('Inspect branch-specific outcomes','A branch specific view lets the application inspect the messages, events, and outcomes for that path.'),
 ('Key idea to remember','The takeaway is the parent relationship, not an independent conversation object detached from its session.'),
 ('Threads belong to a','Every thread belongs to a particular parent session.'),
 ('Each thread keeps its own','Its focused history supports organization and clarity inside that session.'),
 ('Use threads when one session','Use this model when one overall interaction needs several distinct conversation paths.'))

slide(3,
 ('Purpose of thread methods','Thread methods inspect and manage conversation branches within a parent session.'),
 ('Every thread method requires the parent session','The session context scopes the operation, so the thread identifier alone is not the complete address.'),
 ('Available methods','The methods panel describes retrieving, listing, and archiving threads.'),
 (at('retrieve(threadld, { session_id })',750,245),'Retrieve addresses one known thread together with its parent session.'),
 ('want its metadata or current state','Use it when the application needs that branch\'s metadata or current state.'),
 (at('list(sessionld, params?)',750,395),'List discovers the threads belonging to a session.'),
 ('Supports filtering, sorting, and pagination','The available list options depend on the SDK version and supported parameters.'),
 ('Archive a thread within a session','The presentation describes archive as closing a thread within its session.'),
 ('Threads have no delete operation','It distinguishes that operation from deletion and states that threads have no delete operation in the illustrated API.'),
 ('Parameter breakdown','The parameter panel separates branch identity from session scope and collection options.'),
 ('Unique identifier of the target thread','The thread identifier selects the particular branch.'),
 ('Required parent session ID','The parent session identifier scopes the call to the correct interaction.'),
 ('Optional list options such as limits','List parameters control the requested collection, such as a limit or ordering option.'),
 ('How each method is used','The usage panel connects those methods to application actions.'),
 ('Open an existing branch to inspect it','Retrieve a known branch when you want to inspect it.'),
 ('Browse conversation branches for a session','List branches when the application needs to browse or select one.'),
 ('Close an Old branch you no longer want','Use the supported archival operation when the branch should no longer remain active.'),
 ('Use list first when you need','If the thread identifier is not yet known, discovery through listing comes first.'),
 ('TypeScript examples','Now trace those responsibilities through the code illustration.'),
 ('const sessionld','The example begins by selecting a parent session identifier.'),
 ('const threads = await client.beta.sessions.threads.list','The list call requests that session\'s collection of threads.'),
 ('limit: 2e','The illustrated limit bounds the requested collection.'),
 ('order: "desc"','The ordering value selects the order shown in the example.'),
 ('const thread = await client.beta.sessions.threads.retrieve','The retrieval call then addresses a specific thread.'),
 (at('session_id: sessionld',900,875),'Its session parameter keeps that request associated with the correct parent.'),
 ('Key rules to remember','The rules reinforce the same pattern: discover a branch, retain its identity, and provide the session context.'),
 ('Archive is permanent for that thread','The slide presents archival as terminal. Distinguish that lifecycle choice from simply inspecting a branch or closing an event stream.'),
 ('Beta APIS may evolve over time','Treat the shown signatures as examples within the presentation\'s SDK context and check compatibility when implementing them.'))

slide(4,
 ('Purpose of thread event methods','Thread event methods inspect the activity associated with one particular branch.'),
 ('inspect and observe activity','That includes the messages, tool activity, and other supported updates belonging to the selected thread.'),
 ('Thread events are scoped to both a session','Both identifiers matter: the parent session and the thread whose activity you want to read.'),
 ('Available methods','The methods panel separates stored history from a live event feed.'),
 ('events.list(threadld, { session_id })','The list illustration retrieves recorded events for the selected thread.'),
 ('Use this to inspect historical thread activity','Choose this operation when inspecting work that has already happened.'),
 ('Stream thread events in real time','The stream illustration instead subscribes to live activity for that branch.'),
 ('Optionally enable event deltas','The delta option described here requests incremental updates for event types that support them.'),
 ('Common event categories','The categories panel groups the activity an application may need to handle.'),
 ('Includes incremental message updates','Message events can include partial updates and completed messages.'),
 ('Helps inspect tool calls','Tool activity helps explain the operations contributing to the thread\'s work.'),
 ('Useful for observing progress','State updates describe progress or transitions exposed by the event model.'),
 ('Always handle unknown event types','Fallback handling keeps unfamiliar event types from unnecessarily stopping the receiving loop.'),
 ('How list and stream differ','The comparison panel connects the methods to their intended use.'),
 ('Fetch a history snapshot','Listing gives the application a snapshot of recorded activity.'),
 ('Subscribe to a live event feed','Streaming delivers updates while the interaction is happening.'),
 ('Preview incremental updates for','Supported deltas provide previews while content is being generated.'),
 ('use stream for reactive Uls','Use the live stream for a reactive interface and stored history for retrospective inspection.'),
 ('TypeScript example','The code demonstrates those responsibilities with explicit session and thread identifiers.'),
 ('const sessionld = "session_abc123"','The session value chooses the parent interaction.'),
 ('const threadld','The thread value chooses the branch inside it.'),
 ('const events await client.beta.sessions.threads.events.list','The history request retrieves events for that branch.'),
 ('const stream = client.beta.sessions.threads.events.stream','The live request opens the illustrated thread event stream.'),
 ('event_deltas: true','The example enables incremental updates.'),
 ('case "thread.message.delta"','A message delta branch handles supported partial message content.'),
 ('case "thread.message. completed"','A completion branch handles the completed message representation.'),
 ('Key rules to remember','Keep the session and thread scope explicit throughout the handlers.'),
 ('Use list for history','Reading history is an inspection operation.'),
 ('Use stream for real-time UX','Receiving live updates supports the ongoing interface. Match the exact event names and payloads to the SDK version used by your application.'))

slide(5,
 ('Always use the parent','This summary brings the method choices and scope rules together.'),
 ('All thread methods and','Threads live inside a session, so both thread methods and event methods need the relevant parent context.'),
 ('Always keep track of the session_id','Preserve the session identifier alongside each thread identifier used by the application.'),
 ('Use the right method','Choose the operation according to what the user is trying to do.'),
 ('Get a specific','Retrieve inspects a particular known branch.'),
 ('List threads with','List discovers or browses a collection of branches.'),
 ('Permanently close','Archive represents the terminal closure described by the deck.'),
 ('Get stored events','Event listing reads the branch\'s recorded activity.'),
 ('Stream events','Event streaming receives live updates for that branch.'),
 ('Use events to inspect','Events describe what happened within the selected conversation path.'),
 ('Common event types','The reference list illustrates message updates, tool activity, state changes, errors, and usage information.'),
 ('Use streaming with event_deltas','Supported deltas can make a live interface more responsive.'),
 ('Apply filtering and pagination','Use collection parameters when the session contains many threads.'),
 ('limit: 20, order: "desc"','The example combines a limit with descending order.'),
 ('Use parameters like limit, order and filters','Pagination and filtering let the application inspect a manageable portion of the collection.'),
 ('Think about real-time vs. stored events','Keep live observation distinct from stored history.'),
 ('Get incremental updates','The streaming view focuses on updates arriving during the interaction.'),
 ('Retrieve the history of events','The stored view supports debugging, auditing, and analysis of activity already recorded.'),
 ('Keep threads organized','Thread organization should also match the way the application presents its work.'),
 ('Use meaningful identifiers or metadata','Use suitable labels or supported metadata to make branches easier to find.'),
 ('Group related work in the same session','Group related work under the same session and use branches for distinct topics.'),
 ('Handle errors and edge cases','The edge case checklist connects identity and receiving behavior.'),
 ('A thread ID must belong to the session','The selected branch must belong to the session supplied with the call.'),
 ('Check for empty results','An empty collection is a valid situation for the interface to handle.'),
 ('Handle streaming errors and reconnections','Connection failures need explicit handling and a recovery strategy supported by the integration.'),
 ('Be prepared for missing or partial event data','Partial or missing data should be handled according to the event\'s documented shape.'),
 ('Remember the current status','The presentation marks these interfaces as beta, so the integration must account for version specific behavior.'),
 ('Key takeaway','Threads organize conversation paths, and thread events make the activity in each path available for inspection or live display.'))

slide(6,
 ('What this example does','The full TypeScript example combines discovery, retrieval, and live observation.'),
 ('List all threads in a session','First, discover the branches associated with a session.'),
 ('Retrieve a specific thread by ID','Next, inspect a chosen branch.'),
 ('Stream thread events in real time','Then receive its live event updates, including supported deltas.'),
 ('Prerequisites','The setup requires the SDK, an initialized client, and an existing session.'),
 ('A valid session_id','The session identifier comes from a previously created session.'),
 ('SDK setup','Install the SDK package and supply the API key through the application\'s runtime configuration.'),
 ('Key concepts in this example','The concept panel reinforces the distinction between organizing branches and observing their activity.'),
 ('Threads: organize conversations','Threads organize focused conversation histories within the session.'),
 ('Thread events: provide real-time','Thread events describe the activity and status associated with a branch.'),
 ('List all threads for a session','Begin the walkthrough in the left code panel.'),
 ('const client new','The client connects the application to the SDK.'),
 ('const sessionld = "session_abc123"','The parent session identifier scopes the collection request.'),
 ('const threads = await client.beta.sessions.threads.list','The list call requests that session\'s threads.'),
 (at('limit: 20',90,675),'The limit bounds the collection requested by this example.'),
 (at('order: "desc"',90,695),'Descending order selects the ordering shown here.'),
 ('has_more: true','The example result indicates that additional results are available.'),
 ('next_cursor:','The returned cursor provides the pagination position for a subsequent supported request.'),
 (at('Retrieve a specific thread',640,380),'Move to the retrieval example in the center.'),
 ('const threadld = "thread_xyz789"','The thread identifier selects one branch from the parent session.'),
 ('const thread = await client.beta.sessions.threads.retrieve','The retrieve request addresses that branch.'),
 (at('{ session_id: sessionld }',590,550),'The parent session value supplies the required scope.'),
 (at('status: "active"',660,770),'The example response includes the branch\'s current status.'),
 ('Always naes the session_id','The tip repeats the key rule: carry the session identity together with the thread identity.'),
 ('Stream thread events (with deltas)','Now follow the streaming example on the right.'),
 (at('event_deltas: true',1110,545),'The delta option enables the incremental updates illustrated in this code.'),
 ('for await (const event of stream)','The asynchronous loop receives events from the stream.'),
 ('case "thread .message.delta"','A message delta handler processes partial content exposed by the event.'),
 ('console.log("Message cmpleted:"','The completed message handler processes the final message representation.'),
 ('case "thread.status.changed"','A status handler processes the corresponding state update.'),
 ('case "error"','An error branch handles reported failures.'),
 ('default:','The fallback branch records other events instead of assuming every type is already known.'),
 ('Example event output (streaming)','The output panel illustrates how partial message updates lead to a completed message and a later status update.'),
 ('For sessions with many','The practices panel connects this walkthrough to larger collections and ongoing connections.'),
 ('Handle streaming errors','Handle failures and recovery explicitly when streaming.'),
 ('Use event_deltas for a more','Use supported deltas to provide useful incremental feedback.'),
 ('Archive when finished','When the branch is no longer needed, the presentation describes archival as its terminal lifecycle operation.'),
 ('Explore different event types','Inspect the available payloads and build handlers that match the event definitions used by the application.'))

slide(7,
 ('Current status','The closing slide summarizes the compatibility context described by the presentation.'),
 ('APIS are currently in beta','It labels the thread and thread event APIs as beta.'),
 ('names, parameters, and event','Method names, parameters, and event definitions may evolve between SDK versions.'),
 ('Follow the latest SDK documentation','Review the documentation and release notes that match the installed SDK.'),
 ('Stability and compatibility','The compatibility panel reinforces the same integration boundaries.'),
 ('Works with beta namespaces','Use the supported namespaces for thread management and thread event access.'),
 ('Requires a session context','A valid parent session and an initialized client are part of the request context.'),
 ('API may evolve','Treat response schemas and method signatures as versioned contracts.'),
 ('Monitor release notes','Review changes deliberately when upgrading the integration.'),
 ('Namespaces and imports','The namespace panel separates the two responsibilities in code.'),
 ('const threads = client.beta.sessions.threads','The thread namespace provides the branch management methods.'),
 ('const events = client.beta.sessions.threads.events','The nested events namespace provides access to branch activity.'),
 ('No offic:al deprecations','The deprecation statement reflects the documentation context used for this presentation.'),
 ('However, this is a beta API','Use the installed version\'s documentation to assess current compatibility and lifecycle behavior.'),
 ('Related APIS and features','The related features panel connects threads to the rest of the application.'),
 ('Threads are always scoped to a parent session','Sessions provide the parent interaction context.'),
 ('Thread events can include tool call','Tool activity contributes to the events available for branch specific inspection.'),
 ('Use events . stream() to receive incremental','Supported message deltas provide incremental content for live interfaces.'),
 ('Best practices','The practices focus on keeping that interface resilient as it evolves.'),
 ('Keep your SDK up to date','Review SDK updates and their compatibility requirements.'),
 ('Handle changes gracefully','Handle new event types and additional response fields appropriately.'),
 ('Monitor event types','Observe unfamiliar event types so the receiving logic can be updated when necessary.'),
 ('Avoid relying on internal fields','Use documented fields and behavior for the integration.'),
 ('When to use threads and thread events','The final use cases bring the lesson back to application needs.'),
 ('Multi-tum conversations','Use branches to organize distinct topics or focused histories inside one session.'),
 ('Real-time Uls','Use streaming when the interface needs live updates.'),
 ('Debugging and analytics','Use branch activity for inspection and investigation.'),
 ('Archival and audit trails','Manage completed branches through the supported lifecycle operation. The essential relationship remains the same: a parent session, a selected conversation branch, and the events that describe its work.'))

def main():
 out=ROOT/'videos'/NAME;out.mkdir(parents=True,exist_ok=True);deck=next((FOLDER/'output').glob('*.pptx'))
 assert len(ROWS)==7 and all(sum(len(s['text'])+1 for s in row['segments'])<4300 for row in ROWS)
 plan={'project':NAME,'title':'Lesson 6 · Claude Managed Agents Threads and Thread Events','displayTitle':'Lesson 6 - Threads and Thread Events','mediaPrefix':'Lesson06-Threads-and-Thread-Events','presentation':deck.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(deck.read_bytes()).hexdigest(),'outputFile':'Lesson06-Threads-and-Thread-Events.mp4','settings':SETTINGS,'resolution':[1920,1080],'fps':30,'transition':{'type':'perspective rotating cube','seconds':.8},'highlightAudit':'highlight-semantic-audit.json','verifyPhraseBoundaries':True,'highlightStyle':'Complete paragraphs and bounded code passages','slides':ROWS}
 (out/'narration-plan.json').write_text(json.dumps(plan,indent=2));(out/'highlight-semantic-audit.json').write_text(json.dumps(AUDIT,indent=2))
 print(f'Planned {len(ROWS)} slides, {len(AUDIT)} paragraph cues, {sum(len(s["text"].split()) for row in ROWS for s in row["segments"])} narration words.',flush=True)

if __name__=='__main__':main()
