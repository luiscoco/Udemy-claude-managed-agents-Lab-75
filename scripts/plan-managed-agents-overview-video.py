"""Authored narration for the supplied v1.3.0 infographic deck, using measured text."""
from pathlib import Path
import hashlib,json,re
from plan_lab_settings import SETTINGS

ROOT=Path(__file__).resolve().parents[1]
NAME='managed-agents-v1.3.0'
FOLDER=ROOT/'presentations'/NAME
OCR=json.loads((FOLDER/'.build/video/slides/ocr.json').read_text(encoding='utf-8-sig'))
ROWS=[]

def normalized(text):return re.sub('[^a-z0-9]','',text.lower())

def measured(n,phrase):
 matches=[line for line in OCR[n-1]['lines'] if normalized(phrase) in normalized(line['text'])]
 assert matches,(n,phrase)
 # Prefer the shortest matching line, which excludes incidental body references.
 line=min(matches,key=lambda line:len(line['text']))
 words=line['words'];x=min(w['rect'][0] for w in words);y=min(w['rect'][1] for w in words)
 return [x,y,max(w['rect'][0]+w['rect'][2] for w in words)-x,max(w['rect'][1]+w['rect'][3] for w in words)-y]

def slide(n,*items):
 segments=[]
 for phrase,text in items:
  phrases=phrase if isinstance(phrase,list) else [phrase]
  segments.append({'id':f'{n}-{len(segments)+1}','text':text,'target':{'textRects':[measured(n,p) for p in phrases]}})
 ROWS.append({'slide':n,'segments':segments})

slide(1,
 (['Claude Managed','Agents Overview'],'Welcome to Lesson C zero one: Claude Managed Agents Overview. In this presentation by Luis Coco Enriquez, we will follow the main platform concepts and see how they fit together.'),
 ('Hosted execution','Managed agents provide hosted execution for tools, sessions, and outcomes. Start by separating the work the platform runs from the decisions your application still owns.'),
 ('Files, code','The platform workspace brings together files, code, resources, and the managed runtime. These supporting capabilities give an agent somewhere to work and information to work with.'),
 ('Identity, policies','Your application still controls identity, policies, approvals, and business logic. Hosting execution does not remove these responsibilities. Keep that distinction in mind as we move through the API map.'))

slide(2,
 ('TypeScript API Dictionary','This API dictionary is the map for the rest of the lesson. We are explaining the supplied version one point three point zero presentation, including its examples and status labels, rather than running these examples live.'),
 ('Define what the agent','Begin with the agent: its reusable definition describes behavior and available tools. An environment supplies the execution context, and a session connects those definitions to a particular piece of work.'),
 ('Send, stream, and react','Events carry messages and progress through the running session. Outputs and tools turn that activity into useful results, such as answers, files, or actions.'),
 ('Namespace map','The namespace map is a navigation aid. Agents and environments describe reusable configuration. Sessions, events, threads, and resources describe running work. Vaults, memory stores, and deployments add supporting capabilities.'),
 ('Quick Start','The quick start introduces the client and session creation. Notice the two identities the example reuses: an agent identifier and an environment identifier. Creating a session is different from redefining either resource.'),
 ('Status legend','Read the status legend before copying an example. The deck distinguishes the managed agents beta, adjacent stable APIs, experimental patterns, and legacy guidance. These labels belong to this version of the presentation.'))

slide(3,
 ('Overview & Setup','Setup begins with the TypeScript SDK and an API key available to the application that creates the client. The goal is a small, understandable path from reusable configuration to a running session.'),
 ('What you need','Install the SDK, configure the API key through the runtime environment, and keep the agent and environment identifiers available. The slide recommends reusing those identifiers across sessions instead of rebuilding the setup for every interaction.'),
 ('Main namespaces','Use the namespace list to find the responsibility you need. Agent configuration, environment configuration, session activity, resource access, credentials, memory, and deployment scheduling are separate parts of the map.'),
 ('Typical flow','Follow the five stages from left to right: create the agent, create its environment, create a session, send and stream events, then manage supporting resources. Each stage adds a different kind of state or capability.'),
 ('TypeScript quick start','In the quick start, the client creates a session using the existing agent and environment identifiers. An initial user message provides the first task. Trace those inputs before studying the returned session.'),
 ('Status guide','The status guide calls out a separate memory header and different stability categories. When implementing the example, treat the shown headers and request shapes as version specific configuration to check against your installed SDK.'))

