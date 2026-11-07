"""Retarget the unchanged overview narration at sentence/phrase word boundaries."""
from pathlib import Path
import hashlib,importlib.util,json,re,shutil

ROOT=Path(__file__).resolve().parents[1];NAME='managed-agents-v1.3.0';OUT=ROOT/'videos'/NAME
CACHE=ROOT/'presentations'/NAME/'.build/video/audio'
OCR=json.loads((CACHE.parent/'slides/ocr.json').read_text(encoding='utf-8-sig'))

def at(text,x,y):return (text,x,y)

# One explicit, editorially selected visible phrase per narrated sentence.
# Coordinates disambiguate repeated method names in separate infographic panels.
M={
1:[
 [['Claude Managed','Agents Overview'],'Author:'],
 [['Hosted execution','for tools, sessions','and outcomes'],['Identity, policies','approvals and','business logic']],
 [['Files, code','resources and','managed runtime'],['Files, code','resources and','managed runtime']],
 [['Identity, policies','approvals and','business logic'],['Identity, policies','approvals and','business logic'],'One hosted platform']],
2:[
 ['TypeScript API Dictionary','vi.3.o'],
 ['Define what the agent',['Run the agent in a secure','Create a session to run']],
 ['Send, stream, and react',['Use tool calls, files','memory and skills to','produce results']],
 ['Namespace map',['client. beta . agents','client . beta . environments'],['client . beta . sessions . events','client . beta . sessions . resources'],['client. beta. vaults','client . beta . memory_stores','client. beta. deployments']],
 ['const session',['agent:','environnent_id'],'const session'],
 ['Status legend',['Stable Adjacent','Experimental Notes','Legacy Guidance'],'Latest verified Oct 2026']],
3:[
 ['Install the TypeScript SDK','From agent creation'],
 ['Install the TypeScript SDK',['You only need to create agents and environments once','in most production setups. Reuse their IDs.']],
 ['Main namespaces',['client. beta. agents','c lient. beta. environments','client.beta.sessions','client.beta. sessions. resources','client. beta. vaults','client . beta. mernory_stores','client . beta. deployments']],
 [['Create agent','Create environment','Create session','Send / stream events','Manage resources'],'From agent creation'],
 ['const session',['type: "user .message"','Helio! Can you help me'],'Your existing agent ID'],
 ['Memory stores use a separate beta header',['Core beta header','Memory beta header']]],
4:[
 ['Agents are persistent, reusable',['model, system instructions','tools, MCP servers, permissions','and metadata needed to run'],['Create an agent once and reuse it by ID across','sessions, environments, and deployments.']],
 [['create (params)','retrieve(agentld)','update (agentld, params)','list(params?)','archive(agentld)'],'versions. list'],
 ['Important fields','Human-readable name for the agent.',['Model to use','System instructions that define behavior.'],['Configured tool sets','Connected MCP servers','Arbitrary key-value metadata']],
 [['Agents can include default budget','that control how the agent runs'],['Agents can include default budget','that control how the agent runs']],
 ['Behavior and status',['Archive is terminal','No delete method'],'Archived agents are read-only'],
 ['const agent','const version of client.beta.agents.versions.list(agent.id)','console. log(version. id)']],
5:[
 [['Environments define the','execution sandbox where','agent tools run'],['Cloud or self-hosted mode','controlling network access','capabilities, and restrictions.']],
 [['create (params)','retrieve(environmentld)','update (environmentld','list(params?)','delete(environmentld)','archive(environmentld)'],['Delete an environment.','Archive an environment, preventing']],
 [['config. type','networking. type'],['Allow package managers','allow_mcp_servers'],'Prefer least privilege.'],
 ['Best practices',['Changes apply only to new containers.','Existing sessions keep Old config.'],'Create reusable environments.'],
 ['Self-hosted workers are an advanced pattern',['For self_hosted environments, Cloud networking controls','are ignored, since network access']],
 ['const environment = await',['config:','type :','networking:']],
 ['const updated = await','await client . beta . environments . archive','Example: update and archive']],
6:[
 [['Sessions run an agent inside','an environment with persistent'],['conversation history, resources','and runtime state.']],
 [['create (params)','retrieve(sessionld)','update(sessionld, params)','list(params?)','delete(sessionld)','archive(sessionld)'],['Create a new session with','Get details of a session by ID.','Archive a session (terminal state).']],
 [['The agent ID to run in the session.','The environment ID to execute the'],['initial_events',at('resources',1450,340),'budget','User-defined metadata']],
 ['Create agents and environments ahead of time.',['Archive is a terminal state','Delete removes the session object permanently.']],
 ['Create a new session','client. beta . sessions. retrieve(session. id)',at('metadata:',175,960)],
 ['Multi-turn conversations with persistent state.','Resuming and managing progress across sessions.'],
 ['Key takeaway',['Sessions provide a durable, stateful runtime','and execution state across multiple interactions.']]],
7:[
 [['Session events are the session','1/0 stream and control channel'],['letting you send user input','receive agent output, and handle','tool, approval, and system events']],
 [['list(sessionld','send(sessionld','stream( sessionld'],['List past session events','Send one or more events','Stream live session events']],
 [at('user. message',1285,205),at('agent. message',1285,320)],
 [['event_deltas can preview partial','Final events carry complete content'],['event_deltas can preview partial','Final events carry complete content']],
 [['can automatically handle','execute the tools, and send results','back to the session for you.'],'Advanced helper behavior','sessions-side tool runner helper'],
 [at('user.message',1370,630),'Event stream (example)'],
 ['await Client.beta. sessions. events. send','for await (const event Of client. beta. sessions. stream']],
8:[
 ['Threads: organize conversations within a session.',['List all threads in a session','Retrieve a specific thread by ID','Stream thread events in real time']],
 ['A valid session_id',['Always naes the session_id','methods. Threads are scoped to a parent session.']],
 ['const threads = await client.beta.sessions.threads.list',['has_more: true','next_cursor:']],
 ['const thread = await client.beta.sessions.threads.retrieve','id: "thread_xyz789"'],
 ['event_deltas: true',['case "thread .message.delta"','thread.status.changed','case "error"']],
 ['Example event output',['thread.message.delta','thread.rnessage.delta','thread.status.changed']],
 [['For sessions with many','Handle streaming errors','Use event_deltas for a more','Archive when finished'],'Explore different event types']],
9:[
 [['Session Resources attaches','files, GitHub repositories, and','memory stores to a session'],['file','github_repository','nwnory_store']],
 [['add(sessionld','retrieve(resourceld','update(resourceld','list(sessionld','delete(resourceld'],'This namespace uses add() to attach resources'],
 ['Attach a file that was uploaded','Mount a GitHub repository','Attach a memory Store to give','Supported resource types'],
 ['Upload a file',['Get a file_id for the uploaded file','Attach to session']],
 [['Resources are delete-only.','Resources cannot be archived.'],'Resource access is scoped to the session.'],
 ['const file await client.beta . files','await client. beta. sessions. resources . add'],
 ['authorization tokens for GitHub repository mounts','Resource access is scoped to the session.']],
10:[
 [['Vaults store secrets safely','for tools and environments.'],['Keep API keys and tokens','out of code, session events','and memory stores.']],
 [['Vault methods','Credential methods'],['Create a new vault.','Create a credential in a vault.'],['retrieve(vaultld)','retrieve(credentialld']],
 [['Create a credential in a vault.','Get credential details.','Update credential metadata.','List credentials in a vault.','Delete a credential.','Archive a credential (terminal).'],['Update credential metadata.','Use vaults for API keys and tokens']],
 ['Credential types','Stores a value as an environment variable'],
 [['Keep least privilege','Rotate credentials regularly','Use environment-specific vaults','Audit access'],'Never store secrets in memory stores or session events'],
 ['Create a vault for production secrets','value: process. env.','The presentation contains placeholders'],
 [['Keep secrets safe','Enable tools','Separate vaults for','Update credentials'],'Key benefits']],
11:[
 ['memory that persists across sessions.',['Memory Stores','Memories','Memory Versions']],
 ['Namespace map',['client . beta. memory_stores','client. beta. memory_stores. memories','client. beta. memory_stores. memory_versions']],
 [['Manage memory stores for organizing','memories by project, agent, or domain.'],['Memories are small text documents that','capture facts, preferences, and context.']],
 [['Memories are small text documents that','capture facts, preferences, and context.'],['Memories are small text documents and paths matter','use consistent, descriptive names']],
 [['List versions for a memory.','Get a specific version.','Redact a version'],['Each mutation to a memory creates an','immutable version history for audit, rollback','and redaction.']],
 ['Important rules',['Updates can use preconditions','avoid overwrite conflicts.']],
 ['Memories are visible to the agent','Use vaults for secrets and credentials'],
 ['Create a memory Store, add a memory, and list its versions.',['store_id: store.id.','nemory_id: nenory.id,']]],
12:[
 ['Deployments, Files, Skills','Production advice'],
 [['Scheduled deployments run an agent','on a cron schedule and create sessions'],['pause (deploymentld)','unpause(deploymentld)','archive(deploymentld)','run (deploymentld)']],
 ['Adjacent stable APIS',['Manage files for agents and skills.','Manage reusable skills that agents can use.'],'Not part Of Core beta surface'],
 [['Beta','Stable adjacent','Experimental notes','Legacy guidance'],'Status guide'],
 ['agent_id :',['Uplood a file','Create a skill'],'Production advice'],
 ['Production advice',['Use agents and environments as','control-plane resources.'],['Use sessions and events as the runtime','data plane.'],['Use vaults, memory, and resources','as supporting capabilities.'],['Combine these building blocks to create','reliable, scalable agent systems.']]]
}

