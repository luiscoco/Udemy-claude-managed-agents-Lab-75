param([int]$First = 8, [int]$Last = 75, [switch]$UmlOnly, [switch]$FixLayout, [switch]$Recheck)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$outputRoot = Join-Path $root 'presentations/uml-review'
New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
$app = New-Object -ComObject PowerPoint.Application
$checked = @()
try {
    foreach ($number in $First..$Last) {
        $folder = 'lab{0:d2}' -f $number
        $review = Get-Content (Join-Path $root "presentations/$folder/uml-source-review.json") -Raw | ConvertFrom-Json
        $deck = $app.Presentations.Open((Join-Path $root "presentations/$($review.path)"), (-not $FixLayout), $false, $false)
        $issues = @()
        $fixes = @()
        try {
            $directory = Join-Path $outputRoot $folder
            New-Item -ItemType Directory -Force -Path $directory | Out-Null
            $indices = if ($UmlOnly) { @($review.umlSlides) + @($review.liveSlide) } else { @(1..$deck.Slides.Count) }
            $prior = $null
            if ($Recheck -and (Test-Path (Join-Path $directory 'validation.json'))) {
                $prior = Get-Content (Join-Path $directory 'validation.json') -Raw | ConvertFrom-Json
                $indices = @(@($prior.textOverflow | ForEach-Object { $_.slide }) + @($review.layoutRepairs | ForEach-Object { $_.slide }) + @($review.umlSlides) + @($review.liveSlide) | Sort-Object -Unique)
            }
            foreach ($index in $indices) {
                $slide = $deck.Slides.Item($index)
                foreach ($shape in $slide.Shapes) {
                    if ($shape.HasTextFrame -and $shape.TextFrame.HasText) {
                        $range = $shape.TextFrame.TextRange
                        if ($FixLayout -and $range.BoundWidth -gt ($shape.Width + 3) -and $range.BoundWidth -le ($shape.Width + 11)) {
                            # Recover a few points of unused padding, preserving the font.
                            # Only widen within an enclosing panel, or the existing left code column.
                            $rightLimit = if ($shape.Left -lt 470 -and $shape.Left -gt 45 -and $shape.Top -gt 135 -and ($shape.Left + $shape.Width) -le 471) { 471 } elseif ($shape.Width -gt 500 -and ($shape.Left + $shape.Width) -gt 700) { $deck.PageSetup.SlideWidth - 36 } else { $shape.Left + $shape.Width }
                            foreach ($panel in $slide.Shapes) {
                                if (-not $panel.HasTextFrame -or -not $panel.TextFrame.HasText) {
                                    if ($panel.Left -le ($shape.Left - 5) -and $panel.Top -le $shape.Top -and ($panel.Left + $panel.Width) -ge ($shape.Left + $shape.Width) -and ($panel.Top + $panel.Height) -ge ($shape.Top + $shape.Height)) {
                                        $rightLimit = [Math]::Max($rightLimit, ($panel.Left + $panel.Width - 7.2))
                                    }
                                }
                            }
                            $desired = $range.BoundWidth + 2
                            if (($shape.Left + $desired) -le $rightLimit) {
                                $shape.Width = $desired
                                $fixes += [pscustomobject]@{slide=$index; shape=$shape.Name; change='recovered unused horizontal padding'}
                            }
                        }
                        if ($range.BoundHeight -gt ($shape.Height + 3) -or $range.BoundWidth -gt ($shape.Width + 3)) {
                            $issues += [pscustomobject]@{slide=$index; shape=$shape.Name; text=$range.Text; width=$shape.Width; height=$shape.Height; boundWidth=$range.BoundWidth; boundHeight=$range.BoundHeight; uml=($review.umlSlides -contains $index)}
                        }
                    }
                }
            }
            if ($FixLayout -and $fixes.Count) { $deck.Save() }
            foreach ($index in (@($review.umlSlides) + @($review.liveSlide))) {
                $deck.Slides.Item($index).Export((Join-Path $directory "slide-$index.png"), 'PNG', 1600, 900)
            }
            $allChecked = if ($prior) { @(@($prior.checkedSlides) + @($indices) | Sort-Object -Unique) } else { @($indices) }
            $allFixes = if ($prior) { @($prior.fixes) + @($fixes) } else { @($fixes) }
            $report = [pscustomobject]@{lab=$number; path=$review.path; slides=$deck.Slides.Count; checkedSlides=@($allChecked); recheckedSlides=@($indices); umlSlides=@($review.umlSlides); liveSlide=$review.liveSlide; fixes=@($allFixes); textOverflow=@($issues)}
            $report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $directory 'validation.json') -Encoding utf8
            $checked += $report
            Write-Output "Lab ${number}: $($indices.Count) slides checked; $($issues.Count) text bounds issues"
        } finally { $deck.Close() }
        @{first=$First; last=$Last; presentations=@($checked)} | ConvertTo-Json -Depth 9 | Set-Content -LiteralPath (Join-Path $outputRoot "validation-$First-$Last.json") -Encoding utf8
    }
} finally { if ($app.Presentations.Count -eq 0) { $app.Quit() } }
