"""Narrate the supplied deck with complete paragraph targets from the outset."""
from pathlib import Path
import hashlib,importlib.util,json
import cv2
from measured_video_text import MeasuredVideoText,at
from plan_lab_settings import SETTINGS

ROOT=Path(__file__).resolve().parents[1];NAME='lesson05-session-events';FOLDER=ROOT/'presentations'/NAME
OCR=json.loads((FOLDER/'.build/video/slides/ocr.json').read_text(encoding='utf-8-sig'));MEASURED=MeasuredVideoText(OCR)
spec=importlib.util.spec_from_file_location('paragraphs',ROOT/'scripts/refine-lesson-paragraph-highlights.py');PARAGRAPHS=importlib.util.module_from_spec(spec);spec.loader.exec_module(PARAGRAPHS)
ROWS=[];AUDIT=[]

def slide(n,*parts):
 image=cv2.imread(str(FOLDER/f'.build/video/slides/slide-{n:02}.png'));lines=PARAGRAPHS.lines_for(OCR[n-1],image);segments=[];proofs=[]
 for index,(selection,text) in enumerate(parts,1):
  measured,_=MEASURED.target(n,selection);target,visible=PARAGRAPHS.expand(measured,lines);cue=f'{n}-{index}'
  if selection==['const result','= await runTool(event)']:
   target['paragraphGroups']=[list(range(len(target['textRects'])))];visible=[' '.join(visible)]
  # OCR split these three statements into fragments. Inspect the entire visible
  # code row so the outline also includes its field name and remaining value.
  complete_code={4:'apiKey: process.env.ANTHROPIC_API_KEY,',7:'type: "user.message",',8:'content: [{ type: "text", text: "Hello! Can you help me?" }]'}
  if n==7 and index in complete_code:
   _,y,_,height=measured['textRects'][0]
   target={'textRects':[[130,y,1730,height]],'paragraphGroups':[[0]]};visible=[complete_code[index]]
  if segments and segments[-1]['target']==target:
   segments[-1]['text']+=' '+text;proofs[-1]['narration']=segments[-1]['text'];proofs[-1]['selectedPhrases'].append(selection)
  else:
   segments.append({'id':cue,'text':text,'target':target});proofs.append({'slide':n,'cue':cue,'narration':text,'visibleText':visible,'selectedPhrases':[selection],'selectionPolicy':'Complete local paragraph or code line'})
 ROWS.append({'slide':n,'segments':segments});AUDIT.extend(proofs)

slide(1,
 (['Claude Managed','Agents Session Events'],'Welcome to Lesson five: Claude Managed Agents Session Events.'),
 ('Luis Coco Enr','This presentation by Luis Coco Enriquez explains how an application exchanges input and observes agent activity.'),
 ('Understand how session events work','Our focus is the relationship between a running session and the events that describe its interaction.'),
 ('Event types','First, we will distinguish message events, tool activity, and status changes.'),
 ('Streaming','Next, we will examine how streaming delivers updates while work is happening.'),
 ('handling','Then we will connect those updates to application handlers and the visible user experience.'),
 ('Track real-time session activity','We will follow the event flow from the first input through live updates and the final response, using the examples in this presentation.'))

