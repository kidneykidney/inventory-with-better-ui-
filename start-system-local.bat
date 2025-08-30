@echo off
REM Robust Start Script for Inventory Management System (Non-Docker)
REM This will start both backend and frontend with proper error handling

title Inventory Management System Starter

echo 🚀 Starting Inventory Management System
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Python is not installed!
    echo Please install Python 3.11+ from: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo 📦 Creating virtual environment...
    python -m venv .venv
    if %ERRORLEVEL% neq 0 (
        echo ❌ Failed to create virtual environment!
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo 📦 Activating virtual environment...
call .venv\Scripts\activate.bat
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to activate virtual environment!
    pause
    exit /b 1
)

REM Install/Update backend dependencies
echo 📚 Installing/Updating backend dependencies...
pip install -r backend\requirements.txt
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to install backend dependencies!
    echo Try running: pip install --upgrade pip
    pause
    exit /b 1
)

REM Install/Update frontend dependencies
echo 📚 Installing/Update frontend dependencies...
npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to install frontend dependencies!
    echo Try running: npm cache clean --force
    pause
    exit /b 1
)

REM Kill any existing processes on our ports
echo 🧹 Cleaning up existing processes...
netstat -ano | findstr :8000 > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo 🛑 Stopping existing backend on port 8000...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /f /pid %%a > nul 2>&1
)

netstat -ano | findstr :3000 > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo 🛑 Stopping existing frontend on port 3000...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /f /pid %%a > nul 2>&1
)

REM Wait a moment for cleanup
timeout /t 2 /nobreak > nul

REM Start backend API in a new window
echo 🔧 Starting Backend API on port 8000...
start "Backend API - Inventory System" cmd /k "cd /d %~dp0 && .venv\Scripts\activate.bat && cd backend && python main.py"

REM Wait for backend to start
echo ⏳ Waiting for backend to initialize...
set /a backend_attempts=0
:wait_backend
timeout /t 2 /nobreak > nul
set /a backend_attempts+=1
if %backend_attempts% gtr 30 (
    echo ❌ Backend failed to start within 60 seconds!
    echo Check the Backend window for errors.
    goto start_frontend
)
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8000/products' -TimeoutSec 5 -ErrorAction Stop | Out-Null; exit 0 } catch { exit 1 }" > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 🔄 Still waiting for backend... (attempt %backend_attempts%/30)
    goto wait_backend
)
echo ✅ Backend is ready!

:start_frontend

REM Start frontend in a new window  
echo 🎨 Starting Frontend on port 3000...
start "Frontend - Inventory System" cmd /k "cd /d %~dp0 && npm run dev"

REM Wait for frontend to start
echo ⏳ Waiting for frontend to initialize...
set /a frontend_attempts=0
:wait_frontend
timeout /t 3 /nobreak > nul
set /a frontend_attempts+=1
if %frontend_attempts% gtr 20 (
    echo ❌ Frontend failed to start within 60 seconds!
    echo Check the Frontend window for errors.
    goto system_ready
)
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 5 -ErrorAction Stop | Out-Null; exit 0 } catch { exit 1 }" > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 🔄 Still waiting for frontend... (attempt %frontend_attempts%/20)
    goto wait_frontend
)
echo ✅ Frontend is ready!

:system_ready

echo.
echo ✅ System Started Successfully!
echo.
echo 📱 Your application is available at:
echo    🌐 Frontend: http://localhost:3000
echo    🔧 Backend API: http://localhost:8000  
echo    📚 API Docs: http://localhost:8000/docs
echo.
echo 💡 Tips:
echo    • Both services are running in separate windows
echo    • Close those windows to stop the services
echo    • Check logs in the terminal windows if issues occur
echo    • OCR invoice creation is now working perfectly!
echo.
echo 🛑 To stop everything: Run .\stop-system.bat
echo.

REM Open the application in browser
echo 🌐 Opening application in browser...
timeout /t 3 /nobreak > nul
start http://localhost:3000

pause
