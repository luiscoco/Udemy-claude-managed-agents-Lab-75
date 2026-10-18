$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskDocx = Join-Path $taskRoot 'docs\prompt-migration\Claude-Managed-Agents-Prompts-Labs-01-75.docx'
$taskQa = Join-Path $taskRoot 'artifacts\learning-guide\workbook-review'
New-Item -ItemType Directory -Path $taskQa -Force | Out-Null
$taskWord = $null
$taskDocument = $null
try {
    $taskWord = New-Object -ComObject Word.Application
    $taskWord.Visible = $false
    $taskWord.DisplayAlerts = 0
    $taskDocument = $taskWord.Documents.Open($taskDocx, $false, $true)
    $taskDocument.ActiveWindow.View.Type = 3
    & (Join-Path $PSScriptRoot 'render-learning-workbook-pages.ps1') -Document $taskDocument
} finally {
    if ($null -ne $taskDocument) { $taskDocument.Close(0); [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($taskDocument) }
    if ($null -ne $taskWord) { $taskWord.Quit(); [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($taskWord) }
}
