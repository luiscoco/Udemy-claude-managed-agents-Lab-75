"""Narrated Session Resources deck with paragraph and code-panel highlights."""
from pathlib import Path
import hashlib,importlib.util,json
import cv2
from measured_video_text import MeasuredVideoText,at
from plan_lab_settings import SETTINGS

ROOT=Path(__file__).resolve().parents[1];NAME='lesson07-session-resources';FOLDER=ROOT/'presentations'/NAME
OCR=json.loads((FOLDER/'.build/video/slides/ocr.json').read_text(encoding='utf-8-sig'));MEASURED=MeasuredVideoText(OCR)
spec=importlib.util.spec_from_file_location('paragraphs',ROOT/'scripts/refine-lesson-paragraph-highlights.py');PARAGRAPHS=importlib.util.module_from_spec(spec);spec.loader.exec_module(PARAGRAPHS)
ROWS=[];AUDIT=[]

def slide(n,*parts):
 image=cv2.imread(str(FOLDER/f'.build/video/slides/slide-{n:02}.png'));lines=PARAGRAPHS.lines_for(OCR[n-1],image);segments=[];proofs=[]
 for index,(selection,text) in enumerate(parts,1):
  measured,_=MEASURED.target(n,selection);target,visible=PARAGRAPHS.expand(measured,lines);cue=f'{n}-{index}'
  if n==7:
   # Recover complete visible code rows where OCR splits fields or method calls.
   # Panel bounds prevent the outline from including a neighboring explanation.
   for i,rect in enumerate(target['textRects']):
    best=max(lines,key=lambda line:PARAGRAPHS.intersection(rect,line['rect']))
    if not best['code']:continue
    x,y,w,h=rect
    for left,top,right,bottom in [(1085,215,1580,476),(35,645,468,942)]:
     if left<=x<right and top<=y and y+h<=bottom:
      safe_right=min(right,400) if left==35 and y<690 else right
      target['textRects'][i]=[left,y,safe_right-left,h];break
  if segments and segments[-1]['target']==target:
   segments[-1]['text']+=' '+text;proofs[-1]['narration']=segments[-1]['text'];proofs[-1]['selectedPhrases'].append(selection)
  else:
   segments.append({'id':cue,'text':text,'target':target});proofs.append({'slide':n,'cue':cue,'narration':text,'visibleText':visible,'selectedPhrases':[selection],'selectionPolicy':'Complete local paragraph or bounded visible code row'})
 ROWS.append({'slide':n,'segments':segments});AUDIT.extend(proofs)

slide(1,
 (['Claude Managed','Agents','Session Resources'],'Welcome to Lesson seven: Claude Managed Agents Session Resources.'),
 ('Luis Coco Enr','This presentation by Luis Coco Enriquez explains how a session gains access to files and other supporting content.'),
 ('Learn how to use session resources','We will connect external content to the particular session where the agent needs it.'),
 ('Provide','First, we will examine the supported resource types and their purpose.'),
 ('Configure','Next, we will follow attachment and management operations.'),
 ('Use resources','Finally, we will trace a file from upload to session attachment, then examine how that attachment is inspected or removed.'),
 ('Discover how to attach, configure and use','Keep three identifiers separate throughout the walkthrough: the session, the uploaded file, and the attachment that connects the resource to the session.'))

