@echo off
REM Quick Start Script for Inventory Management System with Secure Authentication
REM This will start both backend and frontend with complete authentication system

title Inventory Management System - Quick Start (Secure)

echo 🚀 Starting Inventory Management System
echo ========================================
echo 🔐 Secure Authentication System Enabled
echo ========================================
echo.

echo 📋 Default Admin Credentials:
echo    Username: admin
echo    Password: College@2025
echo    Email: admin@college.edu
echo.
echo ⚠️  IMPORTANT: Change the default password after first login!
echo.

# Check if virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo 📦 Creating virtual environment...
    python -m venv .venv
)

REM Activate virtual environment and install dependencies
echo 📦 Activating virtual environment...
call .venv\Scripts\activate.bat

REM Install Python dependencies
echo 📦 Installing Python dependencies...
cd backend
pip install -r requirements.txt
cd ..

REM Install Node.js dependencies
echo 📦 Installing Node.js dependencies...
npm install

REM Kill any existing processes on our ports
echo 🧹 Cleaning up existing processes...
netstat -ano | findstr :8000 > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo 🛑 Stopping existing backend on port 8000...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /f /pid %%a > nul 2>&1
)

netstat -ano | findstr :5173 > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo 🛑 Stopping existing frontend on port 5173...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /f /pid %%a > nul 2>&1
)

REM Wait a moment for cleanup
timeout /t 2 /nobreak > nul

REM Start backend API in a new window
echo 🔧 Starting Backend API with Authentication on port 8000...
start "Backend API - Inventory System (Auth)" cmd /k "cd /d %~dp0 && .venv\Scripts\activate.bat && cd backend && python main.py"

REM Wait a moment then start frontend
echo ⏳ Waiting 3 seconds before starting frontend...
timeout /t 3 /nobreak > nul

echo 🎨 Starting Frontend with Login System on port 5173...
start "Frontend - Inventory System (Secure)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ✅ Services Starting!
echo.
echo � Authentication System Features:
echo    • Secure Login/Logout System
echo    • Role-Based Access Control (Main Admin, Sub Admin)
echo    • User Management Dashboard
echo    • Session Security & Audit Logging
echo.
echo �📱 Your application will be available at:
echo    🌐 Frontend: http://localhost:5173
echo    🔧 Backend API: http://localhost:8000  
echo    📚 API Docs: http://localhost:8000/api/docs
echo.
echo 💡 Tips:
echo    • Login page will appear at startup
echo    • Use admin credentials to access system
echo    • Create sub-admins from User Management
echo    • Check API docs for authentication endpoints
echo    • OCR invoice creation is fully functional!
echo.
echo 🛑 To stop everything: Close both terminal windows or run .\stop-system.bat
echo.

REM Wait and then open browser
echo 🌐 Opening application in browser in 10 seconds...
timeout /t 10 /nobreak > nul
start http://localhost:5173

echo.
echo ✅ System startup initiated! 
echo 🔐 Secure authentication system ready!
echo Both services should be ready in a few moments.
echo.
pause
