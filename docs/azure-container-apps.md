# Deploying the Claude Managed Agents Learning Platform to Azure

The selected hosting service for this lesson is **Azure Container Apps**, using the existing Linux Docker image. A separate Azure VM is not part of this deployment.

This guide uses the real Azure Container Apps deployment verified for the course recording: private image build, managed identity, password-protected HTTPS, offline exercises, prepared tutor, source inspection and browser notebook reload. Azure CLI and an authenticated Azure subscription are required.

## Prepared deployment files

`azure/container-app.password.template.yaml` defines HTTPS ingress on port 8080, a password-protected recording gateway, managed identity registry access, health probes and disabled model execution. The initial template uses ephemeral server storage; it does not contain a provider key or a database persistence claim.

`scripts/deploy-azure-container-apps.ps1` prepares the dedicated resource group, private Basic registry, image-pull identity and Container Apps environment, builds the image through Azure Container Registry Tasks, then fills and applies the template. Use PowerShell 7. Its default invocation only previews the plan and runs no Azure commands:

```powershell
./scripts/deploy-azure-container-apps.ps1
```

Actual execution requires a subscription ID, an agreed estimated budget and `-Deploy`. Password-protected access is the default. Review the script and charges first. It refuses an existing resource group with a different purpose tag. It does not automatically delete resources or claim browser verification when provisioning returns.

This workspace can use Microsoft's portable Azure CLI under the ignored `artifacts/azure-tools/cli` directory. The script uses a separate ignored Azure configuration directory. A sign-in in the Azure portal does not automatically authenticate that CLI session. Use interactive Microsoft sign-in; never copy credentials into source files.

### Sign in and preview

Install Azure CLI using the official Windows instructions, then run these commands in PowerShell 7 from the course root before using the deployment script:

```powershell
$env:AZURE_CONFIG_DIR = Join-Path (Get-Location) 'artifacts/azure-tools/config'
$env:AZURE_EXTENSION_DIR = Join-Path (Get-Location) 'artifacts/azure-tools/extensions'
az login
az account list --query '[].{name:name,id:id,state:state}' --output table
./scripts/deploy-azure-container-apps.ps1
```

If using the portable distribution instead of a CLI on your PATH, replace `az` with `& ./artifacts/azure-tools/cli/bin/az.cmd`. Complete Microsoft sign-in yourself. Do not record its temporary codes or tokens.

### Create the demonstration app

Select your own subscription ID and a region accepted by that subscription. The default recording mode generates a random private access password; it does not discover or disclose your public IP address. The following placeholders must be replaced before execution:

```powershell
./scripts/deploy-azure-container-apps.ps1 `
  -SubscriptionId '<YOUR-SUBSCRIPTION-GUID>' `
  -Location northeurope `
  -AccessMode password `
  -ApprovedEstimatedBudgetEuros 10 `
  -Deploy
