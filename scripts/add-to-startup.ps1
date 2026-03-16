# Add YuantO Ai server to Windows Startup (runs on login)
# Run from nexus-ai folder: .\scripts\add-to-startup.ps1
# To disable: Settings -> Apps -> Startup -> turn off "YuantO Ai Server"
$batPath = (Resolve-Path (Join-Path $PSScriptRoot "..\start-server.bat")).Path
$startupFolder = [Environment]::GetFolderPath("Startup")
$ws = New-Object -ComObject WScript.Shell
$shortcut = $ws.CreateShortcut((Join-Path $startupFolder "YuantO Ai Server.lnk"))
$shortcut.TargetPath = $batPath
$shortcut.WorkingDirectory = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$shortcut.Description = "YuantO Ai Server (start with Windows)"
$shortcut.Save()
Write-Host "Added to Startup. Server will run automatically after next login." -ForegroundColor Green
Write-Host "To disable: Settings -> Apps -> Startup -> turn off 'YuantO Ai Server'" -ForegroundColor Yellow
