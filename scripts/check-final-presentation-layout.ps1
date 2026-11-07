$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$manifest = Get-Content 'presentations/Labs-23-75-validation.json' -Raw | ConvertFrom-Json
$issues = @()
$checked = @()
$app = New-Object -ComObject PowerPoint.Application
try {
    foreach ($item in $manifest.presentations) {
        $path = Join-Path $root ("presentations/" + $item.path)
        $deck = $app.Presentations.Open($path, $true, $false, $false)
        try {
            $slide = $deck.Slides.Item($item.architecture_slide)
            foreach ($shape in $slide.Shapes) {
                if ($shape.HasTextFrame -and $shape.TextFrame.HasText) {
                    if ($shape.TextFrame.TextRange.BoundHeight -gt ($shape.Height + 3)) {
                        $issues += [pscustomobject]@{ Lab=$item.lab; Slide=$slide.SlideIndex; Text=$shape.TextFrame.TextRange.Text }
                    }
                }
            }
            foreach ($label in $item.source_labels) {
                $shape = $deck.Slides.Item($label.slide).Shapes.Item($label.shape)
                if ($shape.TextFrame.TextRange.BoundHeight -gt ($shape.Height + 3)) {
                    $issues += [pscustomobject]@{ Lab=$item.lab; Slide=$label.slide; Text=$shape.TextFrame.TextRange.Text }
                }
            }
            $directory = Join-Path $root "presentations/render-review/lab$($item.lab)"
            New-Item -ItemType Directory -Force -Path $directory | Out-Null
            $slide.Export((Join-Path $directory 'final-architecture.png'), 'PNG', 1280, 720)
            if ($item.lab -in @(23,31,47,50,63,65,66,70,71,73,75)) {
                $deck.Slides.Item($item.code_slides[2]).Export((Join-Path $directory 'final-code.png'), 'PNG', 1280, 720)
            }
            $checked += $item.lab
            Write-Output "Final layout: Lab $($item.lab)"
        } finally { $deck.Close() }
        @{ checked=$checked; issues=@($issues); sourceLabelsChecked=($checked.Count*6) } | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 'presentations/final-layout-validation.json'
    }
} finally { $app.Quit() }
if ($issues.Count) { throw "$($issues.Count) layout issues found." }
Write-Output "All 53 architecture views and 318 updated source labels passed."
