@echo off
echo ========================================
echo    Node.js Process Cleanup Script
echo ========================================
echo.

echo 🔍 Checking for Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" 2>nul | findstr node.exe >nul
if %errorlevel% == 0 (
    echo Found Node.js processes:
    tasklist /FI "IMAGENAME eq node.exe"
    echo.
    echo 🔧 Killing all Node.js processes...
    taskkill /F /IM node.exe
    if %errorlevel% == 0 (
        echo ✅ All Node.js processes terminated
    ) else (
        echo ❌ Failed to kill some processes
    )
) else (
    echo ℹ️ No Node.js processes found
)

echo.
echo 🔍 Checking port 5000...
netstat -ano | findstr :5000 >nul 2>&1
if %errorlevel% == 0 (
    echo Port 5000 is still in use:
    netstat -ano | findstr :5000
) else (
    echo ✅ Port 5000 is free
)

echo.
pause
