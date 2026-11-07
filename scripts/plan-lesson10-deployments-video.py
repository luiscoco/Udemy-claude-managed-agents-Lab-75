"""Lesson 10: fitted paragraph narration with current API clarifications."""
from pathlib import Path
import hashlib,importlib.util,json
import cv2
from measured_video_text import MeasuredVideoText,at
from plan_lab_settings import SETTINGS

ROOT=Path(__file__).resolve().parents[1];NAME='lesson10-deployments-files-skills-status';FOLDER=ROOT/'presentations'/NAME
OCR=json.loads((FOLDER/'.build/video/slides/ocr.json').read_text(encoding='utf-8-sig'));MEASURED=MeasuredVideoText(OCR)
spec=importlib.util.spec_from_file_location('paragraphs',ROOT/'scripts/refine-lesson-paragraph-highlights.py');PARAGRAPHS=importlib.util.module_from_spec(spec);spec.loader.exec_module(PARAGRAPHS)
ROWS=[];AUDIT=[]
REFERENCES=[
 {'title':'Deployment creation','url':'https://platform.claude.com/docs/en/api/typescript/beta/deployments/create','note':'The current request uses agent, environment_id, initial_events, and name. An optional schedule contains type: cron, expression, and timezone. The slides\' agent_id and schedule.cron fields are conceptual rather than current copy-ready requests.'},
 {'title':'Scheduled runs and lifecycle','url':'https://platform.claude.com/docs/en/managed-agents/scheduled-deployments','note':'Track deployment run records separately from session events. Pause suppresses scheduled triggers but does not stop existing sessions; manual runs remain possible. Archive is terminal. Inspect session outputs through the relevant session or artifact API, not the Skills API.'},
 {'title':'File uploads','url':'https://platform.claude.com/docs/en/api/typescript/files/upload','note':'The stable namespace is client.files. Upload takes file, such as a read stream, rather than path and purpose: assistants. Current metadata uses mime_type.'},
 {'title':'File availability and download','url':'https://platform.claude.com/docs/en/build-with-claude/files','note':'Respect file expiration and downloadable metadata. User-uploaded inputs are not generally downloadable through the content endpoint; supported generated outputs are. Uploading a file does not automatically attach it to every agent.'},
 {'title':'Skill creation','url':'https://platform.claude.com/docs/en/api/typescript/skills/create','note':'The stable namespace is client.skills. Create uploads files from a common top-level directory with SKILL.md, plus optional display_name. The displayed type: agent, tools, prompts, and file_ids object is not the current skill-create schema.'},
 {'title':'Skill versions','url':'https://platform.claude.com/docs/en/api/typescript/skills/versions/create','note':'Create a version through skills.versions with the parent skill ID and uploaded bundle files. A version: v2 field alone does not upload a revised skill.'},
 {'title':'Attach skills to Managed Agents','url':'https://platform.claude.com/docs/en/managed-agents/skills','note':'Use the agent skills array with type, skill_id, and optional version. Files are mounted with resources on sessions or deployments. The final slide\'s flat file_ids and skill_ids agent fields should not be copied as the current request.'},
]

def slide(n,*parts):
 image=cv2.imread(str(FOLDER/f'.build/video/slides/slide-{n:02}.png'));lines=PARAGRAPHS.lines_for(OCR[n-1],image);segments=[];proofs=[]
 for index,(selection,text) in enumerate(parts,1):
  measured,_=MEASURED.target(n,selection);target,visible=PARAGRAPHS.expand(measured,lines);cue=f'{n}-{index}'
  passages={(6,20):(78,807,724,881),(6,21):(78,899,791,1063),(7,9):(216,589,631,677),(7,13):(1018,579,1431,790),(7,18):(215,925,637,1042)}
  if (n,index) in passages:
   left,top,right,bottom=passages[n,index]
   selected=[line for line in lines if left<=line['rect'][0]<right and top<=line['rect'][1]<bottom]
   assert selected
   target={'textRects':[[left,top,right-left,bottom-top]],'paragraphGroups':[[0]]};visible=[' '.join(line['text'] for line in selected)]
  if segments and segments[-1]['target']==target:
   segments[-1]['text']+=' '+text;proofs[-1]['narration']=segments[-1]['text'];proofs[-1]['selectedPhrases'].append(selection)
  else:
   segments.append({'id':cue,'text':text,'target':target});proofs.append({'slide':n,'cue':cue,'narration':text,'visibleText':visible,'selectedPhrases':[selection],'selectionPolicy':'Complete local paragraph or bounded visible code passage'})
 ROWS.append({'slide':n,'segments':segments});AUDIT.extend(proofs)

