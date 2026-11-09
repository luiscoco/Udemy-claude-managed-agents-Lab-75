param([switch]$DeleteRecordingResources)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$private=Join-Path $root 'artifacts/azure-deployment'
$video=Join-Path $root 'videos/azure-container-apps-deployment'
$state=Get-Content -LiteralPath (Join-Path $private 'deployment-status.json') -Raw | ConvertFrom-Json
$prepared=Get-Content -LiteralPath (Join-Path $private 'prepared-infrastructure.json') -Raw | ConvertFrom-Json
if($state.resourceGroup -ne 'rg-claude-learning-azure-video' -or $prepared.subscriptionId -ne $state.subscriptionId){throw 'Refuse cleanup outside the dedicated recording scope.'}
$env:AZURE_CONFIG_DIR=Join-Path $root 'artifacts/azure-tools/config'
$env:AZURE_EXTENSION_DIR=Join-Path $root 'artifacts/azure-tools/extensions'
$cliPython=Join-Path $root 'artifacts/azure-tools/cli/python.exe'
function Read-Azure([string[]]$Arguments){
  $output=& $cliPython -X utf8 -IBm azure.cli @Arguments --only-show-errors
  if($LASTEXITCODE -ne 0){throw 'Azure cleanup inspection failed.'}
  return ($output -join "`n")
}
$group=Read-Azure @('group','show','--subscription',$state.subscriptionId,'--name',$state.resourceGroup,'--output','json') | ConvertFrom-Json
if($group.tags.purpose -ne 'claude-learning-azure-video'){throw 'Recording purpose tag does not match.'}
$expected=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach($id in @($prepared.registry.id,$prepared.identity.id,$prepared.environment.id,('/subscriptions/'+$state.subscriptionId+'/resourceGroups/'+$state.resourceGroup+'/providers/Microsoft.App/containerApps/'+$state.appName))){[void]$expected.Add($id)}
$resources=Read-Azure @('resource','list','--subscription',$state.subscriptionId,'--resource-group',$state.resourceGroup,'--query','[].id','--output','json') | ConvertFrom-Json
foreach($id in $resources){if(-not $expected.Contains($id)){throw 'Unexpected resource in the recording group; no deletion performed.'}}
if(-not $DeleteRecordingResources){Write-Output "Preview passed: only the $($resources.Count) expected tutorial resources are in the dedicated group. No deletion performed.";exit 0}
$validation=Get-Content -LiteralPath (Join-Path $video 'validation.json') -Raw | ConvertFrom-Json
$player=Get-Content -LiteralPath (Join-Path $video 'player-validation.json') -Raw | ConvertFrom-Json
$browser=Get-Content -LiteralPath (Join-Path $root 'presentations/azure-container-apps-deployment/platform/capture-evidence.json') -Raw | ConvertFrom-Json
if($validation.fullVideoAndAudioDecode -ne 'passed' -or $player.playback -ne 'passed' -or $player.chapterSeeking -ne 'passed' -or -not $browser.complete){throw 'Finish and verify the recording before cleanup.'}
Read-Azure @('group','delete','--subscription',$state.subscriptionId,'--name',$state.resourceGroup,'--yes','--no-wait','--output','none') | Out-Null
$removed=$false
for($attempt=0;$attempt -lt 120;$attempt++){
  $exists=Read-Azure @('group','exists','--subscription',$state.subscriptionId,'--name',$state.resourceGroup,'--output','tsv')
  if($exists.Trim() -eq 'false'){$removed=$true;break}
  Start-Sleep -Seconds 5
}
@{resourceGroup=$state.resourceGroup;subscriptionId=$state.subscriptionId;removed=$removed;completedAt=[DateTime]::UtcNow.ToString('o');scopeCheck='purpose tag and exact resource IDs matched';recordedOrigin=$state.origin} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $video 'azure-resource-cleanup.json') -Encoding utf8
if(-not $removed){throw 'Azure deletion is still pending. Do not claim cleanup complete; inspect the dedicated group.'}
$state | Add-Member -NotePropertyName cloudResourcesRemoved -NotePropertyValue $true -Force
$state.cloudProvisioningComplete=$false
$state | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath (Join-Path $private 'deployment-status.json') -Encoding utf8
foreach($name in @('prepared-infrastructure.json','recording-access.json')){Remove-Item -LiteralPath (Join-Path $private $name) -ErrorAction SilentlyContinue}
Write-Output 'Dedicated Azure recording resources are confirmed removed. Local video, evidence and source files remain available.'
