"""Teach the actual, checked local Docker deployment using real captured evidence."""
from pathlib import Path
import ast, hashlib, html, json
from plan_lab_settings import SETTINGS

ROOT = Path(__file__).resolve().parents[1]
NAME = 'docker-desktop-deployment'
P, V = ROOT/'presentations'/NAME, ROOT/'videos'/NAME
V.mkdir(parents=True, exist_ok=True)
captures = json.loads((P/'platform/capture-evidence.json').read_text(encoding='utf-8'))
recorded_deployment = P/'evidence/initial-deployment-evidence.json'
if not recorded_deployment.exists(): recorded_deployment = P/'evidence/deployment-evidence.json'
deployment = json.loads(recorded_deployment.read_text(encoding='utf-8'))
lifecycle = json.loads((P/'evidence/lifecycle-evidence.json').read_text(encoding='utf-8'))
assert captures['complete'] and deployment['complete'] and lifecycle['complete']
assert all(row['status'] == 'passed' for row in deployment['commands']+lifecycle['commands'])
assert captures['notebookPersistedAfterReload'] and not captures['errors']
assert all(row['mode'] in ['scripted', 'prepared'] for row in captures['requests'])
TITLE = 'Deploy your Learning Platform to Docker Desktop'
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
    label = 'ACTUAL SOURCE · RECORDED DOCKER OUTPUT' if is_evidence else 'DOCKER DESKTOP · VERIFIED LOCAL DEPLOYMENT'
    body = f'<img class="full" src="platform/{sid}.png"><div class="bar"{bar_style}><h1>{html.escape(title)}</h1><span>{label}</span></div>'
    segments = []
    for target, narration in zip(item['cues'], narrations):
        x,y,w,h = target['rect']
        body += f'<div class="shotcue" data-cue="{target["id"]}" data-visible="{html.escape(target["text"], quote=True)}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>'
        segments.append((target['id'], narration))
    custom(title, body, segments)

custom(TITLE, head('CLAUDE MANAGED AGENTS · LEARN · BUILD · EXPERIMENT',cue('cover-title','Deploy your Learning Platform<br>to Docker Desktop')) + '<img class="hero" src="../../public/images/portal-welcome.png"><aside class="cover-side"><h2>A real local deployment</h2><p>' + cue('cover-route','Build the image.<br>Start the container.<br>Verify the running app.') + '</p><div class="badge">Luis Coco Enríquez<br><small>Your instructor</small></div></aside>', [
    ('cover-title','Welcome. In this lesson, we will deploy your learning platform to Docker Desktop, step by step.'),
    ('cover-route','You will see the actual course files, recorded Docker command results, and real Playwright screenshots of the deployed application. We will also recreate its container and check that the named volume preserves our teaching proof file.')])

custom('Understand what you are deploying', head('BEFORE YOU BEGIN · LOCAL LINUX CONTAINER','One container, one local application address') + '<div class="grid"><div class="card"><h2>Your computer</h2><p>' + cue('host-browser','Browser → localhost:8080<br>Docker Desktop engine<br>Linux container mode') + '</p></div><div class="card"><h2>Platform container</h2><p>' + cue('container-runtime','Built React frontend<br>Express API + Node 24<br>Same browser origin') + '</p></div><div class="card"><h2>Saved server data</h2><p>' + cue('volume-model','Named Docker volumes<br>Separate from the image<br>Separate from browser storage') + '</p></div></div>', [
    ('host-browser','Install and start Docker Desktop using Docker’s current instructions for your operating system. On Windows, configure a supported Linux-container backend such as WSL two. Docker was already installed on this machine; this recording does not simulate an installer run.'),
    ('container-runtime','We will build the React frontend and serve it with the Express API from one Node twenty-four container. The browser uses one address for both. Your usual development application can continue running on its separate ports.'),
    ('volume-model','Named volumes retain server data independently of a container. Browser learning state is a separate kind of storage. This is a local Docker Desktop deployment, not public internet hosting.')])

