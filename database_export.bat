@echo off
REM ===================================================================
REM DATABASE EXPORT AND BACKUP SCRIPT (Windows)
REM ===================================================================
REM This script creates a complete backup of your current database
REM Run this before giving the project to your friend
REM ===================================================================

echo 🗄️ Database Export and Backup Script
echo =====================================

REM Configuration
set DB_NAME=inventory_management
set DB_USER=postgres
set BACKUP_DIR=database_backups
set DATE=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set DATE=%DATE: =0%

REM Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo 📊 Creating database exports...

REM 1. Full database dump (schema + data)
echo 🔄 Exporting complete database...
pg_dump -U %DB_USER% -h localhost -d %DB_NAME% --no-owner --no-privileges -f "%BACKUP_DIR%\complete_database_backup_%DATE%.sql"

REM 2. Schema only dump
echo 🏗️ Exporting database schema...
pg_dump -U %DB_USER% -h localhost -d %DB_NAME% --schema-only --no-owner --no-privileges -f "%BACKUP_DIR%\schema_only_%DATE%.sql"

REM 3. Data only dump
echo 📈 Exporting data only...
pg_dump -U %DB_USER% -h localhost -d %DB_NAME% --data-only --no-owner --no-privileges -f "%BACKUP_DIR%\data_only_%DATE%.sql"

REM 4. Custom format dump (compressed)
echo 🗜️ Creating compressed backup...
pg_dump -U %DB_USER% -h localhost -d %DB_NAME% --format=custom --no-owner --no-privileges -f "%BACKUP_DIR%\database_backup_%DATE%.dump"

echo.
echo ✅ Backup completed! Files created in %BACKUP_DIR%:
dir "%BACKUP_DIR%"

echo.
echo 📋 Backup Summary:
echo    📁 Complete database: complete_database_backup_%DATE%.sql
echo    🏗️ Schema only: schema_only_%DATE%.sql
echo    📊 Data only: data_only_%DATE%.sql
echo    🗜️ Compressed: database_backup_%DATE%.dump

echo.
echo 🚀 To restore on another system:
echo    1. Install PostgreSQL
echo    2. Create database: createdb -U postgres inventory_management
echo    3. Restore: psql -U postgres -d inventory_management -f complete_database_backup_%DATE%.sql
echo    Or use: pg_restore -U postgres -d inventory_management database_backup_%DATE%.dump

echo.
echo ✅ Your friend can now set up the complete database!

pause