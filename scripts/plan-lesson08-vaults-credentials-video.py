"""Vaults lesson with paragraph targets and explicit API-reference clarifications."""
from pathlib import Path
import hashlib,importlib.util,json
import cv2
from measured_video_text import MeasuredVideoText,at
from plan_lab_settings import SETTINGS

ROOT=Path(__file__).resolve().parents[1];NAME='lesson08-vaults-credentials';FOLDER=ROOT/'presentations'/NAME
OCR=json.loads((FOLDER/'.build/video/slides/ocr.json').read_text(encoding='utf-8-sig'));MEASURED=MeasuredVideoText(OCR)
spec=importlib.util.spec_from_file_location('paragraphs',ROOT/'scripts/refine-lesson-paragraph-highlights.py');PARAGRAPHS=importlib.util.module_from_spec(spec);spec.loader.exec_module(PARAGRAPHS)
ROWS=[];AUDIT=[]
REFERENCES=[
 {'title':'Vault and credential lifecycle','url':'https://platform.claude.com/docs/en/api/cli/beta/vaults','note':'Both archive and delete are supported. The delete-only statements on slides 3 and 4 conflict with the official reference.'},
 {'title':'TypeScript credential creation','url':'https://platform.claude.com/docs/en/api/typescript/beta/vaults/credentials/create','note':'Current creation takes a vault ID and parameters containing an auth object. Its auth types are mcp_oauth, static_bearer, and environment_variable; several flat slide examples do not match this request shape.'},
 {'title':'Vault authentication guide','url':'https://platform.claude.com/docs/en/managed-agents/vaults','note':'Vaults use display_name and metadata. OAuth refresh settings distinguish Basic, POST, and public-client authentication. Archive retains audit records; deletion removes records. The video clarifies these differences while preserving the supplied slide visuals.'},
]

def slide(n,*parts):
 image=cv2.imread(str(FOLDER/f'.build/video/slides/slide-{n:02}.png'));lines=PARAGRAPHS.lines_for(OCR[n-1],image);segments=[];proofs=[]
 for index,(selection,text) in enumerate(parts,1):
  measured,_=MEASURED.target(n,selection);target,visible=PARAGRAPHS.expand(measured,lines);cue=f'{n}-{index}'
  if n==7:
   for i,rect in enumerate(target['textRects']):
    best=max(lines,key=lambda line:PARAGRAPHS.intersection(rect,line['rect']))
    if not best['code']:continue
    x,y,w,h=rect
    for left,top,right,bottom in [(985,285,1390,395),(1440,250,1890,330),(45,640,570,812)]:
     if left<=x<right and top<=y and y+h<=bottom:target['textRects'][i]=[left,y,right-left,h];break
  if segments and segments[-1]['target']==target:
   segments[-1]['text']+=' '+text;proofs[-1]['narration']=segments[-1]['text'];proofs[-1]['selectedPhrases'].append(selection)
  else:
   segments.append({'id':cue,'text':text,'target':target});proofs.append({'slide':n,'cue':cue,'narration':text,'visibleText':visible,'selectedPhrases':[selection],'selectionPolicy':'Complete local paragraph or bounded visible code row'})
 ROWS.append({'slide':n,'segments':segments});AUDIT.extend(proofs)

slide(1,
 (['Claude Managed','Agents','Vaults and Credentials'],'Welcome to Lesson eight: Claude Managed Agents Vaults and Credentials.'),
 ('Luis Coco Enr','This presentation by Luis Coco Enriquez explains organizing authentication secrets and making credentials available to runtime integrations.'),
 ('Secure secrets','We will begin with the distinction between a vault and the individual credentials stored inside it.'),
 ('Control access','Next, we will examine management operations, authentication patterns, and access scope.'),
 ('Use in sessions','Finally, we will trace the TypeScript example and the lifecycle choices.'),
 ('Discover how to use vaults and credentials','Some slide examples differ from the current API reference. The narration will identify those differences, especially credential request fields and the distinction between archival and deletion. Reference links accompany the video.'))

