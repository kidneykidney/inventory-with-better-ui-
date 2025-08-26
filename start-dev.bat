@echo off
REM Development Mode - Auto-restart on file changes
REM Perfect for coding and testing

title Inventory System - Development Mode

echo 🛠️  Starting Development Mode
echo ============================
echo 🔄 Auto-restart enabled for file changes
echo.

REM Check virtual environment
if not exist ".venv\Scripts\activate.bat" (
    echo ❌ Virtual environment not found!
    echo Setting up virtual environment...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install -r backend\requirements.txt
)

REM Activate virtual environment
call .venv\Scripts\activate.bat

echo 📦 Virtual environment activated
echo.

REM Start backend with auto-reload
echo 🔧 Starting Backend API (Development Mode)...
start "Backend DEV - Auto Reload" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001"

REM Wait for backend
timeout /t 3 /nobreak > nul

REM Start frontend with hot reload
echo 🎨 Starting Frontend (Development Mode)...
start "Frontend DEV - Hot Reload" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo 🛠️  Development Mode Active!
echo.
echo 📱 Your development environment:
echo    🌐 Frontend: http://localhost:3000 (Hot reload enabled)
echo    🔧 Backend API: http://localhost:8001 (Auto-reload enabled)  
echo    📚 API Docs: http://localhost:8001/docs
echo.
echo 🔄 Features:
echo    • Backend restarts automatically when Python files change
echo    • Frontend updates automatically when React files change
echo    • Perfect for development and testing
echo.
echo 🛑 To stop: Close the terminal windows or press Ctrl+C in each
echo.

REM Optional: Monitor logs
set /p show_logs="📊 Show combined logs? (y/n): "
if /i "%show_logs%"=="y" (
    echo 📋 Opening log monitor...
    timeout /t 2 /nobreak > nul
    echo Monitoring logs... Press Ctrl+C to stop
    echo.
    REM This will show logs from both services
    powershell -Command "& {Get-Content 'logs\inventory_system.log' -Wait -Tail 10}" 2>nul
)

pause
