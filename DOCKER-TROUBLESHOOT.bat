@echo off
REM DOCKER TROUBLESHOOTER - Inventory Management System
REM This script helps fix common Docker issues

title Inventory Management System - Troubleshooter

color 0E
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                INVENTORY MANAGEMENT SYSTEM                   ║
echo  ║                   TROUBLESHOOTER                             ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

echo  🔧 DOCKER TROUBLESHOOTER
echo  ═══════════════════════
echo.

REM Check Docker status
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ❌ Docker is not running!
    echo.
    echo  💡 Solutions:
    echo     1. Start Docker Desktop
    echo     2. Wait for it to fully initialize
    echo     3. Try running this script again
    echo.
    pause
    exit /b 1
)

echo  🔍 Diagnosing issues...
echo.

REM Check port conflicts
echo  🔌 Checking port conflicts...
netstat -an | findstr ":5173" >nul && (
    echo     ⚠️  Port 5173 is in use
    echo        Solution: Stop other services using this port
) || (
    echo     ✅ Port 5173 is available
)

netstat -an | findstr ":8000" >nul && (
    echo     ⚠️  Port 8000 is in use
    echo        Solution: Stop other services using this port
) || (
    echo     ✅ Port 8000 is available
)

netstat -an | findstr ":5432" >nul && (
    echo     ⚠️  Port 5432 is in use
    echo        Solution: Stop PostgreSQL or other database services
) || (
    echo     ✅ Port 5432 is available
)

echo.

REM Check disk space
echo  💾 Checking disk space...
for /f "tokens=3" %%a in ('dir /-c %SystemDrive%\ ^| find "bytes free"') do (
    set /a freespace=%%a/1024/1024/1024
)
if %freespace% LSS 5 (
    echo     ⚠️  Low disk space: %freespace%GB free
    echo        Solution: Free up at least 5GB for Docker
) else (
    echo     ✅ Sufficient disk space: %freespace%GB free
)

echo.

REM Check Docker resources
echo  🐳 Checking Docker resources...
docker system df
echo.

echo  🛠️  TROUBLESHOOTING OPTIONS:
echo  ═══════════════════════════
echo.
echo  1. Clean restart (recommended)
echo  2. Full system reset (removes all data)
echo  3. Check detailed logs
echo  4. Free up Docker space
echo  5. Reset Docker completely
echo  6. Exit troubleshooter
echo.

set /p choice="Select option (1-6): "

if "%choice%"=="1" goto clean_restart
if "%choice%"=="2" goto full_reset
if "%choice%"=="3" goto check_logs
if "%choice%"=="4" goto free_space
if "%choice%"=="5" goto reset_docker
if "%choice%"=="6" goto exit_script

:clean_restart
echo.
echo  🔄 Performing clean restart...
docker compose down --remove-orphans
timeout /t 5 /nobreak > nul
docker compose up -d --build
echo  ✅ Clean restart completed
goto end

:full_reset
echo.
echo  ⚠️  WARNING: This will delete ALL data!
set /p confirm="Are you sure? (y/n): "
if /i "%confirm%"=="y" (
    echo  🗑️  Performing full reset...
    docker compose down -v --remove-orphans
    docker system prune -a -f --volumes
    docker compose up -d --build
    echo  ✅ Full reset completed
) else (
    echo  ❌ Reset cancelled
)
goto end

:check_logs
echo.
echo  📝 Detailed logs:
echo  ─────────────────
docker compose logs --tail=50
goto end

:free_space
echo.
echo  🧹 Freeing up Docker space...
docker system prune -a -f
docker volume prune -f
echo  ✅ Space cleanup completed
goto end

:reset_docker
echo.
echo  🔄 Resetting Docker completely...
echo     This will stop Docker and reset all settings
echo     You may need to restart Docker Desktop manually
pause
docker system prune -a -f --volumes
echo  ✅ Docker reset completed
echo     Please restart Docker Desktop and try again
goto end

:end
echo.
echo  💡 If problems persist:
echo     • Restart Docker Desktop completely
echo     • Restart your computer
echo     • Check Windows Firewall settings
echo     • Ensure no antivirus is blocking Docker
echo.
echo  🚀 Try starting the system: ONE-CLICK-START.bat
echo.

:exit_script
pause
