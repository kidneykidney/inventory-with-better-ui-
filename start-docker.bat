@echo off
REM Docker Startup Script - Secure Authentication System
REM This will run your system in containers with complete security features

title Inventory System - Docker Mode (Secure)

echo 🐳 Starting Inventory System (Docker Mode)
echo ===========================================
echo � Secure Authentication System Enabled
echo �💾 Optimized for production deployment
echo.

echo 📋 Default Admin Credentials:
echo    Username: admin
echo    Password: College@2025
echo    Email: admin@college.edu
echo.
echo ⚠️  IMPORTANT: Change the default password after first login!
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
docker compose down 2>nul

REM Check if this is first run (build needed)
docker images | findstr "inventory-with-better-ui" >nul
if %errorlevel% neq 0 (
    echo 🏗️  First time setup - Building containers with authentication...
    echo ⏳ This may take 5-10 minutes...
    docker compose build --no-cache
    if %errorlevel% neq 0 (
        echo ❌ Build failed! Check the output above.
        pause
        exit /b 1
    )
)

REM Start containers
echo 🚀 Starting containers with authentication system...
docker compose up -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start containers!
    echo 💡 Try: docker compose down && docker compose build --no-cache && docker compose up -d
    pause
    exit /b 1
)

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak > nul

REM Check container status
echo 📊 Container Status:
docker compose ps

echo.
echo ✅ System Started Successfully!
echo.
echo � Authentication System Features:
echo    • Secure Login/Logout System
echo    • Role-Based Access Control (Main Admin, Sub Admin)  
echo    • User Management Dashboard
echo    • Session Security & Audit Logging
echo.
echo �📱 Your application is now running:
echo    🌐 Frontend: http://localhost:5173
echo    🔧 Backend API: http://localhost:8000
echo    📚 API Docs: http://localhost:8000/docs
echo    🔐 Auth API: http://localhost:8000/api/auth/docs
echo    🗄️  Database: localhost:5432
echo.
echo 📊 Monitoring Commands:
echo    docker compose logs -f          # View live logs
echo    docker compose ps              # Check status
echo    docker stats                   # Monitor resources
echo.
echo 🛑 To stop the system:
echo    docker compose down
echo.

REM Optional: Open browser
set /p open_browser="🌐 Open browser automatically? (y/n): "
if /i "%open_browser%"=="y" (
    start http://localhost:5173
)

pause
