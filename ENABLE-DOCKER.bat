@echo off
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                    🐳 DOCKER ONE-CLICK FIX 🐳                              ║
echo ║                   Enable Docker Desktop Support                             ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Administrator privileges required
    echo.
    echo 🔄 Restarting as administrator...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b 0
)

echo ✅ Running with administrator privileges
echo.

echo 🔧 Enabling required Windows features for Docker...
echo.

:: Enable Hyper-V
echo ► Enabling Hyper-V...
dism.exe /online /enable-feature /featurename:Microsoft-Hyper-V-All /all /norestart
echo.

:: Enable Virtual Machine Platform  
echo ► Enabling Virtual Machine Platform...
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
echo.

:: Enable Containers
echo ► Enabling Containers...
dism.exe /online /enable-feature /featurename:Containers /all /norestart
echo.

:: Enable WSL2 (Docker backend)
echo ► Enabling WSL2...
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
echo.

:: Configure hypervisor
echo ► Configuring hypervisor...
bcdedit /set hypervisorlaunchtype auto
echo.

echo ✅ Windows features enabled for Docker!
echo.
echo 🔄 RESTART REQUIRED
echo.
echo After restart:
echo 1. Docker Desktop should work without virtualization errors
echo 2. Run: npm run one-click
echo.

set /p RESTART="Restart computer now? (y/N): "
if /i "%RESTART%"=="y" (
    echo 🔄 Restarting in 10 seconds...
    timeout /t 10
    shutdown /r /t 0
) else (
    echo 💡 Please restart manually when ready
    echo 💡 Then run: npm run one-click
    pause
)
