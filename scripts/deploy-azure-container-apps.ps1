param(
  [ValidatePattern('^[0-9a-fA-F-]{36}$')][string]$SubscriptionId,
  [ValidatePattern('^[a-z0-9]+$')][string]$Location = 'westeurope',
  [double]$ApprovedEstimatedBudgetEuros = 0,
  [ValidateSet('password')][string]$AccessMode = 'password',
  [switch]$Deploy,
  [switch]$PrepareInfrastructure,
  [ValidatePattern('^[A-Za-z0-9]+$')][string]$ExistingBuildRun
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$outputDirectory = Join-Path $repoRoot 'artifacts/azure-deployment'
$resourceGroup = 'rg-claude-learning-azure-video'
$purpose = 'claude-learning-azure-video'
if (-not $Deploy) {
  Write-Output "Preview only: Azure Container Apps, private Basic registry, managed identity, protected HTTPS, one replica in $Location. No Azure commands run."
  Write-Output 'Server files are ephemeral in this initial template. No persistent database or production availability claim.'
  Write-Output 'To deploy, provide -SubscriptionId, -ApprovedEstimatedBudgetEuros and -Deploy; password access is the default after reviewing estimated charges. The estimate is not a hard spending cap.'
  exit 0
}
if (-not $SubscriptionId -or $ApprovedEstimatedBudgetEuros -le 0) { throw 'Subscription and agreed estimated budget are required.' }
$env:AZURE_CONFIG_DIR = Join-Path $repoRoot 'artifacts/azure-tools/config'
$env:AZURE_EXTENSION_DIR = Join-Path $repoRoot 'artifacts/azure-tools/extensions'
$env:AZURE_CORE_COLLECT_TELEMETRY = 'no'
$portableCli = Join-Path $repoRoot 'artifacts/azure-tools/cli/bin/az.cmd'
$script:AzureCli = if (Test-Path -LiteralPath $portableCli) { $portableCli } else { (Get-Command az -ErrorAction Stop).Source }
$script:AzureCliPrefix = @()
$cliPython = Join-Path (Split-Path $script:AzureCli -Parent) '../python.exe'
if (Test-Path -LiteralPath $cliPython) {
  $script:AzureCli = (Resolve-Path -LiteralPath $cliPython).Path
  $script:AzureCliPrefix = @('-X','utf8','-IBm','azure.cli')
}
New-Item -ItemType Directory -Force $outputDirectory | Out-Null
$script:steps = [Collections.Generic.List[object]]::new()
$preparedPath = Join-Path $outputDirectory 'prepared-infrastructure.json'
$prepared = if (Test-Path -LiteralPath $preparedPath) { Get-Content -LiteralPath $preparedPath -Raw | ConvertFrom-Json } else { $null }
if ($prepared -and ($prepared.subscriptionId -ne $SubscriptionId -or $prepared.location -ne $Location -or $prepared.resourceGroup -ne $resourceGroup)) { throw 'Prepared infrastructure does not match this deployment selection.' }
if ($prepared -and (Test-Path -LiteralPath (Join-Path $outputDirectory 'commands.json'))) {
  foreach ($step in @(Get-Content -LiteralPath (Join-Path $outputDirectory 'commands.json') -Raw | ConvertFrom-Json)) { $script:steps.Add($step) }
}
function Invoke-Azure([string]$Step, [string[]]$Arguments) {
  Write-Output "Running $Step" | Out-Host
  $diagnosticPath = Join-Path $outputDirectory ($Step+'.stderr.txt')
  $prefixArguments=$script:AzureCliPrefix
  $result = & $script:AzureCli @prefixArguments @Arguments --only-show-errors 2> $diagnosticPath
  $code = $LASTEXITCODE
  $text = ($result | ForEach-Object { "$_" }) -join "`n"
  $diagnostics = if (Test-Path -LiteralPath $diagnosticPath) { [IO.File]::ReadAllText($diagnosticPath) } else { '' }
  [IO.File]::WriteAllText((Join-Path $outputDirectory ($Step + '.txt')), ('az ' + ($Arguments -join ' ') + "`n`n" + $text + "`n" + $diagnostics + "`n[exit $code]`n"))
  $script:steps.Add(@{ id=$Step; command=('az '+($Arguments -join ' ')); exitCode=$code; completedAt=[DateTime]::UtcNow.ToString('o') })
  $script:steps | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $outputDirectory 'commands.json') -Encoding utf8
  if ($code -ne 0) { throw "Azure step $Step failed; inspect its recorded output. No automatic retry or cleanup was performed." }
  return $text
}
$account = Invoke-Azure '01-account' @('account','show','--subscription',$SubscriptionId,'--query','{id:id,name:name,state:state}','--output','json') | ConvertFrom-Json
if ($account.id -ne $SubscriptionId -or $account.state -ne 'Enabled') { throw 'An enabled matching subscription must be signed in.' }
$exists = Invoke-Azure '02-group-exists' @('group','exists','--subscription',$SubscriptionId,'--name',$resourceGroup,'--output','tsv')
if ($exists.Trim() -eq 'true') {
  $tag = Invoke-Azure '03-group-owner' @('group','show','--subscription',$SubscriptionId,'--name',$resourceGroup,'--query','tags.purpose','--output','tsv')
  if ($tag.Trim() -ne $purpose) { throw 'Refuse to reuse an unrelated resource group.' }
} else {
  Invoke-Azure '03-create-group' @('group','create','--subscription',$SubscriptionId,'--name',$resourceGroup,'--location',$Location,'--tags',"purpose=$purpose",'--output','none') | Out-Null
}
if (-not $prepared) {
foreach ($provider in @('Microsoft.App','Microsoft.ContainerRegistry','Microsoft.ManagedIdentity')) {
  Invoke-Azure ('04-provider-'+$provider.Replace('.','-')) @('provider','register','--subscription',$SubscriptionId,'--namespace',$provider,'--wait','--output','none') | Out-Null
}
$suffix = ([Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($SubscriptionId+$resourceGroup)))).Substring(0,8).ToLowerInvariant()
$registryName = 'cmalearn'+$suffix
$appName = 'claude-learning-'+$suffix
$environmentName = 'claude-learning-env'
$registry = Invoke-Azure '05-registry' @('acr','create','--subscription',$SubscriptionId,'--resource-group',$resourceGroup,'--name',$registryName,'--location',$Location,'--sku','Basic','--admin-enabled','false','--output','json') | ConvertFrom-Json
$identity = Invoke-Azure '06-identity' @('identity','create','--subscription',$SubscriptionId,'--resource-group',$resourceGroup,'--name','platform-image-pull','--location',$Location,'--output','json') | ConvertFrom-Json
Invoke-Azure '07-pull-role' @('role','assignment','create','--subscription',$SubscriptionId,'--assignee-object-id',$identity.principalId,'--assignee-principal-type','ServicePrincipal','--role','AcrPull','--scope',$registry.id,'--output','none') | Out-Null
$environment = Invoke-Azure '08-environment' @('containerapp','env','create','--subscription',$SubscriptionId,'--resource-group',$resourceGroup,'--name',$environmentName,'--location',$Location,'--logs-destination','none','--output','json') | ConvertFrom-Json
$imageTag = 'azure-video-'+[DateTime]::UtcNow.ToString('yyyyMMddHHmmss')
if ($ExistingBuildRun) {
  $build = Invoke-Azure '09-build-status' @('acr','task','show-run','--subscription',$SubscriptionId,'--registry',$registryName,'--run-id',$ExistingBuildRun,'--query','{status:status,outputImages:outputImages}','--output','json') | ConvertFrom-Json
  if ($build.status -ne 'Succeeded' -or @($build.outputImages).Count -ne 1 -or $build.outputImages[0].repository -ne 'learning-platform' -or $build.outputImages[0].registry -ne $registry.loginServer) { throw 'The selected existing build is not a successful matching application image.' }
  $imageTag=$build.outputImages[0].tag
  Invoke-Azure '09-image-build' @('acr','task','logs','--subscription',$SubscriptionId,'--registry',$registryName,'--run-id',$ExistingBuildRun) | Out-Null
} else {
  Push-Location $repoRoot
  try { Invoke-Azure '09-image-build' @('acr','build','--subscription',$SubscriptionId,'--registry',$registryName,'--image',"learning-platform:$imageTag",'--file','Dockerfile','.') | Out-Null } finally { Pop-Location }
}
$prepared = @{ subscriptionId=$SubscriptionId; location=$Location; resourceGroup=$resourceGroup; registry=$registry; identity=$identity; environment=$environment; appName=$appName; imageTag=$imageTag }
$prepared | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $preparedPath -Encoding utf8
} else {
  $registry=$prepared.registry; $identity=$prepared.identity; $environment=$prepared.environment
  $appName=$prepared.appName; $imageTag=$prepared.imageTag
}
if ($PrepareInfrastructure) {
  Write-Output 'Registry, managed identity, environment and image are prepared. No application ingress was created. Run -Deploy without -PrepareInfrastructure to create the password-protected application.'
  exit 0
}
$values = @{
  APP_NAME=$appName; LOCATION=$Location; IDENTITY_ID=$identity.id; ENVIRONMENT_ID=$environment.id
  REGISTRY_SERVER=$registry.loginServer
  IMAGE=($registry.loginServer+"/learning-platform:$imageTag")
  PUBLIC_ORIGIN=('https://'+$appName+'.'+$environment.properties.defaultDomain)
}
$templateFile='azure/container-app.password.template.yaml'
if ($AccessMode -eq 'password') {
  $templateFile='azure/container-app.password.template.yaml'
  $accessPath=Join-Path $outputDirectory 'recording-access.json'
  if (Test-Path -LiteralPath $accessPath) { $access=Get-Content -LiteralPath $accessPath -Raw | ConvertFrom-Json } else {
    $randomPassword=[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).TrimEnd('=').Replace('+','-').Replace('/','_')
    $access=@{username='instructor';password=$randomPassword;origin=$values.PUBLIC_ORIGIN}
    $access | ConvertTo-Json | Set-Content -LiteralPath $accessPath -Encoding utf8
  }
  if ($access.origin -ne $values.PUBLIC_ORIGIN) { throw 'Saved recording credentials belong to a different app.' }
  $values.CREDENTIAL_SHA256=([Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($access.username+':'+$access.password)))).ToLowerInvariant()
  $values.GATEWAY_SOURCE_JSON=[IO.File]::ReadAllText((Join-Path $repoRoot 'azure/recording-gateway.mjs')) | ConvertTo-Json -Compress
  $values.STARTER_SOURCE_BASE64=[Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $repoRoot 'azure/teaching-dotfiles.json')))
}
$yaml = [IO.File]::ReadAllText((Join-Path $repoRoot $templateFile))
foreach ($entry in $values.GetEnumerator()) { $yaml=$yaml.Replace(('${'+$entry.Key+'}'), [string]$entry.Value) }
if ($yaml -match '\$\{[A-Z_]+\}') { throw 'Unresolved deployment template variables.' }
$yamlPath = Join-Path $outputDirectory 'container-app.yaml'
[IO.File]::WriteAllText($yamlPath,$yaml,[Text.UTF8Encoding]::new($false))
$app = Invoke-Azure '10-app' @('containerapp','create','--subscription',$SubscriptionId,'--resource-group',$resourceGroup,'--name',$appName,'--yaml',$yamlPath,'--output','json') | ConvertFrom-Json
$actualOrigin = 'https://'+$app.properties.configuration.ingress.fqdn
if ($actualOrigin -ne $values.PUBLIC_ORIGIN) { throw 'Unexpected ingress hostname; review the explicit origin setting before browser capture.' }
@{ subscriptionId=$SubscriptionId; resourceGroup=$resourceGroup; location=$Location; appName=$appName; origin=$actualOrigin; image=$values.IMAGE; accessMode=$AccessMode; estimatedBudgetEuros=$ApprovedEstimatedBudgetEuros; serverStorage='ephemeral'; providerCalls=0; cloudProvisioningComplete=$true; browserVerificationComplete=$false } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $outputDirectory 'deployment-status.json') -Encoding utf8
Write-Output "Container app created at $actualOrigin. Browser, ingress restrictions, runtime and storage checks are still required."
Write-Output 'No resource deletion was performed. Apply the agreed retention plan after recording; leaving resources provisioned can incur charges.'
