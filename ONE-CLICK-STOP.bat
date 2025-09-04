@echo off
REM ONE-CLICK STOP SCRIPT - Inventory Management System
REM This script will safely stop all Docker containers and clean up

title Inventory Management System - One Click Stop

color 0C
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                INVENTORY MANAGEMENT SYSTEM                   ║
echo  ║                     SAFE SHUTDOWN                            ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

echo  🛑 Stopping Inventory Management System...
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ⚠️  Docker is not running - system may already be stopped
    echo.
    pause
    exit /b 0
)

REM Show current status
echo  📊 Current container status:
docker compose ps
echo.

REM Stop containers gracefully
echo  🛑 Stopping containers gracefully...
docker compose stop
echo.

REM Remove containers and networks
echo  🧹 Cleaning up containers and networks...
docker compose down --remove-orphans
echo.

REM Optional: Clean up volumes (database data)
set /p clean_data="🗄️  Remove database data? (y/n) [This will delete all your data]: "
if /i "%clean_data%"=="y" (
    echo  🗑️  Removing database volumes...
    docker compose down -v
    echo  ⚠️  All database data has been removed!
) else (
    echo  💾 Database data preserved
)

REM Optional: Clean up images
set /p clean_images="🐳 Remove Docker images to free space? (y/n): "
if /i "%clean_images%"=="y" (
    echo  🧹 Removing Docker images...
    docker image prune -a -f
    echo  💾 Disk space freed up
)

echo.
echo  ✅ SYSTEM SHUTDOWN COMPLETE!
echo.
echo  📊 Final status:
docker compose ps 2>nul || echo     No containers running
echo.
echo  💡 To start again, run: ONE-CLICK-START.bat
echo.
pause
