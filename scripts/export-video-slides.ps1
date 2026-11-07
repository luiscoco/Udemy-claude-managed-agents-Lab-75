param([int]$Lab=1,[string]$Project='')
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$folder=Join-Path $root ('presentations/lab{0:d2}' -f $Lab)
if($Project){if($Project -notmatch '^[a-z0-9][a-z0-9.-]*$'){throw 'Invalid project name'};$folder=Join-Path $root ('presentations/'+$Project)}
$target=(Get-ChildItem (Join-Path $folder 'output/*.pptx') | Where-Object {$_.Name -notlike '~$*'} | Select-Object -First 1).FullName
$out=Join-Path $folder '.build/video/slides'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$sha=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant()
$stamp=Join-Path $out 'source.sha256'
if((Test-Path $stamp) -and (Get-Content $stamp -Raw).Trim() -eq $sha -and (Test-Path (Join-Path $out 'geometry.json'))){Write-Output ('Lab '+$Lab+' native slide exports are current.');return}
$app=New-Object -ComObject PowerPoint.Application
$owned=$true;$deck=$null
foreach($open in $app.Presentations){if($open.FullName -eq $target){$deck=$open;$owned=$false;break}}
if($null -eq $deck){$deck=$app.Presentations.Open($target,$true,$false,$false)}
try {
 $metadata=@()
 $sx=1920/$deck.PageSetup.SlideWidth;$sy=1080/$deck.PageSetup.SlideHeight
 foreach($slide in $deck.Slides){
  $slide.Export((Join-Path $out ('slide-{0:d2}.png' -f $slide.SlideIndex)),'PNG',1920,1080)
  $shapes=@()
  foreach($shape in $slide.Shapes){
   $paragraphs=@()
   if($shape.HasTextFrame -and $shape.TextFrame.HasText){
    $range=$shape.TextFrame.TextRange
    for($i=1;$i -le $range.Paragraphs().Count;$i++){
     $part=$range.Paragraphs($i,1)
     $paragraphs+=@{text=$part.Text;rect=@(($part.BoundLeft*$sx),($part.BoundTop*$sy),($part.BoundWidth*$sx),($part.BoundHeight*$sy))}
    }
   }
   $shapes+=@{name=$shape.Name;rect=@(($shape.Left*$sx),($shape.Top*$sy),($shape.Width*$sx),($shape.Height*$sy));paragraphs=$paragraphs}
  }
  $metadata+=@{slide=$slide.SlideIndex;shapes=$shapes}
 }
 $metadata | ConvertTo-Json -Depth 9 | Set-Content -LiteralPath (Join-Path $out 'geometry.json') -Encoding utf8
 Set-Content -LiteralPath $stamp -Value $sha -NoNewline
 Write-Output ('Exported '+$deck.Slides.Count+' full-resolution slides.')
}finally{if($owned){$deck.Close()};if($app.Presentations.Count -eq 0){$app.Quit()}}
