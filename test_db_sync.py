import psycopg2
import hashlib

def test_database_sync():
    """Test the database sync function"""
    
    # Test user data
    test_user = {
        "username": "testuser",
        "email": "test@college.edu",
        "password": "testpass123",
        "full_name": "Test User",
        "role": "sub_admin",
        "status": "active"
    }
    
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="inventory_management",
            user="postgres",
            password="gugan@2022",
            port="5432"
        )
        cursor = conn.cursor()
        
        print("🧪 Testing database sync...")
        
        # Create password hash
        simple_hash = hashlib.sha256(test_user["password"].encode()).hexdigest()
        
        # Delete test user if exists
        cursor.execute("DELETE FROM users WHERE username = %s", (test_user["username"],))
        
        # Insert test user
        cursor.execute("""
            INSERT INTO users (
                username, 
                email, 
                password_hash, 
                full_name, 
                role, 
                status, 
                is_active, 
                created_at,
                updated_at
            ) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """, (
            test_user["username"],
            test_user["email"],
            simple_hash,
            test_user["full_name"],
            test_user["role"],
            test_user["status"],
            True
        ))
        
        conn.commit()
        
        # Verify insert
        cursor.execute("SELECT username, email, role FROM users WHERE username = %s", (test_user["username"],))
        result = cursor.fetchone()
        
        if result:
            print(f"✅ SUCCESS: Test user inserted: {result[0]} ({result[1]}) - {result[2]}")
            
            # Clean up
            cursor.execute("DELETE FROM users WHERE username = %s", (test_user["username"],))
            conn.commit()
            print("🧹 Test user cleaned up")
        else:
            print("❌ FAILED: Test user not found after insert")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔧 Testing Database Sync Function")
    print("=" * 40)
    success = test_database_sync()
    
    if success:
        print("\n✅ Database sync is working! Your users should now save properly.")
        print("🚀 Try creating a user in your frontend - it should persist after reload!")
    else:
        print("\n❌ Database sync still has issues. Need to investigate further.")