shot('engine','1 · Confirm the Docker client and engine',[ 'Run docker version in the course folder. Both the client and engine must respond. This real result uses the desktop Linux context. When Docker Desktop is still starting, wait for the engine instead of assuming the command-line client proves it is ready.' ])
shot('compose-version','2 · Confirm Docker Compose is available',[ 'Run docker compose version. This machine has the Compose plugin shown here. Copy the command syntax, not the exact recorded version number. Follow Docker’s current supported installation instructions for your own computer.' ])

custom('Open the supplied course source', head('COURSE FOLDER · KEEP PRIVATE SETTINGS LOCAL','Prepare an explicit offline configuration') + '<div class="two"><div class="panel"><h2>Files supplied with this lesson</h2><p>' + cue('source-files','Dockerfile<br>compose.yaml<br>.dockerignore<br>docker/offline.env.example') + '</p></div><div class="panel"><h2>PowerShell</h2><pre>' + cue('copy-config','Copy-Item docker/offline.env.example docker/offline.env') + '</pre><p>Copy only if the destination does not exist.</p><p>' + cue('offline-scope','No provider key.<br>Paid execution disabled.<br>No model charges for this demo.') + '</p></div></div>', [
    ('source-files','Open the supplied course source containing these deployment files. The Dockerfile describes the image, Compose runs the application, and Docker ignore controls which files may enter the build context. Host dependency installation is not required; the image build handles it.'),
    ('copy-config','Copy the offline environment example to docker slash offline dot env, if that file does not already exist. Do not overwrite settings you want to keep.'),
    ('offline-scope','We explicitly select a no-key configuration for this deployment. The lesson demonstrates authored offline workflows and makes no paid model requests. Keep private credentials out of screenshots and out of the image.')])

shot('dockerfile-build','3 · Inspect the image build stage',[ 'This is the actual Dockerfile. The build stage uses Node twenty-four, installs locked dependencies with npm ci, copies the allowed source and runs npm run build. Copying package manifests first lets later builds reuse dependencies when only application source changes.' ])
shot('dockerfile-runtime','4 · Inspect the runtime and health check',[ 'The runtime serves the built frontend and API together. It runs as the non-root node user and checks the health endpoint. Source and installed teaching dependencies are retained for inspection and runtime adapters. This image prioritizes the learning platform; it is not presented as a minimal production image.' ])
shot('dockerignore','5 · Keep private files out of the build',[ 'Review Docker ignore before building. Private environment files, Git data, generated artifacts, videos, presentation caches and machine-specific records are excluded. Existing course images and prerecorded audio under public are included when supplied. Optional media can make the first image larger; deployment does not generate missing recordings.' ])
shot('offline-environment','6 · Check the offline environment settings',[ 'The example leaves the API key blank and disables live tutor and Managed execution. We pass this file explicitly to Compose. Shell variables can override an env file, so use a clean terminal without provider or live-mode overrides for this offline demonstration.' ])
shot('compose-port','7 · Understand the published port',[ 'Compose maps port eighty eighty on the host loopback interface to port eighty eighty inside the container. Express listens on all interfaces inside its container so Docker can reach it. Only the host’s loopback port is published; open the application locally rather than treating this as a public website.' ])
shot('compose-volumes','8 · Understand the named volumes',[ 'Compose defines separate named volumes for artifacts, sessions, workspaces and logs. They are mounted into writable application directories. Recreating the container should retain these volumes. Later we will test that expectation with an actual proof file, rather than relying only on the configuration.' ])
shot('validate','9 · Validate the Compose configuration',[ 'Run docker compose with the explicit offline env file, then config dash dash quiet. Exit zero confirms the configuration parses. It does not mean the image has built or that the application is healthy. Avoid printing an expanded configuration when real credentials are present.' ])

