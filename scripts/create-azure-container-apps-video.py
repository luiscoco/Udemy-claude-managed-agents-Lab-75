"""Teach the checked Azure Container Apps deployment using real evidence."""
from pathlib import Path
import ast, hashlib, html, json
from plan_lab_settings import SETTINGS

ROOT = Path(__file__).resolve().parents[1]
NAME = 'azure-container-apps-deployment'
P, V = ROOT/'presentations'/NAME, ROOT/'videos'/NAME
V.mkdir(parents=True, exist_ok=True)
captures = json.loads((P/'platform/capture-evidence.json').read_text(encoding='utf-8'))
deployment = json.loads((P/'evidence/deployment-evidence.json').read_text(encoding='utf-8'))
assert captures['complete'] and deployment['complete']
assert all(row['status']=='passed' for row in deployment['commands'])
assert not captures['errors'] and captures['notebookPersistedAfterReload']
TITLE = 'Deploying the Claude Managed Agents Learning Platform to Azure'
# Reuse the exact cover/layout stylesheet from the preceding course video author.
author = ast.parse((ROOT/'scripts/create-ai-tutor-live-lab.py').read_text(encoding='utf-8'))
css = ast.literal_eval(next(node.value for node in author.body if isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id == 'css' for target in node.targets)))
slides = []

def cue(cid, text): return f'<span class="textcue" data-cue="{cid}">{text}</span>'
def head(tag, title): return f'<div class="tag">{tag}</div><h1>{title}</h1>'
def custom(title, body, segments): slides.append({'title': title, 'body': body, 'segments': segments})
def shot(sid, title, narrations):
    item = next(row for row in captures['screenshots'] if row['id'] == sid)
    assert len(item['cues']) == len(narrations), sid
    is_evidence = item['kind'] == 'actual-source-or-command-output'
    bar_style = ' style="height:128px"' if is_evidence else ''
    label = 'ACTUAL SOURCE · RECORDED AZURE OUTPUT' if is_evidence else 'AZURE CONTAINER APPS · VERIFIED DEPLOYMENT'
    body = f'<img class="full" src="platform/{sid}.png"><div class="bar"{bar_style}><h1>{html.escape(title)}</h1><span>{label}</span></div>'
    segments = []
    for target, narration in zip(item['cues'], narrations):
        x,y,w,h = target['rect']
        body += f'<div class="shotcue" data-cue="{target["id"]}" data-visible="{html.escape(target["text"], quote=True)}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>'
        segments.append((target['id'], narration))
    custom(title, body, segments)


def cards(title, tag, entries):
    body=head(tag,title)+'<div class="grid">';segments=[]
    for cid,label,visible,narration in entries:
        body+='<div class="card"><h2>'+label+'</h2><p>'+cue(cid,visible)+'</p></div>';segments.append((cid,narration))
    custom(title,body+'</div>',segments)


custom(TITLE, head('CLAUDE MANAGED AGENTS · LEARN · BUILD · EXPERIMENT',cue('cover-title','Deploying the Learning Platform<br>to Azure'))+'<img class="hero" src="../../public/images/portal-welcome.png"><aside class="cover-side"><h2>Azure Container Apps</h2><p>'+cue('cover-route','Build a private image.<br>Deploy a managed container.<br>Verify the real application.')+'</p><div class="badge">Luis Coco Enríquez<br><small>Your instructor</small></div></aside>',[
 ('cover-title','Welcome. In this lesson, we will deploy the Claude Managed Agents learning platform to Azure Container Apps.'),
 ('cover-route','We will follow the reviewed deployment files, actual Azure command results and real browser screenshots. Our demonstration uses authored offline scenarios. Hosting the platform in Azure does not itself invoke a Claude model.')])

cards('Understand the Azure deployment','ONE IMAGE · A MANAGED CONTAINER SERVICE',[
 ('architecture','The application','Built React frontend<br>Express API on port 8080<br>Existing Linux Docker image','We reuse the application image from our Docker lessons. React and Express run in one container, listening on port eighty eighty. Azure Container Apps provides managed hosting; we do not install or maintain a separate virtual machine in this lesson.'),
 ('registry-model','Private image registry','Azure Container Registry<br>Managed identity pulls the image.<br>Registry admin password disabled.','We build and store the image in a private Azure Container Registry. The application uses a managed identity with pull permission. We do not place a registry administrator password in the deployment template.'),
 ('access-model','Controlled access','HTTPS ingress<br>Private recording password<br>Paid model calls disabled','This recording requires a generated access password over HTTPS. The course app began as a local learning tool, so a public class deployment needs a suitable authentication design. We keep paid model execution disabled throughout the deployment checks.')])

