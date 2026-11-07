param([int]$Lab=2,[switch]$Isolated,[string]$Project='')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null=[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
$null=[Windows.Graphics.Imaging.BitmapDecoder,Windows.Foundation,ContentType=WindowsRuntime]
$null=[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
$null=[Windows.Globalization.Language,Windows.Foundation,ContentType=WindowsRuntime]
$awaiter=[System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {$_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'} | Select-Object -First 1
function Await-Result($operation,[Type]$type){$task=$awaiter.MakeGenericMethod($type).Invoke($null,@($operation));$task.Wait();return $task.Result}
$root=Split-Path $PSScriptRoot -Parent
$directory=Join-Path $root ('presentations/lab{0:d2}/.build/video/slides' -f $Lab)
if($Project){if($Project -notmatch '^[a-z0-9][a-z0-9.-]*$'){throw 'Invalid project name'};$directory=Join-Path $root ('presentations/'+$Project+'/.build/video/slides')}
$engine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))
if($null -eq $engine){$engine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()}
if($null -eq $engine){foreach($language in [Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages){$engine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($language);if($null -ne $engine){break}}}
if($null -eq $engine){throw 'No installed Windows OCR language is available.'}
$result=@()
foreach($image in (Get-ChildItem (Join-Path $directory 'slide-*.png') | Sort-Object Name)){
 $file=Await-Result ([Windows.Storage.StorageFile]::GetFileFromPathAsync($image.FullName)) ([Windows.Storage.StorageFile])
 $stream=Await-Result ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
 try{
  $decoder=Await-Result ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bitmap=Await-Result ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  try{
   $recognized=Await-Result ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
   if($null -eq $recognized.Text){
    if($Isolated){throw 'Windows OCR returned missing text in an isolated process.'}
    $isolatedArgs=@('-NoProfile','-ExecutionPolicy','Bypass','-File',$PSCommandPath,'-Lab',$Lab,'-Isolated')
    if($Project){$isolatedArgs+=@('-Project',$Project)}
    & powershell @isolatedArgs
    if($LASTEXITCODE -ne 0){throw 'Isolated Windows OCR failed.'}
    return
   }
   $lines=@()
   foreach($line in $recognized.Lines){
    $words=@();foreach($word in $line.Words){$r=$word.BoundingRect;$words+=@{text=$word.Text;rect=@($r.X,$r.Y,$r.Width,$r.Height)}}
    $lines+=@{text=$line.Text;words=$words}
   }
   $result+=@{slide=[int]([regex]::Match($image.BaseName,'\d+').Value);lines=$lines}
  }finally{$bitmap.Dispose()}
 }finally{$stream.Dispose()}
}
$temporary=Join-Path $directory ('ocr.'+$PID+'.tmp.json')
$result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $temporary -Encoding utf8
Move-Item -LiteralPath $temporary -Destination (Join-Path $directory 'ocr.json') -Force
Write-Output ('OCR measured '+$result.Count+' slides for Lab '+$Lab)
