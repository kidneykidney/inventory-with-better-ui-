@echo off
REM LOCAL STATUS CHECKER - Check health of local services
REM This script shows the status of all locally running services

title Inventory Management System - Local Status Check

color 0B
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                INVENTORY MANAGEMENT SYSTEM                   ║
echo  ║                   LOCAL STATUS CHECK                         ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

echo  🔍 LOCAL SYSTEM HEALTH CHECK
echo  ═══════════════════════════════
echo.

REM Check if services are running on expected ports
echo  🔌 PORT STATUS:
echo.

REM Check Frontend (React - port 5173)
netstat -an | findstr ":5173" >nul 2>&1 && (
    echo     ✅ Frontend (React) - Port 5173: RUNNING
) || (
    echo     ❌ Frontend (React) - Port 5173: NOT RUNNING
)

REM Check Backend (FastAPI - port 8000)
netstat -an | findstr ":8000" >nul 2>&1 && (
    echo     ✅ Backend (FastAPI) - Port 8000: RUNNING
) || (
    echo     ❌ Backend (FastAPI) - Port 8000: NOT RUNNING
)

REM Check if alternative ports are being used
netstat -an | findstr ":3000" >nul 2>&1 && (
    echo     ⚠️  Alternative Port 3000: IN USE
) || (
    echo     ✅ Port 3000: AVAILABLE
)

echo.

REM Test service connectivity
echo  🌐 SERVICE CONNECTIVITY:
echo.

REM Test Frontend
echo     Testing Frontend...
timeout /t 1 /nobreak > nul 2>&1
curl -s -f http://localhost:5173 >nul 2>&1 && (
    echo     ✅ Frontend is responding
) || (
    echo     ❌ Frontend is not responding
)

REM Test Backend
echo     Testing Backend API...
timeout /t 1 /nobreak > nul 2>&1
curl -s -f http://localhost:8000 >nul 2>&1 && (
    echo     ✅ Backend API is responding
) || (
    echo     ❌ Backend API is not responding
)

REM Test specific Backend endpoint
echo     Testing Backend Products API...
timeout /t 1 /nobreak > nul 2>&1
curl -s -f http://localhost:8000/api/products >nul 2>&1 && (
    echo     ✅ Backend Products API is responding
) || (
    echo     ❌ Backend Products API is not responding
)

echo.

REM Check running processes
echo  💻 RUNNING PROCESSES:
echo.

REM Check Python processes
echo     Python processes:
tasklist | findstr python.exe >nul 2>&1 && (
    tasklist | findstr python.exe | findstr /v "tasklist"
) || (
    echo     No Python processes running
)

echo.

REM Check Node.js processes  
echo     Node.js processes:
tasklist | findstr node.exe >nul 2>&1 && (
    tasklist | findstr node.exe | findstr /v "tasklist"
) || (
    echo     No Node.js processes running
)

echo.

REM Check dependencies
echo  📦 DEPENDENCIES STATUS:
echo.

REM Check if virtual environment exists
if exist .venv (
    echo     ✅ Python virtual environment: EXISTS
) else (
    echo     ❌ Python virtual environment: MISSING
)

REM Check if node_modules exists
if exist node_modules (
    echo     ✅ Node.js dependencies: INSTALLED
) else (
    echo     ❌ Node.js dependencies: MISSING
)

echo.

REM Show active network connections
echo  🔗 ACTIVE CONNECTIONS:
netstat -an | findstr ":5173 :8000 :3000" 2>nul || echo     No relevant connections found

echo.

echo  💡 QUICK COMMANDS:
echo     • Start system:      LOCAL-START.bat
echo     • Stop system:       LOCAL-STOP.bat
echo     • View backend logs: Check Backend Server window
echo     • View frontend logs: Check Frontend Server window
echo.

pause
