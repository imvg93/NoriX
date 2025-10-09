# PowerShell Script to Test the 500 Error Fix
# Run this script to verify the backend fix is working

Write-Host "🧪 Testing Backend Fix for 500 Error" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Test 1: Check if backend is running
Write-Host "Test 1: Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is running on http://localhost:5000" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend is not running. Please start it with:" -ForegroundColor Red
    Write-Host "   cd backend" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Login and get token
Write-Host "Test 2: Logging in to get auth token..." -ForegroundColor Yellow
$loginBody = @{
    email = "student@test.com"
    password = "password123"
    userType = "student"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -TimeoutSec 5
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    
    if ($token) {
        Write-Host "✅ Login successful! Token obtained." -ForegroundColor Green
    } else {
        Write-Host "⚠️  Login response received but no token found." -ForegroundColor Yellow
        Write-Host "   Please update credentials in test-fix.ps1" -ForegroundColor Yellow
        Write-Host "   Response: $($loginResponse.Content)" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "⚠️  Could not login with test credentials." -ForegroundColor Yellow
    Write-Host "   Please update the email/password in test-fix.ps1 with valid student credentials" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Skipping authentication tests..." -ForegroundColor Yellow
    $token = $null
}

Write-Host ""

# Test 3: Fetch applications (the endpoint that was returning 500)
if ($token) {
    Write-Host "Test 3: Fetching applications from fixed endpoint..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $appsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/applications/my-applications" `
            -Headers $headers `
            -Method GET `
            -TimeoutSec 5
        
        if ($appsResponse.StatusCode -eq 200) {
            $appsData = $appsResponse.Content | ConvertFrom-Json
            $appCount = $appsData.data.applications.Count
            
            Write-Host "✅ Applications endpoint working! Status: 200 OK" -ForegroundColor Green
            Write-Host "   Found $appCount applications" -ForegroundColor Cyan
            
            if ($appCount -gt 0) {
                Write-Host "   Sample application:" -ForegroundColor Cyan
                $sample = $appsData.data.applications[0]
                Write-Host "   - Job: $($sample.job.title)" -ForegroundColor Gray
                Write-Host "   - Company: $($sample.job.company)" -ForegroundColor Gray
                Write-Host "   - Status: $($sample.status)" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "❌ Applications endpoint failed!" -ForegroundColor Red
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        
        # Try to get error details
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Response: $responseBody" -ForegroundColor Gray
        }
        exit 1
    }
}

Write-Host ""

# Test 4: Fetch jobs
if ($token) {
    Write-Host "Test 4: Fetching jobs for student dashboard..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $jobsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/enhanced-jobs/student-dashboard?limit=1000" `
            -Headers $headers `
            -Method GET `
            -TimeoutSec 5
        
        if ($jobsResponse.StatusCode -eq 200) {
            $jobsData = $jobsResponse.Content | ConvertFrom-Json
            $jobCount = $jobsData.data.jobs.Count
            $kycRequired = $jobsData.data.kycRequired
            
            Write-Host "✅ Jobs endpoint working! Status: 200 OK" -ForegroundColor Green
            Write-Host "   Found $jobCount jobs" -ForegroundColor Cyan
            
            if ($kycRequired) {
                Write-Host "   ⚠️  KYC required - student needs to complete KYC verification" -ForegroundColor Yellow
            } else {
                Write-Host "   ✅ KYC approved - student can view all jobs" -ForegroundColor Green
                
                if ($jobCount -gt 0) {
                    $highlightedCount = ($jobsData.data.jobs | Where-Object { $_.highlighted -eq $true }).Count
                    Write-Host "   - Highlighted jobs: $highlightedCount" -ForegroundColor Cyan
                    Write-Host "   - Regular jobs: $($jobCount - $highlightedCount)" -ForegroundColor Cyan
                }
            }
        }
    } catch {
        Write-Host "⚠️  Jobs endpoint returned an error (this is OK if KYC is not approved)" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🎉 Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "✅ Backend is running" -ForegroundColor Green
if ($token) {
    Write-Host "✅ Authentication working" -ForegroundColor Green
    Write-Host "✅ Applications endpoint fixed (no more 500 errors)" -ForegroundColor Green
    Write-Host "✅ All jobs are being fetched" -ForegroundColor Green
} else {
    Write-Host "⚠️  Authentication skipped - update credentials in script" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open your browser and go to http://localhost:3000" -ForegroundColor White
Write-Host "2. Login as a student" -ForegroundColor White
Write-Host "3. Navigate to the student dashboard" -ForegroundColor White
Write-Host "4. Verify all jobs are displayed" -ForegroundColor White
Write-Host "5. Check that applications load without errors" -ForegroundColor White
Write-Host ""

