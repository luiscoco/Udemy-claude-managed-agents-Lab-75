$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$deckPath = Join-Path $root 'presentations/lab06/output/Lab06-Claude-Managed-Agents-Sessions-and-retained-context.pptx'
$output = Join-Path $root 'presentations/lab06/uml-review'
New-Item -ItemType Directory -Force -Path $output | Out-Null
$app = New-Object -ComObject PowerPoint.Application
$issues = @()
$styleReview = Join-Path $root 'presentations/lab06/style-review.json'
$indices = if (Test-Path $styleReview) { @((Get-Content $styleReview -Raw | ConvertFrom-Json).umlSlides) } else { @(11..14) }
try {
    $deck = $app.Presentations.Open($deckPath, $true, $false, $false)
    try {
        foreach ($index in $indices) {
            $slide = $deck.Slides.Item($index)
            $slide.Export((Join-Path $output "slide-$index.png"), 'PNG', 1600, 900)
            foreach ($shape in $slide.Shapes) {
                if ($shape.HasTextFrame -and $shape.TextFrame.HasText) {
                    $text = $shape.TextFrame.TextRange
                    if ($text.BoundHeight -gt ($shape.Height + 2) -or $text.BoundWidth -gt ($shape.Width + 2)) {
                        $issues += [pscustomobject]@{slide=$index; text=$text.Text; width=$shape.Width; height=$shape.Height; boundWidth=$text.BoundWidth; boundHeight=$text.BoundHeight}
                    }
                }
            }
        }
        $report = [pscustomobject]@{deck=$deckPath; slideCount=$deck.Slides.Count; reviewedSlides=@($indices); textOverflow=@($issues)}
        $report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $output 'validation.json') -Encoding utf8
        $report | ConvertTo-Json -Depth 5
    } finally { $deck.Close() }
} finally { if ($app.Presentations.Count -eq 0) { $app.Quit() } }