cards('Prepare an Azure account and agree on costs','BEFORE CREATING CLOUD RESOURCES',[
 ('signin','Sign in interactively','Install Azure CLI.<br>Use Microsoft sign-in.<br>Select the intended subscription.','Install Azure CLI using Microsoft’s instructions. This machine uses the portable Windows package in an ignored tools folder. Sign in interactively and confirm the intended subscription. A browser portal session does not automatically sign in the command-line tool. Keep device codes and authentication tokens outside recordings.'),
 ('cost-plan','Review the billable resources','Container compute and requests<br>Registry storage and image builds<br>Optional logs and durable storage','Review pricing and your subscription before creating resources. Our recording uses a small temporary deployment and an agreed estimate, then removes its dedicated resources after capture. An estimated budget or billing alert is not a guaranteed hard spending cap.'),
 ('scope-plan','Use a dedicated resource group','Separate tutorial resources.<br>Tag their purpose.<br>Check regional availability.','Keep the recording resources in their own tagged resource group. Our script refuses to reuse a group with another purpose. Regional availability can differ by subscription and service. Follow the actual Azure error instead of assuming every listed region will accept a deployment.')])
shot('cli-version','1 · Confirm Azure CLI is ready',['Run az version and confirm the command-line tool responds. The version shown is an observation from the recording machine, not a version students must copy. Use the current supported installer or portable distribution for your own computer.'])
shot('dockerfile','2 · Reuse the reviewed Dockerfile',['The existing Dockerfile builds the frontend and retains the course source used by the inspector and starter downloads. The runtime runs as the node user. Its ignore file excludes private environment files, generated videos, presentation caches and local Azure tooling.'])

cards('Create the hosting prerequisites','RESOURCE GROUP · REGISTRY · IDENTITY · ENVIRONMENT',[
 ('group-step','Dedicated resource group','Purpose-tagged tutorial scope<br>One selected subscription<br>No unrelated workloads','The deployment script first checks the signed-in subscription and the ownership tag of the dedicated group. Every Azure operation explicitly selects the intended subscription. The script records actual command results in the ignored evidence folder.'),
 ('identity-step','Image-pull permission','Create a user-assigned identity.<br>Grant AcrPull on this registry.<br>Keep credentials out of YAML.','Create the private registry and a user-assigned managed identity. Grant that identity the registry pull role scoped to this registry. Role propagation can take time; inspect the actual image-pull error if the application cannot start.'),
 ('environment-step','Container Apps environment','Consumption workload profile<br>Application image built in Azure<br>Review readiness before capture.','Create the Container Apps environment in an available region. The image is built through Azure Container Registry Tasks, so the laptop does not upload a large prebuilt image archive. Build services can have subscription permissions and charges of their own.')])
