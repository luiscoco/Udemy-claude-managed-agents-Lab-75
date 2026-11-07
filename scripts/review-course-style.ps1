param([int]$First=7,[int]$Last=75,[switch]$Recheck,[string]$Only='')
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$app=New-Object -ComObject PowerPoint.Application
try {
 $numbers=if($Only){@($Only.Split(',') | ForEach-Object {[int]$_})}else{@($First..$Last)}
 foreach($n in $numbers){
  $folder=Join-Path $root ('presentations/lab{0:d2}' -f $n)
  $meta=Get-Content (Join-Path $folder 'style-review.json') -Raw | ConvertFrom-Json
  $out=Join-Path $folder 'style-review';New-Item -ItemType Directory -Force -Path $out | Out-Null
  $path=Join-Path $root "presentations/$($meta.path)"
  $deck=$app.Presentations.Open($path,$true,$false,$false)
  $issues=@()
  try {
   $indices=@(1..$deck.Slides.Count)
   $prior=$null
   if($Recheck -and (Test-Path (Join-Path $out 'validation.json'))){
    $prior=Get-Content (Join-Path $out 'validation.json') -Raw | ConvertFrom-Json
    $indices=@(@($prior.textOverflow | ForEach-Object {$_.slide}) + @($meta.pendingReviewSlides) | Sort-Object -Unique)
   }
   foreach($i in $indices){
    $slide=$deck.Slides.Item($i)
    foreach($shape in $slide.Shapes){
     if($shape.HasTextFrame -and $shape.TextFrame.HasText){
      $t=$shape.TextFrame.TextRange
      if($t.BoundHeight -gt ($shape.Height+2) -or $t.BoundWidth -gt ($shape.Width+2)){
       $issues += [pscustomobject]@{slide=$i;shape=$shape.Name;text=$t.Text;left=$shape.Left;top=$shape.Top;width=$shape.Width;height=$shape.Height;boundWidth=$t.BoundWidth;boundHeight=$t.BoundHeight}
      }
     }
    }
    $slide.Export((Join-Path $out "slide-$i.png"),'PNG',1600,900)
   }
   $allChecked=if($prior){@(@($prior.checkedSlides)+@($indices) | Sort-Object -Unique)}else{@($indices)}
   $report=[pscustomobject]@{lab=$n;slides=$deck.Slides.Count;checkedSlides=@($allChecked);recheckedSlides=@($indices);textOverflow=@($issues)}
   $report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $out 'validation.json') -Encoding utf8
   Write-Output "Lab ${n}: $($indices.Count) slides checked; $($issues.Count) text bounds issues."
  } finally {$deck.Close()}
 }
} finally {if($app.Presentations.Count -eq 0){$app.Quit()}}
