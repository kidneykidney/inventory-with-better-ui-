@echo off
REM ONE-CLICK STARTUP SCRIPT - Inventory Management System
REM This script will start everything you need in Docker containers

title Inventory Management System - One Click Startup

color 0A
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                INVENTORY MANAGEMENT SYSTEM                   ║
echo  ║                    ONE-CLICK STARTUP                         ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.
echo  🚀 Starting complete system in Docker containers...
echo  📦 This includes: Frontend + Backend + Database + Cache fixes
echo.

REM Check if Docker is running
echo  🔍 Checking Docker status...
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ❌ Docker is not running!
    echo.
    echo  💡 Please start Docker Desktop first:
    echo     1. Open Docker Desktop
    echo     2. Wait for it to fully start
    echo     3. Run this script again
    echo.
    pause
    exit /b 1
)
echo  ✅ Docker is running

REM Stop any existing containers gracefully
echo  🛑 Stopping any existing containers...
docker compose down --remove-orphans 2>nul
docker container prune -f 2>nul

REM Clean up any orphaned resources
echo  🧹 Cleaning up resources...
docker system prune -f --volumes 2>nul

REM Check if we need to build (first time or after changes)
echo  🏗️  Building containers with latest changes...
docker compose build --no-cache
if %errorlevel% neq 0 (
    echo  ❌ Build failed! Check the output above.
    echo.
    echo  💡 Common solutions:
    echo     - Make sure no other services are using ports 8000, 5173, or 5432
    echo     - Check if you have enough disk space
    echo     - Try restarting Docker Desktop
    echo.
    pause
    exit /b 1
)

REM Start all services
echo  🚀 Starting all services...
docker compose up -d
if %errorlevel% neq 0 (
    echo  ❌ Failed to start containers!
    echo.
    echo  💡 Trying to fix common issues...
    docker compose down
    timeout /t 5 /nobreak > nul
    docker compose up -d
    if %errorlevel% neq 0 (
        echo  ❌ Still failing. Please check Docker Desktop and try again.
        pause
        exit /b 1
    )
)

REM Wait for services to initialize
echo  ⏳ Waiting for services to initialize...
echo     Database: Starting PostgreSQL...
timeout /t 10 /nobreak > nul
echo     Backend: Starting FastAPI server...
timeout /t 15 /nobreak > nul
echo     Frontend: Starting React development server...
timeout /t 20 /nobreak > nul

REM Check service health
echo  🔍 Checking service health...
docker compose ps

echo.
echo  ✅ SYSTEM STARTUP COMPLETE!
echo.
echo  🌐 Your Inventory Management System is now running:
echo.
echo  ┌─────────────────────────────────────────────────────────────┐
echo  │  📱 Frontend (React):     http://localhost:5173            │
echo  │  🔧 Backend API:          http://localhost:8000            │
echo  │  📚 API Documentation:    http://localhost:8000/docs       │
echo  │  🗄️  Database:             localhost:5432                  │
echo  └─────────────────────────────────────────────────────────────┘
echo.
echo  🔐 Default Admin Login:
echo     Username: admin
echo     Password: College@2025
echo.
echo  📊 Useful Commands:
echo     • View logs:           docker compose logs -f
echo     • Check status:        docker compose ps
echo     • Stop system:         docker compose down
echo     • Restart services:    docker compose restart
echo.
echo  🔧 Features Available:
echo     ✅ Invoice Export (Fixed caching issues)
echo     ✅ Real-time data updates
echo     ✅ Professional CSV formatting
echo     ✅ Complete inventory management
echo     ✅ User authentication system
echo.

REM Optional: Open browser automatically
set /p open_browser="🌐 Open browser automatically? (y/n): "
if /i "%open_browser%"=="y" (
    echo  🚀 Opening browser...
    start http://localhost:5173
    timeout /t 2 /nobreak > nul
    start http://localhost:8000/docs
)

echo.
echo  🎉 Ready to use! Happy managing! 🎉
echo.
pause
