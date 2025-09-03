import requests
import psycopg2
import json

def check_live_users():
    """Check users from your running server"""
    try:
        response = requests.get('http://localhost:8000/api/auth/users')
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ API Error: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return None

def check_db_users():
    """Check users in PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            host='localhost',
            database='inventory_management', 
            user='postgres',
            password='gugan@2022',
            port='5432'
        )
        cursor = conn.cursor()
        cursor.execute("SELECT username, email, role FROM users WHERE role LIKE '%admin%'")
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        return users
    except Exception as e:
        print(f"❌ Database Error: {e}")
        return None

def force_sync_user_to_db(user):
    """Force sync a user to database"""
    try:
        conn = psycopg2.connect(
            host='localhost',
            database='inventory_management',
            user='postgres', 
            password='gugan@2022',
            port='5432'
        )
        cursor = conn.cursor()
        
        # Delete existing user first
        cursor.execute("DELETE FROM users WHERE username = %s", (user['username'],))
        
        # Insert user
        cursor.execute("""
            INSERT INTO users (username, email, role, password_hash, full_name, created_at) 
            VALUES (%s, %s, %s, %s, %s, NOW())
        """, (
            user['username'],
            user['email'], 
            user['role'],
            'temp_hash_' + user['username'], # Temporary hash
            user.get('full_name', user['username'])
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Sync Error for {user['username']}: {e}")
        return False

print("🔍 Checking Live System vs Database...")
print("=" * 50)

# Check live users
live_users = check_live_users()
if live_users:
    print(f"📱 Live System Users ({len(live_users)}):")
    for user in live_users:
        print(f"   • {user['username']} ({user['email']}) - {user['role']}")
else:
    print("❌ Could not get live users")

print()

# Check database users
db_users = check_db_users()
if db_users:
    print(f"🗄️  Database Users ({len(db_users)}):")
    for username, email, role in db_users:
        print(f"   • {username} ({email}) - {role}")
else:
    print("❌ Could not get database users")

print()

# Sync if there's a mismatch
if live_users and db_users is not None:
    if len(live_users) != len(db_users):
        print("🔄 Syncing missing users to database...")
        
        # Get existing usernames in db
        db_usernames = [u[0] for u in db_users] if db_users else []
        
        synced_count = 0
        for user in live_users:
            if user['username'] not in db_usernames:
                print(f"🔄 Syncing {user['username']}...")
                if force_sync_user_to_db(user):
                    print(f"✅ Synced {user['username']}")
                    synced_count += 1
                else:
                    print(f"❌ Failed to sync {user['username']}")
        
        if synced_count > 0:
            print(f"\n🎉 Synced {synced_count} users!")
            
            # Test the query
            print("\n🧪 Testing your admin_users_query.sql...")
            conn = psycopg2.connect(
                host='localhost',
                database='inventory_management',
                user='postgres',
                password='gugan@2022', 
                port='5432'
            )
            cursor = conn.cursor()
            
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
                    username
            """)
            
            results = cursor.fetchall()
            print("🎯 FIXED admin_users_query.sql RESULTS:")
            print("=" * 65)
            print(f"{'Sr#':<4} {'Username':<15} {'Email':<25} {'Role':<15}")
            print("=" * 65)
            for row in results:
                print(f"{row[0]:<4} {row[1]:<15} {row[2]:<25} {row[3]:<15}")
            print("=" * 65)
            print(f"📊 Total admin users: {len(results)}")
            
            cursor.close()
            conn.close()
        else:
            print("✅ All users already synced!")
    else:
        print("✅ Live system and database are in sync!")
else:
    print("❌ Could not compare systems")
