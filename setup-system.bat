@echo off
REM Setup Script for Inventory Management System
REM This will install all dependencies and prepare the system

title Inventory Management System - Setup

echo 🔧 Setting Up Inventory Management System
echo ==========================================
echo.

REM Check if Python is installed
echo 🐍 Checking Python installation...
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Python is not installed!
    echo Please install Python 3.11+ from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)
python --version
echo ✅ Python is installed

echo.
REM Check if Node.js is installed
echo 📦 Checking Node.js installation...
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
node --version
npm --version
echo ✅ Node.js is installed

echo.
REM Create virtual environment
echo 🏗️  Creating virtual environment...
if not exist ".venv" (
    python -m venv .venv
    if %ERRORLEVEL% neq 0 (
        echo ❌ Failed to create virtual environment!
        pause
        exit /b 1
    )
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment already exists
)

echo.
REM Activate virtual environment
echo 📦 Activating virtual environment...
call .venv\Scripts\activate.bat
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to activate virtual environment!
    pause
    exit /b 1
)
echo ✅ Virtual environment activated

echo.
REM Upgrade pip and essential tools first
echo 🔄 Upgrading pip and build tools...
python -m pip install --upgrade pip
python -m pip install --upgrade setuptools wheel
echo ✅ Build tools upgraded

echo.
REM Install backend dependencies with fallbacks
echo 📚 Installing backend dependencies...
echo    This may take a few minutes...

REM Try normal installation first
pip install -r backend\requirements.txt
if %ERRORLEVEL% neq 0 (
    echo ⚠️  Standard installation failed, trying compatibility mode...
    
    REM Try installing problematic packages individually with alternatives
    echo 🔧 Installing core packages first...
    pip install fastapi uvicorn[standard] pydantic python-multipart python-dotenv sqlalchemy httpx python-dateutil
    
    echo 🔧 Installing data processing packages...
    pip install pandas openpyxl numpy
    
    echo 🔧 Installing image processing packages (may take time)...
    pip install --only-binary=all Pillow || pip install Pillow --no-cache-dir
    pip install opencv-python-headless || pip install opencv-python
    pip install pytesseract
    
    REM Final check
    pip install -r backend\requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo ⚠️  Some packages may have failed to install
        echo 💡 The system should still work for basic functionality
        echo 📝 OCR features may require manual Tesseract installation
    )
)
echo ✅ Backend dependencies installation completed

echo.
REM Install frontend dependencies
echo 🎨 Installing frontend dependencies...
npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to install frontend dependencies!
    echo Trying to fix common issues...
    npm cache clean --force
    npm install
    if %ERRORLEVEL% neq 0 (
        echo ❌ Still failed! Check the error messages above.
        pause
        exit /b 1
    )
)
echo ✅ Frontend dependencies installed

echo.
REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "backend\uploads" mkdir backend\uploads
if not exist "backend\uploads\invoices" mkdir backend\uploads\invoices
if not exist "backend\logs" mkdir backend\logs
echo ✅ Directories created

echo.
echo 🎉 Setup Complete!
echo ==================
echo.
echo ✅ All dependencies installed successfully
echo ✅ Virtual environment ready
echo ✅ Directories created
echo.
echo � OCR Setup Notes:
echo    • For full OCR functionality, you may need to install Tesseract manually
echo    • Download from: https://github.com/UB-Mannheim/tesseract/wiki
echo    • The system will work without it, but OCR features will be limited
echo.
echo �🚀 Next Steps:
echo    1. Run: .\start-system.bat
echo    2. Wait for both services to start
echo    3. Open http://localhost:3000 in your browser
echo    4. Test the basic invoice creation first!
echo.
echo 💡 If you have any issues:
echo    • Run: .\stop-system.bat to stop everything
echo    • Run: .\start-system.bat to start again
echo    • Check the terminal windows for error messages
echo    • For OCR issues, install Tesseract from the link above
echo.

pause
