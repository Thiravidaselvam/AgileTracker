@echo off
title Agile Tracker - Start
echo ================================================
echo  Agile Tracker - Starting Services
echo ================================================

:: Start PostgreSQL (requires admin - UAC prompt will appear)
echo [1/3] Starting PostgreSQL (UAC prompt may appear)...
powershell -Command "Start-Process 'cmd' -ArgumentList '/c net start postgresql-x64-13' -Verb RunAs -Wait" >nul 2>&1
timeout /t 2 /nobreak >nul

:: Verify PostgreSQL started
sc query postgresql-x64-13 | findstr "RUNNING" >nul
IF %ERRORLEVEL% EQU 0 (
    echo       PostgreSQL is running.
) ELSE (
    echo       WARNING: PostgreSQL may not have started. Check services.
)

:: Start Next.js dev server in a new window (no admin needed)
echo [2/3] Starting Next.js dev server...
start "Agile Tracker Dev Server" cmd /k "cd /d E:\TrainningMaterials\ProgressTracker\agile-tracker && npm run dev"

:: Wait for server to be ready
echo [3/3] Waiting for server to be ready (15s)...
timeout /t 15 /nobreak >nul

:: Open browser
start http://localhost:3000
echo       Opened http://localhost:3000 in browser.

echo.
echo ================================================
echo  Agile Tracker is running at http://localhost:3000
echo  Run stop.bat to stop all services.
echo ================================================
pause
