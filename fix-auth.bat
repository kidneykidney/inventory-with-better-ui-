@echo off
echo 🔐 Initializing Authentication System...
echo ==========================================

cd backend

echo 📦 Installing/checking authentication dependencies...
..\\.venv\\Scripts\\python.exe -m pip install bcrypt PyJWT python-jose[cryptography] passlib[bcrypt]

echo 🗄️  Creating authentication tables...
..\\.venv\\Scripts\\python.exe init_auth_tables.py

echo 🧪 Testing authentication API...
..\\.venv\\Scripts\\python.exe test_auth_system.py

echo.
echo ✅ Authentication initialization complete!
echo.
echo 📋 Default Admin Credentials:
echo    Username: admin
echo    Password: College@2025
echo    Email: admin@college.edu
echo.
echo ⚠️  REMEMBER: Change the default password after first login!
echo.
pause
