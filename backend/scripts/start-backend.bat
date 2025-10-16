@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    Backend Server Startup Script
echo ========================================
echo.

:: Set default port
set "DEFAULT_PORT=5000"
set "MAX_ATTEMPTS=10"

:: Check if port is provided as argument
if "%~1" neq "" (
    set "DEFAULT_PORT=%~1"
)

echo 🔍 Checking port %DEFAULT_PORT%...

:: Function to check if port is in use
:check_port
netstat -ano | findstr :%DEFAULT_PORT% >nul 2>&1
if %errorlevel% == 0 (
    echo ❌ Port %DEFAULT_PORT% is already in use
    
    :: Find and kill processes using the port
    echo 🔧 Killing processes using port %DEFAULT_PORT%...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%DEFAULT_PORT% ^| findstr LISTENING') do (
        echo Killing PID %%a
        taskkill /PID %%a /F >nul 2>&1
    )
    
    :: Wait for cleanup
    timeout /t 2 /nobreak >nul
    
    :: Check again
    netstat -ano | findstr :%DEFAULT_PORT% >nul 2>&1
    if %errorlevel% == 0 (
        echo ⚠️ Port still in use, trying next port...
        set /a DEFAULT_PORT+=1
        set /a ATTEMPTS+=1
        
        if !ATTEMPTS! LSS %MAX_ATTEMPTS% (
            goto check_port
        ) else (
            echo ❌ Could not find available port after %MAX_ATTEMPTS% attempts
            echo 💡 Try running: taskkill /F /IM node.exe
            pause
            exit /b 1
        )
    )
)

echo ✅ Port %DEFAULT_PORT% is available
echo 🚀 Starting backend server on port %DEFAULT_PORT%...

:: Set environment variable and start
set PORT=%DEFAULT_PORT%
cd /d "%~dp0.."
npm start

pause
