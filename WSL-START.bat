@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                    🐧 INVENTORY SYSTEM - WSL STARTUP 🐧                     ║
echo ║                          One-Click WSL Development                           ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

:: Color codes for Windows terminal
for /f %%A in ('echo prompt $E ^| cmd') do set "ESC=%%A"
set "GREEN=%ESC%[32m"
set "BLUE=%ESC%[34m"
set "YELLOW=%ESC%[33m"
set "RED=%ESC%[31m"
set "RESET=%ESC%[0m"

echo %BLUE%[INFO]%RESET% Checking WSL installation status...

:: Check if WSL is installed
wsl --status >nul 2>&1
if !errorlevel! neq 0 (
    echo %RED%[ERROR]%RESET% WSL is not installed or not properly configured
    echo %YELLOW%[HELP]%RESET% Please run: wsl --install
    echo %YELLOW%[HELP]%RESET% Then restart your computer and run this script again
    pause
    exit /b 1
)

echo %GREEN%[SUCCESS]%RESET% WSL is available

:: Check if Ubuntu is installed (default WSL distribution)
wsl -l -v | findstr "Ubuntu" >nul 2>&1
if !errorlevel! neq 0 (
    echo %YELLOW%[INFO]%RESET% Installing Ubuntu distribution...
    wsl --install -d Ubuntu
    echo %YELLOW%[INFO]%RESET% Please complete Ubuntu setup and run this script again
    pause
    exit /b 0
)

echo %GREEN%[SUCCESS]%RESET% Ubuntu distribution is available

:: Create WSL startup script
echo %BLUE%[INFO]%RESET% Creating WSL startup commands...

set "WSL_SCRIPT=/tmp/inventory_startup.sh"

:: Write the startup script for WSL
(
echo #!/bin/bash
echo echo "🐧 Starting Inventory System in WSL..."
echo.
echo # Update system packages
echo echo "📦 Updating system packages..."
echo sudo apt update ^&^& sudo apt upgrade -y
echo.
echo # Install required packages
echo echo "🔧 Installing required packages..."
echo sudo apt install -y python3 python3-pip python3-venv nodejs npm postgresql postgresql-contrib
echo.
echo # Start PostgreSQL service
echo echo "🗄️ Starting PostgreSQL service..."
echo sudo service postgresql start
echo.
echo # Setup PostgreSQL user and database
echo echo "👤 Setting up database..."
echo sudo -u postgres psql -c "CREATE USER inventory_user WITH PASSWORD 'inventory_pass';" 2^>^/dev/null ^|^| true
echo sudo -u postgres psql -c "CREATE DATABASE inventory_db OWNER inventory_user;" 2^>^/dev/null ^|^| true
echo sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;" 2^>^/dev/null ^|^| true
echo.
echo # Navigate to project directory
echo cd /mnt/c/Users/User/inventory-with-better-ui-
echo.
echo # Setup Python virtual environment
echo echo "🐍 Setting up Python environment..."
echo python3 -m venv .venv
echo source .venv/bin/activate
echo pip install -r backend/requirements.txt 2^>^/dev/null ^|^| pip install fastapi uvicorn psycopg2-binary python-multipart
echo.
echo # Install Node.js dependencies
echo echo "📦 Installing Node.js dependencies..."
echo npm install
echo.
echo # Initialize database
echo echo "🗄️ Initializing database..."
echo cd backend
echo python init_db.py 2^>^/dev/null ^|^| echo "Database already initialized"
echo cd ..
echo.
echo # Start backend in background
echo echo "🚀 Starting backend server..."
echo cd backend
echo source ../.venv/bin/activate
echo python main.py ^&
echo BACKEND_PID=$!
echo cd ..
echo.
echo # Wait for backend to start
echo sleep 5
echo.
echo # Start frontend
echo echo "🌐 Starting frontend server..."
echo npm run dev ^&
echo FRONTEND_PID=$!
echo.
echo echo "✅ System started successfully!"
echo echo "🌐 Frontend: http://localhost:5173"
echo echo "🔧 Backend API: http://localhost:8000"
echo echo "📖 API Docs: http://localhost:8000/docs"
echo echo ""
echo echo "Press Ctrl+C to stop all services"
echo.
echo # Keep script running and handle cleanup
echo trap 'echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2^>^/dev/null; exit' INT TERM
echo wait
) > "%temp%\wsl_startup.sh"

echo %BLUE%[INFO]%RESET% Transferring startup script to WSL...
wsl cp /mnt/c/Users/%USERNAME%/AppData/Local/Temp/wsl_startup.sh %WSL_SCRIPT%
wsl chmod +x %WSL_SCRIPT%

echo %BLUE%[INFO]%RESET% Starting inventory system in WSL...
echo %YELLOW%[NOTE]%RESET% This will open a new WSL session. Keep this window open to maintain services.
echo.

:: Start the WSL script
wsl bash %WSL_SCRIPT%

echo.
echo %GREEN%[INFO]%RESET% WSL session ended. Services have been stopped.
pause
