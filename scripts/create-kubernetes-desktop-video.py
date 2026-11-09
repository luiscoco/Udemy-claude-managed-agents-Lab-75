"""Teach the checked Docker Desktop Kubernetes deployment using real evidence."""
from pathlib import Path
import ast, hashlib, html, json
from plan_lab_settings import SETTINGS

ROOT = Path(__file__).resolve().parents[1]
NAME = 'kubernetes-desktop-deployment'
P, V = ROOT/'presentations'/NAME, ROOT/'videos'/NAME
V.mkdir(parents=True, exist_ok=True)
captures = json.loads((P/'platform/capture-evidence.json').read_text(encoding='utf-8'))
deployment = json.loads((P/'evidence/deployment-evidence.json').read_text(encoding='utf-8'))
assert captures['complete'] and deployment['complete'] and deployment['persistence']['proofRetained']
assert all(row['status']=='passed' for row in deployment['commands'])
assert not captures['errors'] and captures['notebookPersistedAfterReload']
TITLE = 'Deploy your Learning Platform to Kubernetes'
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
    label = 'ACTUAL SOURCE · RECORDED KUBERNETES OUTPUT' if is_evidence else 'DOCKER DESKTOP · KUBERNETES DEPLOYMENT'
    body = f'<img class="full" src="platform/{sid}.png"><div class="bar"{bar_style}><h1>{html.escape(title)}</h1><span>{label}</span></div>'
    segments = []
    for target, narration in zip(item['cues'], narrations):
        x,y,w,h = target['rect']
        body += f'<div class="shotcue" data-cue="{target["id"]}" data-visible="{html.escape(target["text"], quote=True)}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>'
        segments.append((target['id'], narration))
    custom(title, body, segments)


custom(TITLE, head('CLAUDE MANAGED AGENTS · LEARN · BUILD · EXPERIMENT',cue('cover-title','Deploy your Learning Platform<br>to Kubernetes')) + '<img class="hero" src="../../public/images/portal-welcome.png"><aside class="cover-side"><h2>Using Docker Desktop</h2><p>' + cue('cover-route','Create a local cluster.<br>Deploy the platform.<br>Verify the running app.') + '</p><div class="badge">Luis Coco Enríquez<br><small>Your instructor</small></div></aside>', [
 ('cover-title','Welcome. In this lesson, we will deploy your learning platform to Kubernetes using Docker Desktop.'),
 ('cover-route','Follow the actual manifest, recorded command results and real application screenshots. We will verify an offline learning workflow and check that server data survives replacement of the application pod. This is a local development deployment.')])

def cards(title, tag, entries):
    body=head(tag,title)+'<div class="grid">';segments=[]
    for cid,label,visible,narration in entries:
        body+='<div class="card"><h2>'+label+'</h2><p>'+cue(cid,visible)+'</p></div>';segments.append((cid,narration))
    custom(title,body+'</div>',segments)

cards('Start Docker Desktop and create a local cluster','STEP 1 · LINUX CONTAINERS · ONE NODE',[
 ('enable','Create cluster','Docker Desktop → Kubernetes<br>Create cluster → one node<br>Wait for Running','Start Docker Desktop in Linux container mode. In its Kubernetes view, select Create cluster and choose one node. Older versions use Enable Kubernetes in Settings. The student guide links the current official instructions. Initial setup downloads components, so allow time and enough memory.'),
 ('context','Select your local context','kubectl config get-contexts<br>Use --context docker-desktop<br>Keep other clusters unchanged','Confirm that the docker desktop context exists. All our Kubernetes commands name it explicitly, which avoids accidentally deploying to a cloud cluster selected in your terminal. Do not reset an existing cluster just to follow this lesson.'),
 ('architecture','Understand the route','Browser → port-forward<br>Service → application pod<br>Persistent volume → server data','The browser reaches a local port-forward. A Service selects our application pod. A Deployment keeps one replica running, while a persistent volume claim retains server files. These are separate Kubernetes objects with separate responsibilities.')])

