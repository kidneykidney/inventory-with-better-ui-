@echo off
REM Professional Inventory Management System - Quick Start
REM This script starts the complete system locally (no Docker required)

title Inventory Management System - Professional Start

echo 🚀 INVENTORY MANAGEMENT SYSTEM - PROFESSIONAL START
echo =====================================================
echo 💼 Complete system with authentication & database sync
echo =====================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Python is not installed!
    echo Please install Python 3.8+ from: https://www.python.org/downloads/
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

echo ✅ Python and Node.js detected

REM Navigate to project root
cd /d "%~dp0\.."

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

REM Install/Update backend dependencies
echo 📚 Installing backend dependencies...
pip install -r backend\requirements.txt --quiet
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to install backend dependencies!
    echo Try running: pip install --upgrade pip
    pause
    exit /b 1
)

REM Install/Update frontend dependencies
echo 📚 Installing frontend dependencies...
npm install --silent
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to install frontend dependencies!
    pause
    exit /b 1
)

REM Clean up existing processes
echo 🧹 Cleaning up existing processes...
netstat -ano | findstr :8000 > nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /f /pid %%a > nul 2>&1
)

netstat -ano | findstr :3000 > nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /f /pid %%a > nul 2>&1
)

netstat -ano | findstr :5173 > nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /f /pid %%a > nul 2>&1
)

echo ✅ Ports cleaned

REM Start backend API
echo 🔧 Starting Backend API on port 8000...
start "Backend API - Inventory System" cmd /k "cd /d %~dp0\.. && .venv\Scripts\activate.bat && cd backend && python main.py"

REM Wait for backend
echo ⏳ Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

set /a attempts=0
:wait_backend
timeout /t 2 /nobreak > nul
set /a attempts+=1
if %attempts% gtr 20 (
    echo ⚠️  Backend taking longer than expected, continuing with frontend...
    goto start_frontend
)
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8000/health' -TimeoutSec 3 -ErrorAction Stop | Out-Null; exit 0 } catch { exit 1 }" > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 🔄 Backend starting... (attempt %attempts%/20)
    goto wait_backend
)
echo ✅ Backend is ready!

:start_frontend
REM Start frontend
echo 🎨 Starting Frontend on port 5173...
start "Frontend - Inventory System" cmd /k "cd /d %~dp0\.. && npm run dev"

REM Wait for frontend
echo ⏳ Waiting for frontend to initialize...
timeout /t 5 /nobreak > nul

echo.
echo ✅ SYSTEM STARTED SUCCESSFULLY!
echo.
echo 📱 Access your application:
echo    🌐 Frontend:     http://localhost:5173
echo    🔧 Backend API:  http://localhost:8000
echo    📚 API Docs:     http://localhost:8000/docs
echo    🏥 Health Check: http://localhost:8000/health
echo.
echo 🔑 Default Admin Credentials:
echo    Username: admin
echo    Password: College@2025
echo    Email: admin@college.edu
echo.
echo 💡 Your admin_users_query.sql will work with:
echo    Database: inventory_management
echo    Host: localhost:5432
echo    User: postgres
echo    Password: gugan@2022
echo.
echo 🛑 To stop: Run scripts\STOP.bat
echo.

REM Open application in browser
echo 🌐 Opening application in browser...
timeout /t 3 /nobreak > nul
start http://localhost:5173

pause