# Additional spoken boundaries for enumerations. Each item starts exactly at an
# existing word in the recording, never at an estimated fraction of a sentence.
SPLITS={
 '1-4': [('Your application','Identity, policies'),('approvals','approvals and'),('business logic','business logic'),('Hosting execution','Identity, policies'),('Keep that distinction','One hosted platform')],
 '2-2': [('Begin with','Define what the agent'),('An environment','Run the agent in a secure'),('and a session','Create a session to run')],
 '2-6': [('Read the status legend','Status legend'),('The deck distinguishes','Beta'),('adjacent stable APIs','Stable Adjacent'),('experimental patterns','Experimental Notes'),('and legacy guidance','Legacy Guidance'),('These labels','Latest verified Oct 2026')],
 '3-2': [('Install the SDK','nprn install'),('configure the API key','Set your API key:'),('and keep the agent',['Keep your agent and environment','IDs for reuse across sessions.']),('The slide recommends',['You only need to create agents and environments once','in most production setups. Reuse their IDs.'])],
 '3-4': [('Follow the five stages','Typical flow'),('create the agent','Create agent'),('create its environment','Create environment'),('create a session','Create session'),('send and stream events','Send / stream events'),('then manage supporting resources','Manage resources'),('Each stage','From agent creation')],
 '4-2': [('The methods table','Core methods'),('creating an agent','create (params)'),('retrieving it','retrieve(agentld)'),('updating it','update (agentld, params)'),('listing agents','list(params?)'),('and archiving','archive(agentld)'),('Version listing','versions. list')],
 '4-3': [('Read the important fields','Important fields'),('Name identifies','Human-readable name for the agent.'),('Model and system',['Model to use','System instructions that define behavior.']),('Tools and connected',['Configured tool sets','Connected MCP servers']),('while metadata','Arbitrary key-value metadata')],
 '5-3': [('Configuration selects','config. type'),('and its network policy','networking. type'),('The capability switches','Allow package managers'),('and MCP servers','allow_mcp_servers'),('Choose the settings','Prefer least privilege.')],
 '5-7': [('The second example updates','const updated = await'),('and then archives it','await client . beta . environments . archive'),('Compare a configuration change','const updated = await'),('with a lifecycle operation','await client . beta . environments . archive'),('They serve different purposes','Example: update and archive')],
 '6-3': [('The create parameters',['The agent ID to run in the session.','The environment ID to execute the']),('Initial events','initial_events'),('resources attach',at('resources',1450,340)),('and the remaining fields',['budget','User-defined metadata'])],
 '6-4': [('Create reusable agents','Create agents and environments ahead of time.'),('then attach relevant','Attach resources at session creation when possible.'),('The lifecycle tips',['Archive is a terminal state','Delete removes the session object permanently.'])],
 '7-2': [('The methods table','Core methods'),('list earlier events','list(sessionld'),('send new events','send(sessionld'),('and stream events','stream( sessionld'),('Choose the operation',['List past session events','Send one or more events','Stream live session events'])],
 '7-3': [('The event table',at('user. message',1285,205)),('from an agent message',at('agent. message',1285,320)),('and a tool request',at('agent. tool_use',1285,390)),('from the result',at('user. tool_ result',1285,244)),('Keep these roles','Common event types')],
 '7-4': [('The streaming notes','Streaming notes'),('partial previews','event_deltas can preview partial'),('from completed content','Final events carry complete content'),('Deltas can support','event_deltas can preview partial'),('while the final event','Final events carry complete content')],
 '7-6': [('Read the illustrated sequence','Event stream (example)'),('a user message',at('user.message',1370,630)),('agent activity',at('agent.thinking',1370,685)),('a tool call',at('agent.tool_use',1370,740)),('its result',at('user.tool_result',1370,800)),('and the agent response',at('agent.message',1370,855)),('This is an explanatory example','Event stream (example)')],
 '8-5': [('The third panel','event_deltas: true'),('Its event handling','case "thread .message.delta"'),('completed messages','thread wnpleted'),('status changes',at('thread.status.changed',1200,755)),('and errors','case "error"')],
 '8-7': [('The bottom row','For sessions with many'),('streaming error handling','Handle streaming errors'),('delta processing','Use event_deltas for a more'),('and the archive behavior','Archive when finished'),('Use these concerns','Explore different event types')],
 '9-2': [('The resource methods','Core methods'),('attach','add(sessionld'),('retrieve','retrieve(resourceld'),('update','update(resourceld'),('list','list(sessionld'),('and remove','delete(resourceld'),('The highlighted naming distinction','This namespace uses add() to attach resources')],
 '9-4': [('Follow the workflow','Upload a file'),('to attaching it','Attach to session'),('Keep the file identifier','Get a file_id for the uploaded file'),('then include it','Specify the session_id')],
 '9-6': [('The code demonstrates','const file await client.beta . files'),('then add a file resource','await client. beta. sessions. resources . add'),('Reading the operations','file_id: file. id')],
 '10-4': [('The credential types panel','Credential types'),('environment variables','environment_variable'),('static bearer tokens','static_bearer'),('and several OAuth',['OAuth 2.0 client credentials using HTTP','OAuth 2.0 client credentials using form-encoded','OAuth 2.0 client credentials with no additional']),('Select the integration form','Credential types')],
 '10-5': [('The guidance emphasizes','Keep least privilege'),('credential rotation','Rotate credentials regularly'),('separate environment vaults','Use environment-specific vaults'),('and access auditing','Audit access'),('Memories and session events','Never store secrets in memory stores or session events')],
 '10-6': [('The example creates','Create a vault for production secrets'),('and adds an environment variable credential','Add an environment_variable credential'),('It reads the sensitive value','value: process. env.'),('The presentation contains placeholders','nane:')],
 '10-7': [('The benefits are','Keep secrets safe'),('runtime tool access','Enable tools'),('separation between environments','Separate vaults for'),('and support for rotation','Update credentials'),('Keep these operational responsibilities','Key benefits')],
 '11-2': [('Use the namespace map','Namespace map'),('Store operations',at('client . beta. memory_stores',400,165)),('memory operations','client. beta. memory_stores. memories'),('and version operations','client. beta. memory_stores. memory_versions')],
 '11-5': [('The version panel','List versions for a memory.'),('retrieving a specific version','Get a specific version.'),('and redaction','Redact a version'),('Version history',['Each mutation to a memory creates an','immutable version history for audit, rollback','and redaction.'])],
 '11-6': [('The rules panel','Important rules'),('a separate memory beta header','beta header (agent-memory-2e26-67-22)'),('resource attachment','Attach a memory Store to a session via'),('descriptive paths','use consistent, descriptive names'),('and update preconditions','Updates can use preconditions'),('Its main application lesson','avoid overwrite conflicts.')],
 '12-2': [('Deployments schedule',['Scheduled deployments run an agent','on a cron schedule and create sessions']),('The methods table','Key methods'),('pausing','pause (deploymentld)'),('resuming','unpause(deploymentld)'),('archiving','archive(deploymentld)'),('and triggering an immediate run','run (deploymentld)')],
 '12-3': [('Files and skills','Adjacent stable APIS'),('Files supply content','Manage files for agents and skills.'),('while skills','Manage reusable skills that agents can use.'),('They support agent applications','Not part Of Core beta surface')],
 '12-4': [('The status guide','Status guide'),('the core beta',at('Beta',1380,220)),('adjacent stable surfaces',at('Stable adjacent',1380,305)),('experimental notes',at('Experimental notes',1380,385)),('and legacy guidance',at('Legacy guidance',1380,480)),('Read those labels','Understand the stability of each area')],
 '12-5': [('The deployment example','agent_id :'),('an environment identifier',at('environment_id:',100,1040)),('and a cron schedule','schedule:'),('The adjacent example demonstrates','Uplood a file'),('and skill creation','Create a skill'),('These are complementary','Production advice')]
}

