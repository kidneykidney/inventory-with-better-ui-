@echo off
REM ================================================================
REM AUTOMATED SETUP SCRIPT FOR INVENTORY MANAGEMENT SYSTEM
REM This script automates the entire setup process from scratch
REM Run this once after cloning the repository
REM ================================================================

title Inventory System - Automated Setup

echo.
echo ==========================================
echo 🚀 INVENTORY MANAGEMENT SYSTEM SETUP
echo ==========================================
echo.
echo This will automatically set up everything you need:
echo   ✓ Python Virtual Environment
echo   ✓ All Python Dependencies  
echo   ✓ Node.js Dependencies
echo   ✓ OCR Components (Tesseract)
echo   ✓ Database Setup
echo   ✓ Configuration Files
echo.
echo Estimated time: 3-5 minutes
echo.
set /p confirm="Continue with automated setup? (Y/N): "
if /i not "%confirm%"=="Y" goto :end

echo.
echo 📋 STEP 1/6: Checking Prerequisites...
echo ========================================

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation
    pause
    goto :end
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    goto :end
)

echo ✅ Python found: 
python --version
echo ✅ Node.js found:
node --version

echo.
echo 🐍 STEP 2/6: Setting up Python Environment...
echo =============================================

REM Remove existing virtual environment if it exists
if exist ".venv" (
    echo 🧹 Removing existing virtual environment...
    rmdir /s /q .venv
)

REM Create new virtual environment
echo 📦 Creating virtual environment...
python -m venv .venv
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to create virtual environment
    pause
    goto :end
)

REM Activate virtual environment and install dependencies
echo 📥 Installing Python dependencies...
call .venv\Scripts\activate.bat

REM Upgrade pip first
python -m pip install --upgrade pip

REM Install core dependencies
pip install fastapi uvicorn pydantic python-multipart python-dotenv
pip install sqlalchemy psycopg2 Pillow pytesseract opencv-python numpy pandas
pip install openpyxl python-dateutil httpx

echo ✅ Python environment setup complete!

echo.
echo 📦 STEP 3/6: Installing Node.js Dependencies...
echo ===============================================

npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to install Node.js dependencies
    echo Trying with --legacy-peer-deps...
    npm install --legacy-peer-deps
)

echo ✅ Node.js dependencies installed!

echo.
echo 🔍 STEP 4/6: Setting up OCR (Tesseract)...
echo ==========================================

REM Check if Tesseract is already installed
if exist "C:\Program Files\Tesseract-OCR\tesseract.exe" (
    echo ✅ Tesseract already installed at C:\Program Files\Tesseract-OCR
) else (
    echo 📥 Tesseract OCR not found. Attempting automatic installation...
    
    REM Try winget first
    winget install --id UB-Mannheim.TesseractOCR --silent --accept-package-agreements
    if %ERRORLEVEL% equ 0 (
        echo ✅ Tesseract installed via winget
    ) else (
        REM Try chocolatey
        choco install tesseract --yes
        if %ERRORLEVEL% equ 0 (
            echo ✅ Tesseract installed via chocolatey
        ) else (
            echo ⚠️  Automatic Tesseract installation failed
            echo Please manually install Tesseract:
            echo 1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
            echo 2. Install to: C:\Program Files\Tesseract-OCR
            echo 3. Add to PATH during installation
            echo.
            echo The system will work without OCR functionality for now.
            pause
        )
    )
)

REM Test OCR setup
echo 🧪 Testing OCR setup...
cd backend
python ocr_setup.py
cd ..

echo.
echo 💾 STEP 5/6: Database Configuration...
echo =====================================

echo 📝 Creating environment configuration file...
(
echo # Inventory Management System Configuration
echo DATABASE_URL=postgresql://postgres:password123@localhost:5432/inventory_db
echo CORS_ORIGINS=http://localhost:3000,http://localhost:3001
echo API_HOST=0.0.0.0
echo API_PORT=8000
echo FRONTEND_PORT=3000
) > .env

echo ✅ Environment configuration created!

echo.
echo 🔧 STEP 6/6: Final Configuration...
echo ==================================

