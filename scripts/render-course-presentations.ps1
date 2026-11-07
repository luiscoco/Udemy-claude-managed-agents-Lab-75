param([int]$FirstLab = 23, [int]$LastLab = 75)
$ErrorActionPreference = 'Stop'
$reviewRoot = Join-Path (Get-Location).Path 'presentations/render-review'
New-Item -ItemType Directory -Force -Path $reviewRoot | Out-Null
$issues = @()
$powerPoint = New-Object -ComObject PowerPoint.Application
try {
    foreach ($lesson in $FirstLab..$LastLab) {
        $path = (Get-ChildItem "presentations/lab$lesson/output/*.pptx" | Select-Object -First 1).FullName
        $deck = $powerPoint.Presentations.Open($path, $true, $false, $false)
        try {
            $directory = Join-Path $reviewRoot "lab$lesson"
            New-Item -ItemType Directory -Force -Path $directory | Out-Null
            foreach ($slide in $deck.Slides) {
                $text = ''
                foreach ($shape in $slide.Shapes) {
                    if ($shape.HasTextFrame -and $shape.TextFrame.HasText) {
                        $text += $shape.TextFrame.TextRange.Text + ' '
                        $bound = $shape.TextFrame.TextRange.BoundHeight
                        if ($bound -gt ($shape.Height + 3)) {
                            $issues += [pscustomobject]@{ Lab=$lesson; Slide=$slide.SlideIndex; Kind='Text exceeds box'; Text=$shape.TextFrame.TextRange.Text; BoundHeight=$bound; BoxHeight=$shape.Height }
                        }
                    }
                }
                if ($slide.SlideIndex -le 4 -or $text -match 'UML (sequence diagram|component view)' -or $text -match 'STEP 3 /' -or $slide.SlideIndex -eq $deck.Slides.Count) {
                    $slide.Export((Join-Path $directory ("slide-{0:D2}.png" -f $slide.SlideIndex)), 'PNG', 1280, 720)
                }
            }
            Write-Output "Lab $lesson rendered and checked ($($deck.Slides.Count) slides)"
        } finally { $deck.Close() }
    }
} finally {
    $powerPoint.Quit()
    $issues | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 (Join-Path $reviewRoot "overflow-$FirstLab-$LastLab.json")
}
