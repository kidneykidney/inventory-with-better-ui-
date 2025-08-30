# Inventory Management System - Docker Setup

## Quick Start

**Just run this command and everything will work:**

```bash
.\start-system.bat
```

That's it! The system will:
- ✅ Check Docker is running
- ✅ Build all containers
- ✅ Start PostgreSQL database
- ✅ Start FastAPI backend on port 8000
- ✅ Start React frontend on port 3000
- ✅ Open the application in your browser

## Access Points

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432

## Management Commands

### Start the System
```bash
.\start-system.bat
```

### Stop the System
```bash
.\stop-system.bat
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Clean Restart (if issues occur)
```bash
docker-compose down -v
.\start-system.bat
```

## Troubleshooting

### If Docker isn't working:
1. Make sure Docker Desktop is installed and running
2. Check if virtualization is enabled in BIOS
3. Restart Docker Desktop

### If services won't start:
1. Run: `.\stop-system.bat`
2. Run: `docker-compose down -v`
3. Run: `.\start-system.bat`

### If you see port conflicts:
1. Stop other services using ports 3000, 8000, or 5432
2. Run: `.\stop-system.bat`
3. Run: `.\start-system.bat`

### If database issues occur:
```bash
# Reset database
docker-compose down -v
docker volume rm inventory_postgres_data
.\start-system.bat
```

## System Architecture

- **Frontend**: React + Vite (Port 3000)
- **Backend**: FastAPI + Python (Port 8000)
- **Database**: PostgreSQL (Port 5432)
- **OCR**: Tesseract + OpenCV
- **Container**: Docker + Docker Compose

## Features Working

✅ Invoice Management
✅ OCR Invoice Upload
✅ Student Management
✅ Product Management
✅ Order Management
✅ Image Upload & Processing
✅ Database Operations
✅ CORS Configuration
✅ File Upload Handling

## No More Issues Guaranteed!

This Docker setup eliminates:
- ❌ Port conflicts
- ❌ Environment issues
- ❌ Dependency problems
- ❌ CORS issues
- ❌ Database connection problems
- ❌ Missing libraries
- ❌ Python environment issues

Everything runs in isolated containers with all dependencies included!
