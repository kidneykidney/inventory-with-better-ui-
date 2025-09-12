#!/bin/bash
# Database Setup Script for Team Members
# This script helps teammates set up the database locally

echo "🏭 Inventory Management System - Database Setup"
echo "=============================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL first:"
    echo "- Windows: https://www.postgresql.org/download/windows/"
    echo "- macOS: brew install postgresql"
    echo "- Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

echo "✅ PostgreSQL found"

# Database configuration
DB_NAME="inventory_management"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo ""
echo "📝 Database Configuration:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

# Prompt for password
echo "🔐 Please enter your PostgreSQL password for user '$DB_USER':"
read -s DB_PASSWORD
echo ""

# Test connection
echo "🔍 Testing database connection..."
export PGPASSWORD=$DB_PASSWORD
if ! psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Failed to connect to PostgreSQL"
    echo "Please check your credentials and try again"
    exit 1
fi

echo "✅ Database connection successful"

# Check if database exists
echo "🔍 Checking if database '$DB_NAME' exists..."
DB_EXISTS=$(psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';")

if [ "$DB_EXISTS" = "1" ]; then
    echo "⚠️  Database '$DB_NAME' already exists"
    echo "Do you want to recreate it? This will delete all existing data! (y/N)"
    read -n 1 RECREATE
    echo ""
    
    if [ "$RECREATE" = "y" ] || [ "$RECREATE" = "Y" ]; then
        echo "🗑️  Dropping existing database..."
        psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
        echo "✅ Database dropped"
    else
        echo "❌ Setup cancelled"
        exit 1
    fi
fi

# Create database
echo "🏗️  Creating database '$DB_NAME'..."
psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d postgres -c "CREATE DATABASE $DB_NAME;"

if [ $? -eq 0 ]; then
    echo "✅ Database created successfully"
else
    echo "❌ Failed to create database"
    exit 1
fi

# Run initialization script
echo "📊 Initializing database schema and data..."
psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -f database/init_complete_database.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Database setup completed successfully!"
    echo ""
    echo "📋 Summary:"
    echo "  ✅ Database '$DB_NAME' created"
    echo "  ✅ All tables and schemas imported"
    echo "  ✅ Sample data and admin user created"
    echo ""
    echo "🔐 Default Admin Credentials:"
    echo "  Username: admin"
    echo "  Password: College@2025"
    echo ""
    echo "🚀 You can now run the application:"
    echo "  1. Install dependencies: npm install"
    echo "  2. Install Python deps: pip install -r backend/requirements.txt"
    echo "  3. Start backend: cd backend && python main.py"
    echo "  4. Start frontend: npm run dev"
    echo ""
    echo "🌐 Access the application at: http://localhost:3000"
else
    echo "❌ Database initialization failed"
    echo "Check the error messages above and try again"
    exit 1
fi
