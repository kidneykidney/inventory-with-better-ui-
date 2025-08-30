@echo off
REM Complete Reset Script for Inventory Management System
REM This will completely clean and rebuild everything

title Inventory Management System - Complete Reset

echo 🔄 Complete Reset of Inventory Management System
echo =================================================
echo.
echo ⚠️  WARNING: This will delete all data and rebuild everything!
echo.

set /p confirm="Are you sure you want to continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ Reset cancelled.
    pause
    exit /b 0
)

echo.
echo 🧹 Stopping all services...
docker-compose down

echo.
echo 🗑️  Removing all volumes and data...
docker-compose down -v
docker volume prune -f

echo.
echo 🐳 Removing old images...
docker-compose down --rmi all

echo.
echo 🏗️  Rebuilding everything from scratch...
docker-compose build --no-cache

echo.
echo 🚀 Starting fresh system...
docker-compose up -d

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak > nul

echo.
echo 🔍 Checking service status...
docker-compose ps

echo.
echo ✅ Complete reset finished!
echo.
echo 📱 Your fresh application is available at:
echo    🌐 Frontend: http://localhost:3000
echo    🔧 Backend API: http://localhost:8000
echo.

pause
