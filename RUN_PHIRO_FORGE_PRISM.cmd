@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0RUN_PHIRO_FORGE_PRISM.ps1" -InstallAsService
set EXITCODE=%ERRORLEVEL%
echo.
if not "%EXITCODE%"=="0" echo [PRISM // PHIRO FORGE] Launcher failed with exit code %EXITCODE%.
exit /b %EXITCODE%
