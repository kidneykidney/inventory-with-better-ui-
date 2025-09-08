@echo off
title Inventory System - Local One-Click Startup

echo.
echo ================================================================
echo 🚀 INVENTORY MANAGEMENT SYSTEM - LOCAL ONE-CLICK STARTUP
echo ================================================================
echo 📦 Starting Frontend + Backend Together (No Docker Required)
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this from the inventory-app directory
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo ❌ Error: Virtual environment not found
    echo Please run SETUP.bat first
    pause
    exit /b 1
)

echo 🔧 Starting Backend Server (FastAPI)...
start "Backend - Inventory API" cmd /k "cd /d %~dp0 && .venv\Scripts\activate.bat && cd backend && python main.py"

echo ⏳ Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

echo 🌐 Starting Frontend Server (React)...
start "Frontend - Inventory UI" cmd /k "cd /d %~dp0 && npm run dev"

echo ⏳ Waiting for frontend to initialize...
timeout /t 5 /nobreak > nul

echo.
echo ✅ STARTUP COMPLETE!
echo.
echo 📱 Access your application:
echo    Frontend: http://localhost:3000 (or next available port)
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo 🔑 Default Login:
echo    Username: admin
echo    Password: College@2025
echo.
echo 💡 Two terminal windows opened - keep them running!
echo    Close them to stop the services.
echo.
echo 🌐 Opening browser automatically...
timeout /t 2 /nobreak > nul
start http://localhost:3000

echo.
echo 🎉 Ready to use! Happy managing!
pause