slide(2,
 ('What are session events?','Session events form the ordered input and output stream for an ongoing agent session.'),
 ('1/0 stream and control channel','The presentation also describes them as a control channel: the application participates in the conversation through events.'),
 ('input, receive agent output','You can supply user input, receive agent output, and handle other supported interaction events.'),
 ('What they carry','The next panel groups the information that travels through that channel.'),
 ('Messages, files, images','User input can contain messages and supported attachments or content blocks.'),
 ('Text responses. reasoning content','Agent output carries the response content and activity information exposed by the supported event schema.'),
 ('Requests to use built-in tools','Tool usage connects a requested operation with the result that later returns to the session.'),
 ('Approval requests, responses','Approval events represent decisions that the interaction must obtain or report.'),
 ('Lifecycle, status, and Other events','System events describe lifecycle and status information around the work.'),
 ('Why they matter','An ordered event model gives the application a coherent view of the interaction.'),
 ('All communication flows','Instead of treating each update as unrelated, associate it with the session and its event sequence.'),
 ('Enables responsive','Streaming lets the interface respond while the agent is still working.'),
 ('Includes user input, agent','The complete interaction includes input, output, tool usage, approvals, and system activity.'),
 ('How they fit the architecture','Now follow the architecture from left to right.'),
 ('Sends input and','The user or application supplies input and receives updates.'),
 ('Ordered 1/0 stream','The session events channel carries the ordered interaction.'),
 ('Processes input,','The agent and its tools perform the requested work.'),
 ('Streams back','Response events then report results, progress, and status back to the application.'),
 ('Typical uses','The use cases turn that architecture into application behavior.'),
 ('Stream user messages and agent','A chat interface displays the conversation as messages arrive.'),
 ('Handle tool requests and results','A tool integration handles requests and results according to its execution model.'),
 ('Present approval requests to users','An approval flow presents the decision to the user and returns the supported response.'),
 ('Monitor the full session','An observability view uses event information for tracing and investigation.'),
 ('TypeScript example','The code illustration sends a user message to an existing session.'),
 ('await client . beta.sessions.events.send','The send operation addresses that session through its identifier.'),
 ('user .message','The event type identifies the payload as user input.'),
 ('Key takeaway','The essential idea is one ordered interaction model connecting user input, agent output, and the supporting activity around them.'))

slide(3,
 ('Core methods','The methods panel distinguishes three responsibilities: history, new input, and live updates.'),
 (at('list(sessionld, params?)',100,230),'List retrieves past events associated with a session.'),
 ('with optional filters','The presentation describes optional parameters for narrowing or paging through that history.'),
 (at('send (sessionld',100,340),'Send adds supported events to the session, such as user messages or tool results.'),
 (at('stream(sessionld',100,455),'Stream opens the live event feed described by the presentation.'),
 ('What each method does','Keep these responsibilities separate when designing the application.'),
 ('Retrieves a list of past events','History retrieval helps inspect what has already happened.'),
 ('pagination (limit, cursor)','Pagination and limits control how the application requests that history.'),
 ('Events are added to the session','Sending input contributes new information to the session\'s interaction.'),
 ('Opens a server-sent events','Streaming receives updates as they become available through server sent events.'),
 ('When to use each method','The usage panel connects each method to a practical need.'),
 ('Useful for debugging, analytics','Use history for inspection, debugging, or rebuilding a view of past activity.'),
 ('Send user input messages','Send a new message when the user continues the conversation.'),
 ('Send tool results from your app','Return a tool result when your application is responsible for that tool execution.'),
 ('Send approval responses','Send a supported approval response when the interaction requires a decision.'),
 ('Best for building interactive','Use streaming for an interface that needs progress while work is happening.'),
 ('Typical workflow','The workflow diagram combines those responsibilities into an interaction loop.'),
 ('Use send() to send','First, supply the input or result that the session needs.'),
 ('Use stream() to','Receive the live updates from the session.'),
 ('Process agent messages','Dispatch messages, tool activity, approvals, and other supported events to the appropriate handler.'),
 ('Send more events','Further interaction can supply another event while retaining the same session identity.'),
 ('Use list() for history','The notes reinforce that reading history and listening for live updates serve different purposes.'),
 ('TypeScript example','The code below illustrates sending a message and then consuming the session stream.'),
 ('await client .beta . sessions . events . send','The send request uses the chosen session identifier.'),
 ('Hello! Can you help me plan a trip to Japan?','Its text block supplies the user\'s task.'),
 ('for await (const event','The asynchronous loop consumes events from the illustrated stream.'),
 ('console. log(event. type, event)','Logging both the type and the object helps inspect the incoming schema. Establish stream subscription and recovery behavior according to the SDK version used by your application.'))

