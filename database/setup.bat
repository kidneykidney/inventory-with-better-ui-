@echo off
REM Database Setup Script for Team Members (Windows)
REM This script helps teammates set up the database locally

title Inventory Management System - Database Setup

color 0A
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║             INVENTORY MANAGEMENT SYSTEM                      ║
echo  ║                   DATABASE SETUP                             ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Database configuration
set DB_NAME=inventory_management
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432

echo  📝 Database Configuration:
echo     Database: %DB_NAME%
echo     User: %DB_USER%
echo     Host: %DB_HOST%
echo     Port: %DB_PORT%
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo  ❌ PostgreSQL is not installed or not in PATH
    echo.
    echo  💡 Please install PostgreSQL first:
    echo     Download from: https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
)

echo  ✅ PostgreSQL found
echo.

REM Prompt for password
echo  🔐 Please enter your PostgreSQL password for user '%DB_USER%':
set /p DB_PASSWORD=

REM Test connection
echo.
echo  🔍 Testing database connection...
set PGPASSWORD=%DB_PASSWORD%

psql -h %DB_HOST% -U %DB_USER% -p %DB_PORT% -d postgres -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo  ❌ Failed to connect to PostgreSQL
    echo  Please check your credentials and try again
    pause
    exit /b 1
)

echo  ✅ Database connection successful

REM Check if database exists
echo  🔍 Checking if database '%DB_NAME%' exists...

for /f %%i in ('psql -h %DB_HOST% -U %DB_USER% -p %DB_PORT% -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%';"') do set DB_EXISTS=%%i

if "%DB_EXISTS%"=="1" (
    echo  ⚠️  Database '%DB_NAME%' already exists
    echo  Do you want to recreate it? This will delete all existing data! (y/N)
    set /p RECREATE=
    
    if /i "%RECREATE%"=="y" (
        echo  🗑️  Dropping existing database...
        psql -h %DB_HOST% -U %DB_USER% -p %DB_PORT% -d postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;"
        echo  ✅ Database dropped
    ) else (
        echo  ❌ Setup cancelled
        pause
        exit /b 1
    )
)

REM Create database
echo  🏗️  Creating database '%DB_NAME%'...
psql -h %DB_HOST% -U %DB_USER% -p %DB_PORT% -d postgres -c "CREATE DATABASE %DB_NAME%;"

if %errorlevel% equ 0 (
    echo  ✅ Database created successfully
) else (
    echo  ❌ Failed to create database
    pause
    exit /b 1
)

REM Run initialization script
echo  📊 Initializing database schema and data...
psql -h %DB_HOST% -U %DB_USER% -p %DB_PORT% -d %DB_NAME% -f database\init_complete_database.sql

if %errorlevel% equ 0 (
    echo.
    echo  🎉 Database setup completed successfully!
    echo.
    echo  📋 Summary:
    echo     ✅ Database '%DB_NAME%' created
    echo     ✅ All tables and schemas imported
    echo     ✅ Sample data and admin user created
    echo.
    echo  🔐 Default Admin Credentials:
    echo     Username: admin
    echo     Password: College@2025
    echo.
    echo  🚀 You can now run the application:
    echo     1. Install dependencies: npm install
    echo     2. Install Python deps: pip install -r backend\requirements.txt
    echo     3. Start backend: cd backend ^&^& python main.py
    echo     4. Start frontend: npm run dev
    echo.
    echo  🌐 Access the application at: http://localhost:3000
) else (
    echo  ❌ Database initialization failed
    echo  Check the error messages above and try again
)

echo.
pause