SPLITS.update({
 '1-1': [('Welcome',['Claude Managed','Agents Overview']),('In this presentation by','Luis Coco Enr'),('we will follow','One hosted platform')],
 '2-4': [('The namespace map','Namespace map'),('Agents','client. beta . agents'),('and environments','client . beta . environments'),('Sessions,',at('client . beta. sessions',850,780)),('events,','client . beta . sessions . events'),('threads,','Client. beta. sessions. threads'),('and resources','client . beta. sessions . resources'),('Vaults,','client. beta. vaults'),('memory stores,','client . beta . memory_stores'),('and deployments','client. beta. deployments')],
 '2-5': [('The quick start','const session'),('Notice the two identities','agent:'),('an agent identifier','agent:'),('and an environment identifier','environnent_id'),('Creating a session','const session')],
 '3-3': [('Use the namespace list','Main namespaces'),('Agent configuration','client. beta. agents'),('environment configuration','c lient. beta. environments'),('session activity','client.beta.sessions'),('resource access','client.beta. sessions . resources'),('credentials,','client. beta. vaults'),('memory,','client . beta. mernory_stores'),('and deployment scheduling','client . beta. deployments')],
 '4-1': [('An agent is',['Agents are persistent, reusable','definitions that capture the']),('It captures instructions','System instructions that define behavior.'),('the selected model','Model to use'),('tools,','Configured tool sets'),('connected servers','Connected MCP servers'),('and metadata','Arbitrary key-value metadata'),('Think of the agent',['Create an agent once and reuse it by ID across','sessions, environments, and deployments.'])],
 '4-6': [('The example creates','const agent'),('and then lists agents','const a of client.beta.agents.list'),('and agent versions','const version of client.beta.agents.versions.list(agent.id)'),('Follow the created identifier',at('agent.id',800,1000)),('That connection','console. log(version. id)')],
 '5-2': [('The methods table','Core methods'),('creation,','create (params)'),('retrieval,','retrieve(environmentld)'),('updates,','update (environmentld'),('listing,','list(params?)'),('deletion,','delete(environmentld)'),('and archiving','archive(environmentld)'),('Read these',['Delete an environment.','Archive an environment, preventing'])],
 '5-4': [('The best practices','Best practices'),('It explains that changes','Changes apply only to new containers.'),('while existing sessions','Existing sessions keep Old config.'),('Reusable environments','Create reusable environments.')],
 '5-6': [('The first code panel','const environment = await'),('Follow the configuration object',at('config:',140,965)),('execution type',at('type :',155,985)),('networking,',at('networking:',155,1005)),('and capabilities',at('true,',360,1020))],
 '6-2': [('The session methods','Core methods'),('creating,','create (params)'),('retrieving,','retrieve(sessionld)'),('updating,','update(sessionld, params)'),('listing,','list(params?)'),('deleting,','delete(sessionld)'),('and archiving','archive(sessionld)'),('Distinguish starting work','Create a new session with'),('from inspecting existing work','Get details of a session by ID.'),('and from ending its lifecycle','Archive a session (terminal state).')],
 '6-5': [('Trace the code',at('Create a new session',120,860)),('to retrieval','client. beta . sessions. retrieve(session. id)'),('and listing',at('List sessions',125,1030)),('The returned identifier','client. beta . sessions. retrieve(session. id)'),('Resource identifiers',at('resources:',175,930)),('and metadata',at('metadata:',175,960))],
 '6-6': [('Sessions are useful','Multi-turn conversations with persistent state.'),('accesses tools or files','Access to tools, files, and memory over time.'),('or needs progress','Resuming and managing progress across sessions.'),('Persistent session state','Multi-turn conversations with persistent state.')],
 '7-1': [('Session events',['Session events are the session','1/0 stream and control channel']),('They connect user input',at('user. message',1285,205)),('agent output',at('agent. message',1285,320)),('tool activity',at('agent. tool_use',1285,390)),('and other runtime signals',['approval.','span.'])],
 '7-7': [('The code sends','await Client.beta. sessions. events. send'),('and iterates','for await (const event Of client. beta. sessions. stream'),('Notice the repeated session identifier',at('session.id',500,980))],
 '8-1': [('Threads organize','Threads: organize conversations within a session.'),('This example walks through','What this example does'),('listing threads','List all threads in a session'),('retrieving a specific thread','Retrieve a specific thread by ID'),('and streaming updates','Stream thread events in real time')],
 '8-2': [('The prerequisites','Instau the latest Claude SDK'),('and a previously created session identifier','A valid session_id'),('The thread operations',['Always naes the session_id','methods. Threads are scoped to a parent session.'])],
 '8-3': [('The first code panel','const threads = await client.beta.sessions.threads.list'),('with filtering','optional filters'),('and ordering options','order: "desc"'),('Read the example result',at('data:',140,850)),('and notice the pagination information',['has_more: true','next_cursor:'])],
 '8-4': [('The second panel','const thread = await client.beta.sessions.threads.retrieve'),('using its identifier',at('threadld,',630,535)),('together with the parent session identifier',at('session_id: sessionld',640,552)),('Compare its result','id: "thread_xyz789"')],
 '8-6': [('The example output',at('event: thread.message.delta',1600,520)),('before the completed message',at('contenta',1650,770)),('and a status update',at('event: thread.status.changed',1600,850)),('A responsive interface',at('contenta',1650,770))],
 '9-1': [('Session resources',['Session Resources attaches','files, GitHub repositories, and','memory stores to a session']),('The slide illustrates files',at('file',1440,224)),('GitHub repositories,','github_repository'),('and memory stores','nwnory_store')],
 '9-7': [('The additional notes','authorization tokens for GitHub repository mounts'),('and session scoped permissions','Resource access is scoped to the session.'),('Attaching a resource','according to its permissions.')],
 '10-2': [('Vault management','Vault methods'),('and credential management','Credential methods'),('A vault groups','Create a new vault.'),('credentials are managed','Create a credential in a vault.'),('Follow the relevant identifiers',['retrieve(vaultld)','retrieve(credentialld'])],
 '10-3': [('The credential methods table','Credential methods'),('creating,','Create a credential in a vault.'),('retrieving,','Get credential details.'),('updating,','Update credential metadata.'),('listing,','List credentials in a vault.'),('deleting,','Delete a credential.'),('and archiving','Archive a credential (terminal).'),('Metadata management','Update credential metadata.'),('and secret access','Use vaults for API keys and tokens')],
 '11-1': [('Memory stores provide','memory that persists across sessions.'),('The slide separates the store','Memory Stores'),('individual memories',at('Memories',850,135)),('and versions','Memory Versions')],
 '11-8': [('Follow the example through','Create a nenory store'),('memory creation','Create a nenory inside the Store'),('and version listing',at('List versions',1060,925)),('Each stage uses identifiers',at('store_id: store.id',550,975)),('and its history',at('nemory_id: nenory.id',1065,970))],
 '12-1': [('The final infographic','Deployments, Files, Skills'),('scheduled execution',at('Deployments',115,150)),('supporting APIs','Adjacent stable APIS'),('and the status guide','Status guide'),('Use it to connect','Production advice')]
})
SPLITS['12-2']=[(marker,at('Key methods',40,495) if selection=='Key methods' else selection) for marker,selection in SPLITS['12-2']]

