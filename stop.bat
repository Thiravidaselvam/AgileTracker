@echo off
title Agile Tracker - Stop
echo ================================================
echo  Agile Tracker - Stopping Services
echo ================================================

:: Kill Next.js dev server on port 3000 (no admin needed)
echo [1/2] Stopping Next.js dev server...
SET FOUND=0
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') DO (
    taskkill /PID %%P /F >nul 2>&1
    echo       Stopped process on port 3000 (PID %%P).
    SET FOUND=1
)
IF "%FOUND%"=="0" echo       Next.js was not running on port 3000.

:: Stop PostgreSQL (requires admin - UAC prompt will appear)
echo [2/2] Stopping PostgreSQL (UAC prompt may appear)...
powershell -Command "Start-Process 'cmd' -ArgumentList '/c net stop postgresql-x64-13' -Verb RunAs -Wait" >nul 2>&1
timeout /t 2 /nobreak >nul

:: Verify PostgreSQL stopped
sc query postgresql-x64-13 | findstr "STOPPED" >nul
IF %ERRORLEVEL% EQU 0 (
    echo       PostgreSQL stopped.
) ELSE (
    echo       PostgreSQL may still be running or was already stopped.
)

echo.
echo ================================================
echo  All Agile Tracker services stopped.
echo ================================================
pause
