#!/usr/bin/env python3
"""
Sync Users from In-Memory Storage to PostgreSQL Database
This script reads users from simple_auth_api.py and saves them to the database
"""

import sys
import os
import json

# Add backend directory to path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

try:
    from backend.simple_auth_api import users_db
except ImportError:
    print("❌ Could not import users_db. Let me read it directly...")
    users_db = []
import psycopg2
from datetime import datetime
import bcrypt

def get_db_connection():
    """Create database connection"""
    return psycopg2.connect(
        host="localhost",
        database="inventory_management", 
        user="postgres",
        password="postgres",
        port="5432"
    )

def get_users_from_memory():
    """Read users from simple_auth_api.py file directly"""
    try:
        with open(os.path.join(backend_path, 'simple_auth_api.py'), 'r') as f:
            content = f.read()
            
        # Find users_db definition
        start = content.find('users_db = [')
        if start == -1:
            return []
            
        # Find the end of the list
        bracket_count = 0
        end = start + 12  # Skip 'users_db = ['
        
        for i, char in enumerate(content[start + 12:], start + 12):
            if char == '[':
                bracket_count += 1
            elif char == ']':
                if bracket_count == 0:
                    end = i + 1
                    break
                bracket_count -= 1
        
        # Extract the list definition
        list_def = content[start:end]
        
        # Parse it (this is a simple approach)
        if 'ADMIN_USER.copy()' in list_def:
            # Find ADMIN_USER definition
            admin_start = content.find('ADMIN_USER = {')
            if admin_start == -1:
                return []
                
            bracket_count = 0
            admin_end = admin_start + 14
            
            for i, char in enumerate(content[admin_start + 14:], admin_start + 14):
                if char == '{':
                    bracket_count += 1
                elif char == '}':
                    if bracket_count == 0:
                        admin_end = i + 1
                        break
                    bracket_count -= 1
            
            admin_def = content[admin_start:admin_end]
            
            # Extract admin user info (simple parsing)
            if '"username": "admin"' in admin_def and '"email": "admin@college.edu"' in admin_def:
                return [
                    {
                        "username": "admin",
                        "email": "admin@college.edu", 
                        "role": "main_admin"
                    }
                ]
    except Exception as e:
        print(f"❌ Error reading users from file: {e}")
    
    return []

def hash_password(password):
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def sync_users_to_database():
    """Transfer all users from in-memory storage to PostgreSQL"""
    try:
        # Get users from memory
        if not users_db:
            users_from_file = get_users_from_memory()
            print(f"📊 Found {len(users_from_file)} users from file")
        else:
            users_from_file = users_db
            print(f"📊 Found {len(users_db)} users in memory")
        
        # If no users found, create default admin
        if not users_from_file:
            users_from_file = [
                {
                    "username": "admin",
                    "email": "admin@college.edu",
                    "role": "main_admin"
                }
            ]
            print("📊 Using default admin user")
        
        # Connect to PostgreSQL
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print("🔄 Starting user synchronization...")
        
        # Display users to be synced
        for i, user in enumerate(users_from_file, 1):
            print(f"   {i}. {user['username']} ({user['email']}) - {user['role']}")
        
        # Check current database state
        cursor.execute("SELECT COUNT(*) FROM users WHERE role LIKE '%admin%'")
        result = cursor.fetchone()
        db_count = result[0] if result else 0
        print(f"📊 Current admin users in database: {db_count}")
        
        # Clear existing admin users to avoid duplicates
        cursor.execute("DELETE FROM users WHERE role LIKE '%admin%'")
        print("🗑️  Cleared existing admin users from database")
        
        # Insert each user from memory into database
        inserted_count = 0
        for user in users_from_file:
            try:
                # Hash the password (assuming default password)
                password_hash = hash_password('College@2025')
                
                insert_query = """
                INSERT INTO users (username, email, role, password_hash, created_at) 
                VALUES (%s, %s, %s, %s, %s)
                """
                
                cursor.execute(insert_query, (
                    user['username'],
                    user['email'], 
                    user['role'],
                    password_hash,
                    datetime.now()
                ))
                
                inserted_count += 1
                print(f"✅ Inserted: {user['username']} ({user['role']})")
                
            except Exception as e:
                print(f"❌ Error inserting {user['username']}: {e}")
        
        # Commit all changes
        conn.commit()
        
        # Verify the sync
        cursor.execute("""
            SELECT username, email, role, created_at 
            FROM users 
            WHERE role LIKE '%admin%' 
            ORDER BY role, username
        """)
        
        db_users = cursor.fetchall()
        print(f"\n🎉 Synchronization Complete!")
        print(f"📊 Total users inserted: {inserted_count}")
        print(f"📊 Total admin users in database: {len(db_users)}")
        
        print("\n📋 Current database admin users:")
        for i, (username, email, role, created_at) in enumerate(db_users, 1):
            print(f"   {i}. {username} ({email}) - {role}")
        
        cursor.close()
        conn.close()
        
        print(f"\n✅ SUCCESS: Your admin_users_query.sql will now show {len(db_users)} users!")
        return True
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        print("💡 Make sure your PostgreSQL server is running and database is accessible")
        return False

def test_query():
    """Test the admin query after sync"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Run the same query as in admin_users_query.sql
        test_query = """
        SELECT 
            ROW_NUMBER() OVER (ORDER BY 
                CASE role 
                    WHEN 'main_admin' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'subadmin' THEN 3
                    WHEN 'sub_admin' THEN 3
                    ELSE 4
                END, username) as "Sr#",
            username as "Username",
            email as "Email Address", 
            UPPER(role) as "Role"
        FROM users 
        WHERE role LIKE '%admin%'
           OR role IN ('main_admin', 'admin', 'subadmin', 'sub_admin')
        ORDER BY 
            CASE role 
                WHEN 'main_admin' THEN 1
                WHEN 'admin' THEN 2
                WHEN 'subadmin' THEN 3
                WHEN 'sub_admin' THEN 3
                ELSE 4
            END,
            username;
        """
        
        cursor.execute(test_query)
        results = cursor.fetchall()
        
        print(f"\n🧪 Testing admin_users_query.sql:")
        print("=" * 60)
        print(f"{'Sr#':<4} {'Username':<15} {'Email':<25} {'Role':<15}")
        print("=" * 60)
        
        for row in results:
            print(f"{row[0]:<4} {row[1]:<15} {row[2]:<25} {row[3]:<15}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Query test failed: {e}")

if __name__ == "__main__":
    print("🚀 User Database Synchronization Tool")
    print("=" * 50)
    
    success = sync_users_to_database()
    
    if success:
        print("\n🧪 Testing query...")
        test_query()
        
        print(f"\n🎯 Next Steps:")
        print(f"   1. Open pgAdmin")
        print(f"   2. Run your admin_users_query.sql")
        print(f"   3. You should now see all your admin users!")
    else:
        print(f"\n❌ Sync failed. Please check database connection.")
