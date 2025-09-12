# 🗄️ Database Setup Guide

This guide helps team members set up the PostgreSQL database for the Inventory Management System.

## 🚀 Quick Setup (Recommended)

### For Windows Users:
1. **Run the automated setup script:**
   ```bash
   cd inventory-with-better-ui-
   database\setup.bat
   ```

### For Linux/Mac Users:
1. **Run the automated setup script:**
   ```bash
   cd inventory-with-better-ui-
   chmod +x database/setup.sh
   ./database/setup.sh
   ```

## 📋 Manual Setup

If you prefer to set up manually or the automated script doesn't work:

### 1. Install PostgreSQL
- **Windows:** Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS:** `brew install postgresql`
- **Ubuntu:** `sudo apt-get install postgresql postgresql-contrib`

### 2. Create Database
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create the database
CREATE DATABASE inventory_management;

-- Exit psql
\q
```

### 3. Initialize Schema
```bash
# Navigate to project directory
cd inventory-with-better-ui-

# Run the complete database initialization script
psql -U postgres -d inventory_management -f database/init_complete_database.sql
```

### 4. Configure Application
```bash
# Copy the environment template
cp backend/.env.template backend/.env

# Edit the .env file with your database credentials
# Update DATABASE_PASSWORD with your PostgreSQL password
```

## 🔧 Configuration

### Environment Variables (.env file)
Create `backend/.env` with your database settings:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=inventory_management
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password_here
```

### Default Credentials
After setup, you can login with:
- **Username:** `admin`
- **Password:** `College@2025`

## 🗃️ Database Schema

The database includes these main tables:

### Core Tables:
- **categories** - Product categories
- **products** - Product catalog with inventory
- **students** - Student information
- **orders** - Order management
- **order_items** - Items within orders

### Invoice System:
- **invoices** - Invoice records
- **invoice_items** - Items on invoices
- **invoice_images** - Scanned invoice images
- **invoice_transactions** - Payment tracking
- **student_acknowledgments** - Digital signatures

### System Tables:
- **users** - System users and authentication
- **user_sessions** - Login sessions
- **system_settings** - Application configuration
- **audit_logs** - Activity tracking
- **notifications** - System notifications
- **product_transactions** - Inventory movement history

### Views:
- **invoice_details** - Complete invoice information
- **students_clean** - Active students only
- **students_unique** - Deduplicated student records

## 🔧 Advanced Features

### Automatic Functions:
- **Auto Invoice Generation** - Creates invoices when orders are approved
- **Student ID Generation** - Auto-generates unique student IDs
- **Inventory Tracking** - Automatic quantity updates
- **Audit Logging** - Tracks all changes

### Triggers:
- **Updated At Timestamps** - Auto-updates modification times
- **Quantity Management** - Updates stock levels automatically
- **Business Logic** - Enforces lending rules and constraints

## 🔍 Verification

After setup, verify everything works:

```sql
-- Connect to the database
psql -U postgres -d inventory_management

-- Check tables exist
\dt

-- Check some data
SELECT * FROM categories LIMIT 5;
SELECT * FROM users WHERE username = 'admin';
SELECT * FROM system_settings LIMIT 10;

-- Exit
\q
```

## 🐛 Troubleshooting

### Common Issues:

1. **"Database already exists" error:**
   - Drop the existing database: `DROP DATABASE inventory_management;`
   - Then recreate it

2. **"Permission denied" error:**
   - Make sure you're running as a user with database creation privileges
   - Use `sudo` on Linux/Mac if needed

3. **"psql command not found":**
   - Add PostgreSQL to your system PATH
   - On Windows: Add `C:\Program Files\PostgreSQL\XX\bin` to PATH

4. **Connection refused:**
   - Make sure PostgreSQL service is running
   - Check if port 5432 is available: `netstat -an | grep 5432`

### Getting Help:

1. **Check PostgreSQL logs** for detailed error messages
2. **Verify PostgreSQL is running:**
   - Windows: Check Services for "PostgreSQL"
   - Linux/Mac: `sudo systemctl status postgresql`

3. **Test connection manually:**
   ```bash
   psql -U postgres -h localhost -p 5432 -d postgres
   ```

## 🚀 Next Steps

After database setup:

1. **Install application dependencies:**
   ```bash
   npm install
   pip install -r backend/requirements.txt
   ```

2. **Start the application:**
   ```bash
   # Terminal 1: Start backend
   cd backend
   python main.py

   # Terminal 2: Start frontend
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 📊 Sample Data

The initialization script includes:
- ✅ Default admin user
- ✅ Sample product categories
- ✅ System settings
- ✅ Database indexes for performance
- ✅ All required functions and triggers

Your database is ready for production use! 🎉
