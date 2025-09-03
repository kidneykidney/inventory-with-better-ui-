# 🚀 One-Click Docker Setup for Inventory Management System

This setup provides a complete containerized solution with secure authentication and automatic database sync.

## 🎯 One-Click Start Options

### Option 1: Batch File (Easiest)
```bash
# Double-click or run:
start-one-click.bat
```

### Option 2: NPM Scripts
```bash
# One-click start
npm run one-click

# Or alternative
npm run quick

# Docker commands
npm run docker:start    # Start all services
npm run docker:stop     # Stop all services
npm run docker:logs     # View logs
npm run docker:status   # Check status
npm run docker:clean    # Clean everything
```

### Option 3: Direct Docker Compose
```bash
# Start everything
docker-compose up --build -d

# Stop everything
docker-compose down
```

## 🐳 What Gets Started

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 5173 | React app with login interface |
| **Backend** | 8000 | FastAPI with authentication |
| **Database** | 5432 | PostgreSQL with user management |

## 🔐 Default Credentials

- **Username:** `admin`
- **Password:** `College@2025`
- **Email:** `admin@college.edu`

⚠️ **Change password after first login!**

## 📊 Database Connection

Your `admin_users_query.sql` will work with:

- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `inventory_management`
- **Username:** `postgres`
- **Password:** `gugan@2022`

## 🧪 Testing Your Query

1. **Start the system:** Run `start-one-click.bat`
2. **Open pgAdmin** or any PostgreSQL client
3. **Connect** with the credentials above
4. **Run** your `admin_users_query.sql`
5. **Create users** in the frontend - they'll appear in your query!

## 🛠️ Available Commands

```bash
# Development
npm run dev              # Frontend only
npm run backend          # Backend only
npm run full-dev         # Both (local mode)

# Docker Operations
npm run docker:start     # Start containers
npm run docker:stop      # Stop containers
npm run docker:logs      # View live logs
npm run docker:status    # Check service status
npm run docker:clean     # Remove everything
npm run docker:rebuild   # Full rebuild

# Quick Access
npm run one-click        # Complete system start
npm run quick           # Same as one-click
```

## 📱 Access Points

After starting:

- **🌐 Frontend:** http://localhost:5173
- **🔧 Backend API:** http://localhost:8000
- **📚 API Documentation:** http://localhost:8000/docs
- **🔐 Auth API:** http://localhost:8000/api/auth/docs

## 🎉 Features Included

- ✅ **Secure Authentication** (Login/Logout)
- ✅ **Role-Based Access** (Main Admin, Sub Admin)
- ✅ **User Management** Dashboard
- ✅ **Database Persistence** (Users survive restarts)
- ✅ **Auto-Sync** (Frontend ↔ PostgreSQL)
- ✅ **OCR Invoice Processing**
- ✅ **Complete API Documentation**

## 🔧 Troubleshooting

### Docker Issues
```bash
# Check Docker status
docker --version
docker-compose --version

# Full reset
docker-compose down -v --remove-orphans
docker system prune -f
npm run docker:rebuild
```

### Database Issues
```bash
# View database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up --build -d
```

### Service Issues
```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend
```

## 📋 Project Structure

```
inventory-with-better-ui/
├── start-one-click.bat          # 🚀 One-click start
├── docker-compose.yml           # 🐳 Docker configuration
├── Dockerfile                   # 🏗️ Backend container
├── package.json                 # 📦 NPM scripts
├── admin_users_query.sql        # 🧪 Your query file
├── init_database.sql            # 🗄️ Database setup
├── backend/                     # 🔧 FastAPI backend
│   ├── main.py                  # 🎯 Entry point
│   ├── simple_auth_api.py       # 🔐 Authentication
│   └── requirements.txt         # 📋 Dependencies
└── src/                         # 🎨 React frontend
    └── components/
        └── UserManagement.jsx   # 👥 User interface
```

## 🎯 Next Steps

1. **Start the system:** `start-one-click.bat`
2. **Login:** Use admin credentials
3. **Create users:** Use User Management interface
4. **Test query:** Run `admin_users_query.sql` in pgAdmin
5. **Enjoy!** Your system is ready for production

---

🎉 **Your one-click inventory management system with secure authentication is ready!**
