@echo off
REM Quick Start Script for Inventory Management System (No waiting)
REM This will start both backend and frontend immediately

title Inventory Management System - Quick Start

echo 🚀 Starting Inventory Management System
echo ========================================
echo.

REM Check if virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo 📦 Creating virtual environment...
    python -m venv .venv
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

REM Wait a moment then start frontend
echo ⏳ Waiting 3 seconds before starting frontend...
timeout /t 3 /nobreak > nul

echo 🎨 Starting Frontend on port 3000...
start "Frontend - Inventory System" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ✅ Services Starting!
echo.
echo 📱 Your application will be available at:
echo    🌐 Frontend: http://localhost:3000
echo    🔧 Backend API: http://localhost:8000  
echo    📚 API Docs: http://localhost:8000/docs
echo.
echo 💡 Tips:
echo    • Two separate windows opened for Backend and Frontend
echo    • Wait 10-15 seconds for both services to fully start
echo    • Check the terminal windows if there are any errors
echo    • OCR invoice creation is fully functional!
echo.
echo 🛑 To stop everything: Close both terminal windows or run .\stop-system.bat
echo.

REM Wait and then open browser
echo 🌐 Opening application in browser in 10 seconds...
timeout /t 10 /nobreak > nul
start http://localhost:3000

echo.
echo ✅ System startup initiated! 
echo Both services should be ready in a few moments.
echo.
pause