custom('Build and start the application', head('RUN THESE FROM THE COURSE FOLDER','Build first; then wait for a healthy container') + '<div class="panel"><pre>' + cue('build-command','docker compose --env-file docker/offline.env build') + '<br>' + cue('up-command','docker compose --env-file docker/offline.env up -d --wait --wait-timeout 180') + '</pre></div><p class="note">The first build can take several minutes. The following capture shows its actual result.</p>', [
    ('build-command','Build the image with this command. The first run downloads the Node base image and npm dependencies, compiles the platform and exports its image. The video skips waiting time, but the saved build transcript retains the actual timestamps and result.'),
    ('up-command','After a successful build, start in detached mode and wait for health. The timeout shown applies to startup health, not the preceding image build. If a command fails, inspect that step before moving on.')])

shot('build','10 · Confirm the real image build completed',[ 'Here is the recorded end of the actual build. It exported the image and exited successfully. The first export on this machine took several minutes. A running terminal or a partially downloaded layer would not be enough to claim a successful build.' ])
shot('image','11 · Distinguish an image from a container',[ 'Docker image list now shows the local learning-platform image and its observed size. The course includes media and teaching dependencies, so this is a substantial image. An image is the template; the running container is a separate instance. This lesson does not push the image to a registry.' ])
shot('started','12 · Confirm detached startup and health',[ 'The real Compose startup created and started the dedicated platform container, then waited until it was healthy. Detached mode leaves it running after the command returns. A health check is stronger evidence than merely seeing a container process start.' ])
shot('containers','13 · Inspect the running Compose application',[ 'Run Compose ps. This row reports a healthy container and the published loopback port mapping. You can also inspect this Compose application in Docker Desktop’s container view. This screenshot is a clearly labelled viewer of recorded CLI output, not a simulated Docker Desktop dashboard.' ])
shot('logs','14 · Read the backend startup log',[ 'Use Compose logs to inspect startup. The backend reports port eighty eighty and its internal all-interface address. For the browser, use localhost or one twenty-seven dot zero dot zero dot one on the published host port, not the internal zero address.' ])
shot('runtime-audit','15 · Verify the runtime boundaries',[ 'The real runtime audit confirms user ID one thousand, writable artifacts, no private dot env or Git directory in the application image, and no video output copied into it. It also confirms there is no model key and paid execution is disabled for this deployment.' ])
shot('deployed-home','16 · Open the real deployed learning platform',[ 'Now open http, one twenty-seven dot zero dot zero dot one, port eighty eighty. This is the actual containerized application captured with Playwright. The learning portal and seventy-five lesson entries are available. We are using the published Docker app, not the development server on port fifty-one seventy-four.' ])
shot('backend-health','17 · Check the published application backend',[ 'Choose Check backend on Home. The frontend reaches the API through the same published origin. This verifies connectivity and the current health response; it does not certify every live provider or optional external integration.' ])
shot('offline-controls','18 · Run a real offline lesson request',[ 'Open Lab zero one, select Run the exercise, keep the Normal turn scenario and press Run offline fixture. This sends an actual request through the deployed frontend and API. It uses deterministic teaching data and creates no provider session.' ])
shot('offline-complete','19 · Inspect the completed outcome',[ 'The Normal turn fixture reports completed with end turn. Read the lifecycle evidence as well as the answer. This proves the deployed local exercise path returned its expected authored outcome; it is not a claim that Claude ran during the test.' ])
shot('offline-incomplete','20 · Compare an early-ended stream',[ 'Next select Stream ends early and run it. The result is incomplete, as expected, because completion was not confirmed. This second scenario checks that the deployed application preserves an important distinction instead of calling every visible response successful.' ])
shot('source-inspector','21 · Check source inspection in the image',[ 'Open TypeScript source. The deployed platform still displays the lesson implementation with syntax colours and source controls. This is why the image retains the course source and its teaching dependencies rather than containing only static web assets.' ])
shot('tutor-prepared','22 · Check the prepared AI Tutor',[ 'Open AI Tutor and ask for a prepared explanation. The deployed backend returns the authored guidance for this lab.', 'Its Prepared guidance badge identifies the source. Live Claude is disabled in this no-key deployment. Deploying the platform does not require enabling a paid model.' ])
shot('notebook-saved','23 · Save a browser notebook note',[ 'I saved a notebook note and reloaded the page to verify that it remains. Notebook state belongs to this browser origin. Changing hostname, port, profile or clearing browser storage can affect it. Docker volumes and browser storage solve different persistence problems.' ])
shot('volume-write','24 · Write a server-volume proof file',[ 'For a separate persistence check, we wrote a small teaching proof file into the mounted artifacts directory from inside the container. Its purpose is to verify that server data can survive replacement of the container. It contains no student credentials or model output.' ])
shot('stop','25 · Stop only this Compose application',[ 'We stopped the platform service with Compose. This affects our dedicated deployment rather than stopping Docker Desktop or unrelated applications. We keep its data volumes. Stopping a container is different from deleting its image or removing stored data.' ])
shot('recreate','26 · Recreate the container and wait for health',[ 'Now we recreate the platform container with the same image and named volumes, then wait for healthy startup. A new container is created. This is the useful test: will our existing server data still be there after the container itself is replaced?' ])
shot('volume-read','27 · Confirm data survived recreation',[ 'The actual read check passed. It found the original proof value after recreation, confirming the artifacts volume retained this file. This demonstrates one concrete persistence path; it does not automatically back up the browser or prove every integration stores its data in a volume.' ])
shot('recreated-health','28 · Confirm the recreated app is healthy',[ 'Compose ps again reports healthy, with the same published address. The host health endpoint also passed after recreation. The application is left running so you can inspect it after watching the lesson.' ])

