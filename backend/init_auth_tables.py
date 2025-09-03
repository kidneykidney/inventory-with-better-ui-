"""
Initialize Authentication Tables
This script creates the authentication tables in the existing database
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from database_manager import engine, Base, get_db_session
from auth_models import User, UserSession, AuditLog, SystemSettings, create_main_admin

def create_auth_tables():
    """Create authentication tables"""
    try:
        print("Creating authentication tables...")
        Base.metadata.create_all(bind=engine)
        print("Authentication tables created successfully!")
        
        # Check if we need to create the main admin
        from database_manager import SessionLocal
        db = SessionLocal()
        try:
            user_count = db.query(User).count()
            if user_count == 0:
                print("Creating default admin user...")
                create_main_admin(
                    db,
                    username="admin",
                    password="College@2025",
                    email="admin@college.edu",
                    full_name="System Administrator"
                )
                print("Default admin user created successfully!")
                print("Username: admin")
                print("Password: College@2025")
                print("Email: admin@college.edu")
            else:
                print(f"Authentication system already has {user_count} users")
        finally:
            db.close()
            
        return True
    except Exception as e:
        print(f"Error creating authentication tables: {e}")
        return False

if __name__ == "__main__":
    success = create_auth_tables()
    if success:
        print("\n✅ Authentication system initialized successfully!")
        print("🔐 You can now use the login system")
    else:
        print("\n❌ Failed to initialize authentication system")