slide(2,
 ('What are vaults and credentials?','A vault groups authentication credentials; a credential represents an individual configured secret or authentication entry.'),
 ('credentials are used by tools and environments','The purpose is to support authenticated runtime integrations without placing raw secrets in ordinary conversation content.'),
 ('Why they exist','The purpose panel separates secret management from prompts and application instructions.'),
 ('Keep secrets out of source code','Keep literal secret values out of source code.'),
 ('session events, and memory stores','The slide also separates secrets from events, conversations, and saved memories.'),
 ('Let tools access sensitive values','The integration should use the configured credential through the supported runtime mechanism.'),
 ('Centralize secret management','Central organization makes ownership and lifecycle management easier to follow.'),
 ('What problems they solve','The benefits panel groups the operational reasons for that separation.'),
 ('Security','It reduces unnecessary exposure of authentication data.'),
 ('Reusability','A vault can organize several related credential entries.'),
 ('Separation of concerns','Instructions and task context serve a different purpose from authentication secrets.'),
 ('Operations','Updates, rotation, and retirement then become explicit management activities.'),
 ('Mental model','Follow the relationship in the diagram.'),
 ('Secure container','The vault is the container.'),
 ('Individual secret','Its credential entries supply the configured authentication material.'),
 ('Tool / Agent runtime','The runtime integration uses that configuration to contact the intended service.'),
 ('When to use vaults and credentials','The use cases include tools that need external service authentication.'),
 ('Web search or external API tools','An external API integration may need an API key or bearer token.'),
 ('OAuth-based integrations','An OAuth integration has its own token and client configuration.'),
 ('Environments that need secrets','Tools may also obtain authentication through environment variable configuration.'),
 ('Production or team workflows','Team workflows add requirements around ownership, rotation, and consistent management.'),
 ('Key idea to remember','Keep general task knowledge and authentication secrets in their appropriate systems. A vault organizes credentials; it does not replace the conversation or the agent\'s instructions.'))

slide(3,
 ('Overview','The vault methods manage the container that organizes credential entries.'),
 ('Create a vault','Creation establishes a new vault.'),
 ('Creates a vault with the specified configuration','The request supplies the configuration accepted by the API version in use.'),
 ('production-secrets','The example uses a descriptive production label.'),
 ('Get vault &tails','Retrieval inspects a known vault by identifier.'),
 ('const vault = await client.beta. vaults.retrieve','The identifier connects the inspection request to that existing container.'),
 ('Update a vault','Updating changes supported configuration or metadata.'),
 ('owner: "platform-team"','Ownership metadata can record the team responsible for the container.'),
 ('List vaults','Listing discovers available vault records.'),
 ('Lists all vaults, with optional filtering','Use the supported collection parameters to inspect manageable pages of results.'),
 ('Delete a vautt','Deletion is a removal operation for the vault.'),
 ('Vaults are delete-only and cannot be archived','This slide\'s delete-only statement is incorrect against the current reference: vaults support both delete and archive. The final lifecycle slide returns to archival.'),
 ('Typical workflow','The diagram summarizes container management from creation through inspection and eventual retirement.'),
 ('1. Create','Begin by creating the container.'),
 ('2. Retrieve','Retain its identifier for later inspection.'),
 ('3. Update','Change supported configuration when needed.'),
 ('4. List','Browse the collection when selecting or reviewing vaults.'),
 ('5. Delete','Choose removal or archival according to the intended lifecycle outcome and supported API behavior.'),
 ('Important notes','The notes emphasize authentication, permissions, organization, and the consequences of retirement.'),
 ('Best practices','Use clear ownership and purpose information, and manage credential rotation separately from merely changing a vault\'s label.'))

