@echo off
TITLE SmartGrid AI - Backend API (Port 8000)
COLOR 0A
cd /d "%~dp0backend"
echo ==========================================================
echo Starting SmartGrid AI Backend API on http://127.0.0.1:8000
echo ==========================================================
echo.
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backend failed to start.
    echo Make sure Python and dependencies are installed.
    pause
)
pause

