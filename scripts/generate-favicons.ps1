param(
    [string]$OutputDir = (Join-Path $PSScriptRoot "..\public")
)

Add-Type -AssemblyName System.Drawing

function New-ElmIcon {
    param(
        [string]$Path,
        [int]$Size
    )

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.SmoothingMode = 'AntiAlias'

    $rect = New-Object System.Drawing.Rectangle (0, 0, $Size, $Size)
    $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush ($rect,
        ([System.Drawing.Color]::FromArgb(255, 5, 10, 17)),
        ([System.Drawing.Color]::FromArgb(255, 27, 92, 71)),
        45.0)
    $gfx.FillRectangle($bg, $rect)
    $bg.Dispose()

    $padding = [Math]::Round($Size * 0.12)
    $canopyRect = New-Object System.Drawing.Rectangle (
        $padding,
        [Math]::Round($Size * 0.18),
        ($Size - 2 * $padding),
        [Math]::Round($Size * 0.55)
    )
    $canopy = New-Object System.Drawing.Drawing2D.LinearGradientBrush ($canopyRect,
        ([System.Drawing.Color]::FromArgb(255, 12, 138, 98)),
        ([System.Drawing.Color]::FromArgb(255, 34, 193, 140)),
        90.0)
    $gfx.FillEllipse($canopy, $canopyRect)
    $canopy.Dispose()

    $trunkWidth = [Math]::Round($Size * 0.14)
    $trunkHeight = [Math]::Round($Size * 0.28)
    $trunkRect = New-Object System.Drawing.Rectangle (
        [Math]::Round(($Size - $trunkWidth) / 2),
        [Math]::Round($Size * 0.48),
        $trunkWidth,
        $trunkHeight
    )
    $trunkBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 243, 246, 248))
    $gfx.FillRectangle($trunkBrush, $trunkRect)
    $trunkBrush.Dispose()

    $groundRect = New-Object System.Drawing.Rectangle (
        [Math]::Round($Size * 0.15),
        [Math]::Round($Size * 0.7),
        [Math]::Round($Size * 0.7),
        [Math]::Round($Size * 0.22)
    )
    $groundBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(120, 4, 16, 12))
    $gfx.FillEllipse($groundBrush, $groundRect)
    $groundBrush.Dispose()

    $starBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(180, 255, 255, 255))
    $rand = [System.Random]::new(37)
    $starCount = [Math]::Max(4, [Math]::Round($Size * 0.15))
    for ($i = 0; $i -lt $starCount; $i++) {
        $diam = [Math]::Max(1, [Math]::Round($Size * 0.025))
        $x = $rand.Next([Math]::Round($Size * 0.23), [Math]::Round($Size * 0.77))
        $y = $rand.Next([Math]::Round($Size * 0.18), [Math]::Round($Size * 0.45))
        $gfx.FillEllipse($starBrush, $x, $y, $diam, $diam)
    }
    $starBrush.Dispose()

    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

    $gfx.Dispose()
    $bmp.Dispose()
}

if (-not (Test-Path $OutputDir)) {
    throw "Output directory '$OutputDir' was not found."
}

$targets = @{
    "favicon-16x16.png" = 16
    "favicon-32x32.png" = 32
    "apple-touch-icon.png" = 180
    "favicon-64x64.png" = 64
}

foreach ($item in $targets.GetEnumerator()) {
    $path = Join-Path $OutputDir $item.Key
    New-ElmIcon -Path $path -Size $item.Value
    Write-Host "Generated $($item.Key) ($($item.Value)x$($item.Value))"
}

