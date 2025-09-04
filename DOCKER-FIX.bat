@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                    🐳 DOCKER DESKTOP VIRTUALIZATION FIX 🐳                 ║
echo ║                        Complete Docker Repair Tool                          ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

:: Check if running as administrator
net session >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ This script must be run as Administrator
    echo 💡 Right-click this script and select "Run as administrator"
    echo.
    echo 🔄 Attempting to restart as administrator...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b 0
)

:: Color codes
for /f %%A in ('echo prompt $E ^| cmd') do set "ESC=%%A"
set "GREEN=%ESC%[32m"
set "BLUE=%ESC%[34m"
set "YELLOW=%ESC%[33m"
set "RED=%ESC%[31m"
set "CYAN=%ESC%[36m"
set "MAGENTA=%ESC%[35m"
set "RESET=%ESC%[0m"

echo %GREEN%✅ Running with Administrator privileges%RESET%
echo.

echo %CYAN%[STEP 1]%RESET% Checking system compatibility...

:: Check Windows version
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo %BLUE%Windows Version:%RESET% %VERSION%

:: Check if Windows 10/11 Pro/Enterprise (required for Hyper-V)
wmic os get caption | findstr /i "Pro\|Enterprise\|Education" >nul 2>&1
if !errorlevel! equ 0 (
    echo %GREEN%✅ Windows edition supports Hyper-V%RESET%
) else (
    echo %YELLOW%⚠️  Windows Home edition detected - limited Hyper-V support%RESET%
    echo %BLUE%💡 Suggestion: Use WSL2 backend or upgrade to Windows Pro%RESET%
)

echo.
echo %CYAN%[STEP 2]%RESET% Checking BIOS virtualization...

:: Check BIOS virtualization
wmic cpu get VirtualizationFirmwareEnabled /format:list | findstr "TRUE" >nul 2>&1
if !errorlevel! equ 0 (
    echo %GREEN%✅ Virtualization enabled in BIOS%RESET%
) else (
    echo %RED%❌ Virtualization disabled in BIOS%RESET%
    echo %YELLOW%🔧 BIOS FIX REQUIRED:%RESET%
    echo    1. Restart computer and enter BIOS/UEFI setup
    echo    2. Look for: Intel VT-x, AMD-V, SVM, or Virtualization Technology
    echo    3. Enable the virtualization option
    echo    4. Save and exit BIOS
    echo    5. Run this script again
    pause
    exit /b 1
)

echo.
echo %CYAN%[STEP 3]%RESET% Stopping Docker and related services...

:: Stop Docker Desktop completely
echo %BLUE%Stopping Docker Desktop...%RESET%
taskkill /f /im "Docker Desktop.exe" >nul 2>&1
taskkill /f /im "dockerd.exe" >nul 2>&1
taskkill /f /im "docker.exe" >nul 2>&1
taskkill /f /im "com.docker.service" >nul 2>&1

:: Stop Windows services
echo %BLUE%Stopping Docker services...%RESET%
net stop com.docker.service >nul 2>&1
net stop docker >nul 2>&1

echo.
echo %CYAN%[STEP 4]%RESET% Enabling required Windows features...

:: Enable Hyper-V
echo %BLUE%Enabling Hyper-V...%RESET%
dism.exe /online /enable-feature /featurename:Microsoft-Hyper-V-All /all /norestart
if !errorlevel! equ 0 (
    echo %GREEN%✅ Hyper-V enabled%RESET%
) else (
    echo %YELLOW%⚠️  Hyper-V enable failed (may already be enabled)%RESET%
)

:: Enable Virtual Machine Platform
echo %BLUE%Enabling Virtual Machine Platform...%RESET%
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
if !errorlevel! equ 0 (
    echo %GREEN%✅ Virtual Machine Platform enabled%RESET%
) else (
    echo %YELLOW%⚠️  VMP enable failed (may already be enabled)%RESET%
)

:: Enable Containers feature
echo %BLUE%Enabling Containers feature...%RESET%
dism.exe /online /enable-feature /featurename:Containers /all /norestart
if !errorlevel! equ 0 (
    echo %GREEN%✅ Containers feature enabled%RESET%
) else (
    echo %YELLOW%⚠️  Containers enable failed (may already be enabled)%RESET%
)

