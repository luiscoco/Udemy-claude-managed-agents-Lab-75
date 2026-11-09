# Scene definitions consumed by prepare-gcp-recording-assets.py.
custom(TITLE, head('CLAUDE MANAGED AGENTS · LEARN · BUILD · EXPERIMENT',
    cue('cover-title', 'Deploying the Learning Platform<br>to Google Cloud Services'))
    + '<img class="hero" src="../../public/images/portal-welcome.png"><aside class="cover-side"><h2>Google Cloud Run</h2><p>'
    + cue('cover-route', 'Build in the cloud.<br>Deploy a private image.<br>Verify the real application.')
    + '</p><div class="badge">Luis Coco Enríquez<br><small>Your instructor</small></div></aside>', [
    ('cover-title', 'Welcome. In this lesson, we will deploy the Claude Managed Agents learning platform to Google Cloud Services, using Cloud Run.'),
    ('cover-route', 'We will work from browser Cloud Shell, build the existing application in Google Cloud, and deploy a private container image. Then we will verify the real hosted exercises, source inspector, prepared tutor and browser notebook. No paid Claude calls are needed for these checks.')])

cards('Understand the Google Cloud deployment', 'SOURCE ARCHIVE · CLOUD BUILD · CLOUD RUN', [
    ('architecture-app', 'The application', 'React frontend and Express API<br>Linux image on port 8080<br>Managed Cloud Run service', 'The existing Dockerfile packages the React frontend, Express backend, teaching source and course media. Cloud Run runs that Linux image as a managed container service. The recording uses one virtual CPU and two gibibytes of memory per instance, with at most one instance.'),
    ('architecture-build', 'The build path', 'Private Cloud Storage source<br>Cloud Build verifies and builds.<br>Artifact Registry stores the image.', 'Cloud Shell coordinates the work. A private Cloud Storage bucket holds the source archive and build logs. Cloud Build verifies the source checksums, builds the Docker image and publishes it to a private Artifact Registry repository. The laptop needs neither a local Google Cloud CLI nor Docker.'),
    ('architecture-entry', 'The browser path', 'Managed Cloud Run HTTPS URL<br>Generated recording password<br>Frontend and API share one origin.', 'Cloud Run supplies the browser HTTPS address. A generated password protects the recording application. The gateway accepts requests for the configured origin and proxies to the backend on loopback. The frontend and API share one origin, simplifying the deployed browser workflow.')])

cards('Choose an active project and a short recording window', 'BILLING · BELGIUM · TEN EURO ESTIMATE', [
    ('signin', 'Browser login', 'Sign in to Google Cloud.<br>Open Cloud Shell.<br>Keep credentials outside recordings.', 'Sign in through the Google Cloud console and open Cloud Shell. Its browser session gives the command line access to the signed in account. No Google password, service account private key or access token needs to be copied into the lesson package or shared in chat.'),
    ('project', 'Explicit target', 'learning-platform-agents-lab<br>europe-west1: Belgium<br>Active linked billing account', 'The first selected Gemini project had disabled billing because its linked billing account was closed. We selected the learning platform agents lab project, whose linked account was open and billing enabled. Every helper command passes the selected project explicitly, even if the shell prompt shows another project.'),
    ('budget', 'Recording estimate', 'Approved estimate: €10<br>Not a hard spending cap<br>Clean up after verifying the video.', 'The instructor approved a ten euro recording estimate. This is a planning checkpoint, not a hard spending cap or a billing budget configuration. Cloud builds, image storage, network traffic, secrets and retained logs can incur charges. Keep the deployment window short and verify cleanup after the final video.')])

