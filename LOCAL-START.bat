@echo off
REM ONE-CLICK LOCAL STARTUP - No Docker Required
REM This script starts everything locally without Docker Desktop

title Inventory Management System - Local Startup (No Docker)

color 0A
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                INVENTORY MANAGEMENT SYSTEM                   ║
echo  ║                  LOCAL ONE-CLICK STARTUP                     ║
echo  ║                    (No Docker Required)                      ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

echo  🚀 Starting complete system locally...
echo  📦 Backend + Frontend + Database (PostgreSQL)
echo.

REM Check if Node.js is installed
echo  🔍 Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ❌ Node.js is not installed!
    echo.
    echo  💡 Please install Node.js first:
    echo     Download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo  ✅ Node.js is available

REM Check if Python is installed
echo  🔍 Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ❌ Python is not installed!
    echo.
    echo  💡 Please install Python first:
    echo     Download from: https://python.org/
    echo.
    pause
    exit /b 1
)
echo  ✅ Python is available

REM Check if PostgreSQL is running (optional - will work with SQLite if not)
echo  🔍 Checking PostgreSQL...
netstat -an | findstr :5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo  ⚠️  PostgreSQL not detected - will use SQLite database
) else (
    echo  ✅ PostgreSQL is running
)

echo.

REM Install dependencies if needed
echo  📦 Installing/updating dependencies...
if not exist node_modules (
    echo     Installing Node.js dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo  ❌ Failed to install Node.js dependencies
        pause
        exit /b 1
    )
)

REM Setup Python virtual environment if needed
if not exist .venv (
    echo     Creating Python virtual environment...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo  ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment and install Python dependencies
echo     Installing Python dependencies...
call .venv\Scripts\activate.bat
if exist backend\requirements.txt (
    pip install -r backend\requirements.txt >nul 2>&1
)

echo  ✅ Dependencies ready

echo.

REM Kill any existing processes on our ports
echo  🛑 Stopping any existing services...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %%a >nul 2>&1

echo  ✅ Ports cleared

echo.

REM Start Backend
echo  🔧 Starting Backend (FastAPI)...
start "Backend Server" cmd /k "cd /d %cd% && .venv\Scripts\activate && cd backend && python main.py"
echo     Backend starting on http://localhost:8000

REM Wait a bit for backend to start
timeout /t 5 /nobreak > nul

REM Start Frontend  
echo  🌐 Starting Frontend (React)...
start "Frontend Server" cmd /k "cd /d %cd% && npm run dev"
echo     Frontend starting on http://localhost:5173

echo.

REM Wait for services to start
echo  ⏳ Waiting for services to initialize...
timeout /t 10 /nobreak > nul

echo.
echo  ✅ SYSTEM STARTUP COMPLETE!
echo.
echo  🌐 Your Inventory Management System is now running:
echo.
echo  ┌─────────────────────────────────────────────────────────────┐
echo  │  📱 Frontend (React):     http://localhost:5173            │
echo  │  🔧 Backend API:          http://localhost:8000            │
echo  │  📚 API Documentation:    http://localhost:8000/docs       │
echo  └─────────────────────────────────────────────────────────────┘
echo.
echo  🔐 Default Admin Login:
echo     Username: admin
echo     Password: College@2025
echo.
echo  🔧 Features Available:
echo     ✅ Invoice Export (with all fixes)
echo     ✅ Real-time data updates
echo     ✅ Professional CSV formatting
echo     ✅ Complete inventory management
echo     ✅ User authentication system
echo.

REM Optional: Open browser automatically
set /p open_browser="🌐 Open browser automatically? (y/n): "
if /i "%open_browser%"=="y" (
    echo  🚀 Opening browser...
    start http://localhost:5173
    timeout /t 2 /nobreak > nul
    start http://localhost:8000/docs
)

echo.
echo  💡 To stop the system:
echo     - Close the Backend and Frontend terminal windows
echo     - Or run: LOCAL-STOP.bat
echo.
echo  🎉 Ready to use! Happy managing! 🎉
echo.
pause
