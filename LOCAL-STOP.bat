@echo off
REM LOCAL STOP SCRIPT - Stop all local services
REM This script stops the backend and frontend servers

title Inventory Management System - Local Stop

color 0C
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                INVENTORY MANAGEMENT SYSTEM                   ║
echo  ║                     LOCAL SHUTDOWN                           ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

echo  🛑 Stopping Inventory Management System (Local)...
echo.

REM Stop processes on specific ports
echo  🔌 Stopping services on ports 5173, 8000, and 3000...

REM Stop Frontend (port 5173)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    echo     Stopping frontend process %%a
    taskkill /f /pid %%a >nul 2>&1
)

REM Stop Backend (port 8000)  
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    echo     Stopping backend process %%a
    taskkill /f /pid %%a >nul 2>&1
)

REM Stop any Node.js processes
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo     Stopping Node.js process %%a
    taskkill /f /pid %%a >nul 2>&1
)

REM Stop Python processes (FastAPI/Uvicorn)
echo  🐍 Stopping Python processes...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im uvicorn.exe >nul 2>&1

REM Stop Node.js processes  
echo  📦 Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo  ✅ LOCAL SHUTDOWN COMPLETE!
echo.

REM Check if ports are now free
echo  📊 Port status:
netstat -an | findstr ":5173 :8000 :3000" 2>nul || echo     All ports are now free
echo.

echo  💡 To start again, run: LOCAL-START.bat
echo.
pause
