@echo off
REM Professional Inventory Management System - Stop Script

title Inventory Management System - Stop

echo 🛑 STOPPING INVENTORY MANAGEMENT SYSTEM
echo ========================================
echo.

echo 🧹 Stopping all services...

REM Stop processes on port 8000 (Backend)
netstat -ano | findstr :8000 > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo 🔧 Stopping Backend API (port 8000)...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
        taskkill /f /pid %%a > nul 2>&1
        echo    ✅ Stopped process %%a
    )
) else (
    echo 🔧 No Backend process found on port 8000
)

REM Stop processes on port 3000 (Frontend - React dev server)
netstat -ano | findstr :3000 > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo 🎨 Stopping Frontend (port 3000)...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        taskkill /f /pid %%a > nul 2>&1
        echo    ✅ Stopped process %%a
    )
) else (
    echo 🎨 No Frontend process found on port 3000
)

REM Stop processes on port 5173 (Frontend - Vite dev server)
netstat -ano | findstr :5173 > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo 🎨 Stopping Frontend (port 5173)...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
        taskkill /f /pid %%a > nul 2>&1
        echo    ✅ Stopped process %%a
    )
) else (
    echo 🎨 No Frontend process found on port 5173
)

REM Stop any Node.js processes that might be related
echo 🔍 Checking for related Node.js processes...
tasklist /fi "imagename eq node.exe" /fo csv 2>NUL | find /i "node.exe" > nul
if %ERRORLEVEL% equ 0 (
    echo 📱 Found Node.js processes. Stopping inventory-related ones...
    REM Only kill Node processes that are likely from our project
    wmic process where "name='node.exe' and commandline like '%%inventory%%'" delete > nul 2>&1
    wmic process where "name='node.exe' and commandline like '%%vite%%'" delete > nul 2>&1
    wmic process where "name='node.exe' and commandline like '%%5173%%'" delete > nul 2>&1
    echo    ✅ Cleaned up Node.js processes
)

REM Stop any Python processes that might be related
echo 🔍 Checking for related Python processes...
tasklist /fi "imagename eq python.exe" /fo csv 2>NUL | find /i "python.exe" > nul
if %ERRORLEVEL% equ 0 (
    echo 🐍 Found Python processes. Stopping inventory-related ones...
    REM Only kill Python processes that are likely from our project
    wmic process where "name='python.exe' and commandline like '%%main.py%%'" delete > nul 2>&1
    wmic process where "name='python.exe' and commandline like '%%uvicorn%%'" delete > nul 2>&1
    wmic process where "name='python.exe' and commandline like '%%inventory%%'" delete > nul 2>&1
    echo    ✅ Cleaned up Python processes
)

echo.
echo ✅ ALL SERVICES STOPPED!
echo.
echo 💡 To start again: Run scripts\START.bat
echo.

timeout /t 3 /nobreak > nul
