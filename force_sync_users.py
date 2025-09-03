import requests
import psycopg2
import hashlib
from datetime import datetime

def get_current_users_from_api():
    """Get current users from your running API"""
    try:
        response = requests.get("http://localhost:8000/api/auth/users")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ API Error: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ API connection failed: {e}")
        return []

def sync_all_users_to_database(users):
    """Sync all current users to PostgreSQL"""
    try:
        conn = psycopg2.connect(
            host='localhost',
            database='inventory_management',
            user='postgres',
            password='gugan@2022',
            port='5432'
        )
        cursor = conn.cursor()
        
        print("🗑️  Clearing old admin users from database...")
        cursor.execute("DELETE FROM users WHERE role LIKE '%admin%'")
        
        print(f"💾 Syncing {len(users)} users to database...")
        
        for user in users:
            # Create a simple password hash
            password_hash = hashlib.sha256("College@2025".encode()).hexdigest()
            
            cursor.execute("""
                INSERT INTO users (username, email, role, password_hash, full_name, created_at) 
                VALUES (%s, %s, %s, %s, %s, NOW())
            """, (
                user.get('username', user.get('id', 'unknown')),
                user['email'],
                user['role'],
                password_hash,
                user.get('full_name', user.get('username', 'Unknown'))
            ))
            
            print(f"✅ Synced: {user.get('username')} ({user['email']}) - {user['role']}")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"🎉 Successfully synced {len(users)} users to database!")
        return True
        
    except Exception as e:
        print(f"❌ Database sync failed: {e}")
        return False

def test_updated_query():
    """Test your admin query with updated data"""
    try:
        conn = psycopg2.connect(
            host='localhost',
            database='inventory_management',
            user='postgres',
            password='gugan@2022',
            port='5432'
        )
        cursor = conn.cursor()
        
        query = """
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
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        print('\n🎯 UPDATED admin_users_query.sql RESULTS:')
        print('=' * 70)
        print(f"{'Sr#':<4} {'Username':<15} {'Email Address':<30} {'Role':<15}")
        print('=' * 70)
        
        for row in results:
            print(f"{row[0]:<4} {row[1]:<15} {row[2]:<30} {row[3]:<15}")
        
        print('=' * 70)
        print(f'📊 Total admin users: {len(results)}')
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Query test failed: {e}")

if __name__ == "__main__":
    print("🔄 FORCE SYNC: Frontend Users → PostgreSQL Database")
    print("=" * 60)
    
    # Get current users from your running system
    print("📡 Getting current users from API...")
    current_users = get_current_users_from_api()
    
    if current_users:
        print(f"🔍 Found {len(current_users)} users in frontend:")
        for user in current_users:
            print(f"   • {user.get('username', user.get('full_name', 'Unknown'))} ({user['email']}) - {user['role']}")
        
        # Sync to database
        success = sync_all_users_to_database(current_users)
        
        if success:
            print("\n🧪 Testing updated query...")
            test_updated_query()
            
            print(f"\n✅ SUCCESS! Your admin_users_query.sql now shows current data!")
        else:
            print(f"\n❌ Sync failed!")
    else:
        print("❌ No users found in frontend API")
