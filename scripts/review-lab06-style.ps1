$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$path = Join-Path $root 'presentations/lab06/output/Lab06-Claude-Managed-Agents-Sessions-and-retained-context.pptx'
$directory = Join-Path $root 'presentations/lab06/style-review'
New-Item -ItemType Directory -Force -Path $directory | Out-Null
$app = New-Object -ComObject PowerPoint.Application
$issues = @()
try {
    $deck = $app.Presentations.Open($path, $true, $false, $false)
    try {
        foreach ($slide in $deck.Slides) {
            foreach ($shape in $slide.Shapes) {
                if ($shape.HasTextFrame -and $shape.TextFrame.HasText) {
                    $range = $shape.TextFrame.TextRange
                    if ($range.BoundHeight -gt ($shape.Height + 2) -or $range.BoundWidth -gt ($shape.Width + 2)) {
                        $issues += [pscustomobject]@{slide=$slide.SlideIndex; shape=$shape.Name; text=$range.Text; left=$shape.Left; top=$shape.Top; width=$shape.Width; height=$shape.Height; boundWidth=$range.BoundWidth; boundHeight=$range.BoundHeight}
                    }
                }
            }
            $slide.Export((Join-Path $directory "slide-$($slide.SlideIndex).png"), 'PNG', 1600, 900)
        }
        $report = [pscustomobject]@{deck=$path; slideCount=$deck.Slides.Count; reviewedSlides=@(1..$deck.Slides.Count); textOverflow=@($issues)}
        $report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $directory 'validation.json') -Encoding utf8
        Write-Output "$($deck.Slides.Count) slides rendered; $($issues.Count) text bounds issues."
        $issues | Format-Table slide,shape,width,height,boundWidth,boundHeight
    } finally { $deck.Close() }
} finally { if ($app.Presentations.Count -eq 0) { $app.Quit() } }
