#!/usr/bin/env python3
"""
Fix product_transactions table to add missing performed_by column
"""
import psycopg2
from database_manager import DatabaseManager

def fix_product_transactions():
    db = DatabaseManager()
    
    try:
        if not db.connect():
            print("❌ Failed to connect to database")
            return
            
        conn = db.connection
        cursor = conn.cursor()
        
        # Check if performed_by column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'product_transactions' 
            AND column_name = 'performed_by'
        """)
        
        result = cursor.fetchone()
        
        if result is None:
            print("Adding missing 'performed_by' column to product_transactions table...")
            cursor.execute("""
                ALTER TABLE product_transactions 
                ADD COLUMN performed_by VARCHAR(200)
            """)
            conn.commit()
            print("✅ Successfully added 'performed_by' column!")
        else:
            print("✅ Column 'performed_by' already exists!")
            
        # Show current table structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'product_transactions'
            ORDER BY ordinal_position
        """)
        
        columns = cursor.fetchall()
        print("\nCurrent product_transactions table structure:")
        for col in columns:
            print(f"  - {col[0]} ({col[1]}) {'NULL' if col[2] == 'YES' else 'NOT NULL'}")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fix_product_transactions()