slide(2,
 ('What are Session Resources?','Session resources connect supporting content to a particular agent session.'),
 ('Session Resources are attachments connected to','The presentation describes them as attachments the agent can use while working in that session.'),
 ('They are not pasted directly','This model keeps resource access separate from placing the entire content directly into a message.'),
 ('Connect files, repositories, and memory stores','The supported examples are files, repositories, and memory stores.'),
 ('Give the agent access to information','Those attachments make relevant information available during the interaction.'),
 ('Keep large or reusable context outside','Large or reusable materials can remain organized as resources rather than repeated message text.'),
 ('Why they exist','The purpose panel connects that separation to practical application needs.'),
 ('Reduce prompt bloat','One benefit is avoiding large documents, logs, or code pasted into every prompt.'),
 ('Improve organization','Another is keeping supporting content separate from conversation messages.'),
 ('Reuse context','A resource can remain relevant across several turns of the same workflow.'),
 ('Enable richer work','The agent can work with the supporting information made available through those attachments.'),
 ('What an agent can access','The architecture diagram shows three content sources connected to the session.'),
 ('Uploaded content','A file supplies uploaded content such as a document or data file.'),
 ('Source code and','A repository supplies the source files and project content described by that attachment.'),
 ('Saved knowledge','A memory store supplies saved knowledge or historical context.'),
 ('How to think about them','The working model begins with the session itself.'),
 ('The session is the working container','The session provides the context for the agent\'s work.'),
 ('Resources are attached to that session','Resources are linked to that container.'),
 ('The agent can consult attached resources','The agent can consult the attached content as appropriate for the task and its supported capabilities.'),
 ('The prompt stays lighter','The prompt can focus on the task while the resource supplies its supporting material.'),
 ('When to use Session Resources','The use cases show where this arrangement is useful.'),
 ('Document analysis','Document analysis can use specifications, requirements, or reference material.'),
 ('Code assistance','Code assistance can use repository content for navigation and investigation.'),
 ('Long-running workflows','Ongoing workflows can reuse relevant supporting materials across turns.'),
 ('Memory-backed tasks','Memory backed tasks can consult saved context from prior work.'),
 ('Key idea to remember','The key boundary is session scope: the attachment belongs to a specific session and provides access to its linked content.'))

slide(3,
 ('What are core methods?','The core methods manage resources attached to a session.'),
 ('Use the core methods to attach','The presentation groups them into attachment, inspection, modification, discovery, and removal.'),
 ('Attach a resource to a session','Add creates the attachment between the selected resource and the session.'),
 ('Attaches a file, GitHub repository, or memory','Its configuration identifies the supported resource kind and the content being attached.'),
 (at('type: "file"',685,310),'The file example selects the file resource type.'),
 (at('file_id:',685,330),'Its file identifier references content that has already been uploaded.'),
 (at('The session ID to attach',1100,555),'The session identifier selects where the attachment belongs.'),
 ('Resource configuration.','The configuration supplies the fields appropriate to that resource type.'),
 ('Get resource details','Retrieve inspects an existing attachment by its resource identifier.'),
 ('Retrieves detailed information','The result describes the selected resource and its stored configuration.'),
 (at('The session ID that Owns the resource',1390,440),'The parent session value scopes that request to the correct session.'),
 ('Update a resource','Update changes supported configuration on an attachment that already exists.'),
 ('Updates the configuration of an attached resource','Use this operation when configuration or metadata needs to change.'),
 ('Project Documentation','The illustrated update gives the attachment a descriptive name.'),
 ('purpose:','Its metadata associates the resource with an application purpose.'),
 ('List resources','List discovers the resources attached to a session.'),
 ('Lists all resources attached to a session','The presentation describes optional filtering and pagination for that collection.'),
 (at('type: "file"',1000,790),'A type filter can narrow the collection to files in the example.'),
 ('limit: 20','A limit bounds the requested results.'),
 ('cursor: "next_cursor"','A cursor supplies a pagination position for a supported follow up request.'),
 ('Removes a resource from a session','Delete removes the session attachment.'),
 ('The ID of the resource to remove','The resource identifier chooses the attachment being removed.'),
 ('Resources are delete-only. There is no archive() method','The lifecycle note distinguishes removal from archival.'),
 ('immediately revokes the agent','The presentation describes deletion as revoking access through that attachment. Keep the attachment identifier distinct from the identifier of the underlying uploaded file.'))

