@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                   🐳 DOCKER ONE-CLICK STARTUP 🐳                           ║
echo ║                    Complete Docker Solution                                  ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

:: Color codes
for /f %%A in ('echo prompt $E ^| cmd') do set "ESC=%%A"
set "GREEN=%ESC%[32m"
set "BLUE=%ESC%[34m"
set "YELLOW=%ESC%[33m"
set "RED=%ESC%[31m"
set "CYAN=%ESC%[36m"
set "RESET=%ESC%[0m"

echo %CYAN%[STEP 1]%RESET% Checking Docker installation...

:: Check if Docker CLI exists
docker --version >nul 2>&1
if !errorlevel! neq 0 (
    echo %RED%❌ Docker not installed%RESET%
    echo %YELLOW%Please install Docker Desktop first%RESET%
    pause
    exit /b 1
)

echo %GREEN%✅ Docker CLI found%RESET%

echo %CYAN%[STEP 2]%RESET% Checking Docker Desktop status...

:: Check if Docker Desktop is running
tasklist | findstr "Docker Desktop" >nul 2>&1
if !errorlevel! neq 0 (
    echo %YELLOW%⚠️  Docker Desktop not running%RESET%
    echo %BLUE%🚀 Starting Docker Desktop...%RESET%
    
    :: Start Docker Desktop
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    echo %BLUE%⏳ Waiting for Docker Desktop to start...%RESET%
    timeout /t 10 /nobreak >nul
    
    :: Wait for Docker daemon to be ready
    set RETRY=0
    :wait_docker
    docker ps >nul 2>&1
    if !errorlevel! equ 0 (
        echo %GREEN%✅ Docker Desktop is ready%RESET%
        goto docker_ready
    )
    
    set /a RETRY+=1
    if !RETRY! lss 30 (
        echo %BLUE%⏳ Still waiting... [!RETRY!/30]%RESET%
        timeout /t 2 /nobreak >nul
        goto wait_docker
    )
    
    echo %RED%❌ Docker Desktop failed to start properly%RESET%
    echo %YELLOW%💡 Possible solutions:%RESET%
    echo    1. Check Docker Desktop for virtualization errors
    echo    2. Run ENABLE-DOCKER.bat as administrator
    echo    3. Use npm run local instead
    echo.
    set /p CHOICE="Try local setup instead? (y/N): "
    if /i "!CHOICE!"=="y" (
        echo %GREEN%🚀 Starting local setup...%RESET%
        call LOCAL-START.bat
        exit /b 0
    )
    pause
    exit /b 1
) else (
    echo %GREEN%✅ Docker Desktop is running%RESET%
)

:docker_ready
echo %CYAN%[STEP 3]%RESET% Testing Docker connectivity...

docker ps >nul 2>&1
if !errorlevel! neq 0 (
    echo %RED%❌ Docker daemon not responding%RESET%
    echo %YELLOW%💡 This usually means virtualization issues%RESET%
    echo.
    echo %BLUE%Options:%RESET%
    echo 1. Run ENABLE-DOCKER.bat (requires restart)
    echo 2. Use local setup (works immediately)
    echo.
    set /p CHOICE="Choose option (1/2): "
    if "!CHOICE!"=="1" (
        echo %BLUE%🔧 Running Docker enabler...%RESET%
        call ENABLE-DOCKER.bat
    ) else (
        echo %GREEN%🚀 Starting local setup...%RESET%
        call LOCAL-START.bat
    )
    exit /b 0
)

echo %GREEN%✅ Docker is working!%RESET%

echo %CYAN%[STEP 4]%RESET% Starting inventory system with Docker...

:: Stop any existing containers
echo %BLUE%🧹 Cleaning up existing containers...%RESET%
docker-compose down >nul 2>&1

:: Build and start containers
echo %BLUE%🏗️  Building and starting containers...%RESET%
docker-compose up --build -d

if !errorlevel! equ 0 (
    echo %GREEN%✅ Docker containers started successfully!%RESET%
    echo.
    echo %CYAN%🎉 INVENTORY SYSTEM RUNNING!%RESET%
    echo.
    echo %GREEN%🌐 Frontend:%RESET%     http://localhost:3000
    echo %GREEN%🔧 Backend API:%RESET%  http://localhost:8000  
    echo %GREEN%📖 API Docs:%RESET%     http://localhost:8000/docs
    echo %GREEN%🗄️  Database:%RESET%     PostgreSQL (containerized)
    echo.
    echo %BLUE%🔑 Default Login:%RESET%
    echo    Username: admin
    echo    Password: College@2025
    echo.
    echo %YELLOW%💡 To stop:%RESET% npm run docker:stop
    echo %YELLOW%💡 To check status:%RESET% npm run docker-status
    echo.
    
    set /p OPEN="Open in browser? (y/N): "
    if /i "!OPEN!"=="y" (
        start http://localhost:3000
    )
    
    echo %GREEN%🎯 All invoice export fixes are included!%RESET%
    pause
) else (
    echo %RED%❌ Docker startup failed%RESET%
    echo %YELLOW%💡 Fallback: Starting local setup...%RESET%
    call LOCAL-START.bat
)
