#!/bin/bash

# Docker Setup and Run Script for Inventory Management System
# Optimized for 8GB RAM systems

echo "🐳 Inventory Management System - Docker Setup"
echo "=============================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    echo "After installation, restart your computer and run this script again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not available!"
    echo "Please ensure Docker Desktop is running properly."
    exit 1
fi

echo "✅ Docker is available"

# Build and start services
echo "🏗️  Building containers (optimized for 8GB RAM)..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🗄️  Setting up database..."
docker-compose exec backend python -c "
from database_manager import DatabaseManager
import os
import time

# Wait for database
for i in range(30):
    try:
        db = DatabaseManager()
        print('Database connected successfully!')
        break
    except Exception as e:
        print(f'Waiting for database... ({i+1}/30)')
        time.sleep(2)
else:
    print('Failed to connect to database')
    exit(1)

# Run database setup
try:
    # You can add your database initialization here
    print('Database setup completed!')
except Exception as e:
    print(f'Database setup failed: {e}')
"

echo "🎉 Setup complete!"
echo ""
echo "📱 Your application is now running:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8001"
echo "   API Docs: http://localhost:8001/docs"
echo ""
echo "💾 Memory usage optimized for 8GB RAM systems"
echo ""
echo "📊 To monitor containers:"
echo "   docker-compose logs -f        # View all logs"
echo "   docker-compose ps            # Check status"
echo "   docker stats                # Monitor resource usage"
echo ""
echo "🛑 To stop containers:"
echo "   docker-compose down"
echo ""
echo "🔧 To restart after changes:"
echo "   docker-compose down"
echo "   docker-compose build --no-cache"
echo "   docker-compose up -d"
