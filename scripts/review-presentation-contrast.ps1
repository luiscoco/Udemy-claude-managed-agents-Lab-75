param([int]$First=1,[int]$Last=75)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
function Get-Luminance([string]$hex){
 $v=@(0,2,4 | ForEach-Object { $c=[Convert]::ToInt32($hex.Substring($_,2),16)/255.0; if($c -le 0.04045){$c/12.92}else{[Math]::Pow(($c+0.055)/1.055,2.4)} })
 return 0.2126*$v[0]+0.7152*$v[1]+0.0722*$v[2]
}
function Get-Hex([long]$rgb){ return ('{0:X2}{1:X2}{2:X2}' -f ($rgb -band 255),(($rgb -shr 8) -band 255),(($rgb -shr 16) -band 255)) }
function Get-TextGroups($shape){
 $text=$shape.TextFrame.TextRange;$rgb=[long]$text.Font.Color.RGB
 if($rgb -ge 0){return [pscustomobject]@{Text=$text.Text;RGB=$rgb}}
 # The older LibreOffice/PptxGenJS decks expose a mixed sentinel through Font.Color.
 # TextFrame2 resolves their DrawingML font fills directly.
 $modern=$shape.TextFrame2.TextRange;$rgb=[long]$modern.Font.Fill.ForeColor.RGB
 if($rgb -ge 0){return [pscustomobject]@{Text=$modern.Text;RGB=$rgb}}
 $parts=$modern.Runs()
 foreach($i in 1..$parts.Count){$run=$modern.Runs($i,1);[pscustomobject]@{Text=$run.Text;RGB=[long]$run.Font.Fill.ForeColor.RGB}}
}
$app=New-Object -ComObject PowerPoint.Application
$all=@()
try {
 foreach($n in $First..$Last){
  $folder=Join-Path $root ('presentations/lab{0:d2}' -f $n)
  $meta=Get-Content (Join-Path $folder 'contrast-review.json') -Raw | ConvertFrom-Json
  $deck=$app.Presentations.Open((Join-Path $root "presentations/$($meta.path)"),$true,$false,$false)
  $issues=@();$unknown=@();$bounds=@();$checked=0;$groups=0
  $directory=Join-Path $folder 'contrast-review';New-Item -ItemType Directory -Force -Path $directory | Out-Null
  try {
   foreach($item in ($meta.shapeBackgrounds | Where-Object {$_.dark})){
    $slide=$deck.Slides.Item($item.slide);$shape=$slide.Shapes.Item($item.shapeIndex)
    if(-not $shape.HasTextFrame -or -not $shape.TextFrame.HasText){continue}
    $checked++;$ranges=@(Get-TextGroups $shape)
    foreach($range in $ranges){
     if(-not $range.Text.Trim()){continue}
     $colour=[long]$range.RGB
     if($colour -lt 0){$unknown+=[pscustomobject]@{slide=$item.slide;shape=$item.shape;text=$range.Text;colour=$colour};continue}
     $groups++;$foreground=Get-Hex $colour;$a=Get-Luminance $foreground;$b=Get-Luminance $item.background
     $ratio=([Math]::Max($a,$b)+0.05)/([Math]::Min($a,$b)+0.05)
     if($ratio -lt 3){$issues+=[pscustomobject]@{slide=$item.slide;shape=$item.shape;text=$range.Text;foreground=$foreground;background=$item.background;ratio=[Math]::Round($ratio,2)}}
    }
   }
   $exports=@($meta.changedSlides)
   if($n -le 5){$exports=@(1,$deck.Slides.Count)}
   foreach($i in $exports){
    $slide=$deck.Slides.Item($i)
    foreach($shape in $slide.Shapes){
     if($shape.HasTextFrame -and $shape.TextFrame.HasText){
      $t=$shape.TextFrame.TextRange
      if($t.BoundHeight -gt ($shape.Height+2) -or $t.BoundWidth -gt ($shape.Width+2)){$bounds+=[pscustomobject]@{slide=$i;shape=$shape.Name;text=$t.Text}}
     }
    }
    $slide.Export((Join-Path $directory "slide-$i.png"),'PNG',1600,900)
    if($n -ge 6){$slide.Export((Join-Path $folder "style-review/slide-$i.png"),'PNG',1600,900)}
   }
   $report=[pscustomobject]@{lab=$n;slidesReviewed=$deck.Slides.Count;darkTextShapesChecked=$checked;resolvedTextGroupsChecked=$groups;minimumContrastRatio=3;issues=@($issues);unresolvedColours=@($unknown);textBoundsIssues=@($bounds);renderedSlides=@($exports)}
   $report | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath (Join-Path $directory 'native-validation.json') -Encoding utf8
   $all+=$report
   Write-Output "Lab ${n}: $checked dark-background text shapes checked; $($issues.Count) contrast issues; $($unknown.Count) unresolved colours."
  }finally{$deck.Close()}
 }
 $all | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $root 'presentations/native-contrast-validation.json') -Encoding utf8
}finally{if($app.Presentations.Count -eq 0){$app.Quit()}}