slide(4,
 ('Overview','The supported types connect different kinds of external content to the session.'),
 ('Session Resources support three types','This deck describes files, GitHub repositories, and memory stores.'),
 ('All resources are attached to a session using','The same resource attachment operation is used for those types.'),
 ('Supported resource types at a glance','The type determines which identifying fields the configuration needs.'),
 ('Attach a file that was previously','For a file, upload the content first through the Files API.'),
 ('The agent can read and use the','The attachment then makes that file available within the session.'),
 ('Documentation (PDF, Markdown','Documents and reference materials are common examples.'),
 ('Data files (CSV, JSON, logs)','Structured data and logs are other useful file inputs.'),
 ('Mount a GitHub repository so the','A repository attachment provides access to project source content in the model illustrated by this deck.'),
 ('Code review and analysis','That supports code investigation and review tasks.'),
 ('Answering questions about','It can also support questions about the project\'s organization and behavior.'),
 ('Attach a memory store to give','A memory store attachment connects saved knowledge to the session.'),
 ('Reusing knowledge across','The intended benefit is continuity across related work.'),
 ('Resource type details','The details panel separates the type value from the resource specific field.'),
 ('Attach an uploaded file','A file attachment references the uploaded file identifier.'),
 ('Mount a GitHub repository','A repository attachment identifies the repository.'),
 ('Attach a memory store.','A memory attachment identifies the existing memory store.'),
 ('Examples','The examples show the same add operation with different resource configurations.'),
 (at('file_id: "file_def456"',120,770),'The file request links the uploaded file identifier to the session.'),
 ('repository: "anthropic/claude-examples"','The repository request supplies the project reference shown here.'),
 ('memory_store: "mem_abc123"','The memory request supplies the selected store identifier.'),
 ('Common workflows','The workflow diagrams emphasize preparing the resource before attaching it.'),
 ('Use existing','A memory workflow starts from an existing store; a file workflow starts from an uploaded file.'),
 ('Use the same add() method','The attachment method is shared, while the supported type and identifying fields vary.'),
 ('Permissions and access','Resource access also depends on the permissions and scope associated with the attached content.'),
 ('Resources are delete-only','The closing lifecycle note repeats that the illustrated resource interface uses deletion rather than archival to remove an attachment.'))

slide(5,
 ('Prepare your session and client','The typical workflow begins with an initialized client and a valid existing session.'),
 ('All resource operations require a session_id','That session identity provides the context for resource operations.'),
 ('Prerequisite','Preserve the identifier returned by the session creation workflow.'),
 ('Upload a file (optional)','If the resource is a local file, upload it before attempting to attach it.'),
 ('The upload retruns a file_id','The upload returns the file identifier used by the attachment request.'),
 ('file: fs. createReadStream','The example reads a local specification file as its upload input.'),
 ('const fileld = file. id','Keep the returned identifier for the next step.'),
 ('Attach the resource to the session','Add then connects the prepared resource to the selected session.'),
 ('const resource = await client.beta.sessions.resources.add','The attachment request is separate from the upload request.'),
 ('file_id: fileld','Its file identifier links the uploaded content to that session.'),
 ('You can also attach GitHub repositories','Other supported resource types follow the same attachment concept with their own configuration.'),
 ('List attached resources (optional)','After attachment, listing can show the resources available in the session.'),
 ('You can filter and paginate','Filtering and pagination help manage a larger collection.'),
 ('Common parameters','The common parameters panel describes a limit, ordering, type filtering, and a cursor.'),
 ('Retrieve a specific resource (optional)','Retrieve inspects one known attachment.'),
 ('const resourceld = "res_abc123"','This resource identifier addresses the attachment, rather than the uploaded file itself.'),
 ('{ session_id: sessionld }','The parent session value supplies the scope for that request.'),
 ('Response includes','The illustrated response contains configuration, metadata, status, and timestamps.'),
 ('Update or remove a resource (optional)','Later operations either adjust supported configuration or remove the attachment.'),
 ('Updated documentation','The update example changes its descriptive configuration.'),
 ('Resources are delete-only (no archive)','The removal example follows the delete only lifecycle described in the deck.'),
 ('End-to-end flow','The lower diagram summarizes the order: upload, attach, inspect as needed, then update or remove.'),
 ('Common pitfalls','The pitfalls panel highlights relationships that are easy to confuse.'),
 ('Using an invalid or expired session_id','A resource operation needs the correct valid session context.'),
 ('Trying to attach a file without first uploading','A file attachment needs an identifier from a completed upload.'),
 ('Forgetting to pass session_id','Known resource identifiers still need their parent session scope for the relevant operations.'),
 ('Not handling pagination','A collection view must account for additional result pages when present.'),
 ('Key points','The workflow is easier to follow when the uploaded content, session, and session attachment remain distinct in the application.'))