slide(1,
 (['Claude Managed','Agents','Deployments, Files,','Skills and Status Guid'],'Welcome to Lesson ten: Claude Managed Agents Deployments, Files, Skills and Status Guide.'),
 ('Luis Coco Enr','This presentation by Luis Coco Enriquez brings together scheduled execution, reusable assets, and production architecture.'),
 (at('Deploy agents',145,737),'We will begin with deployment configuration and recurring agent runs.'),
 (at('Work with files',475,736),'Then we will examine file uploads and the distinction between storing an asset and making it available at runtime.'),
 ('Use skills and','Skills package reusable instructions and supporting resources. The status guide in this deck concerns API maturity, which is different from a running session\'s lifecycle status.'),
 ('Discover how to deploy','Several illustrated request fields differ from the current API. The narration will explain those differences while keeping the supplied visuals, and the player includes reference links.'))

slide(2,
 ('What are deployments?','A deployment combines the configuration needed to start an agent for a repeatable task.'),
 ('Deployments let you run','The scheduled case shown here starts sessions automatically on a recurring timetable.'),
 ('How deployments work','Follow the flow from configuration to scheduled execution and recorded results.'),
 ('Define a schedule and settings','First, define the task and its execution configuration.'),
 ('specified schedule','The scheduler evaluates the configured recurring schedule.'),
 ('Each scheduled run automatically','A successful trigger creates a session to perform the task.'),
 ('The agent runs using the configured','That session runs with the supported resources, tools, and other configuration supplied to it.'),
 ('Session data, outputs, and metadata','Inspect the run and session afterward to understand what actually happened.'),
 ('Key deployment methods','The method list separates configuration management from lifecycle and execution operations.'),
 ('Create a scheduled deployment.','Create establishes the deployment record.'),
 ('Get deptoyment details.','Retrieve inspects a known deployment.'),
 ('Update schedule, agent, or settings.','Update changes supported configuration for later runs.'),
 ('List deployments','List discovers deployments in the collection.'),
 ('Pause a scheduled deployment','Pause suppresses future scheduled triggers; it does not stop sessions already running. Manual runs remain possible while paused.'),
 ('Resume a paused deployment.','Unpause resumes future scheduled occurrences. It does not backfill missed triggers.'),
 ('Archive a deployment','Archive is a terminal lifecycle operation, rather than another pause setting.'),
 ('Trigger an immediate run outside','Run triggers an immediate attempt outside the recurring schedule.'),
 ('Schedule and configuration','The deployment must identify the agent and environment and supply the initial task events.'),
 ('Exampte schedule formats','Cron describes a recurrence, such as a daily report, a regular refresh, or a weekly task.'),
 ('TypeScript example','The displayed creation example illustrates intent, but its request shape needs updating for the current SDK.'),
 ('agent_id:','Use the current agent field, rather than agent underscore I D, and supply the required initial events describing the task.'),
 (at('schedule:',1058,742),'The current schedule object uses type cron, expression, and timezone, rather than a field named cron inside the schedule.'),
 ('Ofwcommon','The smaller examples illustrate retrieving a configuration, pausing its schedule, and triggering a manual run.'),
 ('Deployment lifecycle','Keep the deployment lifecycle separate from the lifecycle of each session it starts.'),
 ('ley t','A deployment configures repeatable execution. A run records an attempt, and a successful attempt leads to a session whose events show the actual work.'))

