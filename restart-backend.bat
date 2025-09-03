@echo off
echo 🔄 Restarting Backend with Simple Authentication...
echo ===============================================

REM Kill any existing Python processes
taskkill /f /im python.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak > nul

REM Start backend with simple auth
echo 🚀 Starting backend server...
echo 🔐 Simple authentication enabled
echo 📋 Admin credentials: admin / College@2025
echo.

cd backend
start "Backend Server - Simple Auth" cmd /k "..\\.venv\\Scripts\\python.exe main.py"

echo ✅ Backend server started!
echo 🌐 API will be available at: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo 🔐 Auth endpoints: http://localhost:8000/api/auth/
echo.
echo 💡 Try logging in now with:
echo    Username: admin
echo    Password: College@2025
echo.
pause
