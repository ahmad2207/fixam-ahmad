Take a screenshot of the current screen and read it.

Run this PowerShell command to capture the screen:

```powershell
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
$path = "$env:TEMP\claude_screenshot.png"
$bitmap.Save($path)
$graphics.Dispose()
$bitmap.Dispose()
Write-Output $path
```

Then read the image file at the path that was output and describe or analyze what you see.
