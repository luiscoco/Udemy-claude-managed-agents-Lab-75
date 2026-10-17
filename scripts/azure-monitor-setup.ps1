param([switch]$Provision, [ValidateSet('westeurope','northeurope')][string]$Location = 'northeurope')
$ErrorActionPreference = 'Stop'
$azureLabGroup = 'rg-claude-managed-labs-monitor'
$azureLabAccount = az account show --output json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or $azureLabAccount.state -ne 'Enabled') { throw 'An enabled Azure CLI subscription is required.' }
if (-not $Provision) { Write-Output "Azure subscription is available. Explicit -Provision creates only $azureLabGroup monitoring resources in $Location. Ingestion is billed by Azure; a 1 GB daily quota is not a spending guarantee."; exit 0 }
$azureLabExists = az group exists --name $azureLabGroup --output tsv
if ($LASTEXITCODE -ne 0) { throw 'Resource group inspection failed; no deployment attempted.' }
if ($azureLabExists -eq 'true') {
  $azureLabPurpose = az group show --name $azureLabGroup --query tags.purpose --output tsv
  if ($azureLabPurpose -ne 'managed-agents-labs') { throw 'Existing resource group is not owned by this setup.' }
} else {
  az group create --name $azureLabGroup --location $Location --tags purpose=managed-agents-labs --output none
  if ($LASTEXITCODE -ne 0) { throw 'Resource group creation failed.' }
}
az deployment group create --resource-group $azureLabGroup --name managed-labs-monitor --template-file (Join-Path $PSScriptRoot 'azure-monitor-resources.json') --parameters "location=$Location" --output none
if ($LASTEXITCODE -ne 0) { throw 'Monitoring deployment failed; no local settings changed.' }
$azureLabComponentId = '/subscriptions/' + $azureLabAccount.id + '/resourceGroups/' + $azureLabGroup + '/providers/Microsoft.Insights/components/managed-labs-insights'
$azureLabComponent = az rest --method get --url ('https://management.azure.com' + $azureLabComponentId + '?api-version=2020-02-02') --output json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $azureLabComponent.properties.ConnectionString) { throw 'Connection information unavailable; no local settings changed.' }
$azureLabEnvPath = Join-Path $PSScriptRoot '..\.env'
$azureLabLines = if (Test-Path -LiteralPath $azureLabEnvPath) { [IO.File]::ReadAllLines($azureLabEnvPath) } else { @() }
$azureLabLines = @($azureLabLines | Where-Object { $_ -notmatch '^(APPLICATIONINSIGHTS_CONNECTION_STRING|LAB44_AZURE_EXPORT_ENABLED)=' })
$azureLabLines += 'APPLICATIONINSIGHTS_CONNECTION_STRING=' + $azureLabComponent.properties.ConnectionString
$azureLabLines += 'LAB44_AZURE_EXPORT_ENABLED=1'
[IO.File]::WriteAllLines($azureLabEnvPath, $azureLabLines, [Text.UTF8Encoding]::new($false))
Write-Output "Azure monitoring configured in $azureLabGroup. Connection information saved only to ignored .env; the Anthropic key was preserved."