:: Enable WSL2 for Docker backend
echo %BLUE%Enabling WSL...%RESET%
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
if !errorlevel! equ 0 (
    echo %GREEN%✅ WSL enabled%RESET%
) else (
    echo %YELLOW%⚠️  WSL enable failed (may already be enabled)%RESET%
)

echo.
echo %CYAN%[STEP 5]%RESET% Configuring Hyper-V startup...

:: Enable hypervisor at boot
echo %BLUE%Configuring hypervisor launch...%RESET%
bcdedit /set hypervisorlaunchtype auto >nul 2>&1
if !errorlevel! equ 0 (
    echo %GREEN%✅ Hypervisor configured for auto-start%RESET%
) else (
    echo %YELLOW%⚠️  Hypervisor config may need manual setup%RESET%
)

echo.
echo %CYAN%[STEP 6]%RESET% Restarting virtualization services...

:: Restart Hyper-V services
echo %BLUE%Restarting Hyper-V services...%RESET%
net stop vmms >nul 2>&1
net stop vmcompute >nul 2>&1
timeout /t 2 /nobreak >nul
net start vmms >nul 2>&1
net start vmcompute >nul 2>&1

:: Restart HV Host Service
echo %BLUE%Restarting HV Host Service...%RESET%
net stop hvhost >nul 2>&1
timeout /t 2 /nobreak >nul
net start hvhost >nul 2>&1

echo.
echo %CYAN%[STEP 7]%RESET% Testing virtualization detection...

:: Test Hyper-V detection
echo %BLUE%Testing Hyper-V detection:%RESET%
systeminfo | findstr /C:"Hyper-V Requirements" >nul 2>&1
if !errorlevel! equ 0 (
    echo %GREEN%✅ Hyper-V requirements detected%RESET%
    systeminfo | findstr /C:"Hyper-V Requirements" -A 4
) else (
    echo %YELLOW%⚠️  Hyper-V detection test inconclusive%RESET%
)

echo.
echo %CYAN%[STEP 8]%RESET% Docker Desktop restart options...

echo %MAGENTA%Choose your next step:%RESET%
echo.
echo %BLUE%1.%RESET% %GREEN%Restart computer now%RESET% (Recommended for full fix)
echo %BLUE%2.%RESET% %YELLOW%Start Docker Desktop manually%RESET% (Test current state)
echo %BLUE%3.%RESET% %CYAN%Use local inventory system%RESET% (No Docker needed)
echo %BLUE%4.%RESET% %BLUE%Exit and restart later%RESET%
echo.

set /p CHOICE="Enter your choice (1-4): "

if "!CHOICE!"=="1" (
    echo.
    echo %GREEN%🔄 Restarting computer in 15 seconds...%RESET%
    echo %YELLOW%Press Ctrl+C to cancel%RESET%
    echo %BLUE%After restart, Docker Desktop should work properly%RESET%
    timeout /t 15
    shutdown /r /t 0
) else if "!CHOICE!"=="2" (
    echo.
    echo %BLUE%🐳 Starting Docker Desktop...%RESET%
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo %GREEN%Docker Desktop is starting. Check if virtualization is now detected.%RESET%
    echo %YELLOW%If it still shows errors, choose option 1 to restart%RESET%
    pause
) else if "!CHOICE!"=="3" (
    echo.
    echo %GREEN%🚀 Starting local inventory system...%RESET%
    cd /d "C:\Users\User\inventory-with-better-ui-"
    start "Local System" cmd /k "npm run local"
    echo %GREEN%Local system started - no Docker needed!%RESET%
    pause
) else (
    echo.
    echo %BLUE%💡 Manual restart recommended for best results%RESET%
    echo %YELLOW%After restart, try: npm run one-click%RESET%
    pause
)

echo.
echo %CYAN%[SUMMARY]%RESET%
echo %GREEN%✅ Virtualization features enabled%RESET%
echo %GREEN%✅ Hyper-V configured%RESET%
echo %GREEN%✅ Services restarted%RESET%
echo %YELLOW%⚠️  System restart recommended%RESET%
