@echo off
REM Quick Start Script for Inventory Management System
REM This will start both backend and frontend automatically

title Inventory Management System Starter

echo 🚀 Starting Inventory Management System
echo ========================================
echo.

REM Check if virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo ❌ Virtual environment not found!
    echo Please run: python -m venv .venv
    echo Then run: .venv\Scripts\activate.bat
    echo Then run: pip install -r backend\requirements.txt
    pause
    exit /b 1
)

REM Activate virtual environment
echo 📦 Activating virtual environment...
call .venv\Scripts\activate.bat

REM Check if PostgreSQL is running (optional)
echo 🗄️  Checking database connection...
timeout /t 2 /nobreak > nul

REM Start backend API in a new window
echo 🔧 Starting Backend API...
start "Backend API - Inventory System" cmd /k "cd /d %~dp0backend && python main.py"

REM Wait a moment for backend to start
echo ⏳ Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

REM Start frontend in a new window  
echo 🎨 Starting Frontend...
start "Frontend - Inventory System" cmd /k "cd /d %~dp0 && npm run dev"

REM Wait for services to start
echo ⏳ Starting services...
timeout /t 3 /nobreak > nul

echo.
echo ✅ System Starting!
echo.
echo 📱 Your application will be available at:
echo    🌐 Frontend: http://localhost:3000
echo    🔧 Backend API: http://localhost:8001  
echo    📚 API Docs: http://localhost:8001/docs
echo.
echo 💡 Tips:
echo    • Both services are running in separate windows
echo    • Close those windows to stop the services
echo    • Check logs in the terminal windows if issues occur
echo.
echo 🛑 To stop everything: Close all terminal windows or press Ctrl+C in each
echo.

pause