slide(4,
 ('Common event types','An event\'s type tells the application what kind of update it has received.'),
 ('Each event has a specific type','That type determines which payload fields and handling rules are relevant.'),
 ('Event categories','The category panel separates user activity, agent activity, approvals, and observability.'),
 ('Events from you or your app','User events supply input or return information from application controlled execution.'),
 ('Events from the agent, including','Agent events describe the messages and activity exposed by the supported API.'),
 ('Events for human-in-the-loop','Approval events support interactions that need a human decision.'),
 ('System span events for tracing,','Observability events provide information for monitoring and investigation.'),
 ('Common event types (reference)','Read the reference table as an illustration of how event names map to responsibilities.'),
 ('User input message (text, images,','A user message contains the input supplied to the conversation.'),
 ('Result from a tool call executed','A tool result returns information from a tool call handled by your application.'),
 ('Result from a custom tool','A custom tool result serves the corresponding application defined integration.'),
 ('Agent output rnessage','An agent message carries the response content described by that event schema.'),
 ('Agent thinking or reasoning','The presentation illustrates thinking related updates as another event category. Handle only the content that the API actually exposes.'),
 ('Agent request to use a built-in','A tool use event describes an agent request for a tool operation.'),
 ('Agent request to use a custom','A custom tool request addresses a tool that the application provides.'),
 ('Approval requents, responses','Approval updates report the decision flow and its status.'),
 ('How they appear in a stream','The lower timeline shows how several event types contribute to one task.'),
 ('User sends a message','The sequence begins with the user\'s message.'),
 ('Agent is thinking','The next illustrated update indicates work in progress.'),
 ('Agent requests a tool','The agent then requests a tool operation.'),
 ('App returns tool result','The application returns the corresponding result.'),
 ('Agent responds','Finally, an agent message provides the response.'),
 ('Practical usage tips','The usage advice is to dispatch events according to their type.'),
 ('Switch on event. type','Branch on the type and validate the fields expected for that branch.'),
 ('Use events to build your IJI','Keep conversation state separate from transient progress indicators.'),
 ('Implement handlers for approval','Provide explicit handling for tool and approval interactions that your application supports.'),
 ('Track span. * events','Use observability information to investigate execution rather than treating it as ordinary chat text.'),
 ('Example event payloads','The small payload examples illustrate different content shapes. Match implementation details to the actual event definitions in your installed SDK.'))

slide(5,
 ('What is streaming?','Streaming delivers session updates while the interaction is still in progress.'),
 ('stream() uses server-sent','The presentation illustrates a server sent events connection rather than repeated requests for a final answer.'),
 ('Streaming provides a live, ordered','That live event feed lets an interface show progress as well as completed content.'),
 ('What you receive','The receiving side must distinguish partial updates from complete events.'),
 ('Partial content for selected','Event deltas preview content for selected supported event types.'),
 ('preview content as it\'s generated','Use those previews for incremental display according to the event\'s update semantics.'),
 ('Complete content when an event','A final event carries the complete content for that event.'),
 ('the full, final data','Do not accidentally append the complete final content as though it were just another text fragment.'),
 ('You receive a unified stream','The stream can also include input, tools, approvals, and system activity.'),
 ('Typical streaming lifecycle','The lifecycle diagram shows the application\'s receiving loop.'),
 ('Call stream(sessionld) to open','Open the supported stream connection for the selected session.'),
 ('Get event_deltas for supported','Process partial updates for event types that support them.'),
 ('When an event is finished','When a complete event arrives, reconcile the displayed preview with that event\'s final data.'),
 ('Keep processing events from the','Continue listening for further activity according to the session and connection lifecycle.'),
 ('Why streaming is useful','The benefits panel connects streaming to the interface.'),
 ('Shows progress immediately','Visible progress reduces the uncertainty of waiting for a long running operation.'),
 ('Display agent responses as they\'re','Incremental message display helps the conversation feel responsive.'),
 ('Show partial content from','The slide also illustrates previews of supported thinking related content; this does not imply unrestricted access to internal reasoning.'),
 ('Surface tool usage events','Tool activity indicators explain when the application is working with another capability.'),
 ('Live event stream (example)','The timeline illustrates this sequence from initial input to completed response.'),
 ('Thinking about how to help','It shows an in progress update'),
 ('Calling web_search','followed by tool activity.'),
 ('Here\'s the information you','A later complete message provides the finished response content.'),
 ('TypeScript example','The code illustrates consuming an asynchronous event stream.'),
 ('client. beta. sessions.events.stream(sessionld)','The stream is associated with the selected session identifier.'),
 ('switch (event. type)','The switch routes supported types to their own handling logic.'),
 ('case "agent .message"','Message handling distinguishes the relevant partial or complete message representation.'),
 ('case "agent.thinking"','Other activity types have their own handling rules. Keep unsupported types from breaking the entire receiving loop.'))

