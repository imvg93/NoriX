# Automated Backend Restart Script
# This script kills any process using port 5000 and starts the backend

Write-Host "🔧 Backend Restart Script" -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

# Step 1: Check if port 5000 is in use
Write-Host "Step 1: Checking port 5000..." -ForegroundColor Yellow
$portCheck = netstat -ano | findstr ":5000.*LISTENING"

if ($portCheck) {
    Write-Host "⚠️  Port 5000 is in use. Finding process..." -ForegroundColor Yellow
    
    # Extract PIDs from netstat output
    $pids = @()
    $portCheck | ForEach-Object {
        if ($_ -match '\s+(\d+)\s*$') {
            $pids += $matches[1]
        }
    }
    
    # Kill each process
    $pids | Select-Object -Unique | ForEach-Object {
        $pid = $_
        try {
            Write-Host "🔪 Killing process $pid..." -ForegroundColor Yellow
            taskkill /PID $pid /F 2>&1 | Out-Null
            Write-Host "✅ Process $pid terminated" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Could not kill process $pid" -ForegroundColor Red
        }
    }
    
    # Wait a moment for port to be released
    Write-Host "⏳ Waiting for port to be released..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
} else {
    Write-Host "✅ Port 5000 is free" -ForegroundColor Green
}

Write-Host ""

# Step 2: Verify port is now free
Write-Host "Step 2: Verifying port 5000 is free..." -ForegroundColor Yellow
$portCheck2 = netstat -ano | findstr ":5000.*LISTENING"

if ($portCheck2) {
    Write-Host "❌ Port 5000 is still in use!" -ForegroundColor Red
    Write-Host "   Please manually close the process or restart your computer." -ForegroundColor Red
    Write-Host ""
    Write-Host "Processes still using port 5000:" -ForegroundColor Yellow
    netstat -ano | findstr :5000
    exit 1
} else {
    Write-Host "✅ Port 5000 is now free" -ForegroundColor Green
}

Write-Host ""

# Step 3: Navigate to backend directory
Write-Host "Step 3: Navigating to backend directory..." -ForegroundColor Yellow
$backendPath = "C:\Users\giris\OneDrive\Desktop\NoriX\backend"

if (Test-Path $backendPath) {
    Set-Location $backendPath
    Write-Host "✅ In backend directory: $backendPath" -ForegroundColor Green
} else {
    Write-Host "❌ Backend directory not found: $backendPath" -ForegroundColor Red
    Write-Host "   Please update the path in this script." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Check if node_modules exists
Write-Host "Step 4: Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules found" -ForegroundColor Green
} else {
    Write-Host "⚠️  node_modules not found. Running npm install..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ npm install failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 5: Start the backend
Write-Host "Step 5: Starting backend server..." -ForegroundColor Yellow
Write-Host "========================`n" -ForegroundColor Cyan
Write-Host "🚀 Backend is starting..." -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host "   Look for 'Server running on port 5000' message" -ForegroundColor Gray
Write-Host ""

# Start the backend
npm run dev

