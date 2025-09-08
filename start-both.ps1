# One-Click Startup Script for Inventory Management System
# This starts both frontend and backend in separate windows

Write-Host "🚀 Starting Inventory Management System..." -ForegroundColor Green
Write-Host "📦 Frontend + Backend One-Click Startup" -ForegroundColor Cyan

# Check if in correct directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Please run this script from the inventory-app directory" -ForegroundColor Red
    exit 1
}

# Activate virtual environment and start backend
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\.venv\Scripts\Activate.ps1; cd backend; python main.py"

# Wait a moment
Start-Sleep -Seconds 2

# Start frontend
Write-Host "🌐 Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

# Wait a moment
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Both services are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend: http://localhost:3000 (or next available port)" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔑 Login: admin / College@2025" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Two terminal windows will open - don't close them!" -ForegroundColor Magenta