slide(4,
 ('Overview','Credential methods manage the individual authentication entries inside a vault.'),
 ('Create a','Creation associates a credential with its parent container.'),
 ('Creates a new credential in the specified vault','The authentication configuration determines what kind of entry is created.'),
 ('Get credential detaits','Retrieval inspects the credential record and configuration.'),
 ('Sensitive data','Sensitive fields are not returned in API responses. Inspecting a credential record is not a request to print its raw secret.'),
 ('Updates the configuration or metadata','Updating changes the fields that the credential\'s supported API schema permits.'),
 ('Fields to update','Separate descriptive metadata from authentication data when deciding what needs to change.'),
 ('List credentials','Listing discovers the entries belonging to a vault.'),
 ('Lists all credentials in a vault','Use supported pagination and filtering to inspect that collection.'),
 ('Permanently removes a credential','Deletion removes an individual credential.'),
 ('cannot be','The delete-only note is also inconsistent here: the current reference includes credential archival as well as deletion.'),
 ('Supported credential types','The type determines the expected authentication configuration. We will use the next slide to distinguish the illustrated patterns from the current request schema.'),
 ('Keep secrets out of code, memory stores','The management workflow should preserve the separation between credential values and ordinary application content.'),
 ('Rotate and update credentials','When replacing authentication material, use the supported update or replacement workflow for that credential type.'),
 ('The ID of the credential to update','Keep the credential identifier associated with the correct parent vault.'),
 ('The ID of the vault.','A vault identifier addresses the container, while a credential identifier addresses an entry inside it.'))

slide(5,
 ('Overview','The five columns illustrate several authentication patterns.'),
 ('Choose the credential type that matches','Select the configuration appropriate to the integration\'s actual authentication contract.'),
 ('Supported credential types','The current credential auth types are environment variable, static bearer, and MCP OAuth. The Basic, POST, and public-client variants shown here are OAuth refresh authentication settings, not three additional top-level credential types.'),
 (at('environment_variable',420,180),'The environment variable pattern supports integrations configured through a named secret variable.'),
 ('Values that tools read','The slide associates this with command line tools and SDKs that read environment configuration.'),
 (at('static_bearer',715,180),'The static bearer pattern supplies a fixed token for an authenticated integration.'),
 ('Bearer tokens for REST APIS','The example column discusses services that accept bearer authentication.'),
 ('token_endpoint_auth_basic','The Basic pattern describes using a client secret through HTTP Basic authentication at a token endpoint.'),
 ('using form','The POST pattern places the client credentials in the token request body.'),
 ('with no additional authentication','The public-client pattern does not use additional client authentication for that refresh request.'),
 ('Configuration fields','The fields panel groups container identity, labels, metadata, and authentication data.'),
 ('ID of the vault to store','The vault identifier chooses the parent container.'),
 ('Human','A descriptive label helps people identify the entry.'),
 ('Secret value','Secret values belong to the authentication configuration.'),
 ('OAuth token endpoint','OAuth related fields describe the provider endpoint and token flow.'),
 ('Usage in tools and agents','The usage diagram connects the configured credential to a runtime integration.'),
 ('credential_id: "cred_abc123"','The conceptual tool example references a credential identifier instead of embedding the literal secret.'),
 ('Real-world examples','Different integrations use different authentication mechanisms, so a generic API key example is not interchangeable with an OAuth token flow.'),
 ('Security and best practices','The practices panel reinforces access scope, ownership, and regular review. Use the linked current schema when implementing the examples rather than copying the flat slide fields unchanged.'))

