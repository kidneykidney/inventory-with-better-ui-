@echo off
REM Stop All Services Script
REM Stops both Python processes and Docker containers

title Stop Inventory Management System

echo 🛑 Stopping Inventory Management System
echo =======================================
echo.

REM Stop Docker containers if running
echo 🐳 Stopping Docker containers...
docker-compose down 2>nul
if %errorlevel% equ 0 (
    echo ✅ Docker containers stopped
) else (
    echo ℹ️  No Docker containers were running
)

REM Kill Python processes (FastAPI/Uvicorn)
echo 🐍 Stopping Python API servers...
taskkill /f /im python.exe 2>nul
taskkill /f /im uvicorn.exe 2>nul

REM Kill Node.js processes (React dev server)
echo ⚛️  Stopping React development server...
taskkill /f /im node.exe 2>nul

REM Additional cleanup
echo 🧹 Cleaning up processes...
taskkill /f /im "cmd.exe" /fi "WINDOWTITLE eq Backend API - Inventory System" 2>nul
taskkill /f /im "cmd.exe" /fi "WINDOWTITLE eq Frontend - Inventory System" 2>nul

echo.
echo ✅ All services stopped!
echo.
echo 💡 Tip: If some processes are still running, check Task Manager
echo     and manually end any remaining python.exe or node.exe processes
echo.

timeout /t 3 /nobreak > nul