shot('engine','2 · Check the Docker engine',['Run docker version and confirm that the engine responds. We are using Docker Desktop’s local Linux engine. A command-line client being installed does not prove that the engine or Kubernetes is ready.'])
shot('cluster','3 · Check Kubernetes status',['Check Docker Desktop’s Kubernetes status. Wait for the cluster to run before applying application resources. The version and provisioner shown here describe this recording machine; students should follow the supported settings for their installed Desktop release.'])
shot('nodes','4 · Confirm the node is Ready',['Run kubectl with context docker desktop and get nodes. Ready confirms that the node can participate in scheduling. We use a single node for this course deployment. It is a learning setup, not a highly available production cluster.'])
shot('storage','5 · Check dynamic storage',['List storage classes before requesting a volume. Our claim uses the default class. If there is no default provisioner, resolve that configuration before expecting the claim to bind. Do not delete unrelated volumes to solve a Pending claim.'])
shot('dockerfile','6 · Build the existing platform image',['We reuse the reviewed Dockerfile from the previous lesson. It installs dependencies and builds React, then runs the Express platform with Node twenty four. The image includes course source for the inspector and starter downloads. Private environment files and generated videos stay outside the build context.'])
shot('build','7 · Confirm the image build succeeded',['Build the tag claude learning platform, kubernetes. This is real recorded build output, shown in a labelled evidence viewer. Wait for exit zero. Building can require internet for dependencies, even though the application scenarios we demonstrate do not call an AI provider.'])
shot('image','8 · Inspect the local image',['The image now exists in Docker Desktop’s image store. Its size includes the course assets and teaching dependencies. Seeing it here is useful, but a kind based Kubernetes node can have a separate containerd image store.'])
if any(row['id']=='import' for row in captures['screenshots']):
    shot('import','9 · Load the image into the Desktop node',['For this kind based Desktop cluster, we stream the saved image into the identified Desktop node’s containerd store. Our recorder matches the node and Desktop cluster label before importing. This binary transfer uses Node streams, avoiding Windows PowerShell five text-pipeline corruption. Nothing is pushed to a registry.'])

