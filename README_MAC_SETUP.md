# 🚀 Inventory Management System - Mac One-Click Setup

**Complete inventory management system with one-click Mac setup!**

## ⚡ Quick Start (One Command)

```bash
chmod +x mac-setup.sh && ./mac-setup.sh
```

That's it! The setup script will automatically install everything you need.

## 📦 What Gets Installed

- **Homebrew** (macOS package manager)
- **PostgreSQL 15** (Database)
- **pgAdmin 4** (Database management GUI)
- **Node.js 18** (Frontend runtime)
- **Python 3.11** (Backend runtime)
- **All project dependencies**
- **Database schema and sample data**
- **Environment configuration**
- **Startup/shutdown scripts**

## 🎯 After Installation

### Start the System
```bash
./start-all.sh
```

### Access Your Application
- **Main App**: http://localhost:3000 or http://localhost:5173
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **pgAdmin**: Open from Applications folder

### Stop the System
```bash
./stop-all.sh
```

## 🔧 Verification

Check if everything is working:
```bash
./verify-installation.sh
```

Monitor system health:
```bash
python3 health-check.py
```

## 📚 Complete Documentation

For detailed setup instructions, troubleshooting, and configuration:
- [Complete Mac Setup Guide](MAC_SETUP_GUIDE.md)

## 🗄️ Database Access

- **Host**: localhost
- **Port**: 5432
- **Database**: inventory_management
- **Username**: postgres
- **Password**: postgres

## 📞 Quick Help

**System not starting?**
```bash
# Check what's wrong
./verify-installation.sh

# Re-run setup
./mac-setup.sh

# Check logs
tail -f backend/logs/*.log
```

**Need to reset everything?**
```bash
# Stop services
./stop-all.sh

# Drop database
dropdb -U postgres inventory_management

# Re-run setup
./mac-setup.sh
```

---

**🎉 Enjoy your Inventory Management System!**

*For any issues, check the [complete documentation](MAC_SETUP_GUIDE.md) or run the verification script.*