slide(6,
 ('What lifecycle means','The lifecycle applies to the attachment connecting external content to the session.'),
 ('Session resources are attachments','The presentation describes a simple path from attachment through use and optional management to removal.'),
 ('The resource exists to grant','The attachment\'s purpose is to make the linked content available during the session.'),
 ('Typical lifecycle flow','Follow the lifecycle diagram from left to right.'),
 ('Attach a resource','Begin by attaching the prepared resource to the session.'),
 ('The agent can access','The agent can then use that resource within the session\'s supported access model.'),
 ('Inspect resource','Inspection or configuration updates can occur while the attachment exists.'),
 ('Remove the resource','Removal deletes the attachment from the session.'),
 ('The agent loses','The slide describes access through that attachment as being revoked immediately.'),
 ('Important lifecycle rules','The rules distinguish this lifecycle from namespaces that support archival.'),
 ('Resources are delete-only.','The resource attachment is delete only in the API model shown here.'),
 ('Resources cannot be archived.','There is no archive operation for the attachment in this workflow.'),
 ('There is no separate deactivate','The deck also does not introduce a separate deactivate or close state.'),
 ('Every retrieve, update, and delete','Inspection, modification, and removal retain their parent session context.'),
 ('Common operations during the lifecycle','The method table connects the lifecycle stages to operations.'),
 ('Attach a resource to a session.','Add establishes the attachment.'),
 ('Inspect one resource.','Retrieve inspects one attachment.'),
 ('Browse session resources.','List discovers the collection attached to the session.'),
 ('Refresh configuration','Update changes supported configuration or metadata.'),
 ('Permanently remove the','Delete removes the attachment from the session.'),
 ('What happens when you delete','The deletion panel makes the access consequence explicit.'),
 ('The resource is removed from the session','The attachment is removed from that session.'),
 ('You should delete resources when you want','Use that operation when the agent should no longer access content through the attachment.'),
 ('Thereis no restore or archive step','The presentation does not describe a restore or archive step for that removed attachment.'),
 ('await client. beta. sessions.resources .delete','The code illustration addresses a resource together with its parent session.'),
 ('Keep track of resource IDs','Keeping both identifiers lets the application manage the attachment deliberately.'),
 ('Use update() whena GitHub','Use the supported update operation when configuration needs to be refreshed.'),
 ('Remember that the namespace','The beta label is a reminder to match these illustrations to the SDK version in use.'))