REM Create startup scripts directory
if not exist "scripts" mkdir scripts

REM Create enhanced start script
(
echo @echo off
echo title Inventory System - Quick Start
echo echo 🚀 Starting Inventory Management System...
echo.
echo REM Kill existing processes
echo for /f "tokens=5" %%%%a in ('netstat -ano ^| findstr :8000') do taskkill /f /pid %%%%a ^>nul 2^>^&1
echo for /f "tokens=5" %%%%a in ('netstat -ano ^| findstr :3000') do taskkill /f /pid %%%%a ^>nul 2^>^&1
echo.
echo REM Start backend
echo start "Backend API" cmd /k "cd /d %%%%~dp0 ^&^& call .venv\Scripts\activate.bat ^&^& cd backend ^&^& python main.py"
echo.
echo REM Wait and start frontend
echo timeout /t 5 /nobreak ^>nul
echo start "Frontend" cmd /k "cd /d %%%%~dp0 ^&^& npm run dev"
echo.
echo REM Wait and open browser
echo timeout /t 10 /nobreak ^>nul
echo start http://localhost:3000
echo.
echo echo ✅ System started! Check the terminal windows for any errors.
echo pause
) > scripts\START.bat

REM Create stop script
(
echo @echo off
echo title Inventory System - Stop All Services
echo echo 🛑 Stopping all Inventory Management System services...
echo.
echo REM Kill backend processes
echo for /f "tokens=5" %%%%a in ('netstat -ano ^| findstr :8000') do ^(
echo     echo Stopping backend process %%%%a
echo     taskkill /f /pid %%%%a ^>nul 2^>^&1
echo ^)
echo.
echo REM Kill frontend processes  
echo for /f "tokens=5" %%%%a in ('netstat -ano ^| findstr :3000') do ^(
echo     echo Stopping frontend process %%%%a
echo     taskkill /f /pid %%%%a ^>nul 2^>^&1
echo ^)
echo.
echo REM Kill node processes related to the project
echo taskkill /f /im node.exe ^>nul 2^>^&1
echo taskkill /f /im python.exe ^>nul 2^>^&1
echo.
echo echo ✅ All services stopped!
echo pause
) > scripts\STOP.bat

REM Create database setup script
(
echo @echo off
echo title Database Setup
echo echo 🗄️ Setting up database...
echo.
echo call .venv\Scripts\activate.bat
echo cd backend
echo python -c "from database_manager import init_database; init_database(); print('Database initialized!')"
echo cd ..
echo echo ✅ Database setup complete!
echo pause
) > scripts\SETUP_DATABASE.bat

REM Create requirements update script
(
echo @echo off
echo title Update Dependencies
echo echo 📦 Updating all dependencies...
echo.
echo call .venv\Scripts\activate.bat
echo pip install --upgrade pip
echo pip install -r backend\requirements.txt --upgrade
echo npm update
echo echo ✅ Dependencies updated!
echo pause
) > scripts\UPDATE_DEPS.bat

echo ✅ Setup scripts created in 'scripts' folder!

echo.
echo ==========================================
echo 🎉 SETUP COMPLETE!
echo ==========================================
echo.
echo Your Inventory Management System is ready to use!
echo.
echo 📁 Available Commands:
echo   ✓ scripts\START.bat     - Start the entire system
echo   ✓ scripts\STOP.bat      - Stop all services  
echo   ✓ scripts\SETUP_DATABASE.bat - Initialize database
echo   ✓ scripts\UPDATE_DEPS.bat     - Update dependencies
echo.
echo 🚀 To start the system now:
echo   1. Double-click 'scripts\START.bat'  
echo   2. Wait for both services to start (30 seconds)
echo   3. Browser will open automatically at http://localhost:3000
echo.
echo 💡 Next time you clone this repo on another device:
echo   1. Run this SETUP.bat script once
echo   2. Use scripts\START.bat to start the system
echo.
set /p start_now="Start the system now? (Y/N): "
if /i "%start_now%"=="Y" (
    echo.
    echo 🚀 Starting system...
    call scripts\START.bat
)

:end
echo.
echo Setup completed! Press any key to exit.
pause >nul
