# Create desktop shortcut for YuantO Ai server
# Run from nexus-ai folder: .\scripts\create-shortcut.ps1
$batPath = (Resolve-Path (Join-Path $PSScriptRoot "..\start-server.bat")).Path
$desktop = [Environment]::GetFolderPath("Desktop")
$ws = New-Object -ComObject WScript.Shell
$shortcut = $ws.CreateShortcut((Join-Path $desktop "YuantO Ai Server.lnk"))
$shortcut.TargetPath = $batPath
$shortcut.WorkingDirectory = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$shortcut.Description = "YuantO Ai Server - http://localhost:4000"
$shortcut.Save()
Write-Host "Desktop shortcut 'YuantO Ai Server' created." -ForegroundColor Green
