# Run from nexus-ai folder: .\run.ps1
Set-Location $PSScriptRoot
Write-Host "Building..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed." -ForegroundColor Red; exit 1 }
Write-Host "Starting server at http://localhost:4000" -ForegroundColor Green
npm run start:server