custom('Enable paid models only when you need them', head('OPTIONAL NEXT STEP · NOT RUN IN THIS VIDEO','Configure runtime settings; recreate to apply') + '<div class="grid"><div class="card"><h2>AI Tutor</h2><p>' + cue('optional-tutor','Own server API key<br>AI_TUTOR_LIVE_ENABLED=true<br>Consent for each question') + '</p></div><div class="card"><h2>Managed labs</h2><p>' + cue('optional-managed','Own agent + environment IDs<br>MANAGED_LIVE_ENABLED=true<br>Follow each lab’s setup') + '</p></div><div class="card"><h2>Apply changes</h2><p>' + cue('optional-recreate','Use a private runtime env file.<br>Recreate the container.<br>Restart alone keeps old settings.') + '</p></div></div>', [
    ('optional-tutor','For tailored tutor answers later, configure your own server API key and enable the tutor flag in a separate private runtime env file. The tutor still requires individual paid consent. No paid question is part of this deployment demonstration.'),
    ('optional-managed','Live Managed labs additionally need your own agent and environment IDs and the relevant lab prerequisites. Host tools, Word, notification transports, Python and browser exports need their own setup. Container health alone does not prove these external capabilities work.'),
    ('optional-recreate','Pass the intended runtime env file explicitly and recreate the service to apply changed environment values. A simple restart retains the old container environment. Credentials stay outside image layers, although a Docker administrator can inspect runtime environment values.')])

custom('Troubleshoot and manage the local deployment', head('STUDENT CHECKLIST · READ THE FAILED STEP','Use the correct command for the problem') + '<div class="grid"><div class="card"><h2>Port or startup</h2><p>' + cue('trouble-port','Check Docker’s engine.<br>Inspect Compose ps and logs.<br>Choose a free host port.') + '</p></div><div class="card"><h2>Source update</h2><p>' + cue('trouble-rebuild','Build again after code changes.<br>Run up to replace the container.<br>Wait for health before testing.') + '</p></div><div class="card"><h2>Data and teardown</h2><p>' + cue('trouble-data','stop keeps the container.<br>down keeps named volumes.<br>Do not add --volumes casually.') + '</p></div></div>', [
    ('trouble-port','If startup fails, check the engine, Compose status and logs. If eighty eighty is occupied, set the Docker host-port variable in the offline env file to a free port, recreate the app and use that address. Browser learning state is tied to its original origin.'),
    ('trouble-rebuild','After changing source, rebuild the image and run up again. Restarting an old container does not compile new source. The separate milestone starter downloads remain available; their project servers and dependencies are not installed into this main-platform image.'),
    ('trouble-data','Use stop for a pause. Compose down removes this app’s containers and network but retains named volumes by default. Adding dash dash volumes removes saved server data, so we did not do that. Keep an appropriate backup before intentional deletion.')])