slide(6,
 ('What is the SDK helper?','This slide introduces the tool runner concept as a higher level orchestration helper.'),
 ('helper can automatically handle','The presentation describes handling tool requests, invoking implementations, and returning results.'),
 ('runs the tools using your provided implementations','The application still supplies the tool behavior that performs the requested operation.'),
 ('Event types it handles','The illustrated event categories distinguish tool requests from custom tool requests.'),
 ('built-in tool (e.g. web_search','One category describes a built in tool request in the presentation\'s model.'),
 ('custom tool you provide','Another describes a tool supplied by your own application.'),
 ('How the helper works','The workflow diagram explains the orchestration loop.'),
 ('Receive session events using','Start by receiving events from the session.'),
 ('extract the tool name and input','For a supported request, identify the tool and extract its input.'),
 ('Run the requested tool using your','Invoke the appropriate implementation with the validation and controls required by that tool.'),
 ('back to the session','Send the corresponding result back to the session.'),
 ('Keep streaming to receive the next','Then continue receiving events so the interaction can proceed.'),
 ('Key benefits','The purpose of a helper is to reduce repeated orchestration code.'),
 ('Automatically detects tool requests','It can centralize recognition of tool requests and result delivery.'),
 ('Reduces boilerplate code','That reduces duplicated plumbing across the application.'),
 ('Provides a standard, reliable way','Consistent handling also makes the flow easier to inspect and maintain.'),
 ('Cautions and notes','The cautions are important because a helper is an abstraction over the execution flow.'),
 ('Understand the flow','Understand which tool events it handles and which responsibilities remain in your application.'),
 ('More advanced behavior','Custom mapping, error handling, and logging may require additional configuration.'),
 ('Best suited for experienced users','The presentation frames this as an advanced tool loop abstraction. Verify the actual helper capabilities available in your SDK before relying on them.'),
 ('TypeScript example','The example is a simplified loop that demonstrates the same responsibilities.'),
 ('for await (const event of client.beta.sessions.events.stream','The loop receives events for the created session.'),
 (['const result','= await runTool(event)'],'The tool execution produces a result.'),
 ('await client.beta. sessions. events.send','The sending step returns that result to the session.'),
 ('content: result','The result payload carries the tool output so the conversation can continue.'))

