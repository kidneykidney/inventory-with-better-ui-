@echo off
REM One-Click Docker Start - Complete Inventory Management System
REM Updated with secure authentication and database sync

title Inventory Management System - Docker One-Click Start

echo 🚀 INVENTORY MANAGEMENT SYSTEM - ONE-CLICK DOCKER START
echo ========================================================
echo 🐳 Complete system with authentication & database sync
echo ========================================================
echo.

echo 📋 Default Admin Credentials:
echo    Username: admin
echo    Password: College@2025
echo    Email: admin@college.edu
echo.

REM Check Docker
docker --version >nul 2>&1 || (
    echo ❌ Docker not found! Please install Docker Desktop.
    pause & exit /b 1
)

echo ✅ Docker available
echo.

REM Clean start
echo 🧹 Cleaning previous containers...
docker-compose down --remove-orphans >nul 2>&1

echo 🐳 Starting complete system...
echo    📊 PostgreSQL (inventory_management database)
echo    🔧 FastAPI Backend (with auth & sync)
echo    🎨 React Frontend (with login)
echo.

REM Start everything
docker-compose up --build -d

if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to start! Check Docker Desktop is running.
    pause & exit /b 1
)

echo ✅ All services started!
echo.
echo 🎉 SYSTEM READY!
echo.
echo 📱 Access your application:
echo    🌐 Frontend: http://localhost:5173
echo    🔧 API: http://localhost:8000
echo    📚 API Docs: http://localhost:8000/docs
echo    🗄️  Database: localhost:5432 (postgres/gugan@2022)
echo.
echo 🧪 Your admin_users_query.sql will now work with:
echo    Database: inventory_management
echo    User: postgres
echo    Password: gugan@2022
echo.
echo 💡 Useful commands:
echo    docker-compose logs -f    # View logs
echo    docker-compose ps         # Check status
echo    docker-compose down       # Stop system
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5173

echo 🌐 Opening browser...
echo.
echo 🛑 To stop: docker-compose down
pause
