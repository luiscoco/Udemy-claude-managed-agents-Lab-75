"""Lesson 9 narration with measured paragraph highlights and API clarifications."""
from pathlib import Path
import hashlib,importlib.util,json
import cv2
from measured_video_text import MeasuredVideoText,at
from plan_lab_settings import SETTINGS

ROOT=Path(__file__).resolve().parents[1];NAME='lesson09-memory-stores-memory-versions';FOLDER=ROOT/'presentations'/NAME
OCR=json.loads((FOLDER/'.build/video/slides/ocr.json').read_text(encoding='utf-8-sig'));MEASURED=MeasuredVideoText(OCR)
spec=importlib.util.spec_from_file_location('paragraphs',ROOT/'scripts/refine-lesson-paragraph-highlights.py');PARAGRAPHS=importlib.util.module_from_spec(spec);spec.loader.exec_module(PARAGRAPHS)
ROWS=[];AUDIT=[]
REFERENCES=[
 {'title':'Memory store lifecycle and TypeScript namespace','url':'https://platform.claude.com/docs/en/api/typescript/beta/memory_stores','note':'Current TypeScript uses memoryStores and memoryVersions. Archiving is irreversible; the unarchive claim on slide 3 is incorrect. Deleting a store removes its memories and versions.'},
 {'title':'Creating a memory','url':'https://platform.claude.com/docs/en/api/typescript/beta/memory_stores/memories/create','note':'Current creation takes the store ID as the first argument and requires path and content. Paths start with /. The slide examples are conceptual rather than current copy-ready SDK calls.'},
 {'title':'Safe content updates','url':'https://platform.claude.com/docs/en/api/typescript/beta/memory_stores/memories/update','note':'Use the documented content_sha256 precondition in place of the slides\' if_version example. Current update parameters include the parent memory_store_id.'},
 {'title':'Version history and session attachment','url':'https://platform.claude.com/docs/en/managed-agents/memory','note':'Use the memory beta header for memory-store calls, not both beta headers. Session attachment uses the session API. History has retention limits; it is not an unlimited permanent backup. The live head must first be replaced or deleted before redaction.'},
 {'title':'Listing memory versions','url':'https://platform.claude.com/docs/en/api/typescript/beta/memory_stores/memory_versions/list','note':'Versions are listed by store ID and may be filtered by memory_id. Follow pagination to obtain more than one page.'},
 {'title':'Redacting historical content','url':'https://platform.claude.com/docs/en/api/typescript/beta/memory_stores/memory_versions/redact','note':'Redaction scrubs the selected historical content while retaining its audit record; it does not merely add a redacted copy while leaving the original secret readable. Current parameters take the version ID and parent store ID, rather than the illustrated nested reason object.'},
 {'title':'Vault creation recap','url':'https://platform.claude.com/docs/en/api/typescript/beta/vaults/create','note':'Slide 10 revisits vaults. Current vault creation uses display_name and optional metadata, rather than the displayed name, description, and environment_id request.'},
 {'title':'Credential creation recap','url':'https://platform.claude.com/docs/en/api/typescript/beta/vaults/credentials/create','note':'Current credential creation uses an auth object. The environment_variable auth configuration uses secret_name and secret_value, not the displayed flat name/value request.'},
]

def slide(n,*parts):
 image=cv2.imread(str(FOLDER/f'.build/video/slides/slide-{n:02}.png'));lines=PARAGRAPHS.lines_for(OCR[n-1],image);segments=[];proofs=[]
 for index,(selection,text) in enumerate(parts,1):
  measured,_=MEASURED.target(n,selection);target,visible=PARAGRAPHS.expand(measured,lines);cue=f'{n}-{index}'
  if n==9 and 12<=index<=16:
   # Fit the complete logical code passage, including rows OCR partly missed.
   left,top,right,bottom=[(220,484,890,549),(240,578,950,655),(240,667,950,740),(240,751,950,830),(240,842,950,903)][index-12]
   selected=[line for line in lines if left<=line['rect'][0]<right and top<=line['rect'][1]<bottom]
   assert selected
   target={'textRects':[[left,top,right-left,bottom-top]],'paragraphGroups':[[0]]};visible=[' '.join(line['text'] for line in selected)]
  if segments and segments[-1]['target']==target:
   segments[-1]['text']+=' '+text;proofs[-1]['narration']=segments[-1]['text'];proofs[-1]['selectedPhrases'].append(selection)
  else:
   segments.append({'id':cue,'text':text,'target':target});proofs.append({'slide':n,'cue':cue,'narration':text,'visibleText':visible,'selectedPhrases':[selection],'selectionPolicy':'Complete local paragraph or bounded visible code row'})
 ROWS.append({'slide':n,'segments':segments});AUDIT.extend(proofs)

