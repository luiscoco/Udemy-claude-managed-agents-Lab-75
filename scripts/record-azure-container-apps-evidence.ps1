$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$privateOutput = Join-Path $root 'artifacts/azure-deployment'
$out = Join-Path $root 'presentations/azure-container-apps-deployment/evidence'
$state = Get-Content -LiteralPath (Join-Path $privateOutput 'deployment-status.json') -Raw | ConvertFrom-Json
if (-not $state.cloudProvisioningComplete -or $state.resourceGroup -ne 'rg-claude-learning-azure-video' -or $state.origin -notmatch '^https://[a-z0-9-]+\.[a-z0-9.-]+\.azurecontainerapps\.io$') { throw 'A matching completed deployment is required.' }
New-Item -ItemType Directory -Force $out | Out-Null
$env:AZURE_CONFIG_DIR = Join-Path $root 'artifacts/azure-tools/config'
$env:AZURE_EXTENSION_DIR = Join-Path $root 'artifacts/azure-tools/extensions'
$azCli = Join-Path $root 'artifacts/azure-tools/cli/bin/az.cmd'
$azCliPython = Join-Path $root 'artifacts/azure-tools/cli/python.exe'
$azCliPrefix = @()
if (Test-Path -LiteralPath $azCliPython) { $azCli=$azCliPython; $azCliPrefix=@('-X','utf8','-IBm','azure.cli') }
$commands = [Collections.Generic.List[object]]::new()
foreach ($step in @(Get-Content -LiteralPath (Join-Path $privateOutput 'commands.json') -Raw | ConvertFrom-Json)) {
  if ($step.exitCode -ne 0) { throw 'Deployment history contains an unreviewed failed command.' }
  $file = Join-Path $privateOutput ($step.id+'.txt')
  if (Test-Path -LiteralPath $file) {
    Copy-Item -LiteralPath $file -Destination (Join-Path $out ($step.id+'.txt')) -Force
    $commands.Add(@{id=$step.id;command=$step.command;status='passed';exitCode=0;finishedAt=$step.completedAt})
  }
}
function Record-Azure([string]$Id,[string[]]$Arguments) {
  $diagnosticPath=Join-Path $out ($Id+'.stderr.txt')
  $text = (& $azCli @azCliPrefix @Arguments --only-show-errors 2> $diagnosticPath | ForEach-Object { "$_" }) -join "`n"
  $code=$LASTEXITCODE
  [IO.File]::WriteAllText((Join-Path $out ($Id+'.txt')), ('az '+($Arguments -join ' ')+"`n`n"+$text+"`n[exit $code]`n"))
  if ($code -ne 0) { throw "$Id failed; inspect recorded output." }
  $commands.Add(@{id=$Id;command=('az '+($Arguments -join ' '));status='passed';exitCode=$code;finishedAt=[DateTime]::UtcNow.ToString('o')})
  return $text
}
Record-Azure '11-cli-version' @('version','--output','json') | Out-Null
$common=@('--subscription',$state.subscriptionId,'--resource-group',$state.resourceGroup,'--name',$state.appName)
$app = Record-Azure '12-app-status' (@('containerapp','show')+$common+@('--query','{name:name,state:properties.provisioningState,fqdn:properties.configuration.ingress.fqdn,latestReadyRevision:properties.latestReadyRevisionName}','--output','json')) | ConvertFrom-Json
if($app.state -ne 'Succeeded' -or -not $app.latestReadyRevision){throw 'App has not reached a ready revision.'}
Record-Azure '13-revisions' (@('containerapp','revision','list')+$common+@('--query','[].{name:name,active:properties.active,health:properties.healthState,running:properties.runningState}','--output','table')) | Out-Null
$configuration = & $azCli @azCliPrefix containerapp show @common --only-show-errors --output json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'Runtime configuration inspection failed.' }
$ingress=$configuration.properties.configuration.ingress
if($ingress.allowInsecure -or $ingress.targetPort -ne 8080){throw 'HTTPS ingress audit failed.'}
$runtime=@($configuration.properties.template.containers[0].env)
$passwordProtected=$state.accessMode -eq 'password'
$requestHeaders=@{}
if($passwordProtected){
  if(($runtime|Where-Object name -eq 'LEARNING_RECORDING_GATEWAY').value -ne 'true' -or ($runtime|Where-Object name -eq 'LEARNING_ACCESS_SHA256').secretRef -ne 'recording-access-digest'){throw 'Password-protection configuration missing.'}
  $access=Get-Content -LiteralPath (Join-Path $privateOutput 'recording-access.json') -Raw | ConvertFrom-Json
  if($access.origin -ne $state.origin){throw 'Recording credentials belong to a different origin.'}
  $requestHeaders.Authorization='Basic '+[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($access.username+':'+$access.password))
  $anonymous=Invoke-WebRequest -Uri $state.origin -SkipHttpErrorCheck
  if($anonymous.StatusCode -ne 401){throw 'Anonymous application access must be rejected.'}
} elseif(@($ingress.ipSecurityRestrictions).Count -ne 1 -or $ingress.ipSecurityRestrictions[0].action -ne 'Allow' -or $ingress.ipSecurityRestrictions[0].ipAddressRange -notmatch '/32$'){throw 'Instructor IP ingress rule missing.'}
foreach($flag in @('AI_TUTOR_LIVE_ENABLED','MANAGED_LIVE_ENABLED','MILESTONE_LIVE_ENABLED')){if(($runtime|Where-Object name -eq $flag).value -ne 'false'){throw "Unexpected live setting: $flag"}}
if(($runtime|Where-Object name -eq 'ANTHROPIC_API_KEY').value -or ($runtime|Where-Object name -eq 'ANTHROPIC_API_KEY').secretRef){throw 'Provider key must remain absent.'}
if(($runtime|Where-Object name -eq 'LEARNING_PUBLIC_ORIGIN').value -ne $state.origin){throw 'Explicit origin does not match the created app.'}
if($configuration.properties.template.scale.maxReplicas -ne 1){throw 'Recording must use one replica per revision.'}
$registries=@($configuration.properties.configuration.registries)
if($registries.Count -ne 1 -or $registries[0].identity -notmatch '/userAssignedIdentities/' -or $registries[0].passwordSecretRef){throw 'Expected password-free managed identity registry access.'}
$health=Invoke-RestMethod -Uri ($state.origin+'/api/health')
$tutor=Invoke-RestMethod -Uri ($state.origin+'/api/ai-tutor/status') -Headers $requestHeaders
if($tutor.liveAvailable){throw 'Paid tutor unexpectedly enabled.'}
$downloads=@()
foreach($id in @('study-coach','agent-evaluation-studio','agent-publishing-studio')){
  $response=Invoke-WebRequest -Uri ($state.origin+'/api/projects/'+$id+'/starter.zip') -Headers $requestHeaders
  if($response.StatusCode -ne 200){throw "Starter ZIP failed: $id"}
  $downloads+=@{id=$id;status=200;bytes=$response.RawContentLength}
}
@{capturedAt=[DateTime]::UtcNow.ToString('o');origin=$state.origin;commands=@($commands.ToArray());complete=$true;providerCalls=0;health=$health;tutor=$tutor;starterDownloads=$downloads;runtimeAudit=@{https=$true;passwordProtected=$passwordProtected;instructorOnlyIpRule=(-not $passwordProtected);anonymousApplicationAccessDenied=$passwordProtected;targetPort=8080;paidModelsEnabled=$false;registryUsesManagedIdentity=$true;serverStorage='ephemeral';durableDatabaseVerified=$false}} | ConvertTo-Json -Depth 25 | Set-Content -LiteralPath (Join-Path $out 'deployment-evidence.json') -Encoding utf8
Write-Output 'Azure readiness, instructor-only HTTPS, offline APIs and starter downloads verified. Browser verification is the next step.'
