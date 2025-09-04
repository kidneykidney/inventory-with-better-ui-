@echo off
REM DOCKER STATUS CHECKER - Inventory Management System
REM This script shows the health and status of all services

title Inventory Management System - Health Check

color 0B
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                INVENTORY MANAGEMENT SYSTEM                   ║
echo  ║                    HEALTH CHECK                              ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ❌ Docker is not running!
    echo.
    pause
    exit /b 1
)

echo  🔍 SYSTEM HEALTH CHECK
echo  ═══════════════════════
echo.

REM Container Status
echo  📦 CONTAINER STATUS:
docker compose ps
echo.

REM Service Health
echo  🏥 HEALTH STATUS:
echo.

REM Check Database
echo  🗄️  Database (PostgreSQL):
timeout /t 1 /nobreak > nul 2>&1
docker exec inventory_postgres pg_isready -U postgres 2>nul && (
    echo     ✅ Database is healthy
) || (
    echo     ❌ Database is not responding
)

REM Check Backend
echo  🔧 Backend (FastAPI):
timeout /t 1 /nobreak > nul 2>&1
curl -s -f http://localhost:8000/api/products >nul 2>&1 && (
    echo     ✅ Backend API is healthy
) || (
    echo     ❌ Backend API is not responding
)

REM Check Frontend
echo  🌐 Frontend (React):
timeout /t 1 /nobreak > nul 2>&1
curl -s -f http://localhost:5173 >nul 2>&1 && (
    echo     ✅ Frontend is healthy
) || (
    echo     ❌ Frontend is not responding
)

echo.

REM Resource Usage
echo  📊 RESOURCE USAGE:
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo.

REM Logs (last 10 lines from each service)
echo  📝 RECENT LOGS:
echo.
echo  ── Database Logs ──
docker compose logs --tail=5 postgres 2>nul || echo     No logs available
echo.
echo  ── Backend Logs ──
docker compose logs --tail=5 backend 2>nul || echo     No logs available
echo.
echo  ── Frontend Logs ──
docker compose logs --tail=5 frontend 2>nul || echo     No logs available
echo.

REM Port Status
echo  🔌 PORT STATUS:
netstat -an | findstr ":5173 :8000 :5432" 2>nul || echo     No active ports found
echo.

echo  💡 QUICK COMMANDS:
echo     • View live logs:    docker compose logs -f
echo     • Restart service:   docker compose restart [service_name]
echo     • Stop system:       ONE-CLICK-STOP.bat
echo     • Start system:      ONE-CLICK-START.bat
echo.

pause