slide(1,
 (['Claude Managed','Agents','Memory Stores,','Memory and Versions'],'Welcome to Lesson nine: Claude Managed Agents Memory Stores, Memory and Versions.'),
 ('Luis Coco Enr','This presentation by Luis Coco Enriquez explores persistent context and the history of changes to that context.'),
 (at('Memory stores',139,730),'First, we will examine the containers that organize durable information.'),
 ('Agent memory','Then we will look at the text records an agent can reuse across sessions.'),
 ('Versions and memory','Finally, we will connect those records to version history, updates, and lifecycle operations. These are memory versions, distinct from versions of an agent definition.'),
 ('Master memory stores','Several examples need clarification against the current API. I will point those out as we go, and the player includes reference links. The final slide revisits vaults to reinforce the difference between context and credentials.'))

slide(2,
 ('What this feature is for','Memory stores preserve useful context beyond an individual session.'),
 ('Memory stores provide durable,','The container is scoped to a workspace and can support information shared across appropriate sessions.'),
 ('They preserve important context,','Examples include preferences, facts, and domain knowledge that should remain useful over time.'),
 ('Persistence across sessions','Persistence reduces the need to rediscover the same context every time an agent runs.'),
 ('Reusable context','Reusable context lets several conversations build on an established foundation.'),
 ('Less repetition in prompts','Frequently needed information can be maintained centrally rather than pasted into every prompt.'),
 ('Better long-term agent behavior','Consistent reference material can help the agent behave more consistently. Its usefulness still depends on the quality of the stored content.'),
 ('Project/domain organization','Organize stores around a clear project, domain, or agent purpose.'),
 ('What agents can remember','The examples here are small text documents, rather than arbitrary binary attachments.'),
 ('User preferences','A preference record might describe communication style or preferred tools.'),
 ('Team conventions','A team record might capture coding standards or a review process.'),
 ('Documentation snippets','A documentation record can summarize a relevant API or internal convention.'),
 ('Product facts','Product facts need review as the product changes.'),
 ('Workflow notes','Workflow notes capture repeatable procedures and domain guidance.'),
 ('Domain knowledge','Domain context should be relevant and appropriate for the sessions that can access it.'),
 ('Mental model','Follow the hierarchy: the store organizes records, the memories hold text, and versions record changes.'),
 ('1. Create a','Start with a purpose-built store.'),
 ('2. Add memories','Add focused records that express specific facts or preferences.'),
 ('3. Versions track','Edits produce history that can be inspected later. History and the current record are separate concepts.'),
 ('When to use it','The use cases include multi-session assistants, product guidance, support, research, and team conventions.'),
 ('Do not store sensitive information','The deck consistently separates useful context from credentials and other sensitive information.'),
 ('Key idea to remember','Remember the three responsibilities: a container organizes, a memory holds the current text, and a version describes a historical change.'))