slide(4,
 ('Agents & Versions','An agent is a persistent, reusable definition. It captures instructions, the selected model, tools, connected servers, and metadata. Think of the agent as the configuration that many sessions can reuse.'),
 ('Core methods','The methods table separates creating an agent, retrieving it, updating it, listing agents, and archiving. Version listing is a separate operation that lets you inspect the history of that reusable definition.'),
 ('Important fields','Read the important fields from top to bottom. Name identifies the definition for people. Model and system shape its behavior. Tools and connected MCP servers describe capabilities, while metadata records application context.'),
 ('Execution policy and permissions','The execution policy panel reminds us that tool availability and execution limits need deliberate configuration. Relate the permitted capabilities to the intended task rather than treating a reusable agent as unrestricted.'),
 ('Behavior and status','The lifecycle panel distinguishes archiving from ordinary updates. In this deck, archiving is presented as terminal and the normal agent workflow does not use deletion. Check lifecycle consequences before using cleanup operations.'),
 ('TypeScript example','The example creates a support agent and then lists agents and agent versions. Follow the created identifier into the version listing. That connection is what makes the history belong to the correct reusable definition.'))

slide(5,
 ('Environments','An environment defines the execution sandbox for agent tools. The diagram separates where execution happens from what network access and capabilities that execution receives.'),
 ('Core methods','The methods table covers creation, retrieval, updates, listing, deletion, and archiving as presented in this deck. Read these as different management operations, with different lifecycle consequences.'),
 ('Key configuration','Configuration selects the environment type and its network policy. The capability switches then determine whether features such as package installation and MCP servers are available. Choose the settings needed by the workload.'),
 ('Best practices','The best practices panel emphasizes configuration boundaries. It explains that changes apply to new containers while existing sessions retain their earlier configuration. Reusable environments make those choices easier to understand and manage.'),
 ('Experimental note','Self hosted execution is marked as an advanced, experimental pattern in this presentation. Its infrastructure and networking responsibilities differ from the cloud environment described alongside it.'),
 ('Example: create a','The first code panel creates an environment and keeps its identifier. Follow the configuration object: execution type, networking, and capabilities describe the sandbox that later sessions will use.'),
 ('Example: update and archive','The second example updates that environment and then archives it. Compare a configuration change with a lifecycle operation. They serve different purposes and should be handled separately in the application.'))

slide(6,
 ('Sessions','A session is the runtime instance that connects an agent to an environment. It preserves the conversation and associated runtime context across multiple interactions.'),
 ('Core methods','The session methods cover creating, retrieving, updating, listing, deleting, and archiving as shown here. Distinguish starting work from inspecting existing work and from ending its lifecycle.'),
 ('Create parameters','The create parameters identify the agent and environment. Initial events provide conversation input, resources attach supporting content, and the remaining fields carry limits or application metadata in this example.'),
 ('Lifecycle tips','Create reusable agents and environments ahead of time, then attach relevant resources to the session. The lifecycle tips describe archive and delete as consequential operations rather than ordinary conversation turns.'),
 ('TypeScript example','Trace the code from session creation to retrieval and listing. The returned identifier connects later requests to the same session. Resource identifiers and metadata belong to that particular runtime instance.'),
 ('When to use Sessions','Sessions are useful when a task continues over several turns, accesses tools or files, or needs progress to be resumed later. Persistent session state provides continuity across those interactions.'),
 ('Key takeaway','The key distinction is reusable configuration versus running state. Agents and environments describe how work can run; a session carries the conversation, resources, and execution context for a specific run.'))

