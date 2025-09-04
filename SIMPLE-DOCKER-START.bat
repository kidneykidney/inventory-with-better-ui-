@echo off
echo.
echo ========================================
echo    DOCKER ONE-CLICK STARTUP
echo ========================================
echo.

echo [1/4] Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker not installed
    pause
    exit /b 1
)
echo ✓ Docker CLI found

echo.
echo [2/4] Starting Docker Desktop...
tasklist | findstr "Docker Desktop" >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start...
    timeout /t 15 /nobreak >nul
)

echo.
echo [3/4] Testing Docker connection...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker not responding - virtualization issue detected
    echo.
    echo SOLUTION OPTIONS:
    echo 1. Run ENABLE-DOCKER.bat as administrator (requires restart)
    echo 2. Use local setup instead (npm run local)
    echo.
    set /p choice="Choose option (1 or 2): "
    if "%choice%"=="1" (
        start ENABLE-DOCKER.bat
    ) else (
        echo Starting local setup...
        call LOCAL-START.bat
    )
    exit /b 0
)

echo ✓ Docker is working

echo.
echo [4/4] Starting inventory system...
echo Stopping any existing containers...
docker-compose down >nul 2>&1

echo Building and starting containers...
docker-compose up --build -d

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    SUCCESS! SYSTEM RUNNING
    echo ========================================
    echo.
    echo Frontend:    http://localhost:3000
    echo Backend API:  http://localhost:8000
    echo API Docs:    http://localhost:8000/docs
    echo.
    echo Login: admin / College@2025
    echo.
    echo To stop: npm run docker:stop
    echo.
    set /p open="Open in browser? (y/n): "
    if /i "%open%"=="y" start http://localhost:3000
) else (
    echo ERROR: Docker startup failed
    echo Falling back to local setup...
    call LOCAL-START.bat
)

pause