slide(3,
 ('What store methods are for','Store methods manage the container rather than the individual text records inside it.'),
 ('client. beta. memory_stores','The slides use a snake case namespace. The current TypeScript SDK spells it memoryStores in camel case. Treat the displayed calls as conceptual examples.'),
 ('create()','Create establishes the container for a particular purpose.'),
 ('name (required)','Give the store a descriptive name.'),
 ('description (optional)','A description explains the intended subject matter.'),
 ('metadata (optional)','Metadata records organizational labels. It is separate from a memory document\'s content.'),
 ('retrieve(storeld)','Retrieve inspects a known store by its identifier.'),
 ('Useful before updating','Reading the existing configuration helps you understand what an update will change.'),
 ('update(storeld, params)','Update changes the store configuration.'),
 ('Updates the store configuration only','Changing the container\'s metadata does not rewrite all the memories inside it.'),
 ('Common fields','The illustrated fields distinguish the name, description, and metadata of the store.'),
 ('list()','List discovers stores in the workspace.'),
 ('after - pagination cursor','Use pagination when the collection spans more than one response.'),
 ('delete(storeld) / archive(storeld)','The lifecycle panel contrasts deletion with archival.'),
 ('Permanently removes the Store.','Deleting the store removes its memories and versions as well. This is different from retiring it for future use.'),
 ('Preserves the Store and its data','Archive retains the store for inspection while restricting its use.'),
 ('Yes (unarchive later)','The claim that an archived store can be unarchived is incorrect. Archival is one-way; it cannot be undone.'),
 ('Use archive When you want to preserve history','An archived store cannot be attached to new sessions or receive normal content updates. Choose that lifecycle state deliberately.'),
 ('Best practices / key takeaways','Use meaningful names and focused scopes, keep sensitive data out, and distinguish container operations from memory operations.'))

slide(4,
 ('What memory methods are for','Memory methods manage the small text documents inside a store.'),
 (at('Memory Store',219,309),'The store identifies the collection that owns the record.'),
 (at('Memories',221,429),'The memory supplies the current text and its path.'),
 (at('Versions',100,460),'Version history records changes associated with that document.'),
 ('create (storeld, params)','Creating a memory adds a focused text record.'),
 ('Important identifier (path-like name).','The path is a meaningful location for the record. Current API paths begin with a forward slash, so add that slash to examples such as product slash roadmap dot m d.'),
 ('Text body of the memory.','The content holds the actual text, such as the product pricing note shown here.'),
 (at('metadata',564,419),'Do not assume every illustrated field is accepted. The current create schema takes the store ID as the first argument and requires path and content; it does not list per-memory metadata.'),
 ('retrieve(memoryld)','Retrieve reads the chosen memory and lets you inspect its current state.'),
 ('Check current data before updating.','Reading before editing gives you the content and identifiers needed for a deliberate change.'),
 ('update(memoryld, params)','Update changes an existing memory, rather than creating a second unrelated record.'),
 ('if_version','The slide illustrates conflict prevention with if underscore version. The current update reference instead uses a precondition containing the expected content SHA-256 hash.'),
 ('Use version preconditions to protect','If that hash no longer matches, the update fails instead of silently overwriting the concurrent change. Read the fresh state and reconcile it before retrying.'),
 ('list(storeld)','List browses the memories belonging to a store.'),
 ('Optional params:','Apply the supported pagination parameters to browse a large collection.'),
 ('delete(memoryld)','Delete removes the live memory record.'),
 ('Prior version','Do not confuse deletion of the live record with deletion of its retained history. We will return to that distinction on the version slide.'),
 ('Best practices / key takeaways','Keep records focused, use clear paths, and choose create, retrieve, update, list, or delete according to the intended change.'),
 ('Key takeaway:','The store is the collection; the memory is the text record you manage inside it.'))

slide(5,
 ('What are memory versions?','A version captures a historical state or change associated with a memory.'),
 ('Every change to a memory creates a new','The version timeline helps explain how the original content differs from later edits.'),
 ('Available version methods','The three operations shown are list, retrieve, and redact.'),
 (at('List all versions for a memory.',780,200),'List is how you discover the relevant history.'),
 (at('Get a specific version by ID.',780,260),'Retrieve inspects one chosen historical version.'),
 (at('Create a new redacted version',780,320),'The redaction description needs correction: redaction scrubs the selected historical content while preserving its audit record. It does not merely add a redacted copy and leave the original sensitive text readable.'),
 ('Method details','Use the current SDK signatures when translating this table into code.'),
 (at('List versions for a mernory',90,435),'The current TypeScript version collection is memoryVersions in camel case. Listing takes the store ID, with a memory ID filter when you want one document\'s history.'),
 (at('Retrieve a specific version',493,567),'Retrieving a version takes its version ID together with the parent store context.'),
 (at('Create a redacted version',710,435),'The displayed nested reason object does not match the current redaction request shape. The reference call identifies the version and its parent store.'),
 ('Example workflow','The example workflow starts by creating or editing a memory, then inspecting its historical changes.'),
 ('A new version is','History lets you compare an earlier state with a later one.'),
 ('Retumed version object','The version object links the historical entry to the memory and its recorded change.'),
 ('redacted_at','Use the documented redaction fields to determine whether content has been scrubbed; do not rely on the simplified sample alone.'),
 (at('Full history',320,986),'The full-history wording is not an unlimited retention promise. Historical versions have retention limits, so export history if you need to preserve it longer.'),
 ('Sensitive data control','The current live head cannot be redacted directly. Replace the live content or delete the live memory before redacting the affected older version.'),
 ('Simple API','Listing, inspection, and redaction solve different problems. A version history is useful for audit, but does not remove the need to review the current content.'),
 ('Works with memory stores','Memory versions belong to the store. Retained versions can outlive deletion of the live memory, which matters when reviewing or removing historical information.'))

