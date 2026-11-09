"""Author the AWS deployment lesson from real CloudShell and browser evidence."""
from pathlib import Path
import ast
import hashlib
import html
import json
from plan_lab_settings import SETTINGS

ROOT = Path(__file__).resolve().parents[1]
NAME = 'aws-ecs-fargate-deployment'
P, V = ROOT / 'presentations' / NAME, ROOT / 'videos' / NAME
V.mkdir(parents=True, exist_ok=True)
captures = json.loads((P / 'platform/capture-evidence.json').read_text(encoding='utf-8'))
deployment = json.loads((P / 'evidence/deployment-evidence.json').read_text(encoding='utf-8'))
assert captures['complete'] and not captures['errors'] and captures['notebookPersistedAfterReload']
assert deployment['cloudProvisioningComplete'] and deployment['httpVerification']['complete']
assert deployment['imageBuild']['buildStatus'] == 'SUCCEEDED'
assert all(row['status'] == 'passed' for row in deployment['httpVerification']['checks'])
TITLE = 'Deploying the Claude Managed Agents Learning Platform to AWS'
author = ast.parse((ROOT / 'scripts/create-ai-tutor-live-lab.py').read_text(encoding='utf-8'))
css = ast.literal_eval(next(node.value for node in author.body if isinstance(node, ast.Assign)
    and any(isinstance(target, ast.Name) and target.id == 'css' for target in node.targets)))
slides = []


def cue(cid, text): return f'<span class="textcue" data-cue="{cid}">{text}</span>'
def head(tag, title): return f'<div class="tag">{tag}</div><h1>{title}</h1>'
def custom(title, body, segments): slides.append({'title': title, 'body': body, 'segments': segments})


def shot(sid, title, narrations):
    item = next(row for row in captures['screenshots'] if row['id'] == sid)
    assert len(item['cues']) == len(narrations), sid
    source = item['kind'] == 'actual-source-or-command-output'
    label = 'ACTUAL SOURCE / IMPORTED CLOUDSHELL RESULTS' if source else 'ACTUAL AWS-HOSTED APPLICATION'
    bar_style = ' style="height:128px"' if source else ''
    body = f'<img class="full" src="platform/{sid}.png"><div class="bar"{bar_style}><h1>{html.escape(title)}</h1><span>{label}</span></div>'
    segments = []
    for target, narration in zip(item['cues'], narrations):
        x, y, w, h = target['rect']
        body += f'<div class="shotcue" data-cue="{target["id"]}" data-visible="{html.escape(target["text"], quote=True)}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>'
        segments.append((target['id'], narration))
    custom(title, body, segments)


def cards(title, tag, entries):
    body = head(tag, title) + '<div class="grid">'
    segments = []
    for cid, label, visible, narration in entries:
        body += '<div class="card"><h2>' + label + '</h2><p>' + cue(cid, visible) + '</p></div>'
        segments.append((cid, narration))
    custom(title, body + '</div>', segments)


def commands(title, cid, code, narration, note, note_narration):
    body = head('CLOUDSHELL · COMMANDS TO REPEAT IN YOUR ACCOUNT', title)
    body += '<div class="two"><div class="panel"><h2>Run in CloudShell</h2><pre style="font-size:25px;line-height:1.7">'
    body += cue(cid, html.escape(code)) + '</pre></div><div class="panel"><h2>Check the result</h2><p>'
    body += cue(cid + '-result', note) + '</p></div></div>'
    custom(title, body, [(cid, narration), (cid + '-result', note_narration)])


custom(TITLE, head('CLAUDE MANAGED AGENTS · LEARN · BUILD · EXPERIMENT',
    cue('cover-title', 'Deploying the Learning Platform<br>to AWS'))
    + '<img class="hero" src="../../public/images/portal-welcome.png"><aside class="cover-side"><h2>Amazon ECS Fargate</h2><p>'
    + cue('cover-route', 'Build in the cloud.<br>Deploy a private image.<br>Verify the real application.')
    + '</p><div class="badge">Luis Coco Enríquez<br><small>Your instructor</small></div></aside>', [
    ('cover-title', 'Welcome. In this lesson, we will deploy the Claude Managed Agents learning platform to AWS using Amazon ECS Fargate.'),
    ('cover-route', 'We will use the existing Docker image definition, a cloud image build, a private registry and real application captures. The deployment commands were executed in AWS CloudShell. Our application checks use offline course scenarios and prepared tutor guidance.')])

