@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                        🐧 WSL SYSTEM STATUS CHECK 🐧                        ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

:: Color codes
for /f %%A in ('echo prompt $E ^| cmd') do set "ESC=%%A"
set "GREEN=%ESC%[32m"
set "BLUE=%ESC%[34m"
set "YELLOW=%ESC%[33m"
set "RED=%ESC%[31m"
set "RESET=%ESC%[0m"

echo %BLUE%[INFO]%RESET% Checking WSL installation...

:: Check WSL version
echo %YELLOW%WSL Version:%RESET%
wsl --version 2>nul || echo %RED%WSL not installed%RESET%

echo.
echo %YELLOW%Installed Distributions:%RESET%
wsl -l -v 2>nul || echo %RED%No distributions found%RESET%

echo.
echo %YELLOW%WSL Status:%RESET%
wsl --status 2>nul || echo %RED%WSL not available%RESET%

echo.
echo %BLUE%[INFO]%RESET% Checking if services are running in WSL...

:: Check if our services are running
wsl bash -c "ps aux | grep -E '(python|node|npm)' | grep -v grep" 2>nul && (
    echo %GREEN%[SUCCESS]%RESET% Found running services
) || (
    echo %YELLOW%[INFO]%RESET% No inventory services currently running
)

echo.
echo %BLUE%[INFO]%RESET% Testing network connectivity...
wsl bash -c "curl -s http://localhost:8000/health 2>/dev/null" && (
    echo %GREEN%[SUCCESS]%RESET% Backend is responding
) || (
    echo %YELLOW%[INFO]%RESET% Backend not responding
)

wsl bash -c "curl -s http://localhost:5173 2>/dev/null" && (
    echo %GREEN%[SUCCESS]%RESET% Frontend is responding  
) || (
    echo %YELLOW%[INFO]%RESET% Frontend not responding
)

echo.
echo %BLUE%[INFO]%RESET% PostgreSQL status in WSL:
wsl bash -c "sudo service postgresql status 2>/dev/null" || echo %YELLOW%PostgreSQL not configured yet%RESET%

echo.
pause