slide(7,
 ('What this example does','The final example traces a local file through upload and session attachment.'),
 ('Upload a local file.','First, upload the local content.'),
 ('Get the returned file_id','Second, preserve the returned file identifier.'),
 ('Attach that file to a session','Third, attach that file to the intended session using the file resource type.'),
 ('Prerequisites','The prerequisites are an installed SDK, runtime credentials, an existing session, and a local input file.'),
 ('A valid existing session_id','The existing session identifier provides the parent context.'),
 ('A local file path','The local path identifies the file that the example uploads.'),
 ('Files are uploaded first, then attached','The ordering matters because attachment references the identifier returned by upload.'),
 ('Step 1','Start with the upload code in the upper right panel.'),
 ('import fs from "node:fs"','The file system import supplies the local file stream used in this example.'),
 ('const client = new Anthropic','Client construction prepares the SDK connection.'),
 ('const file = await','The upload request sends the local file to the Files API.'),
 ('file: fs. createReadStream','Its input is the requirements document shown in the local path.'),
 ('const fileld = file. id','The returned object supplies the file identifier for later attachment.'),
 ('The upload stores the file','The explanation panel separates storing the file from connecting it to a session.'),
 ('Step 2','Next, follow the attachment code in the lower left panel.'),
 ('const sessionld =','The session value selects the existing conversation context.'),
 ('const resource = await client.beta.sessions.resources.add','The resource add call creates the session attachment.'),
 (at('type: "file"',100,744),'The type field identifies which supported resource kind is being attached.'),
 (at('file_id: fileld',100,765),'The file identifier points to the uploaded content.'),
 ('console. log (resource)','The returned resource object describes the new attachment.'),
 ('sessionld scopes the resource','The nearby explanation reiterates that this attachment belongs to one parent session.'),
 ('file_id links the uploaded file','The uploaded file identifier links the content to the attachment request.'),
 ('id: "sr_abc789"','The example response has its own resource identifier. Keep that attachment identity separate from the file identifier.'),
 ('Optional follow-up operations','The follow up panel shows how the application manages an existing attachment.'),
 ('Browse resources attached to the session','List discovers attached resources, with supported filters and pagination.'),
 ('Inspect one resource to get its details','Retrieve inspects one resource using its identifier and session scope.'),
 ('Remove the resource and i mmediately','Delete removes the attachment and revokes access through it as described by the presentation.'),
 ('Best practices','The practices panel emphasizes retaining identifiers and choosing useful supporting files.'),
 ('Keep the returned file_id','Preserve the file identifier and the resource identifier for their different purposes.'),
 ('Pass the correct session_id','Pass the appropriate session context with the relevant resource operations.'),
 ('Common mistakes','The mistakes panel reinforces the upload order and scope boundaries.'),
 ('Trying to attach a file before','Upload the file before creating an attachment that references it.'),
 ('Expecting the resource to be','Do not treat a session attachment as a global attachment available to every session.'),
 ('End-to-end workfiow','The end to end diagram connects the file upload, returned identifier, attachment request, and the resulting access.'),
 ('Final takeaway','The complete workflow is to upload the file, attach it to the selected session, and manage that attachment with the supported inspection, update, or removal operations.'))

def main():
 out=ROOT/'videos'/NAME;out.mkdir(parents=True,exist_ok=True);deck=next((FOLDER/'output').glob('*.pptx'))
 assert len(ROWS)==7 and all(sum(len(s['text'])+1 for s in row['segments'])<4300 for row in ROWS)
 plan={'project':NAME,'title':'Lesson 7 · Claude Managed Agents Session Resources','displayTitle':'Lesson 7 - Session Resources','mediaPrefix':'Lesson07-Session-Resources','presentation':deck.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(deck.read_bytes()).hexdigest(),'outputFile':'Lesson07-Session-Resources.mp4','settings':SETTINGS,'resolution':[1920,1080],'fps':30,'transition':{'type':'perspective rotating cube','seconds':.8},'highlightAudit':'highlight-semantic-audit.json','verifyPhraseBoundaries':True,'highlightStyle':'Complete paragraphs and bounded code passages','slides':ROWS}
 (out/'narration-plan.json').write_text(json.dumps(plan,indent=2));(out/'highlight-semantic-audit.json').write_text(json.dumps(AUDIT,indent=2))
 print(f'Planned {len(ROWS)} slides, {len(AUDIT)} paragraph cues, {sum(len(s["text"].split()) for row in ROWS for s in row["segments"])} narration words.',flush=True)

if __name__=='__main__':main()
