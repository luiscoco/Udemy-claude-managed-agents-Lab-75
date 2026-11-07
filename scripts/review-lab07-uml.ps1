$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$deckPath = Join-Path $root 'presentations/lab07/output/Lab07-Claude-Managed-Agents-Tool-policy-and-execution-audit.pptx'
$output = Join-Path $root 'presentations/lab07/uml-review'
New-Item -ItemType Directory -Force -Path $output | Out-Null
$app = New-Object -ComObject PowerPoint.Application
$issues = @()
try {
    $deck = $app.Presentations.Open($deckPath, $true, $false, $false)
    try {
        foreach ($index in 1..$deck.Slides.Count) {
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
        $report = [pscustomobject]@{deck=$deckPath; slideCount=$deck.Slides.Count; reviewedSlides=@(1..$deck.Slides.Count); umlSlides=@(7,8,9,10); textOverflow=@($issues)}
        $report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $output 'validation.json') -Encoding utf8
        $report | ConvertTo-Json -Depth 5
    } finally { $deck.Close() }
} finally { $app.Quit() }
