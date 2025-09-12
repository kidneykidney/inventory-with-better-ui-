# Unified Database Schema Documentation

## Overview
This document describes the unified database schema that consolidates all scattered SQL files into a single, comprehensive database structure for the College Inventory Management System.

## 🎯 What This Solves
- **Before**: 30+ scattered SQL files with duplicate/conflicting schemas
- **After**: 1 single unified schema file with all functionality

## 📁 File Structure

### New Unified Files
- `unified_database_schema.sql` - Complete database schema (USE THIS)
- `database_migration.sql` - Migration script from old scattered files
- `DATABASE_UNIFIED_README.md` - This documentation

### Old Files (Can be removed after migration)
- `inventory_management_complete_schema.sql`
- `init_database.sql` 
- `create_auth_tables.sql`
- `inventory_*.sql` (all variants)
- `invoice_*.sql` files
- All other scattered `.sql` files

## 🚀 Quick Start

### For New Installations
```sql
-- Simply run the unified schema
psql -d your_database -f unified_database_schema.sql
```

### For Existing Installations
```sql
-- 1. Backup your existing database first!
pg_dump your_database > backup_$(date +%Y%m%d).sql

-- 2. Run the migration
psql -d your_database -f database_migration.sql

-- 3. Run the unified schema
psql -d your_database -f unified_database_schema.sql
```

## 📊 Database Structure

### Authentication & Users
- `users` - System users with role-based access
- `user_sessions` - Active user sessions with JWT tokens  
- `audit_logs` - System activity logging
- `system_settings` - Configurable application settings

### Core Inventory
- `categories` - Product categories
- `products` - Inventory items with full specifications
- `students` - Student information with flexible ID handling
- `notifications` - System notifications

### Order Management  
- `orders` - Order requests from students
- `order_items` - Individual items within orders
- `product_transactions` - Inventory movement tracking

### Invoice System
- `invoices` - Invoice headers with comprehensive metadata
- `invoice_items` - Line items for each invoice
- `invoice_images` - Physical invoice photos/scans
- `invoice_transactions` - Invoice status changes
- `student_acknowledgments` - Digital/physical signatures

## 🔧 Key Features

### Automated Functions
- **generate_student_id()** - Auto-generates STUD000001 format IDs
- **generate_invoice_number()** - Creates LEN001, RET001, etc. based on type
- **update_product_quantity()** - Automatically adjusts stock levels
- **create_lending_invoice()** - Auto-creates invoices for approved orders
- **find_or_create_student()** - Flexible student lookup/creation

### Smart Indexing
- Performance-optimized indexes for all common queries
- Partial indexes for conditional uniqueness
- Full-text search ready structure

### Business Logic
- Automatic timestamp updates
- Stock level tracking
- Invoice lifecycle management
- Student deduplication handling

## 🔐 Default Credentials
- **Username**: admin  
- **Password**: College@2025
- **Role**: main_admin

## 📈 Views for Complex Queries

### invoice_details
Complete invoice information with student and order data
```sql
SELECT * FROM invoice_details WHERE status = 'issued';
```

### students_clean  
Deduplicated active students
```sql
SELECT * FROM students_clean;
```

### students_unique
Single record per unique student (by ID or email)
```sql
SELECT * FROM students_unique;
```

## 🛠️ Configuration

### System Settings Categories
- `general` - Application-wide settings
- `inventory` - Stock management settings  
- `invoice` - Invoice processing settings
- `notifications` - Alert settings
- `security` - Authentication settings

### Adding New Settings
```sql
INSERT INTO system_settings (category, key, value, description) 
VALUES ('category', 'setting_key', 'value', 'Description');
```

## 🔄 Migration Process

1. **Backup existing data**
   ```bash
   pg_dump inventory_management > backup_$(date +%Y%m%d).sql
   ```

2. **Run migration script**
   ```sql
   psql -d inventory_management -f database_migration.sql
   ```

3. **Deploy unified schema**
   ```sql
   psql -d inventory_management -f unified_database_schema.sql
   ```

4. **Verify installation**
   ```sql
   SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
   ```

5. **Test application functionality**

6. **Remove old SQL files** (after verification)

## 📋 Maintenance

### Regular Tasks
- Monitor `audit_logs` for system activity
- Check `product_transactions` for inventory discrepancies  
- Review `notifications` for system alerts
- Update `system_settings` as needed

### Performance Monitoring
```sql
-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes ORDER BY idx_scan DESC;
```

## ⚠️ Important Notes

1. **Single Source of Truth**: Only use `unified_database_schema.sql` going forward
2. **No More Scattered Files**: All other SQL files are now redundant  
3. **Full Backward Compatibility**: All existing functionality is preserved
4. **Enhanced Features**: New capabilities added (OCR, digital signatures, etc.)
5. **Production Ready**: Includes proper indexing, constraints, and business logic

## 🆘 Troubleshooting

### Common Issues
- **Constraint violations**: Check existing data for duplicates before migration
- **Missing sequences**: Run the sequence update commands in migration script
- **Function errors**: Ensure PostgreSQL version supports used features (9.5+)

### Support
- Check application logs for specific error messages
- Review `audit_logs` table for system activity
- Verify all indexes are created: `\di` in psql

## 📚 Next Steps

1. Update application documentation to reference new schema
2. Train team on new unified structure  
3. Remove old SQL files from repository
4. Update deployment scripts to use `unified_database_schema.sql`
5. Consider adding additional monitoring/alerting based on new capabilities