shot('manifest-config','10 · Keep the demonstration offline',['Read the namespace and ConfigMap. The three live execution flags are false, and there is no provider key. Kubernetes does not automatically read your private root environment file. ConfigMaps hold ordinary configuration; they are not the place for an API secret.'])
shot('manifest-storage','11 · Request persistent server storage',['The persistent volume claim requests two gibibytes with Read Write Once access. A claim asks Kubernetes for storage; it does not contain a backup. In this local setup the default Desktop provisioner creates the actual volume. Later we will verify a file survives pod replacement.'])
shot('manifest-deployment','12 · Run one replica with a local image',['The Deployment uses one replica and the Recreate strategy. This platform writes local files and SQLite data, so simply increasing replicas is not a supported shared-write architecture. Image pull policy Never requires the image to be available on the node and prevents an accidental application-image pull from Docker Hub.'])
shot('manifest-probes','13 · Let Kubernetes check application health',['Kubernetes calls the health endpoint for startup, readiness and liveness. The startup probe gives this application time to initialize. Readiness controls whether it should receive Service traffic. Liveness can trigger a restart. Kubernetes uses these probes, rather than the Dockerfile health check.'])
shot('manifest-mounts','14 · Mount the writable directories',['The same claim has separate subdirectories for artifacts, sessions, workspaces and logs. The pod runs with user and group one thousand, and a filesystem group lets it use the volume. These settings preserve writable application data without running the platform as root.'])
shot('manifest-service','15 · Give the app a stable internal Service',['This Cluster IP Service selects the learning platform pod and maps its HTTP port to eighty eighty. It is an internal cluster address. We will use a loopback port-forward to access it from our browser, rather than exposing the application publicly.'])
shot('dry-run','16 · Validate against the cluster API',['Create or apply the tutorial namespace first, then use a server dry run to validate the manifest against the actual cluster API. This catches API and policy problems before the application resources are persisted. Review the resulting exit status rather than assuming valid YAML guarantees a working deployment.'])
shot('apply','17 · Apply the application resources',['Apply the reviewed manifest to the explicit local context. Kubernetes creates the configuration, volume claim, Deployment and Service. Apply records desired state; it does not mean the application is already ready. The next step waits for that evidence.'])
shot('rollout','18 · Wait for the Deployment',['Rollout status waits for the Deployment to become available. If it times out, inspect the failing pod and events. Do not hide an image import, permission or storage failure by moving on to a screenshot of an unrelated working application.'])
shot('resources','19 · Inspect the actual resources',['Check the Deployment, pod, Service and persistent volume claim together. Look for an available replica, a Ready pod and a Bound claim. A bound volume and a running pod are separate checks; neither alone demonstrates the full browser workflow.'])
shot('logs','20 · Read the platform logs',['Read the application logs and confirm the backend is listening on the expected container address. If startup fails, combine logs with pod descriptions and events. Our local service uses the same Express process for the built frontend and API.'])
shot('runtime-audit','21 · Verify the offline runtime',['This check runs inside the real application container. It confirms user one thousand, writable artifacts, absent private files and disabled paid execution. The demonstration does not send any Claude model request or consume your provider credits.'])
shot('volume-write','22 · Write a small persistence proof',['We write a uniquely identified teaching proof file under artifacts. This directory is backed by the persistent volume claim. A successful write proves the application user can use the mounted path; we still need to test what happens after the pod is replaced.'])
shot('replace','23 · Replace only the application pod',['Delete only this tutorial Deployment’s selected application pod. The Deployment controller notices the missing replica and creates a replacement. We leave the claim, namespace and cluster intact. This is a controlled demonstration of reconciliation, not a cluster reset.'])
shot('ready','24 · Wait for the replacement pod',['Wait for the replacement pod to become Ready. A new pod has its own identity but mounts the same persistent claim. Recreating a pod is different from rebuilding an image or changing environment configuration. Each operation solves a different problem.'])
shot('volume-read','25 · Read the retained file',['The replacement pod reads the original proof and checks its exact value. This passing result verifies server storage across this pod replacement. It does not prove disaster recovery. Deleting the claim, deleting the namespace or resetting Desktop Kubernetes can still remove your local data.'])
shot('port-forward','26 · Open a loopback route to the Service',['Run port-forward on the Service, with address one twenty seven dot zero dot zero dot one and host port eighty ninety. Keep its terminal open. We start it after the replacement check because a selected pod being replaced can end an existing forward. The earlier Compose app can keep using eighty eighty.'])
shot('deployed-home','27 · Open the Kubernetes deployed platform',['Open the loopback address at port eighty ninety. This is a real Playwright screenshot of the application served from the Kubernetes workload. The Home page loads the course catalogue from our deployed platform, rather than the Vite development server.'])
shot('backend-health','28 · Check the backend from the browser',['Click Check backend and confirm the health result. This tests the browser route through the local forward and Service to the API. A healthy cluster and a healthy container are useful foundations; the actual browser request verifies the access path students will use.'])
shot('offline-complete','29 · Run a normal offline turn',['Open Lab one, choose Run the exercise and run the normal offline fixture. The completed outcome comes from an authored teaching scenario. It demonstrates application behaviour without pretending that a live Claude request was made.'])
shot('offline-incomplete','30 · Check an incomplete scenario',['Select Stream ends early and run again. The application reports an incomplete outcome. This verifies that the deployed learning interface preserves the distinction between completed work and an interrupted stream, rather than treating any visible text as success.'])
shot('tutor-prepared','31 · Use the prepared AI Tutor',['Open AI Tutor, choose Explain this exercise and ask for prepared guidance. This answer is available without a provider key.', 'The answer badge identifies the prepared mode. Live model execution remains disabled in this deployment. A student can learn the interface before choosing whether to configure paid execution later.'])
shot('notebook-saved','32 · Save a learning note',['Save a note about your deployment checks. We reload the page and verify that it remains. This notebook state is stored by the browser profile and origin. A Kubernetes volume does not back up browser storage, and changing the hostname or port creates a different origin.'])