slide(3,
 ('What are adjacent stable APIs?','Files and skills support agent workflows, but they represent different kinds of reusable assets.'),
 ('client. beta. files','The current stable file surface is client dot files. The beta namespace shown in the slides is not the clearest way to demonstrate the stable API.'),
 ('client. beta. skills','The current stable skill surface is client dot skills. Keep the namespace and the selected SDK version consistent when adapting these examples.'),
 ('Manage files for agents','Files supply documents or data that a workflow can reference.'),
 ('Manage reusable skills','Skills supply reusable instructions and supporting files for a capability.'),
 ('Upload a file from local disk or bytes.','Upload transfers a supported file payload and returns its identifier.'),
 ('Get file metadata','Metadata inspection tells you about the stored object without running an analysis of its content.'),
 ('Download file content.','Download availability is conditional. Uploaded inputs are not generally downloadable through the content endpoint; supported generated output files can be. Check the downloadable field.'),
 ('Delete a file.','Delete removes the stored file when it is no longer needed.'),
 ('Files API examples','The upload and collection examples need schema corrections before you copy them into an application.'),
 ('purpose: "assistants"','The current upload request takes a file value, for example a file read stream. The displayed path and purpose assistants pair is not the current upload schema.'),
 ('file. content_type','Current file metadata names the MIME type field mime underscore type. Do not assume the displayed content-type property exists in the current response.'),
 ('When to use files vs. skills','Choose files for task inputs and skills for a reusable procedure or specialized guidance.'),
 ('Use Files When you need to:','A file might be a document, image, or dataset needed for a particular analysis.'),
 ('Use Skills when you need to:','A skill might describe a repeatable analysis or reporting workflow, with supporting scripts and references.'),
 ('Skills API examples','The skill creation object also illustrates a concept rather than the current API contract.'),
 ('name: "web-researcher"','Current skill creation uploads a bundle containing a root skill dot m d file. It does not use the displayed top-level type agent, tools, and prompt configuration.'),
 ('Create and list skill versions','Manage revisions under skills dot versions. Creating a version uploads revised bundle files under the parent skill ID; setting a version label alone does not upload new instructions.'),
 ('Best practices','Use meaningful organization and review a revised skill before making it broadly available.'),
 ('Clean up unused files','Maintain the asset lifecycle rather than accumulating unused files and skill revisions indefinitely.'),
 ('Key takeaways','Files are task assets; skills are reusable expertise. Both need explicit use in the supported runtime configuration, and both have their own management APIs.'))

slide(4,
 ('Why a status guide matters','This status guide discusses API maturity and compatibility. It is not a list of session states such as running, idle, or interrupted.'),
 ('Different namespaces and notes','Maturity affects the amount of compatibility testing and change tracking an integration needs.'),
 ('Core managed-agents','The deck groups core Managed Agents features under beta.'),
 ('Actively developed and improved','Beta behavior and request shapes can evolve, so test against the SDK and API version actually used by your application.'),
 ('Building with core managed-agents features','Choose these features when they provide the required agent functionality, with an appropriate validation and rollout process.'),
 ('Read changelogs and test regularly','Read release notes and exercise the paths your application depends on.'),
 ('Stable adjacent','The adjacent category describes files and skills as separate supporting APIs.'),
 ('Generally available and stable','A stable API still needs correct request fields and response handling. Stability does not make every code sample interchangeable across versions.'),
 ('client. beta. files','Prefer the documented stable namespaces client dot files and client dot skills when demonstrating these stable surfaces.'),
 ('Experimental notes','Treat the experimental category as a reason to check a feature\'s specific documentation, rather than a permanent label for every advanced integration.'),
 ('Self-hosted workers, advanced tool','The slide groups several advanced patterns together. Their actual support status depends on the particular feature and version, so do not infer a blanket production restriction from this list alone.'),
 ('APIS may change or be removed','For a feature documented as experimental, isolate the dependency and verify the behavior before wider rollout.'),
 ('Legacy guidance','Legacy compatibility is about intentionally retaining an older contract.'),
 ('Older optional beta headers','Do not add historical beta headers automatically. They may select older response shapes; check the current migration guidance for the surface you use.'),
 ('How to decide','Use the comparison table to ask what the feature is for and what compatibility assumptions it carries.'),
 ('Production advice','The practical advice is to reduce avoidable surprises through explicit versions, controlled experiments, and response validation.'),
 ('Prefer stable surfaces when possible.','Use an established surface when it meets the requirement.'),
 ('Isolateexperiments','Keep experiments sufficiently isolated to review their results before promoting them.'),
 ('Test response shapes.','Test the actual fields and outcomes consumed by your application.'),
 ('Avoid legacy headers untess required.','Keep compatibility work deliberate, and avoid mixing old examples with new schemas without checking the differences.'),
 ('Key takeaway','Select a feature based on its documented behavior and suitability. API maturity, deployment status, and session execution status answer different questions.'))

