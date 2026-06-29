@echo off
title Agile Tracker - Restart
echo ================================================
echo  Agile Tracker - Restarting Services
echo ================================================

:: --- STOP ---
echo [STOP 1/2] Stopping Next.js dev server...
SET FOUND=0
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') DO (
    taskkill /PID %%P /F >nul 2>&1
    echo       Stopped process on port 3000 (PID %%P).
    SET FOUND=1
)
IF "%FOUND%"=="0" echo       Next.js was not running on port 3000.

echo [STOP 2/2] Stopping PostgreSQL (UAC prompt may appear)...
powershell -Command "Start-Process 'cmd' -ArgumentList '/c net stop postgresql-x64-13' -Verb RunAs -Wait" >nul 2>&1
echo       PostgreSQL stop requested.

timeout /t 3 /nobreak >nul

:: --- START ---
echo [START 1/3] Starting PostgreSQL (UAC prompt may appear)...
powershell -Command "Start-Process 'cmd' -ArgumentList '/c net start postgresql-x64-13' -Verb RunAs -Wait" >nul 2>&1
timeout /t 2 /nobreak >nul

sc query postgresql-x64-13 | findstr "RUNNING" >nul
IF %ERRORLEVEL% EQU 0 (
    echo       PostgreSQL is running.
) ELSE (
    echo       WARNING: PostgreSQL may not have started.
)

echo [START 2/3] Starting Next.js dev server...
start "Agile Tracker Dev Server" cmd /k "cd /d E:\TrainningMaterials\ProgressTracker\agile-tracker && npm run dev"

echo [START 3/3] Waiting for server to be ready (15s)...
timeout /t 15 /nobreak >nul

start http://localhost:3000
echo       Opened http://localhost:3000 in browser.

echo.
echo ================================================
echo  Agile Tracker restarted at http://localhost:3000
echo ================================================
pause
