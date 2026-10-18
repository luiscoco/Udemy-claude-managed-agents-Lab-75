param([object]$Document)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskQa = Join-Path $taskRoot 'artifacts\learning-guide\workbook-review'
$taskDocument = $Document
if ($null -eq $taskDocument) {
    $taskWord = [Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application')
    foreach ($taskCandidate in $taskWord.Documents) {
        if ($taskCandidate.FullName -eq (Join-Path $taskRoot 'docs\prompt-migration\Claude-Managed-Agents-Prompts-Labs-01-75.docx')) { $taskDocument = $taskCandidate; break }
    }
}
if ($null -eq $taskDocument) { throw 'The task workbook must be open in Word.' }
$taskPages = $taskDocument.ActiveWindow.Panes.Item(1).Pages
for ($taskIndex = 1; $taskIndex -le $taskPages.Count; $taskIndex++) {
    $taskPage = $taskPages.Item($taskIndex)
    $taskStream = [System.IO.MemoryStream]::new([byte[]]$taskPage.EnhMetaFileBits)
    $taskMetafile = [System.Drawing.Imaging.Metafile]::new($taskStream)
    $taskBitmap = [System.Drawing.Bitmap]::new([int]($taskPage.Width * 120 / 72), [int]($taskPage.Height * 120 / 72))
    $taskGraphics = [System.Drawing.Graphics]::FromImage($taskBitmap)
    try {
        $taskGraphics.Clear([System.Drawing.Color]::White)
        $taskGraphics.DrawImage($taskMetafile, 0, 0, $taskBitmap.Width, $taskBitmap.Height)
        $taskBitmap.Save((Join-Path $taskQa "page-$taskIndex.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $taskGraphics.Dispose(); $taskBitmap.Dispose(); $taskMetafile.Dispose(); $taskStream.Dispose()
    }
}
Write-Output "Rendered $($taskPages.Count) native Word pages."