cards('Troubleshoot the resource that is failing','READ THE EVIDENCE · DO NOT RESET THE CLUSTER',[
 ('image-failure','Image missing','ErrImageNeverPull<br>Check the exact tag.<br>Load the correct node store.','If you see Error Image Never Pull, check the image tag and the actual node store. Building an image on the host does not always load a kind node. The student guide explains our Desktop node import.'),
 ('storage-failure','Storage or startup','Pending claim → storage class<br>Crash loop → logs and events<br>Check memory and permissions.','For a Pending claim, inspect the storage class and claim events. For a crash loop, read logs, previous logs and pod details. Check memory and writable paths. Deleting data is not the first troubleshooting step.'),
 ('forward-failure','Browser access','Keep port-forward running.<br>Restart it after pod replacement.<br>Use the correct local port.','If the browser cannot connect, check the forward process, the Ready pod and the Service. Restart port-forward after pod replacement. This is a local development access method, not a permanent public endpoint.')])

cards('Pause, update and enable optional capabilities','NEXT STEPS · RETAIN THE CLAIM',[
 ('pause','Pause safely','Scale deployment to zero.<br>Keep the persistent claim.<br>Scale to one to resume.','To pause, scale this Deployment to zero replicas. Keep the claim. Scale back to one, wait for readiness and start port-forward again. Do not delete the namespace as routine cleanup because that can delete the claim and its local data.'),
 ('update','Update intentionally','Build a new versioned tag.<br>Load it into the node.<br>Update the Deployment image.','For code updates, build and load a new versioned image, then update the Deployment image reference. Reusing one tag makes rollback harder to explain. Rolling back a Deployment does not restore database contents.'),
 ('live','Configure live use separately','Own API key → Secret<br>Own Managed resource IDs<br>Replace pods to apply changes.','Optional paid use needs your own provider key, Managed resource IDs and explicit live flags. Use a separately managed Secret, not a committed key. Base sixty four encoding is not encryption. Replace pods after runtime configuration changes. We do not enable or test paid integrations in this lesson.')])
shot('final-application','33 · Your platform is running on Kubernetes',['Here is the final application running through the verified Kubernetes deployment. You have checked the image, resource readiness, persistent storage and real offline learning workflows. The student guide includes commands and integration limits. Separate milestone servers and host-specific integrations still need their own setup.'])
source=P/'walkthrough.html'
sections=[]
for index,row in enumerate(slides):
    footer='' if 'class="full"' in row['body'] else f'<div class="footer"><span>CLAUDE MANAGED AGENTS · KUBERNETES · DOCKER DESKTOP</span><span>{index+1:02} / {len(slides):02}</span></div>'
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
    references=[{'title':'Docker Desktop Kubernetes','url':'https://docs.docker.com/desktop/use-desktop/kubernetes/','note':'Create and verify the local cluster; Dashboard location varies by version.'},{'title':'Kubernetes images','url':'https://kubernetes.io/docs/concepts/containers/images/','note':'Image pull policy and node image availability.'},{'title':'Persistent volumes','url':'https://kubernetes.io/docs/concepts/storage/persistent-volumes/','note':'Claims, retention, and storage lifecycle.'},{'title':'Port-forward','url':'https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/','note':'Local access process; restart after replacing a selected pod.'}]
    (V/'narration-plan.json').write_text(json.dumps({'project':NAME,'title':TITLE,'displayTitle':TITLE,'mediaPrefix':'Deploy-Learning-Platform-Kubernetes','outputFile':'Deploy-Learning-Platform-Kubernetes.mp4','presentation':source.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'settings':SETTINGS,'verifyPhraseBoundaries':True,'slides':rows,'referenceNotes':references},indent=2),encoding='utf-8')
    (V/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
print(f'Authored {len(slides)} Kubernetes deployment scenes with real completed deployment evidence.')