commands('1 · Configure the project and region', 'configure-command',
    'python3 gcp/cloudshell-deploy.py configure \\\n  --project-id YOUR_PROJECT_ID \\\n  --region europe-west1\n\npython3 gcp/cloudshell-deploy.py preflight',
    'Upload the source ZIP using the Cloud Shell menu. Extract only the g c p helper directory into the claude g c p folder, leaving the full source ZIP intact. Run configure with your own project identifier and the chosen region, then run preflight.',
    'Billing must be enabled.<br>Review required APIs.<br>Creation permissions remain unproven.',
    'Configure and preflight read cloud settings and save local checkpoints. They do not create application resources. Our preflight found only the Cloud Build API missing. Authentication and billing readiness do not prove every later creation permission; inspect each actual result.')

commands('2 · Prepare dedicated tutorial resources', 'prepare-command',
    'python3 gcp/cloudshell-deploy.py prepare \\\n  --approved-budget-eur 10',
    'Prepare records the approved estimate, enables the required APIs, and creates the dedicated bucket, registry, secret and two service accounts. Preserve the local state directory because it holds the resource manifest, build checkpoints and private recording access file.',
    'Private source bucket and registry<br>Separate build and runtime identities<br>Generated recording credential digest',
    'Only the hash of the recording username and password goes into Secret Manager. The clear password stays in a separate local access file. The temporary source bucket uses uniform private access and disables soft delete so tutorial source and build log objects do not remain in soft deleted storage after cleanup.')

shot('dockerfile', '3 · Reuse the existing Dockerfile', [
    'This is the actual Dockerfile used for the successful build. It installs locked dependencies and builds the frontend. The runtime includes the lesson source and starter files, runs as the node user and listens on port eighty eighty. Credentials and generated recording artifacts are excluded from the build context.'])
shot('gcp-build', '4 · Verify source before building the image', [
    'The Cloud Build configuration first runs the source checksum verifier. The next step runs Docker build and names the output image in the private Artifact Registry repository. The build has a thirty minute timeout. Its logs go to the dedicated Cloud Storage bucket through the custom build service account.'])
shot('gcp-roles', '5 · Scope build and runtime permissions', [
    'The build account receives storage administration on this tutorial bucket and image writer access on this repository. Those permissions are scoped to individual resources. A separate runtime identity receives secret accessor permission only on the recording digest secret. The application does not receive project wide administrator permissions.'])
shot('gcp-staging', '6 · Keep source staging in the dedicated bucket', [
    'Our first submission exposed an important staging detail. The command copied source into the default Cloud Build bucket, where the custom build account had no read access. We corrected the helper to set the source staging directory explicitly to the tutorial bucket. This fixed the upload path while preserving the scoped permissions.'])

commands('7 · Submit one image build and inspect its status', 'build-command',
    'python3 gcp/cloudshell-deploy.py build \\\n  --source-zip ~/claude-learning-gcp.zip\n\npython3 gcp/cloudshell-deploy.py status',
    'Run build once after preparation succeeds. The helper uploads the full source ZIP, submits the remote build and saves its identifier. After an identifier is returned, repeat status rather than build. The remote build can continue even if the browser Cloud Shell connection disconnects.',
    'WORKING means the build is active.<br>Wait for SUCCESS.<br>Open the saved build log URL.',
    'The successful recording build took about four minutes. Build times depend on dependency downloads, compilation and image upload. An absent Cloud Run service at this stage is expected because deployment has not started. A failed build needs log inspection before another attempt.')
shot('image-build', '8 · Inspect the actual successful build', [
    'This evidence viewer shows selected actual Cloud Shell results. The recorded Cloud Build status is success, with a build identifier, timestamps, log link and source archive checksum. The checksum identifies the original uploaded recording package. Later local helper fixes do not change which application archive this successful build used.'])
shot('gcp-offline', '9 · Keep paid model execution disabled', [
    'The deployment environment enables the password gateway and disables live tutor, managed agent and milestone execution. The Anthropic key is empty. This lesson uses authored offline fixtures and prepared tutor guidance. A successful hosted demonstration therefore does not imply a live Claude session or paid model response.'])
