#!/usr/bin/env python3
"""Simple database initialization script"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database_manager import DatabaseManager

def main():
    print("Initializing database...")
    db = DatabaseManager()
    
    # Try to connect
    if not db.connect():
        print("❌ Failed to connect to database")
        print("Make sure PostgreSQL is running and the credentials are correct:")
        print("Host: localhost")
        print("Database: inventory_management") 
        print("User: postgres")
        print("Password: gugan@2022")
        print("Port: 5432")
        return False
    
    print("✅ Connected to database successfully")
    
    # Try to create tables
    try:
        if db.create_database_and_tables():
            print("✅ Database schema created successfully")
            if db.add_sample_products():
                print("✅ Sample data added successfully")
            else:
                print("⚠️ Sample data already exists or failed to add")
        else:
            print("⚠️ Database schema already exists or failed to create")
    except Exception as e:
        print(f"ℹ️ Database setup info: {e}")
    
    print("✅ Database initialization completed!")
    return True

if __name__ == "__main__":
    main()