slide(6,
 ('Why security guidance matters','The security guidance concerns the sensitive authentication values used by integrations.'),
 ('Secrets should never be pasted','Keep those values out of prompts, logs, source code, memory stores, and ordinary session events.'),
 ('Golden rules','The rules connect secret storage with access scope and lifecycle management.'),
 ('Use vaults for API keys and tokens','Use the appropriate credential system for authentication data.'),
 ('Keep least privilege','Grant the access required for the particular integration.'),
 ('Rotate credentials regularly','Review and replace credentials according to the requirements of the service and workload.'),
 ('Use environment-specific vaults','Organize development, staging, and production credentials deliberately.'),
 ('Audit access and usage','Review who can manage and use the configured entries.'),
 ('What to do vs what to avoid','The comparison distinguishes managed secret handling from unnecessary exposure.'),
 ('Document purpose and','Record ownership and purpose in appropriate metadata.'),
 ('Hardcode API keys','Keep literal credentials out of committed application code.'),
 ('Paste secrets into prompts','Conversation text is not the place to distribute authentication values.'),
 ('Reuse one production','Avoid treating one production credential as the default for every environment.'),
 ('Sensitive data locations','The location diagram separates credential storage from ordinary application data.'),
 ('without exposing the raw secret','Its intended boundary is runtime use without placing raw secrets in the user conversation.'),
 ('Least privilege and scope','The scope panel connects permissions to the integration\'s purpose.'),
 ('Use a read-only API token','A read operation and a deployment operation can require different permissions.'),
 ('Rotation and lifecycle','The lifecycle diagram adds review and replacement to initial setup.'),
 ('Track usage','Observe use and investigate unexpected activity.'),
 ('Update before','Update or replace entries when the supported configuration requires it.'),
 ('Environment strategy','The environment panel encourages distinct credential sets for distinct workloads.'),
 ('Auditing and govemance','Ownership, purpose, and continued need should remain reviewable.'),
 ('TypeScript best-practice example','The example illustrates referencing runtime configuration and descriptive metadata.'),
 ('Key takeaway','The practical workflow combines appropriate storage, limited access, ownership, rotation, and careful handling of secret values.'))

slide(7,
 ('What this example does','The TypeScript walkthrough connects client setup, vault creation, and credential creation.'),
 ('Initialize the Anthropic client','First, initialize the SDK client.'),
 ('Create a vault for production','Next, create the container that will organize the entries.'),
 ('Add an environment_variable','Then add the credential for the chosen integration.'),
 ('Prerequisites','The setup needs the SDK, runtime credentials, and the appropriate access context.'),
 ('local environment variable','The secret in this illustration comes from local runtime configuration.'),
 ('Step 1','The first code panel constructs the client.'),
 ('const client = new Anthropic','Client construction prepares the authenticated SDK connection.'),
 ('ANTHROPIC_API_KEY from process.env','The API key is read from the process environment rather than shown as a literal credential.'),
 ('Step 2','The second panel illustrates creating a vault.'),
 ('production-secrets','Its label communicates the intended organizational purpose.'),
 (at('environnent_id:',1490,295),'The fields here are illustrative, not the current vault request shape. The reference uses display name and metadata; naming a vault for an environment does not itself establish an access boundary.'),
 ('Step 3','The credential panel then associates an authentication entry with the vault.'),
 ('const credential = await client.beta.vaults.credentials.create','The current TypeScript call takes the vault identifier separately and an auth object in the parameters.'),
 ('vault.id','Retain the returned vault identifier for that relationship.'),
 (at('type: "environment_variable"',100,691),'The type selects the environment variable authentication pattern.'),
 ('value: process.env','The flat name and value fields shown here differ from the current auth schema. Use its secret name, secret value, and required networking configuration when implementing this pattern.'),
 ('cred def456','The example response identifies the created credential and its parent vault.'),
 ('Optional follow-up operations','Subsequent calls inspect or manage the created records.'),
 ('List cr','Listing discovers the credentials belonging to the container.'),
 ('Update a credential','Updating changes supported fields on an existing entry.'),
 ('Delete (archive) is terminal','The note combines two different operations. Keep archival and hard deletion distinct, as the final lifecycle section explains.'),
 ('Best practices and common mistakes','The practices emphasize meaningful labels, correct scope, and avoiding raw secret values in ordinary output.'),
 ('End-to-end workflow / key takeaway','The conceptual sequence is client setup, container creation, credential configuration, and runtime use. Use the reference request schema to turn that sequence into executable code.'))

