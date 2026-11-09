# Google Cloud deployment recording

This package deploys the course application to Cloud Run, using Cloud Build,
Artifact Registry, a private Cloud Storage source/log bucket and Secret Manager.
Use browser Cloud Shell; no local CLI or Docker installation is required.
The application source and course media match the verified AWS recording snapshot.

## 1. Choose your project

Use an active project with billing enabled. The operator needs permission to
enable APIs, create the listed resources, manage their IAM policies, use the build
and runtime service accounts, and allow public Cloud Run invocation. An
organization policy may forbid public invocation. Do not bypass such a policy.
The helper does not grant project-wide administrator roles to its service accounts.

Upload `claude-learning-gcp.zip` using Cloud Shell's three-dot menu, Upload.
Extract only the small deployment tools, keeping the full source ZIP intact:

```bash
mkdir -p ~/claude-gcp
unzip -o ~/claude-learning-gcp.zip 'gcp/*' -d ~/claude-gcp
cd ~/claude-gcp
python3 gcp/cloudshell-deploy.py configure \
  --project-id YOUR_PROJECT_ID --region europe-west1
python3 gcp/cloudshell-deploy.py preflight
```

Replace YOUR_PROJECT_ID with your own project ID. For the instructor recording,
the selected project is `learning-platform-agents-lab`. Belgium (`europe-west1`)
is the default; Madrid (`europe-southwest1`) is also supported. Choose before
preparing resources. Project and region are locked into the local manifest.
Configure and preflight perform cloud reads and write only local state files.
They do not verify all creation permissions. No passwords, tokens, Google login
details or service-account private keys need to be shared.

## 2. Prepare and build

Deployment is billable. Enter your approved estimate in euros; this records an
estimate and does not create a billing budget or hard spending cap. Cloud Run
scales to zero, with a maximum of one instance; builds, storage, network, secrets
and retained logs can still incur charges. Keep this temporary deployment short.

```bash
read -rp 'Approved recording budget estimate in EUR: ' DEMO_BUDGET_EUR
python3 gcp/cloudshell-deploy.py prepare --approved-budget-eur "$DEMO_BUDGET_EUR"
python3 gcp/cloudshell-deploy.py build --source-zip ~/claude-learning-gcp.zip
python3 gcp/cloudshell-deploy.py status
```

Repeat **status**, not build, until imageBuild.status is SUCCESS. The first
build installs dependencies and compiles the application remotely. Its logUrl
opens the Google Cloud build log. Stop and inspect failures rather than starting
duplicate builds. Preserve `gcp-state/` and `gcp/deployment-config.json` to resume.
Do not put these files in a source archive or commit them.

The bucket is private with uniform access and soft delete disabled for this
temporary tutorial data. The build account has bucket-scoped storage.admin and
repository-scoped artifactregistry.writer. The runtime account has access only
to the recording credential digest secret. Source checksums are verified in
Cloud Build before the Docker image is built. The final image uses its digest.

## 3. Deploy and verify

```bash
python3 gcp/cloudshell-deploy.py deploy --approved-budget-eur "$DEMO_BUDGET_EUR"
python3 gcp/cloudshell-deploy.py status
python3 gcp/cloudshell-deploy.py verify
```

Cloud Run supplies the HTTPS URL. The helper initially deploys with private
Cloud Run IAM, sets the exact observed application origin, then allows public
transport. A generated HTTP Basic password still protects the application.
The public health endpoint supports readiness checks. Paid model calls are
disabled; the course application runs in its teaching/demo mode.

Verify checks anonymous denial (401), readiness (200), authenticated home (200),
foreign-origin denial (403) and disabled live tutor (200). Browser verification
is a separate step: open the origin, log in, navigate lessons, open a starter
download and check the tutor demo before recording. Server files are ephemeral;
do not use this temporary service for durable student progress or real secrets.

To display credentials privately, outside the screen recording:

```bash
python3 gcp/cloudshell-deploy.py access
```

Do not paste that output into chat or include it in a video. To download evidence
and access files with Cloud Shell's Download menu, use these paths:

```text
/home/YOUR_CLOUD_SHELL_USER/claude-gcp/gcp-state/evidence.json
/home/YOUR_CLOUD_SHELL_USER/claude-gcp/gcp-state/recording-access.json
```

Run `pwd` inside `~/claude-gcp` to determine the actual path. Evidence contains
project/resource identifiers but no recording password. Keep the access file
private and share it only through the established local recording workflow.

## 4. Remove tutorial resources after verifying the final MP4

```bash
python3 gcp/cloudshell-deploy.py cleanup \
  --confirm-delete-project YOUR_PROJECT_ID --video-verified
python3 gcp/cloudshell-deploy.py status
```

The confirmation identifies the project containing the resources; **the project
itself is preserved**. Cleanup checks ownership markers before deleting the
tutorial Cloud Run service, image repository, source/log bucket, digest secret
and two service accounts. It cancels an active build first. Check cleanupComplete
is true and all six resource statuses are ABSENT. If an asynchronous deletion
or temporary API error occurs, inspect it and repeat cleanup/status.

Existing projects, Gemini resources, billing accounts and enabled APIs are
preserved. Shared Cloud Logging and build history follow provider/project
retention policies. This helper does not delete shared log buckets or assert
that unrelated resources elsewhere in the account incur no cost. Review Billing
Reports after usage has settled. Retain local cleanup evidence with the video.

## Troubleshooting

- Billing disabled: select a project linked to an open billing account.
- Permission denied: ask your project administrator for the specific operation
  reported. Do not share access tokens or grant blanket roles to runtime code.
- API activation/IAM propagation delay: retry prepare after the error clears.
- Build failure: inspect the build log; do not deploy a failed or unexpected image.
- Organization forbids allUsers: stop; this browser recording workflow requires
  administrator-approved public transport plus the application password gateway.
- Browser 401: use the generated username/password from access, not Google login.
- Readiness failure: inspect the Cloud Run revision log and the gateway startup.
- Unrelated-resource refusal: inspect the resource labels; never relabel existing
  shared resources just to force deployment or deletion.
- Lost local state/password: restore the original private files before proceeding.

## Official references

- https://docs.cloud.google.com/shell/docs/how-cloud-shell-works
- https://docs.cloud.google.com/run/docs/deploying
- https://docs.cloud.google.com/build/docs/securing-builds/configure-user-specified-service-accounts
- https://docs.cloud.google.com/sdk/gcloud/reference/builds/submit
- https://docs.cloud.google.com/sdk/gcloud/reference/storage/buckets/create
