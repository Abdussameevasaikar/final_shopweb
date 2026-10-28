
@echo off
setlocal

if exist "%~dp0backend\server.js" (
    set "BACKEND=%~dp0backend"
) else if exist "%~dp0..\backend\server.js" (
    set "BACKEND=%~dp0..\backend"
) else (
    echo ERROR: Cannot find backend\server.js
    echo Please check where start-website.bat is saved.
    pause
    exit /b 1
)

cd /d "%BACKEND%"

echo Starting Vasaikar Bakala...
echo Backend folder: %CD%

start "Vasaikar Bakala Server" cmd /k "cd /d ""%BACKEND%"" && node server.js"

timeout /t 5 /nobreak >nul
start "" http://localhost:3000

endlocal
exit