slide(7,
 ('Session Events','Session events are the communication and control channel for a running session. They connect user input, agent output, tool activity, and other runtime signals.'),
 ('Core methods','The methods table presents three jobs: list earlier events, send new events, and stream events as they arrive. Choose the operation according to whether you need history, input, or ongoing updates.'),
 ('Common event types','The event table distinguishes a user message from an agent message, and a tool request from the result supplied by the application. Keep these roles separate when interpreting the stream.'),
 ('Streaming notes','The streaming notes distinguish partial previews from completed content. Deltas can support a responsive interface, while the final event supplies the complete content for that event.'),
 ('SDK helper','The tool runner panel describes a helper that can execute supported tool calls and send results back. It is marked as an advanced helper. Understand which application or runtime component is responsible for each tool before adopting that pattern.'),
 ('Event stream (example)','Read the illustrated sequence in order: a user message, agent activity, a tool call, its result, and the agent response. This is an explanatory example, not evidence of a provider run performed for this video.'),
 ('TypeScript example','The code sends a user message to an existing session and iterates over the event stream. Notice the repeated session identifier: both operations refer to the same conversation and runtime context.'))

slide(8,
 ('Threads & Thread Events','Threads organize conversations within a session. This example walks through listing threads, retrieving a specific thread, and streaming updates for that thread.'),
 ('Prerequisites','The prerequisites include SDK access and a previously created session identifier. The thread operations shown here are scoped to that parent session.'),
 ('List all threads for a session','The first code panel lists threads with filtering and ordering options. Read the example result as a collection, and notice the pagination information that indicates when additional results are available.'),
 ('Retrieve a specific thread','The second panel retrieves one thread using its identifier together with the parent session identifier. Compare its result with the list response: this view describes one selected conversation.'),
 ('Stream thread events','The third panel streams thread events and requests incremental updates. Its event handling separates message deltas, completed messages, status changes, and errors.'),
 ('Example event output','The example output shows partial text arriving before the completed message and a status update. A responsive interface should keep incremental display and final content associated with the correct thread.'),
 ('Best','The bottom row summarizes pagination, streaming error handling, delta processing, and the archive behavior described in this deck. Use these concerns as a checklist when explaining how the thread example works.'))

slide(9,
 ('Session Resources','Session resources connect external content to a running session. The slide illustrates files, GitHub repositories, and memory stores as distinct kinds of supporting content.'),
 ('Core methods','The resource methods attach, retrieve, update, list, and remove resource links. The highlighted naming distinction is that this namespace uses add to attach a resource, rather than creating the underlying file or repository.'),
 ('Supported resource types','A file resource refers to an uploaded file. A repository resource provides source code access. A memory store resource connects saved context. The resource type determines what the session can work with.'),
 ('Typical workflow','Follow the workflow from uploading a file to attaching it to a session. Keep the file identifier returned by the upload, then include it in the session resource request.'),
 ('Status / lifecycle','The lifecycle panel distinguishes removing a session resource from archiving other platform objects. Resource access and resource attachment belong to the selected session.'),
 ('TypeScript example','The code demonstrates the same two stages: upload a document, then add a file resource using the returned file identifier. Reading the operations in order makes the relationship between stored content and session access clear.'),
 ('Additional notes','The additional notes call out repository authorization updates and session scoped permissions. Attaching a resource is an access decision that should remain consistent with the application policy.'))

slide(10,
 ('Vaults & Credentials','Vaults and credentials support secret handling for tools and environments. The purpose panel explicitly separates secrets from source code, session events, and memory stores.'),
 ('Vault methods','Vault management and credential management are separate layers. A vault groups the sensitive material; credentials are managed within that vault. Follow the relevant identifiers through creation and later operations.'),
 ('Credential methods','The credential methods table describes creating, retrieving, updating, listing, deleting, and archiving credentials in the workflow shown here. Metadata management and secret access should be understood as separate concerns.'),
 ('Credential types','The credential types panel includes environment variables, static bearer tokens, and several OAuth client patterns. Select the integration form required by the tool rather than placing a secret directly in a prompt.'),
 ('Security guidance','The guidance emphasizes least privilege, credential rotation, separate environment vaults, and access auditing. Memories and session events should carry useful context without becoming secret storage.'),
 ('TypeScript example','The example creates a production vault and adds an environment variable credential. It reads the sensitive value from the process environment. The presentation contains placeholders; this video does not provide or display working credentials.'),
 ('Key benefits','The benefits are secure storage, runtime tool access, separation between environments, and support for rotation. Keep these operational responsibilities visible when designing the application.'))

