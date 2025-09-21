#!/bin/bash

# =============================================================================
# Inventory Management System - Installation Verification Script
# =============================================================================
# This script verifies that all components are properly installed and working
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Initialize counters
PASSED=0
FAILED=0
WARNINGS=0

echo "=================================================================="
echo "🔍 INVENTORY MANAGEMENT SYSTEM - VERIFICATION"
echo "=================================================================="
echo ""

# 1. Check macOS version
print_status "Checking macOS version..."
MACOS_VERSION=$(sw_vers -productVersion)
MACOS_MAJOR=$(echo $MACOS_VERSION | cut -d. -f1)
MACOS_MINOR=$(echo $MACOS_VERSION | cut -d. -f2)

if [[ $MACOS_MAJOR -gt 10 ]] || [[ $MACOS_MAJOR -eq 10 && $MACOS_MINOR -ge 15 ]]; then
    print_success "macOS $MACOS_VERSION (compatible)"
    ((PASSED++))
else
    print_error "macOS $MACOS_VERSION (may have compatibility issues)"
    ((FAILED++))
fi

# 2. Check Homebrew
print_status "Checking Homebrew installation..."
if command_exists brew; then
    BREW_VERSION=$(brew --version | head -n1)
    print_success "Homebrew installed: $BREW_VERSION"
    ((PASSED++))
else
    print_error "Homebrew not found"
    ((FAILED++))
fi

# 3. Check PostgreSQL
print_status "Checking PostgreSQL installation..."
if command_exists psql; then
    PSQL_VERSION=$(psql --version)
    print_success "PostgreSQL installed: $PSQL_VERSION"
    ((PASSED++))
    
    # Check if PostgreSQL is running
    print_status "Checking PostgreSQL service..."
    if brew services list | grep postgresql@15 | grep started >/dev/null 2>&1; then
        print_success "PostgreSQL service is running"
        ((PASSED++))
    else
        print_warning "PostgreSQL service is not running"
        print_status "Attempting to start PostgreSQL..."
        if brew services start postgresql@15; then
            print_success "PostgreSQL service started"
            ((PASSED++))
        else
            print_error "Failed to start PostgreSQL service"
            ((FAILED++))
        fi
    fi
    
    # Test database connection
    print_status "Testing database connection..."
    if psql -U postgres -d postgres -c "SELECT version();" >/dev/null 2>&1; then
        print_success "Database connection successful"
        ((PASSED++))
    else
        print_error "Database connection failed"
        ((FAILED++))
    fi
    
    # Check if inventory database exists
    print_status "Checking inventory_management database..."
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw inventory_management; then
        print_success "inventory_management database exists"
        ((PASSED++))
    else
        print_error "inventory_management database not found"
        ((FAILED++))
    fi
else
    print_error "PostgreSQL not found"
    ((FAILED++))
fi

# 4. Check pgAdmin
print_status "Checking pgAdmin installation..."
if ls /Applications/pgAdmin\ 4.app >/dev/null 2>&1; then
    print_success "pgAdmin 4 installed"
    ((PASSED++))
else
    print_error "pgAdmin 4 not found in Applications"
    ((FAILED++))
fi

# 5. Check Node.js
print_status "Checking Node.js installation..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
    ((PASSED++))
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm installed: v$NPM_VERSION"
        ((PASSED++))
    else
        print_error "npm not found"
        ((FAILED++))
    fi
else
    print_error "Node.js not found"
    ((FAILED++))
fi

# 6. Check Python
print_status "Checking Python installation..."
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python installed: $PYTHON_VERSION"
    ((PASSED++))
    
    # Check pip
    if command_exists pip3; then
        PIP_VERSION=$(pip3 --version)
        print_success "pip3 installed: $PIP_VERSION"
        ((PASSED++))
    else
        print_error "pip3 not found"
        ((FAILED++))
    fi
else
    print_error "Python 3 not found"
    ((FAILED++))
