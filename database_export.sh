#!/bin/bash
# ===================================================================
# DATABASE EXPORT AND BACKUP SCRIPT
# ===================================================================
# This script creates a complete backup of your current database
# Run this before giving the project to your friend
# ===================================================================

echo "🗄️ Database Export and Backup Script"
echo "====================================="

# Configuration
DB_NAME="inventory_management"
DB_USER="postgres"
BACKUP_DIR="database_backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "📊 Creating database exports..."

# 1. Full database dump (schema + data)
echo "🔄 Exporting complete database..."
pg_dump -U $DB_USER -h localhost -d $DB_NAME \
  --no-owner --no-privileges \
  -f "$BACKUP_DIR/complete_database_backup_$DATE.sql"

# 2. Schema only dump
echo "🏗️ Exporting database schema..."
pg_dump -U $DB_USER -h localhost -d $DB_NAME \
  --schema-only --no-owner --no-privileges \
  -f "$BACKUP_DIR/schema_only_$DATE.sql"

# 3. Data only dump  
echo "📈 Exporting data only..."
pg_dump -U $DB_USER -h localhost -d $DB_NAME \
  --data-only --no-owner --no-privileges \
  -f "$BACKUP_DIR/data_only_$DATE.sql"

# 4. Custom format dump (compressed)
echo "🗜️ Creating compressed backup..."
pg_dump -U $DB_USER -h localhost -d $DB_NAME \
  --format=custom --no-owner --no-privileges \
  -f "$BACKUP_DIR/database_backup_$DATE.dump"

echo ""
echo "✅ Backup completed! Files created in $BACKUP_DIR:"
ls -la "$BACKUP_DIR"

echo ""
echo "📋 Backup Summary:"
echo "   📁 Complete database: complete_database_backup_$DATE.sql"
echo "   🏗️ Schema only: schema_only_$DATE.sql"  
echo "   📊 Data only: data_only_$DATE.sql"
echo "   🗜️ Compressed: database_backup_$DATE.dump"

echo ""
echo "🚀 To restore on another system:"
echo "   1. Install PostgreSQL"
echo "   2. Create database: createdb -U postgres inventory_management"
echo "   3. Restore: psql -U postgres -d inventory_management -f complete_database_backup_$DATE.sql"
echo "   Or use: pg_restore -U postgres -d inventory_management database_backup_$DATE.dump"

echo ""
echo "✅ Your friend can now set up the complete database!"