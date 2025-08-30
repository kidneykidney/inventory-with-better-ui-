@echo off
REM Smart Stop Script for Inventory Management System
REM This will stop both Docker containers and local processes

title Inventory Management System - Stop

echo 🛑 Stopping Inventory Management System
echo ========================================
echo.

REM Stop Docker containers if running
echo 🐳 Stopping Docker containers...
docker-compose down 2>nul
if %ERRORLEVEL% equ 0 (
    echo ✅ Docker containers stopped
) else (
    echo ℹ️  No Docker containers were running
)

REM Kill local processes
echo 🧹 Cleaning up local processes...
echo 🛑 Stopping Python API servers...
taskkill /f /im python.exe 2>nul

echo 🛑 Stopping React development server...
taskkill /f /im node.exe 2>nul

echo 🛑 Closing terminal windows...
taskkill /f /im "cmd.exe" /fi "WINDOWTITLE eq Backend API - Inventory System" 2>nul
taskkill /f /im "cmd.exe" /fi "WINDOWTITLE eq Frontend - Inventory System" 2>nulp Script for Inventory Management System
REM This will stop all Docker containers and clean up

title Inventory Management System - Stop

echo 🛑 Stopping Inventory Management System
echo ========================================
echo.

REM Stop all services
echo � Stopping all Docker containers...
docker-compose down

REM Kill any remaining processes just in case
echo 🧹 Cleaning up any remaining processes...
taskkill /f /im python.exe 2>nul
taskkill /f /im node.exe 2>nul

echo.
echo ✅ All services stopped successfully!
echo.
echo 💡 To start again: Run .\start-system.bat
echo 🧹 To clean restart: Run .\start-system.bat (it will rebuild automatically)
echo.

pause