def norm(text):return re.sub(r'[^a-z0-9]','',text.lower())

def locate(slide,selection):
 if isinstance(selection,tuple):query,px,py=selection
 else:query=selection;px=py=None
 needle=norm(query);candidates=[]
 for line in OCR[slide-1]['lines']:
  words=line['words']
  for first in range(len(words)):
   for last in range(first+1,len(words)+1):
    selected=words[first:last];text=' '.join(w['text'] for w in selected)
    if needle not in norm(text):continue
    x=min(w['rect'][0] for w in selected);y=min(w['rect'][1] for w in selected)
    right=max(w['rect'][0]+w['rect'][2] for w in selected);bottom=max(w['rect'][1]+w['rect'][3] for w in selected)
    distance=((x-px)**2+(y-py)**2) if px is not None else 0
    candidates.append(((len(norm(text))-len(needle),distance,y),[x,y,right-x,bottom-y],text))
 assert candidates,('Missing measured phrase',slide,selection)
 _,rect,visible=min(candidates,key=lambda v:v[0])
 return rect,visible

def split_text(text,entries):
 starts=[]
 for marker,selection in entries:
  index=text.find(marker)
  assert index>=0,(marker,text)
  starts.append((index,selection))
 assert starts[0][0]==0 and all(b[0]>a[0] for a,b in zip(starts,starts[1:])),(text,starts)
 return [(text[start:(starts[k+1][0] if k+1<len(starts) else len(text))].strip(),selection) for k,(start,selection) in enumerate(starts)]

