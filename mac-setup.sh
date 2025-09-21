#!/bin/bash

# =============================================================================
# Inventory Management System - One-Click Mac Setup
# =============================================================================
# This script will install and configure everything needed to run the 
# inventory management system on macOS
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_status "🚀 Starting Inventory Management System Setup for macOS"
echo "=================================================================="

# Check if running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    print_error "This script is designed for macOS only!"
    exit 1
fi

# 1. Install Homebrew if not installed
print_status "📦 Checking Homebrew installation..."
if ! command_exists brew; then
    print_status "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for M1/M2 Macs
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    print_success "Homebrew is already installed"
fi

# Update Homebrew
print_status "Updating Homebrew..."
brew update

# 2. Install PostgreSQL
print_status "🐘 Installing PostgreSQL..."
if ! command_exists psql; then
    brew install postgresql@15
    brew services start postgresql@15
    
    # Add PostgreSQL to PATH
    echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zprofile
    export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
else
    print_success "PostgreSQL is already installed"
    brew services start postgresql@15 || true
fi

# 3. Install pgAdmin 4
print_status "🔧 Installing pgAdmin 4..."
if ! brew list --cask pgadmin4 >/dev/null 2>&1; then
    brew install --cask pgadmin4
else
    print_success "pgAdmin 4 is already installed"
fi

# 4. Install Node.js and npm
print_status "📱 Installing Node.js..."
if ! command_exists node; then
    brew install node@18
    brew link node@18
else
    print_success "Node.js is already installed ($(node --version))"
fi

# 5. Install Python 3
print_status "🐍 Installing Python 3..."
if ! command_exists python3; then
    brew install python@3.11
else
    print_success "Python 3 is already installed ($(python3 --version))"
fi

# 6. Install Git (if not already installed)
print_status "📚 Checking Git installation..."
if ! command_exists git; then
    brew install git
else
    print_success "Git is already installed ($(git --version))"
fi

# 7. Setup PostgreSQL Database
print_status "🗄️ Setting up PostgreSQL database..."

# Wait for PostgreSQL to be ready
sleep 5

# Create database user if not exists
print_status "Creating database user 'postgres'..."
createuser -s postgres 2>/dev/null || print_warning "User 'postgres' may already exist"

# Set password for postgres user
print_status "Setting up database password..."
psql -U "$(whoami)" -d postgres -c "ALTER USER postgres PASSWORD 'postgres';" || true

# Create the inventory database
print_status "Creating inventory database..."
createdb -U postgres inventory_management 2>/dev/null || print_warning "Database 'inventory_management' may already exist"

# 8. Clone or setup project (if not already in the directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

print_status "📁 Setting up project directory..."
cd "$PROJECT_DIR"

# 9. Install Python dependencies
print_status "📦 Installing Python dependencies..."
if [ -f "backend/requirements.txt" ]; then
    python3 -m pip install --upgrade pip
    python3 -m pip install -r backend/requirements.txt
else
    print_warning "requirements.txt not found, creating basic dependencies..."
    python3 -m pip install fastapi uvicorn sqlalchemy psycopg2-binary python-multipart python-jose[cryptography] passlib[bcrypt] pandas openpyxl
fi

# 10. Install Node.js dependencies
print_status "📦 Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    npm install
else
    print_warning "package.json not found in root directory"
fi

# Install frontend dependencies if they exist
if [ -f "frontend/package.json" ]; then
    cd frontend
    npm install
    cd ..
fi

# 11. Setup environment variables
print_status "⚙️ Setting up environment variables..."

# Create .env file for backend
cat > backend/.env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_management
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_management
DB_USER=postgres
DB_PASSWORD=postgres

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=pdf,jpg,jpeg,png,xlsx,xls,csv

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173
EOF

# Create .env file for frontend (if using Vite)
if [ -f "vite.config.js" ]; then
    cat > .env << 'EOF'
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000
REACT_APP_API_URL=http://localhost:8000
EOF
fi

# 12. Run database migrations
print_status "🗄️ Running database migrations..."
python3 -c "
import subprocess
import sys
import os

# Change to project directory
os.chdir('$PROJECT_DIR')

# Run the consolidated database setup
try:
    result = subprocess.run(['python3', 'setup_database.py'], capture_output=True, text=True, cwd='.')
    if result.returncode == 0:
        print('✅ Database setup completed successfully')
    else:
        print(f'❌ Database setup failed: {result.stderr}')
        # Try alternative method
        subprocess.run(['psql', '-U', 'postgres', '-d', 'inventory_management', '-f', 'MASTER_DATABASE_SETUP.sql'], check=True)
        print('✅ Database setup completed via SQL file')
except Exception as e:
    print(f'⚠️ Database setup encountered issues: {e}')
    print('You may need to run the database setup manually')
"

# 13. Create startup scripts
print_status "📝 Creating startup scripts..."

# Create start-all script
cat > start-all.sh << 'EOF'
#!/bin/bash

# Start PostgreSQL
brew services start postgresql@15

# Start backend
cd backend
python3 main.py &
BACKEND_PID=$!

# Start frontend
cd ..
if [ -f "vite.config.js" ]; then
    npm run dev &
else
    npm start &
fi
FRONTEND_PID=$!

echo "🚀 Services started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "📱 Frontend: http://localhost:3000 or http://localhost:5173"
echo "🔧 Backend API: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"
echo "🐘 pgAdmin: Open pgAdmin 4 application"
echo ""
echo "To stop services, run: ./stop-all.sh"

# Save PIDs for stop script
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid
EOF

# Create stop-all script
cat > stop-all.sh << 'EOF'
#!/bin/bash

# Kill backend if PID file exists
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null || true
    rm .backend.pid
    echo "🛑 Backend stopped"
fi

# Kill frontend if PID file exists
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null || true
    rm .frontend.pid
    echo "🛑 Frontend stopped"
fi

echo "🛑 All services stopped"
EOF

# Make scripts executable
chmod +x start-all.sh stop-all.sh

# 14. Create desktop shortcuts (optional)
print_status "🖥️ Creating desktop shortcuts..."

# Create pgAdmin shortcut info
cat > ~/Desktop/Inventory-System-pgAdmin.txt << 'EOF'
To access pgAdmin:
1. Open pgAdmin 4 from Applications
2. Create new server with these settings:
   - Name: Inventory System
   - Host: localhost
   - Port: 5432
   - Database: inventory_management
   - Username: postgres
   - Password: postgres
EOF

print_success "🎉 Setup completed successfully!"
echo ""
echo "=================================================================="
echo "🚀 INVENTORY MANAGEMENT SYSTEM - READY TO USE"
echo "=================================================================="
echo ""
echo "📍 Project Location: $PROJECT_DIR"
echo ""
echo "🔧 Quick Start Commands:"
echo "  Start All Services:    ./start-all.sh"
echo "  Stop All Services:     ./stop-all.sh"
echo ""
echo "🌐 Access URLs:"
echo "  Frontend:              http://localhost:3000 or http://localhost:5173"
echo "  Backend API:           http://localhost:8000"
echo "  API Documentation:     http://localhost:8000/docs"
echo ""
echo "🗄️ Database Access:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: inventory_management"
echo "  Username: postgres"
echo "  Password: postgres"
echo ""
echo "📱 pgAdmin 4: Open from Applications folder"
echo "📄 pgAdmin Setup Guide: ~/Desktop/Inventory-System-pgAdmin.txt"
echo ""
echo "🚀 To start the system now, run: ./start-all.sh"
echo "=================================================================="