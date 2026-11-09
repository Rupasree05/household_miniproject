@echo off
TITLE SmartGrid AI Launcher
COLOR 0E
cd /d "%~dp0"
echo ==========================================================
echo       SMARTGRID AI - COMPLETE SYSTEM LAUNCHER
echo ==========================================================
echo.
echo [1/3] Starting Backend API Server (FastAPI on Port 8000)...
start "SmartGrid AI - Backend (Port 8000)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo [2/3] Starting Frontend Web Server (React on Port 5173)...
timeout /t 2 /nobreak >nul
start "SmartGrid AI - Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo [3/3] Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ==========================================================
echo   Both servers launched successfully!
echo   - Backend API  : http://127.0.0.1:8000
echo   - Swagger Docs : http://127.0.0.1:8000/docs
echo   - Frontend UI  : http://localhost:5173
echo.
echo   Keep the two black terminal windows open while using the app!
echo ==========================================================
echo.
pause
