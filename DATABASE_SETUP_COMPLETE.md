# 🗄️ Complete Database Setup Guide

This guide will help you set up the complete inventory management database from scratch.

## 📋 Prerequisites

1. **PostgreSQL 12+** installed and running
2. **Database admin access** (postgres user or equivalent)
3. **psql command line tool** available

## 🚀 Quick Setup (Recommended)

### Option 1: Single Command Setup
```bash
# Navigate to project directory
cd inventory-with-better-ui-

# Run the master setup script
psql -U postgres -f MASTER_DATABASE_SETUP.sql
```

### Option 2: Step-by-Step Setup

1. **Create Database**
```bash
psql -U postgres -c "CREATE DATABASE inventory_management;"
```

2. **Run Complete Schema**
```bash
psql -U postgres -d inventory_management -f unified_database_schema.sql
```

3. **Add Sample Data (Optional)**
```bash
psql -U postgres -d inventory_management -f database/sample_data.sql
```

## 📊 Database Structure Overview

### Core Tables
- **students** - Student records with auto-generated IDs
- **products** - Product inventory with categories
- **invoices** - Lending/return invoice system  
- **invoice_items** - Line items for invoices
- **invoice_images** - OCR uploaded images
- **orders** - Order management system
- **users** - System user authentication
- **categories** - Product categorization

### Key Features
- ✅ **Auto-generated student IDs** (STUD001, STUD002, etc.)
- ✅ **Auto-generated invoice numbers** (INV-2025-0001, etc.)  
- ✅ **OCR integration** with image storage
- ✅ **Staff/Lender management** with auto-creation
- ✅ **Product quantity tracking**
- ✅ **Audit logging**
- ✅ **Database triggers** for data consistency

## 🔧 Configuration

### Database Connection Settings
Update these in `backend/database_manager.py`:

```python
DATABASE_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'inventory_management', 
    'username': 'postgres',
    'password': 'your_password_here'
}
```

### Settings Configuration  
Update `backend/data/settings.json` with your institution details.

## 🧪 Verify Setup

Run these commands to verify everything is working:

```sql
-- Check if all tables exist
\dt

-- Verify sample data
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM products; 
SELECT COUNT(*) FROM invoices;

-- Test auto-generation functions
SELECT generate_student_id();
SELECT generate_invoice_number();
```

## 📁 File Reference

- `MASTER_DATABASE_SETUP.sql` - Complete database setup (run this first)
- `unified_database_schema.sql` - Main database schema
- `database/init_complete_database.sql` - Alternative complete setup
- `database/sample_data.sql` - Sample data for testing
- `DATABASE_EXPORT_SUMMARY.md` - Detailed database documentation

## 🚨 Troubleshooting

### Common Issues:

1. **"Database already exists"**
   ```bash
   dropdb -U postgres inventory_management
   createdb -U postgres inventory_management
   ```

2. **Permission errors**
   ```bash
   # Grant permissions
   psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE inventory_management TO postgres;"
   ```

3. **Connection issues**
   - Verify PostgreSQL is running: `systemctl status postgresql`
   - Check pg_hba.conf for connection permissions
   - Ensure password is correct

## 📞 Support

If you encounter any issues:
1. Check the logs in `logs/inventory_api.log`
2. Verify database connection in backend
3. Ensure all extensions are installed (uuid-ossp, pgcrypto)

## 🎯 Next Steps

After database setup:
1. Install Python dependencies: `pip install -r backend/requirements.txt`
2. Install Node.js dependencies: `npm install` 
3. Start backend: `python backend/main.py`
4. Start frontend: `npm start`
5. Visit: http://localhost:3000

---
**Database Schema Version**: 2.0  
**Last Updated**: September 2025  
**Compatibility**: PostgreSQL 12+