@echo off
REM Docker Startup Script - Optimized for 8GB RAM
REM This will run your system in containers for better resource management

title Inventory System - Docker Mode

echo 🐳 Starting Inventory System (Docker Mode)
echo ===========================================
echo 💾 Optimized for 8GB RAM systems
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running!
    echo.
    echo Please start Docker Desktop first, then run this script again.
    echo.
    echo 💡 If Docker is not installed:
    echo    Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose down 2>nul

REM Check if this is first run (build needed)
docker images | findstr "inventory1" >nul
if %errorlevel% neq 0 (
    echo 🏗️  First time setup - Building containers...
    echo ⏳ This may take 5-10 minutes...
    docker-compose build --no-cache
    if %errorlevel% neq 0 (
        echo ❌ Build failed! Check the output above.
        pause
        exit /b 1
    )
)

REM Start containers
echo 🚀 Starting containers...
docker-compose up -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start containers!
    echo 💡 Try: docker-compose down && docker-compose build --no-cache && docker-compose up -d
    pause
    exit /b 1
)

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak > nul

REM Check container status
echo 📊 Container Status:
docker-compose ps

echo.
echo ✅ System Started Successfully!
echo.
echo 📱 Your application is now running:
echo    🌐 Frontend: http://localhost:3000
echo    🔧 Backend API: http://localhost:8001
echo    📚 API Docs: http://localhost:8001/docs
echo    🗄️  Database: localhost:5432
echo.
echo 📊 Monitoring Commands:
echo    docker-compose logs -f          # View live logs
echo    docker-compose ps              # Check status
echo    docker stats                   # Monitor resources
echo    python memory_monitor.py       # Memory usage monitor
echo.
echo 🛑 To stop the system:
echo    docker-compose down
echo.

REM Optional: Open browser
set /p open_browser="🌐 Open browser automatically? (y/n): "
if /i "%open_browser%"=="y" (
    start http://localhost:3000
)

pause
