# 🚀 Inventory Management System - Mac Setup Guide

Complete one-click setup guide for the Inventory Management System on macOS.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [One-Click Setup](#one-click-setup)
3. [Manual Setup](#manual-setup)
4. [Verification](#verification)
5. [Usage](#usage)
6. [Troubleshooting](#troubleshooting)
7. [Configuration](#configuration)

---

## 🔧 Prerequisites

- **macOS 10.15+** (Catalina or later)
- **Admin privileges** for installing software
- **Internet connection** for downloading dependencies
- **Command line access** (Terminal app)

---

## ⚡ One-Click Setup

### Step 1: Download and Run Setup Script

```bash
# Navigate to the project directory
cd /path/to/inventory-with-better-ui-

# Make the setup script executable
chmod +x mac-setup.sh

# Run the one-click setup
./mac-setup.sh
```

**That's it!** 🎉 The script will automatically:
- Install Homebrew (if not installed)
- Install PostgreSQL 15
- Install pgAdmin 4
- Install Node.js 18
- Install Python 3.11
- Setup the database
- Install all dependencies
- Create startup scripts
- Configure environment variables

### Step 2: Start the System

```bash
# Start all services
./start-all.sh
```

### Step 3: Access the Applications

- **Frontend**: http://localhost:3000 or http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **pgAdmin**: Open from Applications folder

---

## 🛠️ Manual Setup (If Needed)

### 1. Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Dependencies

```bash
# Update Homebrew
brew update

# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Install pgAdmin 4
brew install --cask pgadmin4

# Install Node.js
brew install node@18

# Install Python
brew install python@3.11

# Install Git (if needed)
brew install git
```

### 3. Setup PostgreSQL

```bash
# Create postgres user
createuser -s postgres

# Set password
psql -U $(whoami) -d postgres -c "ALTER USER postgres PASSWORD 'postgres';"

# Create database
createdb -U postgres inventory_management
```

### 4. Setup Project

```bash
# Navigate to project directory
cd /path/to/inventory-with-better-ui-

# Install Python dependencies
pip3 install -r backend/requirements.txt

# Install Node.js dependencies
npm install

# Setup database
python3 setup_database.py
```

### 5. Configure Environment

Create `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_management
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_management
DB_USER=postgres
DB_PASSWORD=postgres
API_HOST=0.0.0.0
API_PORT=8000
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Create `.env` (for frontend):
```env
VITE_API_URL=http://localhost:8000
REACT_APP_API_URL=http://localhost:8000
```

---

## ✅ Verification

### Check Installation

```bash
# Check PostgreSQL
brew services list | grep postgresql
psql -U postgres -d inventory_management -c "SELECT version();"

# Check Node.js
node --version
npm --version

# Check Python
python3 --version
pip3 --version

# Check database
python3 setup_database.py
```

### Test Services

```bash
# Start backend
cd backend
python3 main.py

# In another terminal, test API
curl http://localhost:8000/health

# Start frontend
npm run dev
# or
npm start
```

---

## 🚀 Usage

### Daily Operations

```bash
# Start all services
./start-all.sh

# Stop all services
./stop-all.sh

# View logs
tail -f backend/logs/*.log
```

### Database Management

```bash
# Access database via command line
psql -U postgres -d inventory_management

# Backup database
pg_dump -U postgres inventory_management > backup.sql

# Restore database
psql -U postgres -d inventory_management < backup.sql
```

### pgAdmin Setup

1. Open pgAdmin 4 from Applications
2. Create new server connection:
   - **Name**: Inventory System
   - **Host**: localhost
   - **Port**: 5432
   - **Database**: inventory_management
   - **Username**: postgres
   - **Password**: postgres

---

## 🔧 Configuration

### Database Configuration

Edit `backend/.env` to modify database settings:

```env
# Database settings
DB_HOST=localhost          # Database host
DB_PORT=5432              # Database port
DB_NAME=inventory_management  # Database name
DB_USER=postgres          # Database user
DB_PASSWORD=postgres      # Database password
```

### API Configuration

```env
# API settings
API_HOST=0.0.0.0         # API host (0.0.0.0 for all interfaces)
API_PORT=8000            # API port
SECRET_KEY=your-secret   # JWT secret key
ACCESS_TOKEN_EXPIRE_MINUTES=30  # Token expiration
```

### Frontend Configuration

Edit `.env` in project root:

```env
# Frontend settings
VITE_API_URL=http://localhost:8000     # For Vite projects
REACT_APP_API_URL=http://localhost:8000  # For Create React App
```

---

## 🔍 Troubleshooting

### Common Issues

#### PostgreSQL Connection Error
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL if not running
brew services start postgresql@15

# Check connection
psql -U postgres -c "SELECT version();"
```

#### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill process if needed
kill -9 <PID>

# Find process using port 3000
lsof -i :3000
```

#### Database Setup Failed
```bash
# Manual database setup
psql -U postgres -d inventory_management -f MASTER_DATABASE_SETUP.sql

# Or use the unified schema
psql -U postgres -d inventory_management -f unified_database_schema.sql
```

#### Permission Denied
```bash
# Fix script permissions
chmod +x mac-setup.sh
chmod +x start-all.sh
chmod +x stop-all.sh

# Fix Python script permissions
chmod +x setup_database.py
```

#### Node.js Dependencies Error
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Python Dependencies Error
```bash
# Upgrade pip
python3 -m pip install --upgrade pip

# Install dependencies with force reinstall
pip3 install -r backend/requirements.txt --force-reinstall
```

### Logs and Debugging

```bash
# Backend logs
tail -f backend/logs/inventory_system.log

# PostgreSQL logs
tail -f /opt/homebrew/var/log/postgresql@15.log

# Frontend console
# Open browser dev tools (F12) and check console
```

### Reset Everything

```bash
# Stop all services
./stop-all.sh

# Drop and recreate database
dropdb -U postgres inventory_management
createdb -U postgres inventory_management

# Reinstall dependencies
rm -rf node_modules
npm install
pip3 install -r backend/requirements.txt --force-reinstall

# Run setup again
python3 setup_database.py
./start-all.sh
```

---

## 📱 Application URLs

After successful setup, access these URLs:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Main application interface |
| Frontend (Vite) | http://localhost:5173 | Alternative frontend port |
| Backend API | http://localhost:8000 | REST API endpoints |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| API Redoc | http://localhost:8000/redoc | Alternative API documentation |
| pgAdmin | Applications → pgAdmin 4 | Database management tool |

---

## 📞 Support

If you encounter any issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the logs for error messages
3. Ensure all prerequisites are met
4. Try the manual setup process
5. Contact the development team

---

## 🔄 Updates

To update the system:

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install
pip3 install -r backend/requirements.txt

# Update database if needed
python3 setup_database.py

# Restart services
./stop-all.sh
./start-all.sh
```

---

**🎉 Enjoy your Inventory Management System!**