cards('Understand the AWS deployment', 'CLOUD BUILD · PRIVATE IMAGE · MANAGED CONTAINER', [
    ('architecture-app', 'The application', 'React frontend and Express API<br>Linux image on port 8080<br>One Fargate task', 'The existing Dockerfile builds the frontend and includes the Express backend and teaching source. Amazon ECS runs the container on Fargate. The recording uses one task with one virtual CPU and two gibibytes of memory. We do not install a separate virtual machine.'),
    ('architecture-build', 'The build path', 'CloudShell coordinates the steps.<br>S3 holds reviewed source.<br>CodeBuild publishes to ECR.', 'CloudShell coordinates the deployment. The reviewed source archive goes into a private S3 bucket. CodeBuild builds the container in AWS and publishes it to a private ECR repository. This avoids installing AWS CLI or Docker on the instructor laptop.'),
    ('architecture-entry', 'The browser path', 'CloudFront browser HTTPS<br>Application Load Balancer<br>Protected recording gateway', 'The browser connects to a CloudFront HTTPS address. CloudFront forwards uncached requests through an Application Load Balancer to the task. A generated recording password protects application access, while the health endpoint remains available for readiness checks.')])

cards('Prepare the account, region and recording budget', 'AWS CONSOLE · CLOUDSHELL · STOCKHOLM', [
    ('signin', 'Use CloudShell', 'Sign in through the AWS console.<br>Open CloudShell.<br>Keep credentials private.', 'Sign in to the AWS console and open CloudShell. It receives the console session credentials, so there is no need to copy access keys to the laptop. Passwords, MFA codes and session tokens must stay outside the lesson captures. This recording uses an IAM user.'),
    ('region', 'Confirm the target', 'Account identity check<br>eu-north-1: Stockholm<br>Existing default VPC', 'Confirm the account identity and set the region explicitly. Our recording uses Stockholm, region eu north one, and three existing default subnets in different availability zones. The driver refuses a different account or an unrelated purpose tag. Students must adapt these account checks deliberately for their own deployment.'),
    ('budget', 'Review costs', 'Agreed recording estimate: €10<br>Compute, build, registry and ALB<br>Estimate is not a spending cap.', 'The instructor selected a ten euro recording budget. This records an estimate, not a hard AWS spending cap. Review current compute, build, image storage, load balancer, public address and data transfer charges. The service and load balancer can continue billing while the application stays provisioned.')])

commands('1 · Confirm identity and select Stockholm', 'identity-command',
    'aws sts get-caller-identity\nexport AWS_REGION=eu-north-1\nexport AWS_DEFAULT_REGION=eu-north-1\nexport AWS_PAGER=""',
    'Run the identity command in CloudShell, then set both region environment variables to Stockholm. Disable the command pager so JSON results remain in the terminal. A blank output from configure get region does not mean CloudShell is unauthenticated.',
    'Match the intended account.<br>Confirm the IAM identity.<br>Use the selected region consistently.',
    'Inspect the returned account and identity before creating resources. Being signed in proves authentication, not permission to create every AWS service. Resolve specific permission errors without making credentials part of the course materials.')

commands('2 · Upload and inspect the reviewed source', 'upload-command',
    "mkdir -p ~/claude-aws\nunzip -o ~/claude-learning-aws.zip \\\n  'aws/*' -d ~/claude-aws\ncd ~/claude-aws\npython3 aws/cloudshell-deploy.py preflight",
    'Upload the prepared source ZIP with the CloudShell Actions menu. Extract only the AWS helper directory. Do not expand the entire media archive into the limited home directory. Change into the helper folder and run preflight.',
    'Template validation passed.<br>Network routes passed.<br>Fargate vCPU quota: 6.',
    'Our actual preflight validated both templates, found suitable subnets and an active internet gateway route, and observed a six virtual CPU Fargate quota. This read-only check does not prove all later creation permissions, so the subsequent stack results remain important.')

shot('dockerfile', '3 · Reuse the application Dockerfile', [
    'The existing Dockerfile installs the locked Node dependencies and runs the application build. Its runtime keeps the source used by the lesson inspector and starter downloads, runs as the node user, and listens on port eighty eighty. Local credentials and generated recording artifacts are excluded from the build context.'])
shot('aws-build', '4 · Build the image inside AWS', [
    'The build template selects private S3 source and the AWS CodeBuild standard image. Docker builds run in the isolated privileged build environment, with a thirty minute build timeout. The image build runs in AWS, so the corporate laptop does not need a local Docker build or AWS CLI installation.'])

