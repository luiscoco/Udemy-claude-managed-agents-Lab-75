# Troubleshooting

## Account configuration

Configure your own matching account before preflight. If deployment state
already exists, keep its original account configuration. Changing a folder's
account ID does not move AWS resources.

## Upload or extraction

Check `df -h "$HOME"` and `ls -lh ~/*.zip`. Keep the source ZIP and extract only
aws/*. Do not expand all media in CloudShell. If the filename acquired a suffix
such as (1), adjust the source path or rename the upload before starting.

## Budget or shell variable errors

Use a positive number with a decimal point. Shell variables disappear in a new
terminal; restore the saved budget as shown in the guide. No estimate enforces a cap.

## AccessDenied / UnauthorizedOperation

Report the exact denied action/resource to your training administrator. Use the
templates and IAM-REQUIREMENTS.md as context. Preflight checks do not prove all
creation permissions. Do not share tokens, access JSON, CloudFront configuration
or listener rules: the latter can contain the private origin header.

## Missing default network, routes or quota

Have the administrator prepare a suitable course account/network or deliberately
adapt/review the templates. The helper does not create a default VPC. Fargate
quota is regional; the recorded quota is not a promise about a new account.

## Build resources still creating

Use status until the build stack reaches CREATE_COMPLETE. The first build call
creates infrastructure; the second starts the image build. Avoid repeated creates.

## Build running / CloudShell disconnected

Use status with the same saved buildId. BUILD and POST_BUILD are intermediate
phases. Wait for SUCCEEDED before deploy. The cloud build continues after a
CloudShell disconnect; return to the same helper folder and keep its state.

## Build failed

Follow the build log deepLink from status. Inspect source download, manifest
verification, npm installation, application build and ECR push separately.
Do not modify the ZIP after checksums were generated. Additional build calls are
blocked after a buildId is saved. Do not delete state to force a retry. After
diagnosis, an experienced operator may explicitly retry the existing CodeBuild
build with its project/source settings, or remove this dedicated deployment and
start a reviewed clean attempt. Retrying is not polling.

## App failure / rollback

Inspect the first failure in the dedicated CloudFormation stack Events tab,
then ECS service events and the app log group if relevant. Check permissions,
quotas, image digest/pull role, outbound network path and port 8080. The gateway
starts its backend on loopback port 8081. The helper does not overwrite an
existing app stack. Do not relax security groups to bypass a startup error.

## Browser 401 / 403 / 502

Anonymous 401 is expected. Run access privately and use its generated login at
your own returned CloudFront HTTPS origin. Foreign Origin requests are deliberately
denied. A 502 can indicate startup/backend failure: inspect target health/logs.
Do not substitute a task IP or the ALB URL. The app password is not your AWS login.

## HTTP checks disappear from evidence

Status refreshes evidence.json. Run verify again for current HTTP results.
Neither command marks the manual browser exercises complete.

## Notebook state

Use the same browser profile and hostname. Clearing site data or changing
profiles changes browser-local notes. The template does not configure durable
server data, database backups or a production student identity system.

## Cleanup pending / failed

CloudFront deletion takes time. Poll until the app stack is ABSENT, then run
cleanup again for the build stack. Resolve the exact failed deletion resource;
do not assume a submitted delete stops all charges. Unexpected source-bucket
objects intentionally block automatic removal. Preserve unrelated resources and
keep your original helper/state until both stacks are ABSENT.

## Offline helper checks

After extracting the full kit on a development machine, run:

```bash
python scripts/test-aws-deployment.py
```

These checks mock AWS. They verify account configuration and guards, state
preservation, duplicate-build prevention, budget validation, cleanup guards and
credential redaction. They create no AWS resources.
