"""
View Admin Users from In-Memory Storage
This script shows the admin users that are currently stored in your simple auth system
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Import the users database from simple_auth_api
try:
    from simple_auth_api import users_db
    
    print("👥 ADMIN & SUBADMIN USERS FROM IN-MEMORY STORAGE")
    print("=" * 60)
    
    # Filter admin users
    admin_users = [user for user in users_db if 'admin' in user.get('role', '').lower()]
    
    if not admin_users:
        print("❌ No admin users found in memory storage")
    else:
        print(f"📊 Found {len(admin_users)} admin user(s):")
        print()
        
        # Table header
        print(f"{'Sr#':<4} {'Username':<15} {'Email':<25} {'Role':<12} {'Status':<8}")
        print("-" * 70)
        
        # Sort by role hierarchy
        role_order = {'main_admin': 1, 'admin': 2, 'sub_admin': 3, 'subadmin': 3}
        admin_users.sort(key=lambda x: (role_order.get(x['role'], 4), x['username']))
        
        # Display users
        for i, user in enumerate(admin_users, 1):
            print(f"{i:<4} {user['username']:<15} {user['email']:<25} {user['role']:<12} {user.get('status', 'active'):<8}")
        
        print()
        print("💡 These users are stored in memory and will be lost when the server restarts")
        print("💡 To persist them to PostgreSQL, run: python sync_users_to_postgres.py")
    
except ImportError as e:
    print(f"❌ Could not import users_db: {e}")
    print("💡 Make sure you're running this from the correct directory")
except Exception as e:
    print(f"❌ Error accessing user data: {e}")

# Also show what's in PostgreSQL for comparison
print("\n" + "=" * 60)
print("👥 ADMIN USERS IN POSTGRESQL (for comparison)")
print("=" * 60)

try:
    import psycopg2
    
    # Database connection
    DB_CONFIG = {
        'host': 'localhost',
        'database': 'inventory_management', 
        'user': 'postgres',
        'password': 'inventory',
        'port': 5432
    }
    
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Run your admin query
    cursor.execute("""
        SELECT 
            ROW_NUMBER() OVER (ORDER BY 
                CASE role 
                    WHEN 'main_admin' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'subadmin' THEN 3
                    WHEN 'sub_admin' THEN 3
                    ELSE 4
                END, username) as sr_num,
            username,
            email, 
            UPPER(role) as role
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
    """)
    
    results = cursor.fetchall()
    
    if not results:
        print("❌ No admin users found in PostgreSQL")
        print("💡 This confirms the issue - users are only in memory, not in database")
    else:
        print(f"📊 Found {len(results)} admin user(s) in PostgreSQL:")
        print()
        print(f"{'Sr#':<4} {'Username':<15} {'Email':<25} {'Role':<12}")
        print("-" * 60)
        
        for row in results:
            sr_num, username, email, role = row
            print(f"{sr_num:<4} {username:<15} {email:<25} {role:<12}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Could not connect to PostgreSQL: {e}")
    print("💡 Make sure PostgreSQL is running")

print("\n🚀 SOLUTION:")
print("1. Your users are working fine in the frontend (stored in memory)")
print("2. To see them in PostgreSQL, run: python sync_users_to_postgres.py")
print("3. After syncing, your PostgreSQL query will show the admin users")
