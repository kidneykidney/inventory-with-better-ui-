@echo off
REM Docker Setup and Run Script for Windows
REM Optimized for 8GB RAM systems

echo 🐳 Inventory Management System - Docker Setup
echo ==============================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    echo After installation, restart your computer and run this script again.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available!
    echo Please ensure Docker Desktop is running properly.
    pause
    exit /b 1
)

echo ✅ Docker is available

REM Build and start services
echo 🏗️  Building containers (optimized for 8GB RAM)...
docker-compose build --no-cache

if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo 🚀 Starting services...
docker-compose up -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start services!
    pause
    exit /b 1
)

echo ⏳ Waiting for services to be ready...
timeout /t 15 /nobreak

echo 🎉 Setup complete!
echo.
echo 📱 Your application is now running:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8001
echo    API Docs: http://localhost:8001/docs
echo.
echo 💾 Memory usage optimized for 8GB RAM systems
echo.
echo 📊 To monitor containers:
echo    docker-compose logs -f        # View all logs
echo    docker-compose ps            # Check status  
echo    docker stats                # Monitor resource usage
echo.
echo 🛑 To stop containers:
echo    docker-compose down
echo.
echo 🔧 To restart after changes:
echo    docker-compose down
echo    docker-compose build --no-cache
echo    docker-compose up -d

pause
