@echo off
TITLE SmartGrid AI - Frontend UI (Port 5173)
COLOR 0B
cd /d "%~dp0frontend"
echo ==========================================================
echo Starting SmartGrid AI Frontend on http://localhost:5173
echo ==========================================================
echo.
npm run dev
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Frontend failed to start.
    echo Make sure Node.js is installed.
    pause
)
pause

