@echo off
REM Quick System Status Check for 8GB RAM System

echo 🔍 System Status Check
echo ====================

echo.
echo 🖥️  System Memory:
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /format:list | findstr "="

echo.
echo 🐳 Docker Status:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 📊 Container Resource Usage:
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo.
echo 🌐 Service Health Check:
echo Testing Frontend (http://localhost:3000)...
curl -s -o nul -w "%%{http_code}" http://localhost:3000 > temp_status.txt
set /p frontend_status=<temp_status.txt
if "%frontend_status%"=="200" (
    echo ✅ Frontend: Online
) else (
    echo ❌ Frontend: Offline or Error
)

echo Testing Backend API (http://localhost:8001)...
curl -s -o nul -w "%%{http_code}" http://localhost:8001/health > temp_status2.txt
set /p backend_status=<temp_status2.txt
if "%backend_status%"=="200" (
    echo ✅ Backend: Online
) else (
    echo ❌ Backend: Offline or Error
)

del temp_status.txt temp_status2.txt 2>nul

echo.
echo 📋 Quick Actions:
echo   1. View logs: docker-compose logs -f
echo   2. Restart services: docker-compose restart
echo   3. Stop all: docker-compose down
echo   4. Monitor memory: python memory_monitor.py
echo   5. Build fresh: docker-compose down && docker-compose build --no-cache && docker-compose up -d

pause
