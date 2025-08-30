@echo off
REM Smart Start Script for Inventory Management System
REM This will automatically choose Docker or Local mode

title Inventory Management System Starter

echo 🚀 Starting Inventory Management System
echo ========================================
echo.

REM Check if Docker is available
echo 🐳 Checking for Docker...
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 💡 Docker not found. Starting in LOCAL MODE...
    echo.
    call start-system-local.bat
    exit /b 0
)

docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 💡 Docker not running. Starting in LOCAL MODE...
    echo.
    call start-system-local.bat
    exit /b 0
)

echo ✅ Docker is available! Starting in DOCKER MODE...

docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo ✅ Docker is running!
echo.

REM Stop any existing containers
echo � Stopping any existing containers...
docker-compose down

echo.
echo 🏗️  Building and starting all services...
echo This may take a few minutes on first run...
echo.

REM Build and start all services
docker-compose up --build -d

REM Wait for services to be healthy
echo.
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak > nul

REM Check service status
echo.
echo 🔍 Checking service status...
docker-compose ps

echo.
echo ✅ System Started Successfully!
echo.
echo 📱 Your application is available at:
echo    🌐 Frontend: http://localhost:3000
echo    🔧 Backend API: http://localhost:8000  
echo    📚 API Docs: http://localhost:8000/docs
echo    🗄️  Database: localhost:5432
echo.
echo 💡 Useful Commands:
echo    🔍 View logs: docker-compose logs -f [service_name]
echo    🔍 View all logs: docker-compose logs -f
echo    🛑 Stop system: docker-compose down
echo    🔄 Restart: docker-compose restart
echo    🧹 Clean restart: docker-compose down -v && docker-compose up --build -d
echo.
echo 📋 Service Status:
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 🛑 To stop everything: Run .\stop-system.bat or docker-compose down
echo.

REM Open the application in default browser
echo 🌐 Opening application in browser...
timeout /t 3 /nobreak > nul
start http://localhost:3000

pause