def main():
 backup=OUT/'before-highlight-revision';backup.mkdir(exist_ok=True)
 for name in ['narration-plan.json','recording-manifest.json','timeline.json','validation.json','Claude-Managed-Agents-v1.3.0.mp4']:
  if not (backup/name).exists():shutil.copy2(OUT/name,backup/name)
 plan=json.loads((backup/'narration-plan.json').read_text());manifest=json.loads((backup/'recording-manifest.json').read_text());audit=[]
 spec=importlib.util.spec_from_file_location('recorder',ROOT/'scripts/record-presentation-video.py');recorder=importlib.util.module_from_spec(spec);spec.loader.exec_module(recorder)
 for row,record in zip(plan['slides'],manifest['recordings']):
  n=row['slide'];segments=[]
  assert len(row['segments'])==len(M[n])
  for old,selections in zip(row['segments'],M[n]):
   if old['id'] in SPLITS:parts=split_text(old['text'],SPLITS[old['id']])
   else:
    sentences=re.split(r'(?<=[.!?])\s+',old['text']);assert len(sentences)==len(selections),(old['id'],sentences,selections)
    parts=list(zip(sentences,selections))
   for text,selection in parts:
    queries=selection if isinstance(selection,list) else [selection];found=[locate(n,q) for q in queries]
    segment={'id':f'{n}-{len(segments)+1}','text':text,'target':{'textRects':[r for r,_ in found]}}
    segments.append(segment);audit.append({'slide':n,'cue':segment['id'],'narration':text,'visibleText':[v for _,v in found],'selectedPhrases':queries})
  assert ' '.join(s['text'] for s in segments)==' '.join(s['text'] for s in row['segments']),('Narration changed',n)
  metadata=json.loads((ROOT/record['audio']).with_suffix('.json').read_text())
  record['cues']=recorder.align(segments,metadata['timestampInfo']);row['segments']=segments
  assert hashlib.sha256((ROOT/record['audio']).read_bytes()).hexdigest()==record['sha256']
  print(f'Slide {n:02}: {len(segments)} exact-word visual cues.',flush=True)
 plan['highlightRevision']='phrase-level-2';plan['highlightAudit']='highlight-semantic-audit.json'
 plan['outputFile']='Claude-Managed-Agents-v1.3.0-highlights-v2.mp4'
 plan['retainedAudioSource']=(backup/'Claude-Managed-Agents-v1.3.0.mp4').relative_to(ROOT).as_posix()
 (OUT/'narration-plan.json').write_text(json.dumps(plan,indent=2));(OUT/'recording-manifest.json').write_text(json.dumps(manifest,indent=2))
 (OUT/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2))

if __name__=='__main__':main()
