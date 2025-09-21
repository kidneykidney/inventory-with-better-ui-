#!/usr/bin/env python3
"""
Inventory Management System - Database Setup Script
==================================================
This script sets up the complete database schema and initial data
for the inventory management system.

Usage: python3 setup_database.py
"""

import os
import sys
import subprocess
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def run_sql_file(connection, file_path):
    """Execute SQL file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            sql_content = file.read()
        
        cursor = connection.cursor()
        cursor.execute(sql_content)
        connection.commit()
        cursor.close()
        print(f"✅ Successfully executed: {file_path}")
        return True
    except Exception as e:
        print(f"❌ Error executing {file_path}: {e}")
        return False

def create_database():
    """Create the inventory_management database if it doesn't exist"""
    try:
        # Connect to PostgreSQL (default database)
        connection = psycopg2.connect(
            host='localhost',
            port=5432,
            user='postgres',
            password='postgres',
            database='postgres'
        )
        connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        cursor = connection.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname='inventory_management'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute("CREATE DATABASE inventory_management")
            print("✅ Created database: inventory_management")
        else:
            print("✅ Database 'inventory_management' already exists")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

def setup_database():
    """Setup the complete database schema"""
    print("🚀 Starting Database Setup...")
    
    # Create database if needed
    if not create_database():
        return False
    
    try:
        # Connect to the inventory_management database
        connection = psycopg2.connect(
            host='localhost',
            port=5432,
            user='postgres',
            password='postgres',
            database='inventory_management'
        )
        
        print("🔗 Connected to inventory_management database")
        
        # List of SQL files to execute in order
        sql_files = [
            'COMPLETE_DATABASE_MIGRATION.sql',  # Primary comprehensive migration
            'unified_database_schema.sql',      # Fallback option
            'MASTER_DATABASE_SETUP.sql',        # Alternative fallback
            'database/sample_data.sql'          # Additional sample data if exists
        ]
        
        # Execute the first available file
        migration_executed = False
        for sql_file in sql_files:
            if os.path.exists(sql_file):
                print(f"📄 Executing: {sql_file}")
                if run_sql_file(connection, sql_file):
                    migration_executed = True
                    print(f"✅ Successfully executed {sql_file}")
                    break
                else:
                    print(f"⚠️ Failed to execute {sql_file}, trying next option...")
        
        if not migration_executed:
            print("❌ No migration files found or all failed!")
            return False
        
        connection.close()
        print("✅ Database setup completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False

def verify_setup():
    """Verify that the database setup was successful"""
    try:
        connection = psycopg2.connect(
            host='localhost',
            port=5432,
            user='postgres',
            password='postgres',
            database='inventory_management'
        )
        
        cursor = connection.cursor()
        
        # Check if main tables exist
        tables_to_check = [
            # Core tables
            'students', 'products', 'categories', 'lenders',
            # Order management
            'orders', 'order_items', 
            # Invoice management
            'invoices', 'invoice_items', 'invoice_images', 'invoice_transactions',
            # Authentication and users
            'users', 'user_sessions', 'audit_logs', 'system_settings',
            # Tracking and logs
            'student_acknowledgments', 'product_transactions', 'notifications',
            'email_notifications', 'system_logs'
        ]
        
        print("🔍 Verifying database setup...")
        
        for table in tables_to_check:
            cursor.execute(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = '{table}'
                );
            """)
            result = cursor.fetchone()
            exists = result[0] if result else False
            
            if exists:
                # Count rows in table
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                result = cursor.fetchone()
                count = result[0] if result else 0
                print(f"✅ Table '{table}': {count} rows")
            else:
                print(f"❌ Table '{table}': NOT FOUND")
        
        cursor.close()
        connection.close()
        print("✅ Database verification completed")
        return True
        
    except Exception as e:
        print(f"❌ Database verification failed: {e}")
        return False

def main():
    """Main function"""
    print("=" * 60)
    print("🗄️ INVENTORY MANAGEMENT SYSTEM - DATABASE SETUP")
    print("=" * 60)
    
    # Check if PostgreSQL is running
    try:
        subprocess.run(['pg_isready', '-h', 'localhost', '-p', '5432'], 
                      check=True, capture_output=True)
        print("✅ PostgreSQL is running")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ PostgreSQL is not running or not installed")
        print("Please start PostgreSQL and try again")
        return False
    
    # Setup database
    if setup_database():
        # Verify setup
        verify_setup()
        
        print("\n" + "=" * 60)
        print("🎉 DATABASE SETUP COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("\n🔧 Database Connection Details:")
        print("  Host: localhost")
        print("  Port: 5432")
        print("  Database: inventory_management")
        print("  Username: postgres")
        print("  Password: postgres")
        print("\n🚀 You can now start the application!")
        return True
    else:
        print("\n❌ Database setup failed!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)