shot('gcp-scale', '10 · Bound the temporary Cloud Run workload', [
    'The helper sets one virtual CPU, two gibibytes of memory, concurrency eight and a maximum of one instance. Minimum instances is zero, so an idle service can scale down. Startup probes check the health endpoint. These controls bound this demonstration, but they do not create a hard spending cap or durable application storage.'])

commands('11 · Deploy the successful image and verify HTTPS', 'deploy-command',
    'python3 gcp/cloudshell-deploy.py deploy \\\n  --approved-budget-eur 10\n\npython3 gcp/cloudshell-deploy.py verify',
    'After build status becomes success, deploy resolves the image digest and creates the Cloud Run service. It initially uses private Cloud Run invocation, obtains the real HTTPS URL and updates the exact application origin. It then allows public transport, while the recording gateway still requires the generated application password.',
    'Wait for the ready revision.<br>Verify all five HTTP checks.<br>Keep the access file private.',
    'An organization policy may forbid public invocation. If that happens, use an administrator approved deployment design rather than weakening the policy. The password protected tutorial gateway is suitable for this temporary recording, but a broad student service needs a separate identity and authorization design.')
shot('app-status', '12 · Confirm the real Cloud Run HTTPS origin', [
    'These are actual imported deployment results from the learning platform project in Belgium. The service is ready and reports its Cloud Run HTTPS origin. The source and command result screens are labelled evidence viewers, not a simulated interactive Google Cloud console. We will now follow that real origin into the application.'])
shot('service-health', '13 · Match the created and ready revisions', [
    'The latest created and latest ready revision identifiers match. The observed scaling annotation reports a maximum of one instance. Together with the public invocation policy and recorded deployment checkpoint, these observations mark cloud provisioning complete. Browser exercises are verified separately from service readiness.'])
shot('http-checks', '14 · Verify the protected application over HTTPS', [
    'All five HTTP checks passed. Anonymous application requests returned unauthorized. The health endpoint and authenticated Home returned success. Requests with a foreign browser origin were denied. Tutor status confirmed live mode was unavailable. These checks establish the intended access behaviour before capturing the student workflows.'])
shot('deployed-home', '15 · Open the Google Cloud hosted platform', [
    'This is the actual application captured through the verified Cloud Run HTTPS origin. Home displays the seventy five implemented lessons from the deployed container. The frontend and backend use the same origin. The private recording credentials are supplied to the browser outside these screenshots and never appear in the video.'])
shot('backend-health', '16 · Check the deployed backend', [
    'Click Check backend from the application. The response travels through the Cloud Run route and recording gateway to the Express backend. Basic readiness is useful, but students need more than a working Home page. We will also run the exercise scenarios, inspect source and request prepared tutor guidance.'])
shot('offline-complete', '17 · Run the normal offline exercise', [
    'Open Lab one and run the normal offline fixture. The actual hosted application reports a completed turn outcome. This exercises the deployed API and learning interface using the authored scenario. It validates the student workflow without creating an external Claude managed session.'])
shot('offline-incomplete', '18 · Inspect a stream that ends early', [
    'Now select the stream ends early scenario and run it. The outcome is incomplete. Receiving some text is different from observing successful completion. This intentional second result demonstrates that the hosted application preserves the course distinction between a completed turn and an interrupted stream.'])
shot('source-inspector', '19 · Inspect the deployed TypeScript source', [
    'Open the TypeScript source tab. The teaching source is available inside the deployed image, allowing students to inspect the implementation alongside the lesson. Viewing source does not execute that integration. It confirms another application feature survived packaging and deployment.'])
shot('tutor-prepared', '20 · Request prepared tutor guidance', [
    'Open AI Tutor, choose Explain this exercise and ask the tutor. The actual deployed interface returns the prepared answer through the protected Cloud Run route.',
    'The badge identifies prepared mode. Our browser capture also checks that live answer mode is disabled. This workflow teaches how guidance appears without requiring a provider key or making a paid Claude request.'])