fi

# 7. Check project files
print_status "Checking project structure..."
PROJECT_FILES=(
    "package.json"
    "backend/main.py"
    "backend/requirements.txt"
    "src"
    "setup_database.py"
    "start-all.sh"
    "stop-all.sh"
)

for file in "${PROJECT_FILES[@]}"; do
    if [[ -e "$file" ]]; then
        print_success "Found: $file"
        ((PASSED++))
    else
        print_error "Missing: $file"
        ((FAILED++))
    fi
done

# 8. Check environment files
print_status "Checking environment configuration..."
if [[ -f "backend/.env" ]]; then
    print_success "Backend environment file exists"
    ((PASSED++))
else
    print_warning "Backend .env file not found (will be created automatically)"
    ((WARNINGS++))
fi

if [[ -f ".env" ]]; then
    print_success "Frontend environment file exists"
    ((PASSED++))
else
    print_warning "Frontend .env file not found (will be created automatically)"
    ((WARNINGS++))
fi

# 9. Check Python dependencies
print_status "Checking Python dependencies..."
PYTHON_DEPS=("fastapi" "uvicorn" "sqlalchemy" "psycopg2-binary")
MISSING_DEPS=()

for dep in "${PYTHON_DEPS[@]}"; do
    if python3 -c "import $dep" 2>/dev/null; then
        print_success "Python package installed: $dep"
        ((PASSED++))
    else
        print_error "Python package missing: $dep"
        MISSING_DEPS+=("$dep")
        ((FAILED++))
    fi
done

# 10. Check Node.js dependencies
print_status "Checking Node.js dependencies..."
if [[ -d "node_modules" ]]; then
    print_success "Node.js dependencies installed"
    ((PASSED++))
else
    print_error "Node.js dependencies not installed (run: npm install)"
    ((FAILED++))
fi

# 11. Check ports availability
print_status "Checking port availability..."
PORTS=(3000 5173 8000)
for port in "${PORTS[@]}"; do
    if port_in_use $port; then
        print_warning "Port $port is already in use"
        ((WARNINGS++))
    else
        print_success "Port $port is available"
        ((PASSED++))
    fi
done

# 12. Test database tables
print_status "Checking database tables..."
if psql -U postgres -d inventory_management -c "\dt" >/dev/null 2>&1; then
    TABLE_COUNT=$(psql -U postgres -d inventory_management -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    if [[ $TABLE_COUNT -gt 0 ]]; then
        print_success "Database has $TABLE_COUNT tables"
        ((PASSED++))
    else
        print_error "Database has no tables (run: python3 setup_database.py)"
        ((FAILED++))
    fi
else
    print_error "Cannot access database tables"
    ((FAILED++))
fi

# Summary
echo ""
echo "=================================================================="
echo "📊 VERIFICATION SUMMARY"
echo "=================================================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [[ $FAILED -eq 0 ]]; then
    print_success "🎉 All critical checks passed! System is ready to use."
    echo ""
    echo "🚀 To start the system:"
    echo "   ./start-all.sh"
    echo ""
    echo "🌐 Access URLs:"
    echo "   Frontend: http://localhost:3000 or http://localhost:5173"
    echo "   Backend: http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
    exit 0
elif [[ $FAILED -le 3 && $WARNINGS -gt 0 ]]; then
    print_warning "⚠️ System might work but has some issues to resolve."
    echo ""
    echo "🔧 Recommended actions:"
    if [[ ${#MISSING_DEPS[@]} -gt 0 ]]; then
        echo "   pip3 install ${MISSING_DEPS[*]}"
    fi
    echo "   ./mac-setup.sh  # Re-run setup if needed"
    echo ""
    exit 1
else
    print_error "❌ Critical issues found. Please fix the errors above."
    echo ""
    echo "🔧 Try running the setup script again:"
    echo "   ./mac-setup.sh"
    echo ""
    exit 2
fi