slide(6,
 ('What these rules are for','These rules connect the conceptual model to actual session and API behavior.'),
 ('Rule 1','Use the correct beta configuration for the endpoint you are calling.'),
 ('Do not send both the managed-agents beta','For memory-store requests, the guide says to use the memory beta header without combining it with the managed agents header.'),
 ('Send only the memory','The memory beta identifier shown here selects the memory functionality.'),
 ('Do not combine both','The avoid example illustrates an invalid header configuration; it is not a pattern to copy.'),
 ('Rule 2','Attaching the store to a session is a separate operation from creating it.'),
 ('A memory Store is attached','The session resources describe which store that session can use.'),
 ('const session = await','Session creation still uses the session endpoint\'s beta configuration. Do not apply the memory-call header rule indiscriminately to every request.'),
 ('Rule 3','Memories are lightweight text documents.'),
 ('Good uses: facts, preferences,','Use them for focused facts, preferences, procedures, and domain context.'),
 ('Not for: credentials, API keys,','Do not treat memory as a place for binary files or secret payloads.'),
 ('Rule 4','Paths give those text documents a clear organization.'),
 ('Use consistent, descriptive','Use a naming convention that makes the subject and purpose obvious.'),
 ('Good paths','The examples describe product and team context. Current API paths also need a leading forward slash.'),
 ('Poor paths','Vague names such as temp or misc give a future reader little help.'),
 ('Rule 5','Protect edits against concurrent changes.'),
 ('Retrieve the current version','Read the current state before computing the replacement content.'),
 ('Update with if_version','Here again, replace the illustrated if-version field with the documented content-hash precondition for the SDK you use.'),
 ('Update succeeds, or is rejected','A failed condition is a signal to reconcile the competing edit, rather than to force the same overwrite.'),
 ('Common mistakes to avoid','The checklist brings together wrong headers, missing attachments, sensitive content, vague paths, and unsafe updates.'),
 ('Key takeaway','Create the store, attach it deliberately, keep the records readable, and use the supported update safeguards.'))

slide(7,
 ('Why safety matters','Persistent information can be reused long after the conversation that introduced it.'),
 ('Storing sensitive information insecurely','That longevity makes content selection and access review part of memory design.'),
 ('Key safety principies','The safety principles begin by separating reusable context from authentication secrets.'),
 ('Never store credentials','Do not put API keys, tokens, passwords, or service account secrets in memory documents.'),
 ('Use dedicated vaults','Vaults provide the credential mechanism discussed in the previous lesson.'),
 ('Apply least privilege','Give each agent and integration only the memory access needed for its task.'),
 ('Keep non-sensitive context','Keep the stored context relevant and appropriate for the intended audience.'),
 ('Rotate and update regularly','Review information regularly and remove stale guidance. A persistent record can become misleading when the underlying facts change.'),
 ('Do\'s and don\'ts','The checklist turns these principles into practical review questions.'),
 ('Use memory stores for persistent','Use memory for suitable preferences and domain context.'),
 ('Do not expose memory Store contents','Avoid copying entire records into logs or errors merely for convenience.'),
 ('Do not share memory stores between','Do not let a convenient shared store cross an unintended trust boundary.'),
 ('Use the right storage','Choose storage according to the information\'s purpose.'),
 (at('Use memory stores for:',265,695),'A memory store can hold appropriate summaries, preferences, and project notes.'),
 ('Use vaults for:','Credentials and secret keys belong in the supported credential system.'),
 ('Safe to Store in memory','Even the sample labeled safe needs a content review: an internal roadmap is not automatically non-sensitive merely because it is written as text.'),
 ('Do not store in memory','The secret examples show categories to exclude, not sample values to reuse.'),
 (at('Environment-specific stores',251,912),'Separating development, staging, and production information reduces accidental mixing. Names alone do not enforce the access boundary; configure access appropriately.'),
 ('Audit and monitoring','Review who can access a store, what it contains, and how it changes over time.'),
 ('Key takeaway','Useful memory is selective, maintained, and scoped. Persist only information that remains appropriate for the sessions and people who can access it.'))