shot('notebook-saved', '21 · Save a browser notebook and reload', [
    'Save a note about the Google Cloud deployment, reload and reopen the notebook. Our direct browser check confirmed that the note survived. This is browser learning state associated with the profile and origin. It is separate from container files and does not demonstrate a shared database or server backup.'])

cards('Understand storage and production limits', 'BROWSER STATE · EPHEMERAL CONTAINER FILES', [
    ('storage-browser', 'Browser learning state', 'Notebook and progress<br>Same browser and origin<br>Not a shared server database', 'Notebook and progress state can survive reload in the same browser. Clearing site data, changing profiles or changing hostnames can affect that state. Export important learning notes when appropriate. Browser persistence is a separate observation from durable application storage.'),
    ('storage-server', 'Ephemeral server storage', 'Instances can stop or be replaced.<br>Local files can disappear.<br>File writes consume memory.', 'Cloud Run container files are ephemeral, and writes consume instance memory. Scale to zero or instance replacement can discard server data. This recording mounts no durable database. Do not place important student records or real secrets in temporary container files.'),
    ('storage-future', 'Broader student hosting', 'Durable data and backup plan<br>Student identity and authorization<br>Separate milestone services', 'A broader student platform needs an identity design, durable database, backups and an appropriate concurrency plan. Separate milestone servers and host integrations need their own configuration. A maximum of one instance and a shared recording password do not supply those production capabilities.')])

cards('Troubleshoot the layer that failed', 'OBSERVE BEFORE RETRYING', [
    ('troubleshoot-build', 'Source and image build', 'Check source staging bucket.<br>Inspect Cloud Build logs.<br>Keep the build identifier.', 'For source permission errors, check the actual object path and custom build identity. Explicit source staging avoids silently using the default bucket. For image build failures, inspect dependency installation, source verification, frontend compilation and registry push in the build log.'),
    ('troubleshoot-runtime', 'Container startup', 'Inspect revision readiness.<br>Check image and secret access.<br>Read Cloud Run logs.', 'For startup failures, inspect the failing revision and its logs. Confirm the expected image digest, runtime secret access and application port. The gateway listens on eighty eighty and starts the backend on loopback. Readiness failures need diagnosis before recording.'),
    ('troubleshoot-access', 'Browser access', 'Use the exact HTTPS origin.<br>Use the recording login.<br>Keep live mode disabled.', 'For browser failures, use the exact Cloud Run HTTPS origin and generated recording login. A four oh one response without that login is expected. A foreign origin should be rejected. Preserve those checks while diagnosing the affected request.')])

commands('22 · Clean up after verifying the final video', 'cleanup-command',
    'python3 gcp/cloudshell-deploy.py cleanup \\\n  --confirm-delete-project YOUR_PROJECT_ID \\\n  --video-verified\n\npython3 gcp/cloudshell-deploy.py status',
    'After the final video and evidence are verified, run cleanup with your exact project identifier. Despite the flag name, this confirms which project contains the tutorial resources; it does not delete the project. The helper checks ownership before removing the tutorial service, repository, bucket, digest secret and two service accounts.',
    'All six resource statuses: ABSENT<br>Preserve shared project and billing.<br>Review retained logs and stray uploads.',
    'Verify that cleanup complete is true and all six tutorial resources are absent. Existing project services, enabled APIs and billing settings remain. Shared logs and build history follow their retention policies. Remove any specifically identified failed source uploads separately, preserving shared buckets and unrelated objects. This recorded lesson does not claim cleanup has already occurred.')
shot('final-application', 'The verified learning platform on Google Cloud Run', [
    'Here is the final real Google Cloud hosted application. You have followed project and billing checks, scoped build permissions, source staging, the private image build, Cloud Run deployment and actual browser workflows. Use the included guide, source, captions and chapters to repeat the deployment in your own project, then verify cleanup when your recording is complete.'])
