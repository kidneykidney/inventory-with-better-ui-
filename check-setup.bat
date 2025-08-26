@echo off
REM Quick Setup Checker - Verifies your environment is ready

title System Setup Checker

echo 🔍 Inventory System - Setup Checker
echo ===================================
echo.

set "all_good=1"

REM Check Python
echo 📍 Checking Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    python --version
    echo ✅ Python is installed
) else (
    echo ❌ Python is not installed or not in PATH
    set "all_good=0"
)

echo.

REM Check Node.js
echo 📍 Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    node --version
    echo ✅ Node.js is installed
) else (
    echo ❌ Node.js is not installed
    set "all_good=0"
)

echo.

REM Check virtual environment
echo 📍 Checking Virtual Environment...
if exist ".venv\Scripts\activate.bat" (
    echo ✅ Virtual environment exists
    call .venv\Scripts\activate.bat
    echo 📦 Python packages:
    pip list | findstr "fastapi\|uvicorn\|psycopg2"
) else (
    echo ❌ Virtual environment not found
    echo 💡 Run: python -m venv .venv
    set "all_good=0"
)

echo.

REM Check npm packages
echo 📍 Checking NPM packages...
if exist "node_modules" (
    echo ✅ NPM packages installed
) else (
    echo ❌ NPM packages not installed
    echo 💡 Run: npm install
    set "all_good=0"
)

echo.

REM Check Docker (optional)
echo 📍 Checking Docker (optional)...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    docker --version
    echo ✅ Docker is available
) else (
    echo ℹ️  Docker not installed (optional for development)
)

echo.

REM Check database connection
echo 📍 Checking Database Connection...
echo import psycopg2; print("✅ Database libraries available") > temp_db_check.py
python temp_db_check.py 2>nul
if %errorlevel% equ 0 (
    echo ✅ Database libraries ready
) else (
    echo ❌ Database connection issues
    echo 💡 Check PostgreSQL installation
    set "all_good=0"
)
del temp_db_check.py 2>nul

echo.
echo ==========================================
if "%all_good%"=="1" (
    echo 🎉 SYSTEM READY!
    echo.
    echo 🚀 Choose how to start:
    echo    1. start-system.bat     # Quick Python start
    echo    2. start-docker.bat     # Docker containers  
    echo    3. start-dev.bat        # Development mode
    echo.
) else (
    echo ⚠️  SETUP INCOMPLETE
    echo.
    echo 🔧 Run these commands to fix:
    if not exist ".venv\Scripts\activate.bat" echo    python -m venv .venv
    if not exist ".venv\Scripts\activate.bat" echo    .venv\Scripts\activate.bat
    if not exist ".venv\Scripts\activate.bat" echo    pip install -r backend\requirements.txt
    if not exist "node_modules" echo    npm install
    echo.
)

pause
