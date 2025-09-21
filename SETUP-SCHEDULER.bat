@echo off
REM Scheduler Setup Script - Install scheduler dependencies
title Installing Automatic Overdue Notification System

color 0B
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║           AUTOMATIC OVERDUE NOTIFICATION SETUP               ║
echo  ║                  Installing Dependencies                     ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

echo  📅 Installing scheduler dependencies for automatic overdue notifications...
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ❌ Python is not installed!
    echo.
    echo  💡 Please install Python first:
    echo     Download from: https://python.org/
    echo.
    pause
    exit /b 1
)
echo  ✅ Python is available

REM Setup virtual environment if it doesn't exist
if not exist .venv (
    echo  🔧 Creating Python virtual environment...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo  ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
    echo  ✅ Virtual environment created
)

REM Activate virtual environment
echo  🔧 Activating virtual environment...
call .venv\Scripts\activate.bat

REM Install scheduler dependencies
echo  📦 Installing scheduler packages...
pip install apscheduler>=3.11.0
pip install pytz>=2023.3

if %errorlevel% neq 0 (
    echo  ❌ Failed to install scheduler dependencies
    pause
    exit /b 1
)

echo  ✅ Scheduler dependencies installed successfully!

REM Test the installation
echo  🧪 Testing scheduler installation...
cd backend
python -c "from overdue_scheduler import overdue_scheduler; print('✅ Scheduler import successful')" 2>nul
if %errorlevel% neq 0 (
    echo  ⚠️  Warning: Scheduler test failed - may need to install other dependencies
    echo     Run: npm run local (this will install all required dependencies)
) else (
    echo  ✅ Scheduler test passed!
)

cd ..

echo.
echo  🎉 SETUP COMPLETE!
echo.
echo  🚀 The automatic overdue notification system is now ready!
echo.
echo  📅 Features installed:
echo     ✅ Daily overdue checks at 9:00 AM
echo     ✅ Automatic email notifications
echo     ✅ Manual overdue check capability
echo     ✅ Scheduler status monitoring
echo.
echo  🔧 Start the system with: npm run local
echo  📊 Check scheduler status: npm run scheduler-status
echo  🚀 Manual overdue check: npm run scheduler
echo.
pause