"""Adapt the established recording layout to verified Google Cloud results."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
capture = (ROOT / 'scripts/capture-aws-ecs-fargate.mjs').read_text(encoding='utf-8')
capture = capture.replace('aws-ecs-fargate-deployment', 'gcp-cloud-run-deployment').replace('artifacts/aws-deployment/', 'artifacts/gcp-deployment/')
start = capture.index('const app = rawDeployment.stacks?')
end = capture.index("await mkdir(path.join(base, 'evidence')", start)
capture = capture[:start] + '''if (rawDeployment.projectId !== 'learning-platform-agents-lab' || rawDeployment.region !== 'europe-west1'
    || !rawDeployment.cloudProvisioningComplete || rawDeployment.imageBuild?.status !== 'SUCCESS'
    || !rawDeployment.httpVerification?.complete || rawDeployment.httpVerification.checks.length !== 5
    || rawDeployment.httpVerification.checks.some(row => row.status !== 'passed')
    || rawDeployment.imageBuild.sourceSha256 !== '9c122418aaabcad2b47b7d005c35703ed6baab8171f558bc432ef96e720ff6dc') {
  throw Error('Verified Google Cloud deployment and all five HTTPS checks are required.');
}
const deployment = {origin: rawDeployment.service.origin, complete: true, runtimeAudit: {passwordProtected: true}};
if (deployment.origin !== 'https://cma-learning-video-78c93568-4yahrci5uq-ew.a.run.app') throw Error('Unexpected deployment origin.');
''' + capture[end:]
capture = capture.replace('imported AWS CloudShell results', 'imported Google Cloud Shell results')
start = capture.index('  const appTemplate = ')
end = capture.index("  if (process.argv.includes('--sources-only'))", start)
capture = capture[:start] + '''  const driver = await readFile('gcp/cloudshell-deploy.py', 'utf8');
  const docker = (await readFile('Dockerfile', 'utf8')).split(/\\r?\\n/).slice(0, 10).join('\\n');
  await documentShot('dockerfile', 'Actual Dockerfile · reviewed build stage', docker, 'RUN npm run build', 'Actual repository Dockerfile used by the successful cloud image build.');
  const buildConfig = JSON.parse(await readFile('gcp/cloudbuild.json', 'utf8'));
  await documentShot('gcp-build', 'Actual Cloud Build configuration', JSON.stringify(buildConfig, null, 2), 'gcp/verify-source.py', 'Actual source file: gcp/cloudbuild.json.');
  const excerpt = (first, last) => driver.slice(driver.indexOf(first), driver.indexOf(last, driver.indexOf(first)));
  await documentShot('gcp-roles', 'Dedicated build and runtime permissions', excerpt("    member = 'serviceAccount:'", "    access = read('recording-access.json')"), 'roles/artifactregistry.writer', 'Actual helper: permissions scoped to the tutorial bucket and repository.');
  await documentShot('gcp-staging', 'Use the dedicated source staging bucket', excerpt("    result = gc('builds', 'submit'", "    result = result[0]"), '--gcs-source-staging-dir', 'Actual corrected helper: source staging and logs use the dedicated bucket.');
  await documentShot('gcp-offline', 'Runtime configuration · paid model calls disabled', excerpt("    env = {'LEARNING_RECORDING_GATEWAY'", '    if not existing:'), 'AI_TUTOR_LIVE_ENABLED', 'Actual helper source; only the credential digest is supplied through Secret Manager.');
  await documentShot('gcp-scale', 'Cloud Run · one CPU, two GiB, maximum one instance', excerpt("            gc('run', 'deploy'", '        finally:'), "--max-instances=1", 'Actual Cloud Run deployment arguments; configuration settings are source evidence.');
  const recorded = 'Actual Google Cloud Shell results · ' + rawDeployment.recordedAt;
  for (const [id, title, value, target] of [
    ['image-build', 'Actual Cloud Build result · image build successful', rawDeployment.imageBuild, 'SUCCESS'],
    ['app-status', 'Actual Cloud Run deployment · ready HTTPS origin', {projectId: rawDeployment.projectId, region: rawDeployment.region, origin: rawDeployment.service.origin, ready: rawDeployment.service.ready}, 'true'],
    ['service-health', 'Actual service revision and scaling evidence', {latestReadyRevision: rawDeployment.service.latestReadyRevision, latestCreatedRevision: rawDeployment.service.latestCreatedRevision, scalingAnnotations: rawDeployment.service.scalingAnnotations, cloudProvisioningComplete: rawDeployment.cloudProvisioningComplete}, 'maxScale'],
    ['http-checks', 'Actual HTTPS checks · protected application', rawDeployment.httpVerification.checks, 'anonymous-app-denied'],
  ]) await documentShot(id, title, JSON.stringify(value, null, 2), target, recorded);
''' + capture[end:]
capture = capture.replace('AWS ECS Fargate deployment verified: CloudFront HTTPS serves the course and API through the load balancer and the Fargate task.', 'Google Cloud Run deployment verified: the Cloud Run HTTPS origin serves the course and API from the deployed container.')
capture = capture.replace('AWS ECS Fargate deployment verified', 'Google Cloud Run deployment verified')
(ROOT / 'scripts/capture-gcp-cloud-run.mjs').write_text(capture, encoding='utf-8')

# Preserve shared rendering helpers and measured highlight geometry, author new content separately.
author = (ROOT / 'scripts/create-aws-ecs-fargate-video.py').read_text(encoding='utf-8')
head = author[:author.index('custom(TITLE, head(')]
head = head.replace('AWS deployment lesson', 'Google Cloud deployment lesson').replace('aws-ecs-fargate-deployment', 'gcp-cloud-run-deployment')
head = head.replace("deployment['imageBuild']['buildStatus'] == 'SUCCEEDED'", "deployment['imageBuild']['status'] == 'SUCCESS'")
head = head.replace("TITLE = 'Deploying the Claude Managed Agents Learning Platform to AWS'", "TITLE = 'Deploying the Claude Managed Agents Learning Platform to Google Cloud Services'")
head = head.replace('ACTUAL AWS-HOSTED APPLICATION', 'ACTUAL GOOGLE CLOUD-HOSTED APPLICATION')
tail = author[author.index("source = P / 'walkthrough.html'"):]
tail = tail.replace('AWS ECS FARGATE', 'GOOGLE CLOUD RUN').replace('User-provided AWS CloudShell verify output', 'User-provided Google Cloud Shell verify output')
tail = tail.replace('Direct Playwright capture of the deployed CloudFront origin', 'Direct Playwright capture of the deployed Cloud Run origin')
tail = tail.replace('Deploy-Claude-Managed-Agents-Learning-Platform-AWS', 'Deploy-Claude-Managed-Agents-Learning-Platform-Google-Cloud')
tail = tail.replace('AWS deployment scenes', 'Google Cloud deployment scenes')
start = tail.index('    references = [')
end = tail.index("    plan = ", start)
tail = tail[:start] + '''    references = [
        {'title': 'Google Cloud Shell', 'url': 'https://docs.cloud.google.com/shell/docs/how-cloud-shell-works', 'note': 'Browser Cloud Shell supplies the CLI; no local CLI or Docker installation is needed.'},
        {'title': 'Cloud Build source staging', 'url': 'https://docs.cloud.google.com/sdk/gcloud/reference/builds/submit', 'note': 'Set the source staging directory and log directory to the dedicated tutorial bucket.'},
        {'title': 'Custom build service accounts', 'url': 'https://docs.cloud.google.com/build/docs/securing-builds/configure-user-specified-service-accounts', 'note': 'The build account has scoped storage and registry permissions.'},
        {'title': 'Cloud Run container contract', 'url': 'https://docs.cloud.google.com/run/docs/container-contract', 'note': 'Cloud Run provides managed HTTPS; local container files are ephemeral and consume memory.'},
    ]
''' + tail[end:]
body = (ROOT / 'scripts/gcp-recording-scenes.py').read_text(encoding='utf-8')
(ROOT / 'scripts/create-gcp-cloud-run-video.py').write_text(head + body + '\n' + tail, encoding='utf-8')
print('Prepared Google Cloud capture and lesson authoring scripts.')