slide(8,
 ('What are you managing?','The summary returns to the three related resources.'),
 ('Organize memories','Stores organize records by purpose.'),
 ('Small text documents','Memories contain the actual facts and context.'),
 ('Immutable history','Versions support historical inspection, subject to retention and redaction behavior.'),
 ('Use the right method for the job','Choose the method for the resource you intend to manage.'),
 ('Create a Store','Store methods address the container.'),
 ('Update content','Memory methods address the live text record.'),
 ('List all versions','Version methods address historical entries.'),
 ('Follow the important rules','Endpoint configuration, attachment, paths, and update conditions remain separate concerns.'),
 ('Attach a memory Store to a session','A store must be made available to the intended session; creating one alone does not attach it everywhere.'),
 ('Keep your data safe','Keep credentials separate and access limited to the intended purpose.'),
 ('Manage the full lifecycle','The lifecycle moves from creating useful context to maintaining and eventually retiring it.'),
 ('Keep information','Update facts when they change.'),
 ('Create redacted','Redact affected historical content using the supported behavior rather than relying on the illustrated new-copy description.'),
 ('Remove outdated','Choose removal or archival according to the intended retention outcome.'),
 ('Example: Putting it all together','Read the example left to right: create the store, add a record, inspect history, handle redaction where needed, and retire the store.'),
 ('Archived data is terminal','The terminal-archive note here is the correct direction; it resolves the earlier unarchive claim. Do not design a workflow that depends on reversing archival.'),
 (at('Key takeaways',1405,498),'Keep the container, current document, and historical entries distinct, and consult the linked references when adapting the examples.'))

slide(9,
 ('What this example does','The TypeScript walkthrough combines creation, editing, and history inspection.'),
 ('Prerequisites','Prepare the SDK and supply authentication through the configured environment.'),
 ('npm install','The package shown is the Anthropic TypeScript SDK.'),
 ('Use the beta memory stores namespace','Remember the namespace correction: current TypeScript uses memoryStores, with memoryVersions nested beneath it.'),
 ('Key concepts used','The store, live memory, and historical version each have their own identifier and purpose.'),
 ('Example flow','Follow the four stages in sequence.'),
 (at('Create a memory store',1510,230),'First, create the container for the product documentation.'),
 (at('Add a memory',1510,310),'Second, add the initial product note.'),
 (at('Update the mernory',1510,390),'Third, update that note when the product information changes.'),
 (at('List versions',1510,470),'Fourth, inspect the recorded changes.'),
 ('Complete TypeScript example','The large code block illustrates the control flow, but several displayed argument shapes are not copy-ready current TypeScript calls.'),
 ('import Anthropic','The import establishes the SDK client used for the requests.'),
 ('// 1. Create a memory store','The first request creates the store and saves its identifier.'),
 ('// 2. Create a memory inside the store','For the current create-memory call, pass that store ID first and include both a valid slash-prefixed path and the text content. The displayed example omits the required path.'),
 ('// 3. Update the memory','The edit changes the product note from the initial plan list to the expanded list. Use the memory ID, parent store context, and supported content precondition when adapting this step.'),
 ('// 4. List all versions','List history by store ID and filter by the chosen memory ID. A response page is not necessarily the entire history.'),
 ('Step-by-step explanation','The explanation panel reinforces the relationship between the requests.'),
 ('Human-readable name.','The store name describes the collection.'),
 ('Text contentof thememory','The memory content describes the product fact itself.'),
 ('Returns the new version ID.','Use the response schema for the current SDK. The current memory object exposes memory underscore version underscore I D, rather than assuming the sample\'s shortened version field.'),
 ('Example output (simplified)','The output is illustrative, not a live execution result. Compare the original and updated product note to understand why history is useful.'),
 ('List versions to audit changes','For rollback, retrieve a retained earlier snapshot and write its content back as a new current change. There is no separate restore call in the memory guide.'),
 ('Follow security best practices','Keep the walkthrough\'s focus on appropriate product context, and keep credentials out of both live memory and its history.'))

