$ErrorActionPreference = 'Stop'
$mailAuthIds = @(az ad app list --display-name managed-agents-lab65-mail --query "[?displayName=='managed-agents-lab65-mail'].id" --output tsv | Where-Object { $_ -match '^[a-fA-F0-9-]{36}$' })
if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect app registrations.' }
if ($mailAuthIds.Count -gt 1) { throw 'Multiple matching registrations; resolve the ambiguity before setup.' }
if ($mailAuthIds.Count -eq 0) {
  $mailAuthManifest = Join-Path $PSScriptRoot '..\managed\lab65-mail-auth.app.json'
  $mailAuthApp = az rest --method post --url https://graph.microsoft.com/v1.0/applications --body "@$mailAuthManifest" --output json | ConvertFrom-Json
  if ($LASTEXITCODE -ne 0) { throw 'App registration refused; no local settings changed.' }
} else { $mailAuthApp = az ad app show --id $mailAuthIds[0] --output json | ConvertFrom-Json; if ($LASTEXITCODE -ne 0) { throw 'Cannot read registration.' } }
if ($mailAuthApp.signInAudience -ne 'PersonalMicrosoftAccount' -or -not $mailAuthApp.isFallbackPublicClient) { throw 'Existing registration differs from the authored public personal-account client.' }
$mailAuthResources = @($mailAuthApp.requiredResourceAccess)
if ($mailAuthResources.Count -ne 1 -or $mailAuthResources[0].resourceAppId -ne '00000003-0000-0000-c000-000000000000') { throw 'Registration has unexpected API permissions.' }
$mailAuthScopes = @($mailAuthResources[0].resourceAccess)
if ($mailAuthScopes.Count -ne 1 -or $mailAuthScopes[0].id -ne 'e383f46e-2787-4529-855e-0e479a3ffac0' -or $mailAuthScopes[0].type -ne 'Scope' -or $mailAuthApp.api.requestedAccessTokenVersion -ne 2) { throw 'Registration differs from delegated Mail.Send-only setup.' }
$mailAuthEnvPath = Join-Path $PSScriptRoot '..\.env'
$mailAuthLines = if (Test-Path -LiteralPath $mailAuthEnvPath) { [IO.File]::ReadAllLines($mailAuthEnvPath) } else { @() }
$mailAuthLines = @($mailAuthLines | Where-Object { $_ -notmatch '^LAB65_GRAPH_CLIENT_ID=' })
$mailAuthLines += 'LAB65_GRAPH_CLIENT_ID=' + $mailAuthApp.appId
[IO.File]::WriteAllLines($mailAuthEnvPath, $mailAuthLines, [Text.UTF8Encoding]::new($false))
Write-Output 'Dedicated public-client registration ready. No password, client secret, admin grant or mail token was created.'