shot('final-application','29 · Your deployed learning platform is running',[ 'Here is the final real application after deployment and lifecycle checks. Open the published local address, choose a lab, and repeat the learning loop: read, run an offline scenario, inspect the evidence and record what you learned.' ])
custom('Your deployment is ready to use', head('BUILD · RUN · VERIFY · KEEP YOUR DATA','Repeat a deployment you can explain') + '<div class="grid"><div class="card"><h2>Build</h2><p>' + cue('recap-build','Review Dockerfile and ignores.<br>Choose explicit configuration.<br>Confirm the build succeeded.') + '</p></div><div class="card"><h2>Run</h2><p>' + cue('recap-run','Start with Compose.<br>Wait for a healthy container.<br>Open the published address.') + '</p></div><div class="card"><h2>Verify</h2><p>' + cue('recap-verify','Test the actual app.<br>Understand both storage types.<br>Retain your data volumes.') + '</p></div></div>', [
    ('recap-build','You have seen the actual files and a successful image build, with private configuration excluded from its layers.'),
    ('recap-run','You have started the platform through Docker Desktop and confirmed the container and application health.'),
    ('recap-verify','You have tested the deployed learning workflow and verified one named-volume persistence path. You are ready to deploy the platform locally and explain what each step proves.')])

source=P/'walkthrough.html'
sections=[]
for index,row in enumerate(slides):
    footer='' if 'class="full"' in row['body'] else f'<div class="footer"><span>CLAUDE MANAGED AGENTS · DOCKER DESKTOP</span><span>{index+1:02} / {len(slides):02}</span></div>'
    sections.append(f'<section class="slide {"active" if index==0 else ""}">{row["body"]}{footer}</section>')
source.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>'+TITLE+'</title><style>'+css+'</style>'+''.join(sections)+'</html>',encoding='utf-8')
(P/'storyboard.json').write_text(json.dumps(slides,indent=2),encoding='utf-8')
(V/'narration-script.txt').write_text('\n\n'.join(f'{i+1}. {row["title"]}\n'+' '.join(text for _,text in row['segments']) for i,row in enumerate(slides)),encoding='utf-8')
(V/'deployment-evidence.json').write_text(json.dumps({'deployment':deployment,'lifecycle':lifecycle,'browser':captures},indent=2),encoding='utf-8')
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
    references=[{'title':'Docker Desktop installation','url':'https://docs.docker.com/desktop/setup/install/windows-install/','note':'Follow current OS-specific installation requirements. Docker was already installed for this recording.'},{'title':'Docker Desktop WSL backend','url':'https://docs.docker.com/desktop/features/wsl/','note':'Windows backend setup and integration.'},{'title':'Compose runtime environment','url':'https://docs.docker.com/compose/how-tos/environment-variables/set-environment-variables/','note':'Explicit env files and environment settings.'}]
    (V/'narration-plan.json').write_text(json.dumps({'project':NAME,'title':TITLE,'displayTitle':TITLE,'mediaPrefix':'Deploy-Learning-Platform-Docker-Desktop','outputFile':'Deploy-Learning-Platform-Docker-Desktop.mp4','presentation':source.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'settings':SETTINGS,'verifyPhraseBoundaries':True,'slides':rows,'referenceNotes':references},indent=2),encoding='utf-8')
    (V/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
print(f'Authored {len(slides)} Docker deployment scenes with real completed deployment evidence.')
