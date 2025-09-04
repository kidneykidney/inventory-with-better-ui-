@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                      🔧 WSL SETUP TROUBLESHOOTER 🔧                         ║
echo ║                    Complete WSL Installation Guide                           ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

:: Color codes
for /f %%A in ('echo prompt $E ^| cmd') do set "ESC=%%A"
set "GREEN=%ESC%[32m"
set "BLUE=%ESC%[34m"
set "YELLOW=%ESC%[33m"
set "RED=%ESC%[31m"
set "CYAN=%ESC%[36m"
set "MAGENTA=%ESC%[35m"
set "RESET=%ESC%[0m"

echo %CYAN%[STEP 1]%RESET% Checking current system status...

:: Check if running as administrator
net session >nul 2>&1
if !errorlevel! neq 0 (
    echo %RED%[ERROR]%RESET% This script must be run as Administrator
    echo %YELLOW%[FIX]%RESET% Right-click this script and select "Run as administrator"
    pause
    exit /b 1
)

echo %GREEN%[SUCCESS]%RESET% Running with administrator privileges

:: Check Windows version
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo %BLUE%[INFO]%RESET% Windows version: %VERSION%

:: Check if WSL is installed
echo %CYAN%[STEP 2]%RESET% Checking WSL installation...
wsl --version >nul 2>&1
if !errorlevel! neq 0 (
    echo %YELLOW%[INFO]%RESET% WSL not detected, installing...
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
    echo %YELLOW%[IMPORTANT]%RESET% Please restart your computer and run this script again
    pause
    exit /b 0
) else (
    echo %GREEN%[SUCCESS]%RESET% WSL is installed
)

:: Check WSL version
echo %CYAN%[STEP 3]%RESET% Checking WSL version and features...
wsl --version
echo.

:: Enable required Windows features
echo %CYAN%[STEP 4]%RESET% Ensuring all required Windows features are enabled...

echo %BLUE%[INFO]%RESET% Enabling Windows Subsystem for Linux...
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

echo %BLUE%[INFO]%RESET% Enabling Virtual Machine Platform...
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

echo %BLUE%[INFO]%RESET% Enabling Hyper-V (if available)...
dism.exe /online /enable-feature /featurename:Microsoft-Hyper-V-All /all /norestart >nul 2>&1

:: Set WSL 2 as default
echo %CYAN%[STEP 5]%RESET% Setting WSL 2 as default version...
wsl --set-default-version 2

:: Check if Ubuntu is installed
echo %CYAN%[STEP 6]%RESET% Checking Ubuntu installation...
wsl -l -v | findstr "Ubuntu" >nul 2>&1
if !errorlevel! neq 0 (
    echo %YELLOW%[INFO]%RESET% Ubuntu not found, attempting installation...
    
    :: Try installing Ubuntu
    echo %BLUE%[INFO]%RESET% Installing Ubuntu distribution...
    wsl --install -d Ubuntu
    
    if !errorlevel! neq 0 (
        echo %RED%[ERROR]%RESET% Ubuntu installation failed
        echo %YELLOW%[ALTERNATIVE]%RESET% Trying manual installation from Microsoft Store...
        echo %CYAN%[MANUAL STEPS]%RESET% 
        echo 1. Open Microsoft Store
        echo 2. Search for "Ubuntu"
        echo 3. Install "Ubuntu" from Canonical
        echo 4. Launch Ubuntu and complete setup
        echo 5. Run this script again
        echo.
        echo %MAGENTA%[OPENING STORE]%RESET% Opening Microsoft Store for you...
        start ms-windows-store://pdp/?productid=9PDXGNCFSCZV
        pause
        exit /b 1
    )
) else (
    echo %GREEN%[SUCCESS]%RESET% Ubuntu is installed
)

:: Check virtualization capabilities
echo %CYAN%[STEP 7]%RESET% Checking virtualization support...
systeminfo | findstr /i "Hyper-V Requirements" >nul 2>&1
if !errorlevel! equ 0 (
    systeminfo | findstr /i "Hyper-V Requirements" -A 4
) else (
    echo %YELLOW%[INFO]%RESET% Checking virtualization in BIOS...
    wmic cpu get VirtualizationFirmwareEnabled /format:list 2>nul | findstr "TRUE" >nul 2>&1
    if !errorlevel! equ 0 (
        echo %GREEN%[SUCCESS]%RESET% Virtualization is enabled in BIOS
    ) else (
        echo %RED%[WARNING]%RESET% Virtualization may not be enabled in BIOS
        echo %YELLOW%[FIX]%RESET% Please enable virtualization in your BIOS/UEFI settings
        echo %CYAN%[HELP]%RESET% Look for: Intel VT-x, AMD-V, SVM, or Virtualization Technology
    )
)

:: Final status check
echo %CYAN%[STEP 8]%RESET% Final system status...
echo %BLUE%[INFO]%RESET% WSL Status:
wsl --status 2>nul || echo %RED%WSL not fully configured%RESET%

echo.
echo %BLUE%[INFO]%RESET% Installed distributions:
wsl -l -v 2>nul || echo %RED%No distributions found%RESET%

echo.
echo %CYAN%[NEXT STEPS]%RESET%
echo.
if exist "C:\Users\%USERNAME%\AppData\Local\Packages\CanonicalGroupLimited.Ubuntu*" (
    echo %GREEN%✅ Ubuntu appears to be installed%RESET%
    echo %BLUE%▶️  Next: Run 'wsl' to start Ubuntu and complete initial setup%RESET%
    echo %BLUE%▶️  Then: Run 'npm run wsl' to start the inventory system%RESET%
) else (
    echo %YELLOW%⚠️  Ubuntu installation may have failed%RESET%
    echo %BLUE%▶️  Option 1: Restart computer and try again%RESET%
    echo %BLUE%▶️  Option 2: Install Ubuntu manually from Microsoft Store%RESET%
    echo %BLUE%▶️  Option 3: Use 'npm run local' for Windows-native setup%RESET%
)

echo.
echo %MAGENTA%[RESTART RECOMMENDATION]%RESET%
echo %YELLOW%It's highly recommended to restart your computer now for all changes to take effect%RESET%
echo.

set /p RESTART="Do you want to restart now? (y/N): "
if /i "!RESTART!"=="y" (
    echo %BLUE%[INFO]%RESET% Restarting computer in 10 seconds...
    echo %YELLOW%Press Ctrl+C to cancel%RESET%
    timeout /t 10
    shutdown /r /t 0
) else (
    echo %YELLOW%[INFO]%RESET% Please restart manually when convenient
    pause
)
