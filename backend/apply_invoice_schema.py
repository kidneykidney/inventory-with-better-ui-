#!/usr/bin/env python3
"""
Apply invoice schema to database
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from database_manager import DatabaseManager

def apply_invoice_schema():
    try:
        db = DatabaseManager()
        
        if not db.connection:
            print("❌ Could not connect to database")
            return False
        
        # Check if invoice tables already exist
        result = db.execute_query("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'invoice%'
        """)
        
        if result and len(result) > 0:
            print("📋 Invoice tables already exist:")
            for table in result:
                print(f"  - {table['table_name']}")
            print("✅ Invoice schema is already applied!")
            return True
        
        print("📋 No invoice tables found. Applying schema...")
        
        # Read schema file
        with open('invoice_schema.sql', 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        
        # Split into statements and execute
        statements = []
        current_statement = ""
        
        for line in schema_sql.split('\n'):
            line = line.strip()
            if line and not line.startswith('--'):
                current_statement += line + '\n'
                if line.endswith(';'):
                    statements.append(current_statement.strip())
                    current_statement = ""
        
        print(f"📝 Found {len(statements)} SQL statements to execute")
        
        success_count = 0
        for i, stmt in enumerate(statements, 1):
            if len(stmt) > 10:  # Skip empty statements
                try:
                    db.execute_command(stmt)
                    success_count += 1
                    print(f"✓ Statement {i} executed successfully")
                except Exception as e:
                    error_msg = str(e).lower()
                    if 'already exists' in error_msg:
                        print(f"✓ Statement {i} - element already exists (skipped)")
                    elif 'does not exist' in error_msg and 'function' in error_msg:
                        print(f"⚠ Statement {i} - function dependency missing (skipped)")
                    else:
                        print(f"⚠ Statement {i} failed: {str(e)[:100]}...")
        
        print(f"\n✅ Invoice schema application completed!")
        print(f"📊 Successfully executed {success_count} statements")
        
        # Verify tables were created
        result = db.execute_query("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'invoice%'
            ORDER BY table_name
        """)
        
        if result:
            print("\n📋 Created invoice tables:")
            for table in result:
                print(f"  ✓ {table['table_name']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error applying schema: {e}")
        return False

if __name__ == "__main__":
    apply_invoice_schema()