slide(11,
 ('Memory Stores, Memories','Memory stores provide durable context across sessions. The slide separates the store that organizes knowledge, individual memories that contain text, and versions that record changes.'),
 ('Namespace map','Use the namespace map to distinguish these three levels. Store operations manage the collection, memory operations manage individual entries, and version operations inspect their recorded history.'),
 ('Store methods','The store methods create and manage the container for a project or domain. This is different from editing the content of an individual memory inside that store.'),
 ('Memory methods','A memory is a small text document containing context, preferences, or domain knowledge. Consistent paths help the application organize and find the right entry.'),
 ('Version methods','The version panel describes listing versions, retrieving a specific version, and redaction. Version history is presented as the record of changes to a memory, supporting inspection and traceability.'),
 ('Important rules','The rules panel calls out a separate memory beta header, resource attachment, descriptive paths, and update preconditions. Its main application lesson is to keep identity and version expectations explicit when updating shared context.'),
 ('Safety guidance','Memory is context the agent may use in future sessions. Keep secrets and credentials in the appropriate secret handling system rather than in memory content.'),
 ('TypeScript example','Follow the example through store creation, memory creation, and version listing. Each stage uses identifiers returned by the preceding stage, connecting the document and its history to the correct store.'))

slide(12,
 ('Deployments, Files, Skills','The final infographic brings together scheduled execution, supporting APIs, and the status guide. Use it to connect the reusable configuration to ongoing application operation.'),
 ('Deployments','Deployments schedule recurring agent work and create sessions over time. The methods table separates configuration from pausing, resuming, archiving, and triggering an immediate run.'),
 ('Adjacent stable APIs','Files and skills are shown as adjacent APIs in this deck. Files supply content, while skills package reusable capabilities. They support agent applications without replacing sessions or events.'),
 ('Status guide','The status guide distinguishes the core beta, adjacent stable surfaces, experimental notes, and legacy guidance. Read those labels in the context of this presentation version when selecting implementation details.'),
 ('Example','The deployment example combines an agent identifier, an environment identifier, and a cron schedule. The adjacent example demonstrates file upload and skill creation. These are complementary application operations.'),
 ('Production advice','Finish with the architectural separation in the production advice. Agents and environments form reusable configuration. Sessions and events carry running work. Vaults, memory, and resources supply supporting capabilities. Keeping those responsibilities clear makes the complete workflow easier to explain and maintain.'))

def main():
 deck=next((FOLDER/'output').glob('*.pptx'));out=ROOT/'videos'/NAME;out.mkdir(parents=True,exist_ok=True)
 assert len(ROWS)==12 and [r['slide'] for r in ROWS]==list(range(1,13))
 assert all(sum(len(s['text'])+1 for s in r['segments'])<2000 for r in ROWS)
 plan={'project':NAME,'title':'Claude Managed Agents Overview · v1.3.0','displayTitle':'Claude Managed Agents Overview - v1.3.0','mediaPrefix':'Claude-Managed-Agents-v1.3.0','presentation':deck.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(deck.read_bytes()).hexdigest(),'outputFile':'Claude-Managed-Agents-v1.3.0.mp4','settings':SETTINGS,'resolution':[1920,1080],'fps':30,'transition':{'type':'perspective rotating cube','seconds':.8},'slides':ROWS}
 (out/'narration-plan.json').write_text(json.dumps(plan,indent=2),encoding='utf8')
 print(f'Authored {len(ROWS)} slides with {sum(len(r["segments"]) for r in ROWS)} measured narration targets.',flush=True)

if __name__=='__main__':main()