shot('image-build','3 · Verify the image build in Azure',['This is real recorded registry-build output. The source upload uses the reviewed Docker build context and ignore rules. Wait for a successful build before creating an application that references its image tag. The private root environment file and Azure token cache do not belong in the uploaded source.'])
shot('azure-identity','4 · Configure the application identity',['The application template requests the user-assigned identity. The deployment fills resource identifiers from the actual Azure resources, rather than hard-coding the instructor’s account into student files. The registry configuration refers to the same identity for image pulls.'])
shot('azure-ingress','5 · Configure restricted HTTPS ingress',['Ingress targets port eighty eighty and disables insecure traffic. The recording uses a password gateway inside the container, with only a digest stored as an Azure secret. The ordinary application is unavailable without the generated credentials. Its read-only health endpoint remains available for probes. This removes the need to discover or record a public IP address.'])
shot('azure-access','6 · Keep recording access private',['The gateway starts before the learning application and requires the generated recording credentials. The deployment passes its digest through an Azure secret reference. The clear password stays in an ignored local file and is never shown in the video. This temporary shared recording access is separate from a production student identity system.'])
shot('azure-offline','7 · Set the application origin and execution flags',['The application accepts one explicitly configured HTTPS origin for APIs that previously required localhost. The server still checks the request Host and Origin headers. The model flags remain false, the provider key is empty, and deployment does not enable authoring-provider narration. Secrets belong in separate runtime configuration when you deliberately add live capabilities later.'])
shot('azure-probes','8 · Configure startup and health probes',['The startup, readiness and liveness probes call the application health endpoint. Startup allows time for initialization; readiness determines whether the application should receive traffic. Probes are useful checks, but a passing health response does not replace testing the actual student workflow.'])
shot('azure-scale','9 · Keep the recording deployment to one replica',['We use one replica for this teaching demonstration and keep it warm while recording. A replica limit applies within a revision. During an update, old and new revisions can overlap. Do not treat this setting as a complete design for concurrent writes or a durable shared database.'])
shot('app-status','10 · Inspect the real Azure application',['The Azure response identifies the application’s HTTPS hostname, successful provisioning state and ready revision. Creating the resource and having an image available are separate from a ready application. Wait for the actual ready revision before opening the browser for the recording.'])
shot('revisions','11 · Check revision health',['List the application revisions and inspect their active, running and health states. A new image or runtime configuration creates a revision. An image update does not automatically migrate a database, and returning to an earlier revision does not restore server data.'])
shot('deployed-home','12 · Open the Azure-hosted learning platform',['Open the application’s Azure HTTPS address using the private recording credentials. This real Playwright screenshot comes from the hosted application, rather than the laptop’s Vite development server. The same browser origin serves the built frontend and the API.'])
shot('backend-health','13 · Verify the backend from the browser',['Click Check backend and confirm the application response. This verifies the actual browser route through Azure ingress to the container. If it fails, check access credentials, target port, revision health and container startup logs.'])
shot('offline-complete','14 · Run a normal offline learning scenario',['Open Lab one and run the normal offline fixture. The completed outcome is produced by the authored course scenario. It confirms that the exercise interface works in the hosted deployment without representing a live Claude session.'])
shot('offline-incomplete','15 · Verify an interrupted outcome',['Run the Stream ends early scenario. The platform reports an incomplete outcome instead of treating the presence of text as proof that a turn finished. This is the same learning behaviour we verified locally, now reached through Azure hosting.'])
shot('source-inspector','16 · Read the deployed course source',['Open the TypeScript source tab. The included course source remains readable in the deployed application. Viewing it does not execute it. This verifies another student workflow beyond simply loading the Home page.'])
shot('tutor-prepared','17 · Use the prepared tutor on Azure',['Open AI Tutor and ask for an explanation using prepared guidance. The configured HTTPS origin allows this request while foreign origins remain rejected.', 'The answer badge identifies the prepared mode. The cloud deployment does not need an Anthropic API key to teach this workflow. Live model execution remains disabled, and no Claude question is sent in this demonstration.'])
shot('notebook-saved','18 · Save and reload a browser note',['Save a note about your Azure deployment and reload the page. Our check confirms that the note remains. This is browser storage tied to the HTTPS hostname and browser profile. It is separate from files written inside an Azure container.'])

cards('Understand what persists in this deployment','STORAGE LIFETIMES · DO NOT ASSUME DURABILITY',[
 ('browser-state','Browser learning state','Notes and progress<br>Same hostname and browser profile<br>Separate from server storage','Your browser can retain notebooks, progress and its learning identity across a page reload. Changing the hostname or clearing browser data changes that state. Container restarts do not make a backup of the student’s browser.'),
 ('server-state','Container server files','Initial template: ephemeral<br>Replica replacement can lose data.<br>No durable database claim.','This initial Container Apps template does not mount durable server storage. Local artifacts and the tutor’s SQLite records can be lost when a replica is replaced. Keeping one replica running is not a persistence guarantee. Do not use this teaching setup as the only copy of important student records.'),
 ('durable-design','Plan durable storage separately','Azure Files for suitable files<br>Validate database behaviour.<br>Plan backup and concurrency.','Azure Files can retain suitable files, but a network share does not automatically establish safe SQLite database behaviour. A production shared platform needs a verified durable database design, backup and concurrency handling. We do not claim to have tested those capabilities in this lesson.')])

cards('Troubleshoot a cloud deployment with evidence','INSPECT THE FAILED LAYER',[
 ('region-failure','Resource creation','Check region and subscription.<br>Check quotas and permissions.<br>Read the actual Azure error.','If a resource is rejected, read the region, quota and permission error. The recording encountered a region that was not accepting new registry customers, so the dedicated deployment used an available region. A generic retry loop would not explain or fix that condition.'),
 ('image-failure','Container startup','Check the exact image tag.<br>Inspect managed identity and AcrPull.<br>Read revision and startup logs.','For an image-pull or startup failure, check the image tag, the assigned identity, pull permission and revision logs. Confirm that the process listens on all container interfaces at port eighty eighty. Do not expose an unhealthy application to work around startup errors.'),
 ('access-failure','Application requests','Check the access credentials.<br>Match the HTTPS origin exactly.<br>Separate health from workflow tests.','For browser access failures, check the recording credentials and exact configured HTTPS origin. A different origin can legitimately receive a forbidden response. Avoid permissive cross-origin settings that hide the underlying mismatch. Repeat the student workflows after fixing access.')])