slide(5,
 ('Control plane resources','The production architecture separates persistent configuration from live execution.'),
 ('Agents and environments','Agent and environment resources belong to the configuration side of that distinction.'),
 ('Define the agent\'s identity,','The agent defines its behavior, instructions, and available tools.'),
 ('Use environments to control runtime','The environment supplies the runtime configuration and isolation required by the workload.'),
 ('Treat these as configuration resources','Manage configuration changes deliberately so that execution can be reproduced and reviewed.'),
 ('Runtime data plane','Sessions and events describe what happens during execution.'),
 ('Sessions represent live','A session represents the live execution and conversation.'),
 ('Events capture streaming','Events expose outputs, tool activity, state changes, and results.'),
 ('Use them for real-time UX,','That event stream supports the user interface, observation, and debugging.'),
 ('Supporting capabilities','Vaults, memory, and mounted resources support the runtime without replacing its event history.'),
 ('Store secrets and','Vaults hold configured credentials.'),
 ('Persist non-sensitive','Memory stores hold appropriate durable context and preferences.'),
 ('Attach documents,','Resources make selected documents, repositories, and other assets available for the task.'),
 ('How the pieces fit together','Read the architecture from configuration to execution, with supporting services connected to the runtime.'),
 ('Produces results','The intended output is an answer, an action, an artifact, or another useful task result.'),
 ('Recommended production workflow','The workflow begins with a controlled configuration and ends with observation and improvement.'),
 ('Define the agent and environment.','First, define behavior and the environment that will run it.'),
 ('Attach required tools, vault access, and resources.','Second, grant the required access and provide relevant resources.'),
 ('Start or schedule runs','Third, start the work through a session or configure a deployment to do it repeatedly.'),
 ('Monitor events and outcomes.','Fourth, inspect events and outcomes rather than assuming creation of a deployment means the task succeeded.'),
 ('Persist useful knowledge and iterate safety.','Finally, maintain useful non-sensitive knowledge, version changes, and test the next configuration.'),
 ('Common mistakes to avoid','The mistakes panel highlights leaked secrets, mixed responsibilities, and missing observation.'),
 ('Treating sessions as permanent configuration storage.','Do not use a session as the sole definition of the application\'s long-term configuration.'),
 ('Ignoring event streams','Without the event history, a user interface or operator loses important evidence about execution.'),
 ('Over-coupling one agent','Keep responsibilities focused enough to reason about behavior and changes.'),
 ('Key takeaway','Configuration defines the system, sessions perform the work, events show what happened, and supporting resources supply the context and access required.'))

slide(6,
 ('What this example does','This example configures recurring execution for a reporting agent.'),
 ('Creates a scheduled deployment','The deployment saves the configuration used to start a new session for a scheduled task.'),
 ('Prerequisites','Prepare the SDK, authentication, and the existing agent and environment that the deployment will use.'),
 ('Existing agent_id','The selected agent must already exist. In the current create request, the field is named agent, and it can identify an agent version.'),
 ('Understand cron schedule','Choose the recurrence based on the intended reporting schedule.'),
 ('Input fields explained','The table explains the conceptual inputs, but some names differ from the current request schema.'),
 ('schedule. cron','Replace schedule dot cron with a schedule object containing type cron and expression.'),
 ('schedule. timezone','Timezone determines how the recurrence is interpreted. UTC avoids changes associated with local daylight-saving offsets.'),
 ('How the deployment works','The workflow moves from configuration through a scheduled trigger to a session and its results.'),
 ('Define configuration','Define the agent, environment, task instructions, and any supported resources.'),
 ('Schedule the run','Save the recurring schedule in the deployment.'),
 ('Deployment starts agent','When a trigger occurs, the platform attempts to start the configured work.'),
 ('New session is created','A successful attempt produces a session; the deployment run record links the attempt to that session.'),
 ('Retrieve results later','This result-retrieval description needs clarification. Inspect deployment run records and session events for execution results. The Skills API manages skill definitions, not the reporting session\'s answer.'),
 ('Cron schedule quick guide','A standard five-field cron expression describes minute, hour, day of month, month, and day of week.'),
 ('Every day at 09:00 UTC','The daily example expresses a morning run in UTC.'),
 ('Every hour at minute 00','The hourly example selects minute zero of each hour.'),
 ('Every Monday at 09.00 UTC','The weekly example restricts the run to Monday morning.'),
 ('Complete TypeScript example','Follow the code in three parts: create the client, create the deployment, and inspect the returned identifier.'),
 ('import Anthropic','The SDK import and client initialization establish authenticated access to the API.'),
 ('const deployment','The current deployment request also requires initial events, which provide the work to perform. That required task payload is missing from the displayed creation snippet.'),
 ('Step-by-step code explanation','Treat the steps as a guide to the dependencies between those operations, then use the linked current schema when implementing them.'),
 ('Invect the result','The returned deployment ID identifies the saved configuration; it is not evidence that a scheduled session has already completed.'),
 ('Key takeaways','Create the configuration, verify the schedule, and inspect a run and its session to confirm the actual outcome. The video explains the example without executing or scheduling a live agent.'))

