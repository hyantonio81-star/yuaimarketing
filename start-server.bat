@echo off
cd /d "%~dp0"
echo Building...
call npm run build
if errorlevel 1 ( echo Build failed. & pause & exit /b 1 )
echo Starting server at http://localhost:4000
echo.
call npm run start:server
pause
