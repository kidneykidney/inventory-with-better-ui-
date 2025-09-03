"""
Sync in-memory users to PostgreSQL database
This script copies users from the simple auth system to the PostgreSQL users table
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

import psycopg2
from datetime import datetime

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'database': 'inventory_management',
    'user': 'postgres',
    'password': 'inventory',
    'port': 5432
}

# Users from simple_auth_api.py (copy the current in-memory data)
CURRENT_USERS = [
    {
        "id": 1,
        "username": "admin",
        "email": "admin@college.edu",
        "full_name": "System Administrator",
        "role": "main_admin",
        "status": "active"
    },
    {
        "id": 2,
        "username": "gugi",  # Update this with the actual username from your frontend
        "email": "guganasir@gmail.com",
        "full_name": "Gugan",
        "role": "sub_admin",  # Note: using sub_admin (with underscore) to match PostgreSQL schema
        "status": "active"
    }
]

def sync_users_to_postgres():
    """Copy users from in-memory storage to PostgreSQL"""
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🔗 Connected to PostgreSQL database")
        
        # Check if users table exists and get its structure
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        if not columns:
            print("❌ Users table does not exist in PostgreSQL")
            return
        
        print("✅ Users table found with columns:")
        for col_name, col_type in columns:
            print(f"   - {col_name}: {col_type}")
        
        # Clear existing users (optional - remove this if you want to keep existing data)
        # cursor.execute("DELETE FROM users WHERE role LIKE '%admin%';")
        # print("🗑️ Cleared existing admin users")
        
        # Insert users
        for user in CURRENT_USERS:
            try:
                # Check if user already exists
                cursor.execute("SELECT id FROM users WHERE username = %s", (user["username"],))
                existing = cursor.fetchone()
                
                if existing:
                    print(f"👤 User '{user['username']}' already exists, skipping...")
                    continue
                
                # Insert new user with only the columns that exist
                insert_query = """
                INSERT INTO users (username, email, role) 
                VALUES (%s, %s, %s)
                RETURNING id;
                """
                
                cursor.execute(insert_query, (
                    user["username"],
                    user["email"], 
                    user["role"]
                ))
                
                new_id = cursor.fetchone()[0]
                print(f"✅ Added user: {user['username']} (ID: {new_id}) as {user['role']}")
                
            except Exception as e:
                print(f"❌ Error adding user {user['username']}: {e}")
                continue
        
        # Commit changes
        conn.commit()
        
        # Verify the data
        cursor.execute("SELECT username, email, role FROM users WHERE role LIKE '%admin%' ORDER BY role;")
        results = cursor.fetchall()
        
        print("\n📊 Current admin users in PostgreSQL:")
        print("Username | Email | Role")
        print("-" * 50)
        for username, email, role in results:
            print(f"{username} | {email} | {role}")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 User synchronization completed!")
        print("💡 You can now run your PostgreSQL query to see the admin users")
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        print("💡 Make sure PostgreSQL is running and connection details are correct")

if __name__ == "__main__":
    sync_users_to_postgres()