slide(7,
 ('Complete TypeScript example','Now connect the preceding concepts through the full code illustration.'),
 ('import Anthropic','The example starts by importing the SDK.'),
 ('const client = new Anthropic','Client construction prepares the application connection.'),
 ('apiKey: process','The key is supplied through the runtime environment, rather than as a literal credential in the example.'),
 ('await client.beta.sessions.events.send(sessionld','The send call addresses an already existing session.'),
 (at('events:',170,405),'Its events array contains the input events being submitted.'),
 (at('" user. message"',280,430),'The illustrated type identifies a user message.'),
 ('Hello! Can you help me?','The text block contains the message supplied by the user.'),
 ('for await (const event of client .beta. sessions.events.stream','The asynchronous loop then receives updates for the selected session.'),
 ('console. log(event . type, event)','Logging the event type and object makes their relationship visible during development.'),
 ('What this example does','The walkthrough panel separates those operations into four responsibilities.'),
 ('Creates an Anthropic client','First, construct the client.'),
 ('Sends a user message event','Second, send the user\'s input to the intended session.'),
 ('Streams the session events in','Third, receive live session updates.'),
 ('Logs each event type and the','Fourth, inspect the incoming event data.'),
 ('Parameter breakdown','The parameter panel explains the values used by the request.'),
 ('The ID of the existing session','The session identifier connects sending and receiving to the same conversation.'),
 ('An array of event objects','The events array groups the submitted event objects.'),
 ('Event type. In this example','The type field selects the kind of input.'),
 ('The message content. Here we','The content field contains the supported message blocks.'),
 ('Expected streamed output','The output panel is a simplified illustration of possible events.'),
 ('// Agent thinking event','It includes an activity update representing work in progress,'),
 ('// Tool result event','a tool result associated with execution,'),
 ('// Agent message event','and an agent response carrying text content.'),
 ('Key takeaways','Read the example as a relationship between session identity, submitted input, and received updates.'),
 ('single, ordered event stream','Those updates belong to one ordered interaction.'),
 ('as they happen in real time','The receiving loop supports a responsive view of ongoing work.'),
 ('Each streamed event includes','Its type and event specific content determine how the application processes it. The exact payload shapes must match the SDK version in use.'))

slide(8,
 ('What happens in this example?','This example traces a single request from user input through tool activity to the final response.'),
 ('Each event is part of a single','The ordered stream gives the interface a coherent sequence of progress updates.'),
 ('Example event stream (timeline)','Follow the timeline in the middle of the slide.'),
 ('The user asks a question','The interaction begins when the user asks for help.'),
 ('The agent is thinking','The next illustrated event reports work in progress.'),
 ('The agent requests a tool','A subsequent request asks for a tool operation, such as the search illustrated here.'),
 ('The tool result is returned','The corresponding result returns the information produced by that operation.'),
 ('The agent responds','The agent then responds using the available context.'),
 ('What each event contains','The reference panel links the event names to their payload responsibilities.'),
 ('User input message (text,','User messages contain input supplied to the conversation.'),
 ('Agent thinking or reasoning','Thinking related events expose only the supported activity content described by their schema.'),
 ('Agent request to use a','Tool use events identify a requested operation.'),
 ('Result from a tool call','Tool result events return the corresponding execution output.'),
 ('Agent output message','Agent messages carry response content.'),
 ('How ordered events help your UX','The user experience panel explains how to make the sequence useful.'),
 ('Show user input immediately','Show the user\'s input promptly and display appropriate progress indicators.'),
 ('Display tool usage and intermediate','Show relevant tool activity so the user understands why the task is still running.'),
 ('Build interactive Uls with live updates','Combine updates into an interface that remains responsive during the interaction.'),
 ('Sample event objects','The sample objects illustrate the data behind those indicators.'),
 ('Example: agent.tool_use event','The tool use example describes a requested operation.'),
 ('"t001Name": "web_search"','Its illustrated tool name identifies search as the requested capability.'),
 ('"input": { "query"','The input object supplies the query for that operation.'),
 ('Example: agent.message event','The message example instead illustrates response content.'),
 ('information you requested','Its text supplies the answer shown to the user.'),
 ('How to react in your app','The implementation guidance brings those pieces back to the application.'),
 ('Render user messages, show a thinking indicator','Render each supported category using the view appropriate to its purpose.'),
 ('Use event.type to branch','Use the event type to choose the handler.'),
 ('Process events as they arrive using SSE','Process live updates as they arrive rather than waiting to reconstruct progress from a final response.'),
 ('Use the ordered stream to build','Maintain conversation state alongside the displayed tool activity and final results. The ordered sequence connects the user\'s request with the work performed to answer it.'))