commands('5 · Create build resources, then start the image build', 'build-command',
    'python3 aws/cloudshell-deploy.py build \\\n  --source-zip ~/claude-learning-aws.zip \\\n  --approved-budget-eur 10\n\npython3 aws/cloudshell-deploy.py status',
    'The first build invocation creates the dedicated build stack. Poll status until create complete. Repeat the build command once to upload source and start the image build. After it returns a build identifier, use status to poll; do not start another build.',
    'First: stack CREATE_COMPLETE<br>Then: a CodeBuild build identifier<br>Finally: buildStatus SUCCEEDED',
    'The driver separates stack creation from the image build and saves checkpoints in CloudShell. If the shell disconnects, the cloud build continues. Inspect the saved build status rather than treating a missing terminal connection as a reason to launch a duplicate build.')

shot('image-build', '6 · Inspect the successful image build', [
    'These are actual successful CodeBuild results imported from the CloudShell output. The source archive checksum ties the result to the reviewed package. CodeBuild verified the packaged source, built the container, and pushed it to ECR. The app deployment then resolves that immutable image tag to an image digest.'])
shot('aws-roles', '7 · Separate build and runtime permissions', [
    'The execution role can obtain an ECR login token and pull the deployment image from the specified repository. Log writes are separately scoped to the application log group. The application task role has no AWS access policies. CodeBuild has its own role for reading this source and publishing to this registry.'])
shot('aws-network', '8 · Limit access to the application task', [
    'The task security group accepts the application port only from the load balancer security group. The load balancer accepts traffic from the CloudFront origin-facing prefix list and requires a private origin header. Tasks receive a public address for outbound image pulls; their security group does not grant public inbound application access.'])
shot('aws-https', '9 · Configure the browser HTTPS endpoint', [
    'CloudFront redirects browsers to HTTPS and disables caching for this dynamic application. The origin request policy forwards the browser authorization and other request values while replacing the Host header. This recording uses HTTP from CloudFront to the load balancer. It is browser HTTPS, not an end to end TLS claim.'])
shot('aws-offline', '10 · Keep the demonstration offline', [
    'The runtime has an empty Anthropic API key and false live execution flags. The gateway starts the backend on loopback, checks the browser origin and removes recording authorization before proxying. Only a credential digest enters the container configuration. The clear recording password remains in a separate private access file.'])
shot('aws-scale', '11 · Use one small recording task', [
    'The task definition requests one virtual CPU and two gibibytes of memory. The service desired count is one, using the Fargate launch type. This gives us a bounded demonstration workload. One task does not provide redundant application availability, durable server storage or a production multi-user identity system.'])

commands('12 · Deploy the successful image', 'deploy-command',
    'python3 aws/cloudshell-deploy.py deploy \\\n  --approved-budget-eur 10\n\npython3 aws/cloudshell-deploy.py status\n\npython3 aws/cloudshell-deploy.py verify',
    'After the image build succeeds, run deploy with the agreed estimate. It creates a separate app stack. Poll status while the load balancer, CloudFront distribution and Fargate service become ready. Run verify only after provisioning completes and the target is healthy.',
    'Wait for the app stack.<br>Confirm one running task.<br>Verify HTTPS before capture.',
    'A submitted create request is only the beginning. The app stack, service state and healthy load balancer target must agree. If a resource fails or rolls back, inspect the failed layer rather than repeating provisioning or relaxing access restrictions.')

shot('app-status', '13 · Check the actual CloudFormation application', [
    'The actual application stack reached create complete and returned its CloudFront HTTPS hostname. This evidence viewer displays selected real output supplied from CloudShell; it is not a simulated AWS console. The hostname identifies the running recording application at the time of capture.'])
shot('service-health', '14 · Confirm the running task and healthy target', [
    'The real service is active, with desired count one, running count one and pending count zero. The load balancer reports a healthy target. Our driver marks cloud provisioning complete only when these observations agree. Container startup and basic readiness are now established, before the separate browser workflow checks.'])
shot('http-checks', '15 · Verify protected HTTPS behaviour', [
    'All five recorded HTTPS checks passed. Anonymous application access returned unauthorized, while the health endpoint and authenticated Home returned success. A foreign browser origin was denied, and the tutor status confirmed live mode was unavailable. The verification command makes no paid model call.'])
shot('deployed-home', '16 · Open the AWS-hosted learning platform', [
    'This is the actual application captured through the AWS CloudFront hostname using the private recording login. The course Home loads from the deployed container. It is separate from the development server on the instructor laptop, and the same browser origin serves the frontend and application API.'])
