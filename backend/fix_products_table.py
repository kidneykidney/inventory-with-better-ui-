#!/usr/bin/env python3

import database_manager

def fix_products_table():
    """Add missing is_active column to products table"""
    db = database_manager.DatabaseManager()
    
    try:
        # Check if is_active column exists
        check_query = """
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_active'
        """
        result = db.execute_query(check_query)
        
        if not result:
            print("Adding is_active column to products table...")
            
            # Add the is_active column with default value true
            alter_query = """
            ALTER TABLE products 
            ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
            """
            
            if db.execute_command(alter_query):
                print("✅ Successfully added is_active column to products table")
            else:
                print("❌ Failed to add is_active column")
        else:
            print("✅ is_active column already exists in products table")
            
        # Show current columns
        print("\nCurrent products table columns:")
        columns_query = """
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        ORDER BY ordinal_position
        """
        columns = db.execute_query(columns_query)
        for col in columns:
            print(f"  - {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']}, default: {col['column_default']})")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_products_table()