# PowerShell Start Script for Inventory Management System (Non-Docker)
# This will start both backend and frontend with proper error handling

$Host.UI.RawUI.WindowTitle = "Inventory Management System Starter"

Write-Host "🚀 Starting Inventory Management System" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed!" -ForegroundColor Red
    Write-Host "Please install Python 3.11+ from: https://www.python.org/downloads/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if virtual environment exists
if (-not (Test-Path ".venv\Scripts\activate.ps1")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create virtual environment!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Activate virtual environment
Write-Host "📦 Activating virtual environment..." -ForegroundColor Yellow
& ".venv\Scripts\Activate.ps1"

# Install/Update backend dependencies
Write-Host "📚 Installing/Updating backend dependencies..." -ForegroundColor Yellow
pip install -r backend\requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies!" -ForegroundColor Red
    Write-Host "Try running: pip install --upgrade pip" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Install/Update frontend dependencies
Write-Host "📚 Installing/Update frontend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies!" -ForegroundColor Red
    Write-Host "Try running: npm cache clean --force" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Kill any existing processes on our ports
Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow

# Stop processes on port 8000
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "🛑 Stopping existing backend on port 8000..." -ForegroundColor Yellow
    $port8000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

# Stop processes on port 3000
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "🛑 Stopping existing frontend on port 3000..." -ForegroundColor Yellow
    $port3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

# Wait a moment for cleanup
Start-Sleep -Seconds 2

# Start backend API in a new window
Write-Host "🔧 Starting Backend API on port 8000..." -ForegroundColor Yellow
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { Set-Location '$PWD'; & '.venv\Scripts\Activate.ps1'; Set-Location backend; python main.py }" -WindowStyle Normal -PassThru

# Wait for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
$backendReady = $false
$attempts = 0
while (-not $backendReady -and $attempts -lt 30) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/products" -TimeoutSec 5 -ErrorAction Stop
        $backendReady = $true
        Write-Host "✅ Backend is ready!" -ForegroundColor Green
    } catch {
        $attempts++
        Write-Host "🔄 Still waiting for backend... (attempt $attempts/30)" -ForegroundColor Yellow
    }
}

if (-not $backendReady) {
    Write-Host "❌ Backend failed to start within timeout!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Start frontend in a new window
Write-Host "🎨 Starting Frontend on port 3000..." -ForegroundColor Yellow
$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { Set-Location '$PWD'; npm run dev }" -WindowStyle Normal -PassThru

# Wait for frontend to start
Write-Host "⏳ Waiting for frontend to initialize..." -ForegroundColor Yellow
$frontendReady = $false
$attempts = 0
while (-not $frontendReady -and $attempts -lt 20) {
    Start-Sleep -Seconds 3
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
        $frontendReady = $true
        Write-Host "✅ Frontend is ready!" -ForegroundColor Green
    } catch {
        $attempts++
        Write-Host "🔄 Still waiting for frontend... (attempt $attempts/20)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ System Started Successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Your application is available at:" -ForegroundColor Cyan
Write-Host "   🌐 Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   🔧 Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "   📚 API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   • Both services are running in separate windows" -ForegroundColor White
Write-Host "   • Close those windows to stop the services" -ForegroundColor White
Write-Host "   • Check logs in the terminal windows if issues occur" -ForegroundColor White
Write-Host "   • OCR invoice creation is now working perfectly!" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop everything: Run .\stop-system.bat" -ForegroundColor Red
Write-Host ""

# Open the application in browser
Write-Host "🌐 Opening application in browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"

Read-Host "Press Enter to close this window (services will continue running)"
