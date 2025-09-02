# 🚀 Inventory Management System - Quick Setup

> **Professional inventory management system with automated setup - ready in 2-3 minutes!**

## ⚡ **INSTANT SETUP OPTIONS**

### **Option 1: One-Click Setup (Recommended)**
```bash
# 1. Clone the repository
git clone https://github.com/kidneykidney/inventory-with-better-ui-.git
cd inventory-with-better-ui-

# 2. Run automated setup (Windows)
SETUP.bat

# 3. Start the system
scripts\START.bat
```

### **Option 2: Docker Setup (Easiest)**
```bash
# 1. Clone and run Docker setup
git clone https://github.com/kidneykidney/inventory-with-better-ui-.git
cd inventory-with-better-ui-
DOCKER_SETUP.bat

# That's it! Everything runs in containers.
```

### **Option 3: Manual Setup (For developers)**
```bash
# Backend setup
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements-auto.txt

# Frontend setup  
npm install

# Start services
npm run dev          # Frontend on :3000
python backend/main.py  # Backend on :8000
```

---

## 📋 **What Gets Installed Automatically**

### **Backend Dependencies:**
- ✅ FastAPI + Uvicorn (Web framework)
- ✅ PostgreSQL + SQLAlchemy (Database)
- ✅ Tesseract OCR + OpenCV (Image processing)
- ✅ Pillow + NumPy (Image manipulation)
- ✅ All required Python packages

### **Frontend Dependencies:**
- ✅ React 19 + Material-UI v7
- ✅ Framer Motion (Animations)
- ✅ Vite (Build tool)
- ✅ All Node.js packages

### **System Components:**
- ✅ Virtual environment setup
- ✅ Database schema creation
- ✅ OCR configuration
- ✅ Environment variables
- ✅ Startup/shutdown scripts

---

## 🎯 **After Setup - Available Commands**

### **Windows Scripts (in `scripts/` folder):**
```bash
scripts\START.bat           # Start everything
scripts\STOP.bat            # Stop all services
scripts\SETUP_DATABASE.bat  # Initialize database
scripts\UPDATE_DEPS.bat     # Update dependencies
```

### **Docker Commands:**
```bash
docker-compose -f docker-compose-auto.yml up    # Start with logs
docker-compose -f docker-compose-auto.yml down  # Stop and remove
docker-compose -f docker-compose-auto.yml logs  # View logs
```

### **Development Commands:**
```bash
npm run dev                 # Frontend development server
python backend/main.py      # Backend development server
python backend/ocr_setup.py # Test OCR functionality
```

---

## 🌐 **Access Points**

After setup, access your application at:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000  
- **API Documentation:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

---

## 🔧 **Troubleshooting**

### **Common Issues:**

**"Port already in use"**
```bash
scripts\STOP.bat  # Stop all services first
scripts\START.bat # Then restart
```

**"OCR not working"**
```bash
# Run OCR setup test
python backend/ocr_setup.py
```

**"Dependencies missing"**
```bash
# Update all dependencies
scripts\UPDATE_DEPS.bat
```

**"Database connection failed"**
```bash
# Reinitialize database
scripts\SETUP_DATABASE.bat
```

### **Docker Issues:**
```bash
# Reset everything
docker-compose -f docker-compose-auto.yml down -v
docker-compose -f docker-compose-auto.yml up --build
```

---

## 📊 **System Requirements**

### **Minimum Requirements:**
- Windows 10/11, macOS 10.15+, or Linux
- Python 3.8+ (automatically configured)
- Node.js 16+ (for frontend)
- 4GB RAM, 2GB free disk space

### **Docker Requirements:**
- Docker Desktop installed and running
- 8GB RAM recommended
- 5GB free disk space

---

## 🚀 **Features Ready Out-of-Box**

After setup, you get:

- ✅ **Product Management** - Add, edit, track inventory
- ✅ **Student Management** - Comprehensive user system  
- ✅ **Order Processing** - Drag-and-drop order creation
- ✅ **Invoice System** - OCR-powered invoice processing
- ✅ **Analytics Dashboard** - Real-time insights
- ✅ **Responsive UI** - Works on all devices
- ✅ **Real-time Notifications** - Live system updates

---

## 💡 **For New Team Members**

When someone new joins your team:

1. **Share the repository link**
2. **They run `SETUP.bat` once** (2-3 minutes)  
3. **Use `scripts\START.bat` to develop** (30 seconds)

**No more 2-hour setup sessions!** 🎉

---

## 📞 **Support**

If you encounter any issues:

1. Check the **Troubleshooting** section above
2. Run `python backend/ocr_setup.py` to diagnose OCR issues
3. Check logs in the terminal windows
4. For Docker: `docker-compose -f docker-compose-auto.yml logs`

---

**Built with ❤️ for seamless development experience**