shot('backend-health', '17 · Check the backend from the browser', [
    'Click Check backend and inspect the response shown by the application. This traverses the deployed browser route to the running backend. A health response is useful evidence, but it cannot replace testing the student exercises, source inspector and tutor interface. We verify those workflows next.'])
shot('offline-complete', '18 · Complete the normal offline exercise', [
    'Open Lab one, choose the normal offline scenario and run the fixture. The application displays a completed turn outcome. This is the authored learning fixture running through AWS hosting. It proves the deployed exercise workflow works without claiming that the demonstration created a live Claude session.'])
shot('offline-incomplete', '19 · Inspect an interrupted turn', [
    'Choose the Stream ends early scenario and run it. The application reports an incomplete turn. Receiving some text does not prove that a turn finished successfully. This second outcome verifies the intended learning behaviour of the hosted application rather than checking only that its Home page loads.'])
shot('source-inspector', '20 · Read the deployed TypeScript source', [
    'Open the TypeScript source tab and inspect the first lines. The Docker image contains the teaching source required by this feature. Reading that source is another real deployed student workflow, and does not itself execute an integration or call a model.'])
shot('tutor-prepared', '21 · Use the prepared AI Tutor', [
    'Open AI Tutor and request an explanation using prepared guidance. The actual deployed interface returns an answer through the protected HTTPS route.',
    'The answer badge identifies prepared mode. Our browser check also confirms that live answer mode is disabled. The application does not need a provider key to teach this workflow, and this recording sends no paid Claude question.'])
shot('notebook-saved', '22 · Save and reload a browser note', [
    'Save a note about the AWS deployment, reload the application and reopen the notebook. Our capture verified that the note remained. This persistence belongs to the browser profile and hostname. It is distinct from files written inside a Fargate task and is not a durable server database test.'])

cards('Understand storage and production limits', 'BROWSER STATE · TASK FILES · FUTURE DESIGN', [
    ('storage-browser', 'Browser learning state', 'Notebook and progress<br>Same browser and hostname<br>Clearing site data changes it.', 'Browser notebooks can survive a page reload while remaining local to that browser profile. A different hostname, a new profile or clearing browser data can change what the student sees. The successful notebook reload does not establish a shared server backup.'),
    ('storage-server', 'Ephemeral task storage', 'Task replacement can lose files.<br>No durable database is mounted.<br>Keep important data elsewhere.', 'This task definition does not mount durable application storage. The tutor database and server artifacts can be lost when the task is replaced. Saving a container image or keeping a desired task count of one does not turn task files into persistent data.'),
    ('storage-future', 'Plan the next deployment', 'Durable database and backups<br>Student identity and access<br>Separate milestone integrations', 'Broader student access needs an appropriate identity and authorization design. Shared data needs a durable database, backup and concurrency plan. The separate milestone servers and host integrations still require their own setup. Those capabilities are outside this temporary recording deployment.')])

cards('Troubleshoot the failed layer', 'OBSERVE THE RESULT BEFORE RETRYING', [
    ('troubleshoot-build', 'Image build', 'Read the CodeBuild phase.<br>Inspect the build log link.<br>Keep the source checksum.', 'For a failed build, inspect its phase and CloudWatch log link. Verify dependency installation, the frontend build and the ECR push separately. A build can continue after CloudShell disconnects, so use its saved identifier to inspect it before attempting another build.'),
    ('troubleshoot-runtime', 'Container readiness', 'Check task and service events.<br>Check image pull permissions.<br>Inspect the app log group.', 'For runtime failures, inspect the task definition, image digest, execution role and application logs. Confirm the gateway listens on port eighty eighty and the backend starts on loopback. A running task with an unhealthy target needs diagnosis before browser capture.'),
    ('troubleshoot-access', 'Browser requests', 'Use the CloudFront HTTPS URL.<br>Keep recording access private.<br>Match the configured origin.', 'For an access failure, use the exact HTTPS hostname and the generated recording login. The load balancer is deliberately gated, and the application rejects foreign origins. Verify the intended path instead of removing the origin check or exposing the task port directly.')])