slide(7,
 ('What are files and skills?','The final example connects reusable assets to runtime use.'),
 ('Files (client.beta. files)','Files supply documents, images, or data needed by the task.'),
 ('Skills (client.tpta.skills)','Skills package reusable expertise, with instructions and supporting resources.'),
 ('When to use each','Choose a file when the task needs particular content, and a skill when it needs a reusable procedure.'),
 ('High-level flow','Both flows include creation and later use. Storing the asset alone does not attach it to every agent.'),
 ('File flow','For a file, prepare the content, upload it, and reference the returned identifier through the supported request.'),
 ('Skill flow','For a custom skill, author a bundle, upload it to the Skills API, and attach the intended skill version.'),
 ('Example I','The upload example illustrates a local research report.'),
 (at('// Upload a file',221,593),'Use client dot files dot upload with a file object or stream. The path field in this snippet is not the current request shape.'),
 ('purpose: "assistants"','The current upload schema also does not use purpose assistants. Adapt this example to the actual file-upload parameters.'),
 ('content_type:','Read the current MIME-type metadata field rather than assuming the displayed content-type field exists.'),
 ('Example 2','The custom skill example illustrates web research guidance.'),
 (at('// Create a skill',1023,583),'Current skill creation uploads files containing a root skill dot m d file. The API does not interpret this illustrated tools-and-prompts object as a skill bundle.'),
 (at('tools:',1041,661),'A skill\'s instructions can describe how to use available tools, but creating a skill does not by itself grant those tool permissions.'),
 (at('file_ids:',1041,693),'Supporting files belong in the appropriate bundle or runtime resources. Do not assume this flat field is accepted by the skill creation endpoint.'),
 ('Example response (truncated)','The response is an illustrative record, rather than a live execution result or proof that the skill is already attached.'),
 ('Use the uploaded file or skill with an agent','The last code block needs the same distinction between asset management and attachment.'),
 ('// Exunple: include a file','For Managed Agents, mount files through session or deployment resources. Attach skills through the agent skills array, using the documented type, skill ID, and optional version, rather than copying the flat file and skill ID arrays shown here.'),
 ('Next steps and best practices','Maintain the assets after creation: use clear organization, review access, and update the content as the workflow changes.'),
 ('Use consistent naming','Names and descriptions should make the purpose clear to the next person maintaining the integration.'),
 ('Version your skills','Create and test a new bundle revision when the reusable instructions change.'),
 ('Keep content up to date','Replace outdated inputs and update the selected skill version deliberately.'),
 ('Key points','The lesson\'s main distinction is now complete: deployments configure repeatable execution, files provide task content, skills provide reusable expertise, and events reveal the outcome. Use the linked reference notes when turning these conceptual examples into working requests.'))

def main():
 out=ROOT/'videos'/NAME;out.mkdir(parents=True,exist_ok=True);deck=next((FOLDER/'output').glob('*.pptx'))
 assert len(ROWS)==7 and all(sum(len(s['text'])+1 for s in row['segments'])<4300 for row in ROWS)
 plan={'project':NAME,'title':'Lesson 10 · Deployments, Files, Skills and Status Guide','displayTitle':'Lesson 10 - Deployments, Files, Skills and Status Guide','mediaPrefix':'Lesson10-Deployments-Files-Skills-and-Status-Guide','presentation':deck.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(deck.read_bytes()).hexdigest(),'outputFile':'Lesson10-Deployments-Files-Skills-and-Status-Guide.mp4','settings':SETTINGS,'resolution':[1920,1080],'fps':30,'transition':{'type':'perspective rotating cube','seconds':.8},'highlightAudit':'highlight-semantic-audit.json','verifyPhraseBoundaries':True,'highlightStyle':'Complete paragraphs and bounded code passages','referenceNotes':REFERENCES,'slides':ROWS}
 (out/'narration-plan.json').write_text(json.dumps(plan,indent=2));(out/'highlight-semantic-audit.json').write_text(json.dumps(AUDIT,indent=2));(out/'api-reference-notes.json').write_text(json.dumps(REFERENCES,indent=2))
 print(f'Planned {len(ROWS)} slides, {len(AUDIT)} paragraph cues, {sum(len(s["text"].split()) for row in ROWS for s in row["segments"])} narration words.',flush=True)

if __name__=='__main__':main()
