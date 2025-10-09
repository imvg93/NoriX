@echo off
echo 🔍 Checking for port conflicts...

:: Check if port 5000 is in use
netstat -ano | findstr :5000 >nul 2>&1
if %errorlevel% == 0 (
    echo ❌ Port 5000 is already in use
    echo 🔧 Killing processes using port 5000...
    
    :: Find and kill processes using port 5000
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
        echo Killing PID %%a
        taskkill /PID %%a /F >nul 2>&1
    )
    
    :: Wait a moment for processes to terminate
    timeout /t 2 /nobreak >nul
    
    :: Verify port is free
    netstat -ano | findstr :5000 >nul 2>&1
    if %errorlevel% == 0 (
        echo ❌ Still conflicts found, killing all Node processes...
        taskkill /F /IM node.exe >nul 2>&1
        timeout /t 2 /nobreak >nul
    )
)

echo ✅ Port 5000 is free
echo 🚀 Starting backend server...

cd backend
npm start

pause