commands('23 · Follow the recording retention plan', 'cleanup-command',
    'python3 aws/cloudshell-deploy.py cleanup \\\n  --confirm-delete-account 954718177936 \\\n  --video-verified\n\npython3 aws/cloudshell-deploy.py status',
    'After the video and evidence are verified, use the cleanup command under your chosen retention plan. It requests deletion of the dedicated app stack. Poll status until that stack is absent, then repeat cleanup to remove the build stack and its private image and source resources.',
    'Keep the final video locally.<br>Check both stacks become ABSENT.<br>Preserve the existing VPC.',
    'Stopping one task is insufficient because the ECS service can replace it and the load balancer remains provisioned. The cleanup helper checks purpose tags, refuses unexpected bucket objects and preserves the existing VPC and subnets. This lesson does not claim that deletion has already occurred.')

shot('final-application', 'The verified learning platform running on AWS', [
    'Here is the final real AWS hosted application. You have followed CloudShell preparation, the private cloud image build, Fargate deployment, protected browser HTTPS and the actual offline learning workflows. Use the included deployment guide, source files, chapters and captions to repeat the process in your own account.'])

source = P / 'walkthrough.html'
sections = []
for index, row in enumerate(slides):
    footer = '' if 'class="full"' in row['body'] else f'<div class="footer"><span>CLAUDE MANAGED AGENTS · AWS ECS FARGATE</span><span>{index+1:02} / {len(slides):02}</span></div>'
    sections.append(f'<section class="slide {"active" if index == 0 else ""}">{row["body"]}{footer}</section>')
source.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>' + TITLE + '</title><style>' + css + '</style>' + ''.join(sections) + '</html>', encoding='utf-8')
(P / 'storyboard.json').write_text(json.dumps(slides, indent=2), encoding='utf-8')
(V / 'narration-script.txt').write_text('\n\n'.join(f'{i+1}. {row["title"]}\n' + ' '.join(text for _, text in row['segments']) for i, row in enumerate(slides)), encoding='utf-8')
(V / 'deployment-evidence.json').write_text(json.dumps({'deployment': deployment, 'browser': captures,
    'cloudEvidenceProvenance': 'User-provided AWS CloudShell verify output',
    'browserEvidenceProvenance': 'Direct Playwright capture of the deployed CloudFront origin'}, indent=2), encoding='utf-8')
geometry = P / '.build/video/slides/geometry.json'
if geometry.exists():
    measured = json.loads(geometry.read_text(encoding='utf-8'))
    assert len(measured) == len(slides)
    rows, audit = [], []
    for index, row in enumerate(slides):
        segments = []
        for cid, text in row['segments']:
            target = next(item for item in measured[index]['rects'] if item['id'] == cid)
            segments.append({'id': cid, 'text': text, 'target': {'textRects': [target['rect']], 'paragraphGroups': [[0]]}})
            audit.append({'slide': index+1, 'cue': cid, 'narration': text, 'visibleText': [target['text']]})
        rows.append({'slide': index+1, 'segments': segments})
    references = [
        {'title': 'AWS CloudShell authentication', 'url': 'https://docs.aws.amazon.com/cloudshell/latest/userguide/working-with-aws-cli.html', 'note': 'CloudShell uses the console session; no AWS CLI installation on the recording laptop.'},
        {'title': 'Amazon ECS architecture', 'url': 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-configuration.html', 'note': 'The lesson runs one Fargate task from a private ECR image.'},
        {'title': 'Restrict ALB access through CloudFront', 'url': 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/restrict-access-to-load-balancer.html', 'note': 'The recording uses a private origin header and CloudFront origin-facing prefix list. Browser HTTPS terminates at CloudFront; the ALB origin connection is HTTP.'},
        {'title': 'Fargate ephemeral storage', 'url': 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-task-storage.html', 'note': 'The recording template mounts no durable server database. Browser notebook reload is a separate observation.'},
    ]
    plan = {'project': NAME, 'title': TITLE, 'displayTitle': TITLE,
        'mediaPrefix': 'Deploy-Claude-Managed-Agents-Learning-Platform-AWS',
        'outputFile': 'Deploy-Claude-Managed-Agents-Learning-Platform-AWS.mp4',
        'presentation': source.relative_to(ROOT).as_posix(),
        'presentationSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'settings': SETTINGS, 'verifyPhraseBoundaries': True, 'slides': rows, 'referenceNotes': references}
    (V / 'narration-plan.json').write_text(json.dumps(plan, indent=2), encoding='utf-8')
    (V / 'highlight-semantic-audit.json').write_text(json.dumps(audit, indent=2), encoding='utf-8')
words = sum(len(text.split()) for row in slides for _, text in row['segments'])
print(f'Authored {len(slides)} AWS deployment scenes, {words} narration words, with actual cloud/browser evidence.')
