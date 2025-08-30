@echo off
REM Health Check Script for Inventory Management System
REM This will check if all services are running correctly

title Inventory Management System - Health Check

echo 🏥 Health Check for Inventory Management System
echo ================================================
echo.

echo 📊 Checking Docker containers status...
docker-compose ps

echo.
echo 🔍 Testing service endpoints...

echo 📱 Frontend (http://localhost:3000):
curl -s -o nul -w "Status: %%{http_code}\n" http://localhost:3000/ || echo "❌ Frontend not responding"

echo 🔧 Backend (http://localhost:8000):
curl -s -o nul -w "Status: %%{http_code}\n" http://localhost:8000/products || echo "❌ Backend not responding"

echo 🗄️  Database connection:
docker-compose exec -T postgres pg_isready -U postgres -d inventory_db || echo "❌ Database not responding"

echo.
echo 📋 Service Health Summary:
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 💡 If any service shows as unhealthy:
echo    1. Run: .\stop-system.bat
echo    2. Run: .\start-system.bat
echo.

pause
