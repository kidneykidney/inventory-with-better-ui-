"""
Quick Fix for Authentication Database Setup
This creates the auth tables and admin user directly
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
import json

def create_auth_tables_and_admin():
    """Create authentication tables and admin user"""
    
    # Database connection
    conn_params = {
        'host': 'localhost',
        'database': 'inventory_management',
        'user': 'postgres',
        'password': 'gugan@2022',
        'port': 5432
    }
    
    try:
        # Connect to database
        conn = psycopg2.connect(**conn_params)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("🔗 Connected to database successfully!")
        
        # Create users table
        print("📊 Creating users table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                role VARCHAR(20) NOT NULL DEFAULT 'viewer',
                status VARCHAR(20) NOT NULL DEFAULT 'active',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Users table created!")
        
        # Create user_sessions table
        print("📊 Creating user_sessions table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                access_token_jti VARCHAR(255) UNIQUE NOT NULL,
                refresh_token_jti VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                refresh_expires_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT true,
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ User sessions table created!")
        
        # Create audit_logs table
        print("📊 Creating audit_logs table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                action VARCHAR(100) NOT NULL,
                resource_type VARCHAR(50),
                resource_id VARCHAR(100),
                details JSONB,
                ip_address INET,
                user_agent TEXT,
                success BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Audit logs table created!")
        
        # Create system_settings table
        print("📊 Creating system_settings table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(100) UNIQUE NOT NULL,
                value TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ System settings table created!")
        
        # Check if admin user exists
        cursor.execute("SELECT id FROM users WHERE username = 'admin'")
        admin_exists = cursor.fetchone()
        
        if not admin_exists:
            print("👤 Creating admin user...")
            
            # Hash the password
            password = "College@2025"
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Insert admin user
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, full_name, role, status, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                'admin',
                'admin@college.edu', 
                password_hash,
                'System Administrator',
                'main_admin',
                'active',
                True
            ))
            
            print("✅ Admin user created successfully!")
            print("📋 Login Credentials:")
            print("   Username: admin")
            print("   Password: College@2025")
            print("   Email: admin@college.edu")
        else:
            print("ℹ️  Admin user already exists")
        
        # Insert default system settings
        print("⚙️  Setting up system settings...")
        settings = [
            ('system_name', 'College Inventory Management System', 'Name of the system'),
            ('max_failed_login_attempts', '5', 'Maximum failed login attempts'),
            ('session_timeout', '30', 'Session timeout in minutes')
        ]
        
        for key, value, description in settings:
            cursor.execute("""
                INSERT INTO system_settings (key, value, description)
                VALUES (%s, %s, %s)
                ON CONFLICT (key) DO NOTHING
            """, (key, value, description))
        
        print("✅ System settings configured!")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 Authentication system setup complete!")
        print("🔐 You can now login with:")
        print("   Username: admin")
        print("   Password: College@2025")
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔐 Setting up Authentication System...")
    print("=" * 50)
    
    success = create_auth_tables_and_admin()
    
    if success:
        print("\n✅ Setup completed successfully!")
        print("🌐 Now refresh your browser and try logging in")
    else:
        print("\n❌ Setup failed. Check the error messages above.")