slide(9,
 ('Current maturity','The final slide places the event API in the maturity context described by the presentation.'),
 ('The sessions events API is','It labels the API as beta and actively evolving.'),
 ('Beta means the API is functional','Treat that label as context for version specific behavior, rather than as a promise that the illustrated schema never changes.'),
 ('Why recommended for real-time UX','The presentation recommends event driven interaction for a responsive user experience.'),
 ('Stream events as they happen using','Streaming provides live updates while work is in progress.'),
 ('Get incremental updates on user input','The application can observe messages, tool activity, approvals, and other supported updates.'),
 ('Show progress, reasoning steps','Useful progress information keeps the user informed during longer tasks.'),
 ('Designed for conversational, real-time','The goal is a conversational experience with visible and understandable activity.'),
 ('Ideal use cases','The use cases include several recurring interface needs.'),
 ('Interactive chat experiences','Interactive chat combines incoming responses with clear progress indicators.'),
 ('Live tool calling','Tool activity views show relevant requests and results.'),
 ('User approvals','Approval interfaces present a decision when the interaction requires one.'),
 ('Streaming reasoning previews','The slide also discusses previews of thinking related updates, subject to the content the supported API exposes.'),
 ('What to monitor in a beta API','For implementation work, review the integration as the SDK evolves.'),
 ('Method signatures, event shapes','Changes can affect method signatures, event shapes, and helper behavior.'),
 ('Additional events and fields','New types and fields can extend the event model.'),
 ('Event ordering, contents, or timing','Behavior changes may also affect assumptions in the receiving logic.'),
 ('Keep an eye on SDK','Release notes help identify which assumptions need review.'),
 ('Best practices for production-minded use','The guidance panel focuses on keeping the integration resilient.'),
 ('Use the latest SDK','Review SDK upgrades deliberately and check compatibility with the application.'),
 ('Handle unknown event types gracefully','Handle unfamiliar event types without unnecessarily stopping the entire stream processor.'),
 ('Log events and monitor','Observe failures and unexpected changes so problems can be investigated.'),
 ('Consider starting with internal','The presentation suggests validating the integration in suitable initial use cases before expanding its role.'),
 ('Key takeaway','The lesson\'s central idea is to connect session identity, ordered events, and type specific handlers.'),
 ('The sessions events API is actively','Together, those pieces let the application supply input, receive updates, and respond to ongoing agent activity.'),
 ('Its streaming, event-driven design','You now have the model for turning an event stream into a clear conversation, useful progress feedback, and the appropriate tool or approval workflow.'))

def main():
 out=ROOT/'videos'/NAME;out.mkdir(parents=True,exist_ok=True);deck=next((FOLDER/'output').glob('*.pptx'))
 assert len(ROWS)==9 and all(sum(len(s['text'])+1 for s in row['segments'])<4000 for row in ROWS)
 plan={'project':NAME,'title':'Lesson 5 · Claude Managed Agents Session Events','displayTitle':'Lesson 5 - Claude Managed Agents Session Events','mediaPrefix':'Lesson05-Session-Events','presentation':deck.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(deck.read_bytes()).hexdigest(),'outputFile':'Lesson05-Session-Events.mp4','settings':SETTINGS,'resolution':[1920,1080],'fps':30,'transition':{'type':'perspective rotating cube','seconds':.8},'highlightAudit':'highlight-semantic-audit.json','verifyPhraseBoundaries':True,'highlightStyle':'Complete paragraphs and local code statements','slides':ROWS}
 (out/'narration-plan.json').write_text(json.dumps(plan,indent=2));(out/'highlight-semantic-audit.json').write_text(json.dumps(AUDIT,indent=2))
 print(f'Planned {len(ROWS)} slides, {len(AUDIT)} paragraph cues, {sum(len(s["text"].split()) for row in ROWS for s in row["segments"])} narration words.',flush=True)

if __name__=='__main__':main()
