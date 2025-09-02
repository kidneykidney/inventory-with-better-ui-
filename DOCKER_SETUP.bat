@echo off
REM ================================================================
REM ONE-COMMAND DOCKER SETUP
REM Complete setup using Docker - no manual dependency installation
REM ================================================================

title Inventory System - Docker Setup

echo.
echo ==========================================
echo 🐳 DOCKER SETUP - INVENTORY SYSTEM
echo ==========================================
echo.
echo This will set up everything using Docker:
echo   ✓ PostgreSQL Database
echo   ✓ Python Backend with all dependencies
echo   ✓ React Frontend  
echo   ✓ OCR Components (Tesseract)
echo   ✓ All configurations
echo.
echo Prerequisites: Docker Desktop must be installed
echo Estimated time: 2-3 minutes
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Docker is not installed or not running
    echo.
    echo Please install Docker Desktop:
    echo 1. Download from: https://docker.com/products/docker-desktop
    echo 2. Install and start Docker Desktop
    echo 3. Run this script again
    echo.
    pause
    goto :end
)

echo ✅ Docker found:
docker --version

set /p confirm="Continue with Docker setup? (Y/N): "
if /i not "%confirm%"=="Y" goto :end

echo.
echo 🧹 Cleaning up any existing containers...
docker-compose -f docker-compose-auto.yml down -v 2>nul

echo.
echo 🚀 Starting all services with Docker...
echo This may take a few minutes on first run...
docker-compose -f docker-compose-auto.yml up --build -d

echo.
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

echo.
echo 🔍 Checking service status...
docker-compose -f docker-compose-auto.yml ps

echo.
echo ==========================================
echo 🎉 DOCKER SETUP COMPLETE!
echo ==========================================
echo.
echo 🌐 Your application is available at:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo 📋 Docker Commands:
echo   docker-compose -f docker-compose-auto.yml logs    - View logs
echo   docker-compose -f docker-compose-auto.yml stop    - Stop services
echo   docker-compose -f docker-compose-auto.yml start   - Start services  
echo   docker-compose -f docker-compose-auto.yml down    - Remove everything
echo.

set /p open_browser="Open application in browser? (Y/N): "
if /i "%open_browser%"=="Y" (
    echo 🌐 Opening application...
    timeout /t 5 /nobreak >nul
    start http://localhost:3000
)

:end
echo.
echo Press any key to exit.
pause >nul