slide(8,
 ('What are namespaces?','The SDK organizes related operations under namespaces.'),
 ('Available namespaces','The vault namespace manages containers, while the nested credential namespace manages entries inside them.'),
 ('Namespace relationship','Follow that relationship through the diagram.'),
 ('Manage vaults','The container level addresses vault records.'),
 ('Manage credentials','The credential level addresses the authentication entries associated with a vault.'),
 ('Vault operations','Container operations include creation, inspection, updates, collection access, and lifecycle management.'),
 ('Credential operations','Credential operations perform the corresponding work on individual entries.'),
 ('TypeScript usage examples','The examples demonstrate which namespace receives each call.'),
 ('const vaults = await client.beta.vaults.list','A vault listing is a container-level request.'),
 ('client. beta. vaul ts. credentials. create','A credential creation request belongs to the nested credential interface.'),
 ('Key differences','The comparison table separates identity and responsibility.'),
 ('Vault containers','A vault groups the entries that belong together for the application.'),
 ('Individual credentials (secrets)','An individual credential configures authentication for a particular integration.'),
 ('Primary ID','Keep the container identifier and entry identifier associated with their correct operations.'),
 ('Typical workflow using both namespaces','The combined workflow begins by creating a vault.'),
 ('2. Add credentials','Create the supported authentication entries inside it.'),
 ('3. Manage and update','Inspect and update those records through the appropriate namespace.'),
 ('4. Secure usage','Reference the configured credentials through the supported runtime integration mechanism. The conceptual distinction between container and entry remains useful even when individual request fields evolve.'))

slide(9,
 ('Keep secrets safe','The benefits panel brings the earlier management concepts back to application design.'),
 ('Secure storage for API keys and tokens','Central credential handling reduces unnecessary distribution of sensitive values.'),
 ('Enable tools','Configured credentials support authenticated service integrations.'),
 ('Provide credentials to tools at runtime','The runtime integration uses the supported authentication configuration.'),
 ('credential_id: "cred_abc123"','The conceptual example points to an entry by identifier rather than embedding its secret in the tool description.'),
 ('Environment ready','The environment panel emphasizes organizing different credential sets.'),
 ('Separate vaults for development','Development, staging, and production can have different operational requirements.'),
 ('Isolates credentials by environment','A label alone does not enforce isolation. The reference describes workspace-scoped access, so combine organization with the actual access controls.'),
 ('Support rotation','Rotation maintains the authentication material used by the integration.'),
 ('Update credentials regularly','Use supported update or replacement operations when credentials change.'),
 ('Example: rotate a credential','The code illustrates an update, but metadata describing a schedule does not itself establish an automated rotation process.'),
 ('Additional advantages','Other benefits come from keeping ownership and use visible.'),
 ('Access control','Access scope should match the integration\'s purpose.'),
 ('Audit and monitoring','Review which workloads use each entry and who can manage it.'),
 ('flexible authentication','Different integrations can use the authentication mechanisms they require.'),
 ('Cleaner code','Application logic can reference configured authentication rather than duplicate literal secrets.'),
 ('Best practices','The practical benefits depend on appropriate configuration, clear ownership, and deliberate lifecycle management.'))

slide(10,
 ('What does "Beta" mean?','The presentation labels the vault and credential interfaces as beta.'),
 ('Still being refined','That label describes an evolving interface and the need to review compatibility.'),
 ('Why Beta is the best place for secrets','Read this panel as the presentation\'s description of the feature\'s intended benefits. Beta maturity by itself is not proof that a configuration meets every workload\'s requirements.'),
 ('Security-first design','Evaluate the documented security properties and the actual integration configuration.'),
 ('Rapid improvements','An evolving interface may gain capabilities or change behavior between versions.'),
 ('What you can securely store','The content categories include authentication values needed by external integrations.'),
 ('API keys','API keys are one example of sensitive authentication data.'),
 ('OAuth tokens','OAuth integrations use their own supported token configuration.'),
 ('Service accwnt keys','Service account credentials require configuration appropriate to the service involved.'),
 ('Using Beta vaults and credentials','The code examples revisit creating the container and its entry.'),
 ('Example: Create a vault for secrets','The first illustrates the vault creation responsibility.'),
 ('Example: Add a credential to a vault','The second illustrates linking an authentication entry to that container.'),
 ('Important considerations in Beta','The considerations focus on compatibility and continued review.'),
 ('Method names, parameters, or behavior','Check the supported methods and fields when upgrading the SDK.'),
 ('Not generally available','Use the maturity status described by the reference relevant to the deployment.'),
 ('Follow security best practices','Continue to apply the workload\'s access and lifecycle requirements.'),
 ('Best practices for using Beta','The practices reinforce scope, rotation, review, and environment organization.'),
 ('Key takeaway','The important decision is to use a documented authentication mechanism correctly, with configuration and lifecycle behavior that match the application.'))

