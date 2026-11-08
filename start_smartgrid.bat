@echo off
TITLE SmartGrid AI System Launcher
COLOR 0B

echo ===================================================================
echo     SMARTGRID AI - HOUSEHOLD POWER DEMAND PREDICTION SYSTEM
echo ===================================================================
echo.
echo [1/3] Starting Backend API Server (FastAPI + Uvicorn on Port 8000)...
start "SmartGrid AI - Backend (Port 8000)" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --reload --port 8000"

echo [2/3] Starting Frontend Web Server (React + Vite on Port 5173)...
start "SmartGrid AI - Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo [3/3] Waiting 4 seconds for servers to initialize...
timeout /t 4 /nobreak >nul

echo.
echo Opening SmartGrid AI in your default web browser...
start http://localhost:5173

echo ===================================================================
echo   System running successfully!
echo   Frontend : http://localhost:5173
echo   Backend  : http://127.0.0.1:8000
echo   API Docs : http://127.0.0.1:8000/docs
echo ===================================================================
echo.
pause

