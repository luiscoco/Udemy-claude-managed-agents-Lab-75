param([int]$First=3,[int]$Last=75)
$ErrorActionPreference='Stop'
foreach($lab in $First..$Last){
 & (Join-Path $PSScriptRoot 'export-video-slides.ps1') -Lab $lab
 & (Join-Path $PSScriptRoot 'ocr-video-slides.ps1') -Lab $lab
 Write-Output ('Lab '+$lab+' export and OCR complete.')
}