slide(10,
 ('TypeScript example','This final slide is a vaults recap included in the supplied deck. It reinforces the storage distinction: memory carries context, while credentials support authentication.'),
 ('Prerequisites','The setup again uses the Anthropic SDK and environment-based authentication.'),
 ('Instau the SDK','Install the SDK in the application that manages the integration.'),
 ('Set your API key','Supply the key through your configured environment rather than embedding a literal secret in a lesson script.'),
 ('Initialize the client','Create the client used for vault and credential operations.'),
 (at('apiKey:',777,235), 'The illustrated client configuration reads authentication from the environment.'),
 (at('Create a vault',1287,101),'The container groups credential entries. Current vault creation uses display underscore name and optional metadata, rather than the displayed name, description, and environment ID fields.'),
 (at('Add an environment_variable credential',245,409),'The credential represents the configured environment-variable secret.'),
 ('type: " environment_variable"','The current request places that type inside an auth object.'),
 ('The secret value','Within that configuration, use the documented secret-name and secret-value fields instead of treating the flat name and value example as the current schema.'),
 ('Verify the credential','Inspect the credential collection to confirm that the record exists.'),
 ('console. log(credentials. data)','Review record metadata without logging secret payloads.'),
 ('Full example','The full example combines container creation and credential creation. It is a conceptual recap, not code executed as part of this video.'),
 ('What this example demonstrates','The demonstrated responsibilities are creating the container, configuring the credential, and verifying the resulting record.'),
 ('Uses asymc/ await','Awaiting each request preserves the dependency between creating the container and using its identifier.'),
 ('Keeps secrets Nit of code','Reading a value from the configured environment avoids writing the literal secret into the source file.'),
 ('Key takeaways','For Lesson nine, remember the boundary: maintain useful non-sensitive context in memory, inspect its version history, and manage authentication material through the credential system.'),
 ('Use descriptive names and metadata','Use clear organization in both systems, while applying the correct fields and lifecycle behavior for each resource. The linked reference notes identify the corrections discussed throughout this lesson.'))

def main():
 out=ROOT/'videos'/NAME;out.mkdir(parents=True,exist_ok=True);deck=next((FOLDER/'output').glob('*.pptx'))
 assert len(ROWS)==10 and all(sum(len(s['text'])+1 for s in row['segments'])<4300 for row in ROWS)
 plan={'project':NAME,'title':'Lesson 9 · Memory Stores, Memory and Versions','displayTitle':'Lesson 9 - Memory Stores, Memory and Versions','mediaPrefix':'Lesson09-Memory-Stores-Memory-and-Versions','presentation':deck.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(deck.read_bytes()).hexdigest(),'outputFile':'Lesson09-Memory-Stores-Memory-and-Versions.mp4','settings':SETTINGS,'resolution':[1920,1080],'fps':30,'transition':{'type':'perspective rotating cube','seconds':.8},'highlightAudit':'highlight-semantic-audit.json','verifyPhraseBoundaries':True,'highlightStyle':'Complete paragraphs and bounded code passages','referenceNotes':REFERENCES,'slides':ROWS}
 (out/'narration-plan.json').write_text(json.dumps(plan,indent=2));(out/'highlight-semantic-audit.json').write_text(json.dumps(AUDIT,indent=2));(out/'api-reference-notes.json').write_text(json.dumps(REFERENCES,indent=2))
 print(f'Planned {len(ROWS)} slides, {len(AUDIT)} paragraph cues, {sum(len(s["text"].split()) for row in ROWS for s in row["segments"])} narration words.',flush=True)

if __name__=='__main__':main()
