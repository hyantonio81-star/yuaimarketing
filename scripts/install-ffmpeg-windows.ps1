# Windows: FFmpeg 공식 빌드 설치 (winget → Gyan.FFmpeg)
# 소스 tarball(ffmpeg-*.tar.xz) 빌드는 MSYS2/Visual Studio 등이 필요해 이 스크립트와 달리 복잡합니다.
# 참고: https://www.ffmpeg.org/download.html
# 설치 후 새 터미널에서: ffmpeg -version
# PATH에 없으면 backend/.env 에 FFMPEG_PATH=C:\...\ffmpeg.exe

$ErrorActionPreference = "Stop"
Write-Host "Installing FFmpeg via winget (Gyan.FFmpeg)..."
winget install Gyan.FFmpeg --accept-package-agreements --accept-source-agreements
Write-Host "Done. Open a NEW terminal and run: ffmpeg -version"
Write-Host "If the backend still cannot find ffmpeg, set FFMPEG_PATH in backend/.env to the full path of ffmpeg.exe"
