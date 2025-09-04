@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                  🔧 VIRTUALIZATION DETECTION FIX 🔧                         ║
echo ║                   Docker Desktop + WSL Repair Tool                          ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

:: Check if running as administrator
net session >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ This script must be run as Administrator
    echo 💡 Right-click this script and select "Run as administrator"
    pause
    exit /b 1
)

:: Color codes
for /f %%A in ('echo prompt $E ^| cmd') do set "ESC=%%A"
set "GREEN=%ESC%[32m"
set "BLUE=%ESC%[34m"
set "YELLOW=%ESC%[33m"
set "RED=%ESC%[31m"
set "CYAN=%ESC%[36m"
set "RESET=%ESC%[0m"

echo %CYAN%[STEP 1]%RESET% Checking current virtualization status...

:: Check BIOS virtualization
echo %BLUE%BIOS Virtualization:%RESET%
wmic cpu get VirtualizationFirmwareEnabled /format:list | findstr "TRUE" >nul 2>&1
if !errorlevel! equ 0 (
    echo %GREEN%✅ Enabled in BIOS%RESET%
) else (
    echo %RED%❌ Disabled in BIOS%RESET%
    echo %YELLOW%⚠️  You need to enable virtualization in BIOS settings%RESET%
    pause
    exit /b 1
)

echo %CYAN%[STEP 2]%RESET% Checking Windows features...

:: Check Hyper-V status
echo %BLUE%Checking Hyper-V:%RESET%
dism /online /get-featureinfo /featurename:Microsoft-Hyper-V-All | findstr "State : Enabled" >nul 2>&1
if !errorlevel! equ 0 (
    echo %GREEN%✅ Hyper-V is enabled%RESET%
) else (
    echo %YELLOW%⚠️  Hyper-V not enabled, enabling now...%RESET%
    dism.exe /online /enable-feature /featurename:Microsoft-Hyper-V-All /all /norestart
)

:: Check Virtual Machine Platform
echo %BLUE%Checking Virtual Machine Platform:%RESET%
dism /online /get-featureinfo /featurename:VirtualMachinePlatform | findstr "State : Enabled" >nul 2>&1
if !errorlevel! equ 0 (
    echo %GREEN%✅ Virtual Machine Platform is enabled%RESET%
) else (
    echo %YELLOW%⚠️  Enabling Virtual Machine Platform...%RESET%
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
)

:: Check Windows Subsystem for Linux
echo %BLUE%Checking WSL:%RESET%
dism /online /get-featureinfo /featurename:Microsoft-Windows-Subsystem-Linux | findstr "State : Enabled" >nul 2>&1
if !errorlevel! equ 0 (
    echo %GREEN%✅ WSL is enabled%RESET%
) else (
    echo %YELLOW%⚠️  Enabling WSL...%RESET%
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
)

echo %CYAN%[STEP 3]%RESET% Checking and restarting services...

:: Stop Docker Desktop if running
echo %BLUE%Stopping Docker Desktop...%RESET%
taskkill /f /im "Docker Desktop.exe" >nul 2>&1
taskkill /f /im "dockerd.exe" >nul 2>&1

:: Restart Hyper-V services
echo %BLUE%Restarting Hyper-V services...%RESET%
net stop vmms >nul 2>&1
net stop vmcompute >nul 2>&1
net start vmms >nul 2>&1
net start vmcompute >nul 2>&1

:: Restart WSL
echo %BLUE%Restarting WSL...%RESET%
wsl --shutdown >nul 2>&1
timeout /t 3 /nobreak >nul

echo %CYAN%[STEP 4]%RESET% Testing virtualization detection...

:: Test if virtualization is now working
echo %BLUE%Testing Hyper-V detection:%RESET%
systeminfo | findstr /C:"Hyper-V Requirements" >nul 2>&1
if !errorlevel! equ 0 (
    systeminfo | findstr /C:"Hyper-V Requirements" -A 4
) else (
    echo %YELLOW%Hyper-V requirements check not available%RESET%
)

echo %CYAN%[STEP 5]%RESET% Alternative solutions if issues persist...

echo.
echo %YELLOW%🔧 ADDITIONAL FIXES:%RESET%
echo.
echo %BLUE%Option A:%RESET% Use Local Development (No virtualization needed)
echo   Command: %GREEN%npm run local%RESET%
echo.
echo %BLUE%Option B:%RESET% Manual Docker restart after reboot
echo   1. Restart computer
echo   2. Start Docker Desktop manually
echo   3. Run: %GREEN%npm run one-click%RESET%
echo.
echo %BLUE%Option C:%RESET% WSL without Docker
echo   1. Restart computer  
echo   2. Run: %GREEN%npm run wsl%RESET%
echo.

echo %CYAN%[RECOMMENDATION]%RESET%
echo %GREEN%For immediate use:%RESET% npm run local
echo %GREEN%After restart:%RESET% npm run one-click or npm run wsl
echo.

set /p CHOICE="What would you like to do? (1=Restart now, 2=Start local now, 3=Exit): "

if "!CHOICE!"=="1" (
    echo %BLUE%Restarting computer in 10 seconds...%RESET%
    echo %YELLOW%Press Ctrl+C to cancel%RESET%
    timeout /t 10
    shutdown /r /t 0
) else if "!CHOICE!"=="2" (
    echo %GREEN%Starting local development environment...%RESET%
    cd /d "C:\Users\User\inventory-with-better-ui-"
    call LOCAL-START.bat
) else (
    echo %BLUE%Manual restart recommended for best results%RESET%
    pause
)
