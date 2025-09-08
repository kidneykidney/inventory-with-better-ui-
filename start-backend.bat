@echo off
echo Activating virtual environment...
call "%~dp0.venv\Scripts\activate.bat"
if %ERRORLEVEL% neq 0 (
    echo Failed to activate virtual environment
    exit /b 1
)
echo Changing to backend directory...
cd /d "%~dp0backend"
echo Starting backend server...
python main.py