cards('Update deliberately and clean up the recording resources','VERSIONED IMAGES · EXPLICIT RETENTION',[
 ('updates','Application updates','Build a new image tag.<br>Deploy and verify its revision.<br>Keep a data migration plan.','For code changes, build a new versioned image, deploy it and verify the new revision before relying on it. Configuration changes also need a new effective runtime. A previous image version is not a database backup.'),
 ('live-later','Optional live models','Own provider key and resource IDs<br>Runtime secrets and consent<br>Secure access before public use.','Optional live tutor or Managed Agents execution needs your own provider credentials, appropriate resource IDs and explicit flags. Configure runtime secrets separately and keep the tutor’s paid-consent workflow. Broad student access also needs an authentication and authorization design.'),
 ('cleanup','Cloud resource retention','Recording resources are temporary.<br>Inspect the dedicated group.<br>Remove it under the agreed plan.','Our recording plan removes only the dedicated tutorial resources after verification and capture. Check the exact group and purpose tag before deleting anything. Leaving a registry, environment or active application behind can continue to incur charges, even after the video is finished.')])
shot('final-application','19 · The verified Azure-hosted application',['Here is the final real application captured from Azure Container Apps. You have seen the private image build, managed identity configuration, HTTPS access, revision readiness and actual offline learning workflows. Use the accompanying student guide and deployment files to repeat the process in your own account.'])
source=P/'walkthrough.html'
sections=[]
for index,row in enumerate(slides):
    footer='' if 'class="full"' in row['body'] else f'<div class="footer"><span>CLAUDE MANAGED AGENTS · AZURE CONTAINER APPS</span><span>{index+1:02} / {len(slides):02}</span></div>'
    sections.append(f'<section class="slide {"active" if index==0 else ""}">{row["body"]}{footer}</section>')
source.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>'+TITLE+'</title><style>'+css+'</style>'+''.join(sections)+'</html>',encoding='utf-8')
(P/'storyboard.json').write_text(json.dumps(slides,indent=2),encoding='utf-8')
(V/'narration-script.txt').write_text('\n\n'.join(f'{i+1}. {row["title"]}\n'+' '.join(text for _,text in row['segments']) for i,row in enumerate(slides)),encoding='utf-8')
(V/'deployment-evidence.json').write_text(json.dumps({'deployment':deployment,'browser':captures},indent=2),encoding='utf-8')
geometry=P/'.build/video/slides/geometry.json'
if geometry.exists():
    measured=json.loads(geometry.read_text(encoding='utf-8'));assert len(measured)==len(slides)
    rows,audit=[],[]
    for index,row in enumerate(slides):
        segments=[]
        for cid,text in row['segments']:
            target=next(item for item in measured[index]['rects'] if item['id']==cid)
            segments.append({'id':cid,'text':text,'target':{'textRects':[target['rect']],'paragraphGroups':[[0]]}})
            audit.append({'slide':index+1,'cue':cid,'narration':text,'visibleText':[target['text']]})
        rows.append({'slide':index+1,'segments':segments})
    references=[{'title':'Azure Container Apps','url':'https://learn.microsoft.com/en-us/azure/container-apps/overview','note':'Managed container hosting; this lesson uses a dedicated recording deployment.'},{'title':'Container Apps storage','url':'https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts','note':'Container and replica storage are ephemeral; this template does not configure a durable database.'},{'title':'IP restrictions','url':'https://learn.microsoft.com/en-us/azure/container-apps/ip-restrictions','note':'The recording endpoint is restricted to the instructor IP; general student access needs a suitable authentication design.'},{'title':'Azure CLI on Windows','url':'https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-windows','note':'The recording uses the portable Windows CLI; students can use the supported installer for their system.'}]
    (V/'narration-plan.json').write_text(json.dumps({'project':NAME,'title':TITLE,'displayTitle':TITLE,'mediaPrefix':'Deploy-Claude-Managed-Agents-Learning-Platform-Azure','outputFile':'Deploy-Claude-Managed-Agents-Learning-Platform-Azure.mp4','presentation':source.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'settings':SETTINGS,'verifyPhraseBoundaries':True,'slides':rows,'referenceNotes':references},indent=2),encoding='utf-8')
    (V/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
print(f'Authored {len(slides)} Azure deployment scenes with real completed deployment evidence.')
