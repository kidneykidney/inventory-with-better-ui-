# ===================================================================
# PROJECT MIGRATION CHECKLIST
# ===================================================================
# Use this checklist to ensure your friend gets everything needed
# ===================================================================

## 📋 Database Migration Checklist

### ✅ Core Database Files
- [ ] `MASTER_DATABASE_SETUP.sql` - Master setup script (run this first!)
- [ ] `unified_database_schema.sql` - Complete database schema
- [ ] `database/init_complete_database.sql` - Alternative complete setup
- [ ] `database/sample_data.sql` - Sample data for testing
- [ ] `DATABASE_SETUP_COMPLETE.md` - Complete setup guide

### ✅ Export Scripts
- [ ] `database_export.bat` (Windows) / `database_export.sh` (Linux/Mac)
- [ ] Run export script to create current database backup
- [ ] `database_backups/` folder with exported files

### ✅ Configuration Files
- [ ] `backend/data/settings.json` - System settings
- [ ] `backend/database_manager.py` - Database connection config
- [ ] `backend/requirements.txt` - Python dependencies
- [ ] `package.json` - Node.js dependencies
- [ ] `.env` files (if any)

### ✅ Documentation Files
- [ ] `DATABASE_SETUP_COMPLETE.md` - Database setup guide
- [ ] `DATABASE_EXPORT_SUMMARY.md` - Database documentation
- [ ] `README.md` - Main project documentation
- [ ] `WSL-TROUBLESHOOTING.md` - Troubleshooting guide

## 🚀 Setup Instructions for Your Friend

### Prerequisites
```bash
# 1. Install PostgreSQL 12+
# Windows: Download from postgresql.org
# Ubuntu: sudo apt install postgresql postgresql-contrib
# Mac: brew install postgresql

# 2. Install Python 3.8+
# 3. Install Node.js 16+
```

### Quick Setup Process
```bash
# 1. Clone/extract the project
cd inventory-with-better-ui-

# 2. Set up database (CRITICAL STEP!)
psql -U postgres -f MASTER_DATABASE_SETUP.sql

# 3. Install Python dependencies
pip install -r backend/requirements.txt

# 4. Install Node.js dependencies
npm install

# 5. Update database connection in backend/database_manager.py
# Change password and connection details if needed

# 6. Start the application
# Terminal 1: python backend/main.py
# Terminal 2: npm start

# 7. Visit: http://localhost:3000
```

## 🔍 Verification Steps

### Database Verification
```sql
-- Connect to database
psql -U postgres -d inventory_management

-- Check all tables exist
\dt

-- Verify sample data
SELECT COUNT(*) FROM students;   -- Should return 4
SELECT COUNT(*) FROM products;  -- Should return 5
SELECT COUNT(*) FROM categories; -- Should return 6

-- Test functions
SELECT generate_student_id();    -- Should return STUD005
SELECT generate_invoice_number(); -- Should return INV-2025-0001

-- Exit
\q
```

### Application Verification
- [ ] Backend starts without errors (http://localhost:8000)
- [ ] Frontend starts without errors (http://localhost:3000)
- [ ] Database connection successful
- [ ] Can create students, products, invoices
- [ ] OCR upload functionality works
- [ ] Settings page loads correctly

## 📁 Required Files Summary

### Database Files (Must Include)
```
MASTER_DATABASE_SETUP.sql          ← MOST IMPORTANT!
unified_database_schema.sql
DATABASE_SETUP_COMPLETE.md
database/
  ├── init_complete_database.sql
  ├── sample_data.sql
  └── README.md
```

### Backend Files
```
backend/
  ├── main.py
  ├── database_manager.py
  ├── requirements.txt
  ├── settings_manager.py
  ├── settings_api.py
  └── data/
      └── settings.json
```

### Frontend Files
```
src/
  ├── components/
  ├── pages/
  ├── api/
  └── ...
package.json
```

### Configuration Files
```
.env (if exists)
vite.config.js
docker-compose.yml (if using Docker)
```

## 🚨 Common Issues & Solutions

### Database Issues
1. **"Database already exists"** 
   ```sql
   DROP DATABASE inventory_management;
   CREATE DATABASE inventory_management;
   ```

2. **Permission errors**
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE inventory_management TO postgres;
   ```

3. **pg_dump not found**
   - Add PostgreSQL bin directory to PATH
   - Or use pgAdmin export functionality

### Backend Issues  
1. **Connection errors**: Update `backend/database_manager.py`
2. **Missing modules**: Run `pip install -r backend/requirements.txt`
3. **Port conflicts**: Change port in `backend/main.py`

### Frontend Issues
1. **Dependencies**: Run `npm install`
2. **Port conflicts**: Change port in `vite.config.js`
3. **API connection**: Update API_BASE_URL in components

## ✅ Final Checklist

- [ ] All database files included
- [ ] MASTER_DATABASE_SETUP.sql tested and working
- [ ] Database export created (using database_export.bat/sh)  
- [ ] Backend dependencies listed in requirements.txt
- [ ] Frontend dependencies listed in package.json
- [ ] Configuration files included
- [ ] Documentation provided
- [ ] Setup instructions clear
- [ ] Contact information provided for support

## 📞 Support Information

**Contact**: [Your contact information]
**Project Version**: 2.0
**Database Version**: PostgreSQL 12+
**Last Updated**: September 2025

---

**🎯 Most Important**: Make sure your friend runs `MASTER_DATABASE_SETUP.sql` first - this single file will create the complete database structure with all data!

**🔗 GitHub Repository**: [If applicable]