slide(11,
 ('What this note means','The closing slide separates compatibility notes from retirement decisions.'),
 ('There are currently no oficial','Its deprecation statement belongs to the documentation context used to prepare the presentation.'),
 ('Archive is terminal','The lifecycle discussion introduces irreversible archival.'),
 ('archive() is a one-way','Treat archival as retirement rather than a temporary pause.'),
 ('Archive vs delete vs keep active','The comparison distinguishes active use, archival, and deletion.'),
 ('Still in use by tools','Keep a record active while the integration still needs it.'),
 ('Moved to an archived','The official guide distinguishes archival, which purges secret payloads and retains audit records, from hard deletion, which does not retain the record.'),
 ('Permanently removed','Deletion is the separate removal operation supported by the reference.'),
 ('When to archive','The retirement examples include replaced credentials and integrations that are no longer needed.'),
 ('Old credential rotation','Replacing an old credential requires a supported replacement or rotation workflow.'),
 ('Environment retired','A retired environment or completed experiment can trigger a lifecycle review.'),
 ('Vault and credential examples','The code illustrates the archive operations for a vault and an individual credential.'),
 ('client.beta. vaults .archive','The vault archive request addresses the selected container.'),
 ('vault_id: "vault_abc123"','The credential request retains its parent vault context.'),
 ('Best practices before archiving','Review dependent tools and replace required credentials before retiring an entry.'),
 ('Document the reason','Record why the entry was retired and ensure references are updated appropriately.'),
 ('How to stay informed','Review the current API reference and test the integration\'s behavior in its intended environment.'),
 ('Key takeaway','This resolves the earlier delete-only notes: both archive and delete exist, with different retention outcomes. Keep container identity, credential identity, authentication configuration, and lifecycle decisions distinct.'))

def main():
 out=ROOT/'videos'/NAME;out.mkdir(parents=True,exist_ok=True);deck=next((FOLDER/'output').glob('*.pptx'))
 assert len(ROWS)==11 and all(sum(len(s['text'])+1 for s in row['segments'])<4300 for row in ROWS)
 plan={'project':NAME,'title':'Lesson 8 · Claude Managed Agents Vaults and Credentials','displayTitle':'Lesson 8 - Vaults and Credentials','mediaPrefix':'Lesson08-Vaults-and-Credentials','presentation':deck.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(deck.read_bytes()).hexdigest(),'outputFile':'Lesson08-Vaults-and-Credentials.mp4','settings':SETTINGS,'resolution':[1920,1080],'fps':30,'transition':{'type':'perspective rotating cube','seconds':.8},'highlightAudit':'highlight-semantic-audit.json','verifyPhraseBoundaries':True,'highlightStyle':'Complete paragraphs and bounded code passages','referenceNotes':REFERENCES,'slides':ROWS}
 (out/'narration-plan.json').write_text(json.dumps(plan,indent=2));(out/'highlight-semantic-audit.json').write_text(json.dumps(AUDIT,indent=2));(out/'api-reference-notes.json').write_text(json.dumps(REFERENCES,indent=2))
 print(f'Planned {len(ROWS)} slides, {len(AUDIT)} paragraph cues, {sum(len(s["text"].split()) for row in ROWS for s in row["segments"])} narration words.',flush=True)

if __name__=='__main__':main()