```

The budget argument records an estimate you have agreed to; it does not enforce a billing limit. Change it to suit the resource estimate you reviewed. The recording initially tried West Europe, but Azure rejected new registry customers in that region. North Europe accepted the recording resources. Students must check availability for their own subscription rather than copying an unavailable region.

For infrastructure-only preparation, `-PrepareInfrastructure` builds only the registry, identity, environment and image. It does not create application ingress. Once preparation succeeds, the script saves a local checkpoint and reuses it on the later app-creation run.

Open the HTTPS address returned after app creation and supply your private recording credentials. The generated username and password are saved only in ignored `artifacts/azure-deployment/recording-access.json`. Do not include that file in student ZIPs or screenshots. Verify Home, **Check backend**, Lab 01's normal and interrupted offline fixtures, source viewing, prepared tutor and notebook reload. A successful provisioning response alone does not verify those workflows. The evidence recorder and Playwright capture scripts perform separate checks for the recording:

```powershell
./scripts/record-azure-container-apps-evidence.ps1
node scripts/capture-azure-container-apps.mjs
```

These are instructor recording helpers. They require the actual local deployment status; students can verify the same workflows manually.

`LEARNING_PUBLIC_ORIGIN` sets one exact HTTPS origin for APIs that otherwise require localhost. The server checks the actual Host and Origin headers and does not trust an arbitrary forwarded host. This is a same-origin control, not user authentication. The deployment must also enforce recording access protection or a suitable authentication design.

## Student workflow

1. Install Azure CLI and sign in interactively with `az login`. Keep authentication tokens and credentials out of screenshots and source files.
2. Choose the intended subscription and region. Review the estimated charges for Container Apps, the container registry, logging and any persistent storage. A budget alert is not a hard spending cap.
3. Create a dedicated, tagged resource group for the tutorial. Keep unrelated resources outside it.
4. Build the reviewed Dockerfile and publish the course image to a private Azure Container Registry. Use managed identity and pull-only permissions for the container app instead of embedding a registry password.
5. Create a Container Apps environment and deploy the image. The platform listens on `0.0.0.0:8080`; configure HTTP ingress with target port 8080 and HTTPS.
6. Protect the demonstration with a generated recording password over HTTPS. General student access needs an appropriate authentication and authorization setup; the local course app is not already a public multi-user service.
7. Keep live model execution disabled for the deployment demonstration. Do not put the instructor's Anthropic or Inworld credentials in the image, registry or deployment files.
8. Verify the real deployed application with Playwright: Home, API health, offline scenarios, prepared tutor guidance and browser notebook reload.
9. Inspect revision status and logs, verify configuration updates, and understand the applicable storage behaviour. Stop or remove the dedicated resources when their recording use is finished, following the agreed retention plan.

## Application adaptations to verify

The current platform intentionally permits several APIs only from a localhost origin. Hosting the frontend on an Azure HTTPS domain requires explicit support for that trusted application origin. The deployment work must preserve same-origin checks; setting permissive CORS or trusting arbitrary forwarded headers is not a substitute.

The platform also stores some server data in local files and SQLite. Container Apps container and replica filesystems are ephemeral. Browser notebooks and learning progress use browser storage and are separate from server-side tutor answers and artifacts. Scaling to zero, replacing a replica or switching revisions must not be described as preserving server data without a verified durable storage design.

Azure Files can retain ordinary files, but its availability does not automatically establish SQLite database correctness on a network filesystem. The tutorial must distinguish any verified persistence demonstration from a production database design. Do not present an untested file-share mount as a durable multi-user database solution.

Use one replica for the initial demonstration. A one-replica limit is not a complete concurrency strategy: revisions can overlap during deployment. Durable database migration, broad public student access and external host integrations require additional application design.

## Official references

- [Azure Container Apps overview](https://learn.microsoft.com/en-us/azure/container-apps/overview)
- [HTTP ingress](https://learn.microsoft.com/en-us/azure/container-apps/ingress-overview)
- [IP restrictions](https://learn.microsoft.com/en-us/azure/container-apps/ip-restrictions)
- [Authentication](https://learn.microsoft.com/en-us/azure/container-apps/authentication)
- [Storage mounts and persistence](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts)
- [Azure CLI installation](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)

## Recording access and operational limits

`azure/recording-gateway.mjs` is supplied as a container command override, so the reviewed application image is reused. It starts the application on loopback port 8081 and a protected HTTP gateway on port 8080 behind Azure HTTPS ingress. Azure receives only a credential digest through a secret reference. The randomly generated clear password stays in the instructor's ignored local access file.

Anonymous application requests return 401. The read-only `/api/health` endpoint remains available for startup and readiness probes. The gateway removes the recording Authorization header before proxying to the application. The capture scripts read credentials privately and never draw them into screenshots or narration. This shared recording password is not a production student identity system; use an appropriate authentication and authorization design, such as Microsoft Entra ID, for broader deployment.

The Windows CLI in this recording initially failed to print a Unicode build marker even though the cloud build succeeded. The scripts use the installed CLI's Python runtime with explicit UTF-8 where available. Check an existing ACR run before rebuilding after a local log-display failure; `-ExistingBuildRun` can reuse a verified successful run.

## Retention and cleanup

The recording plan removes only its dedicated resource group after the real application has been captured and the final video checked. Inspect the group and its purpose tag first. Removing the app alone leaves the registry and environment; those resources can continue to incur charges. Do not delete a group containing unrelated resources or student data.

The initial server filesystem is ephemeral. Keeping a replica warm, protecting access or saving an image does not create a durable database. The video must not be used as proof of durable multi-user hosting or backup.

The gateway checks the original browser Origin against the configured HTTPS address before normalizing Host and Origin for the loopback backend. This preserves the course exercise routes’ local-origin contract without permitting foreign browser origins. It also restores exactly the two reviewed starter `.gitignore` files omitted by the recording’s ACR source upload; private environment files remain excluded.
