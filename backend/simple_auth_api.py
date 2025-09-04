"""
Simple Authentication Test API
This creates basic auth endpoints that work without complex dependencies
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import hashlib
import psycopg2
# Removed bcrypt import for faster user creation

# Simple auth router
simple_auth_router = APIRouter(prefix="/api/auth", tags=["authentication"])

def get_db_connection():
    """Get database connection"""
    try:
        return psycopg2.connect(
            host="localhost",
            database="inventory_management",
            user="postgres",
            password="gugan@2022",  # Updated to correct password
            port="5432"
        )
    except Exception as e:
        print(f"Database connection failed: {e}")
        return None

def sync_user_to_database(user):
    """Sync user to PostgreSQL database - fixed for actual schema"""
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="inventory_management",
            user="postgres",
            password="gugan@2022",
            port="5432"
        )
        cursor = conn.cursor()
        
        # Create a simple password hash
        import hashlib
        simple_hash = hashlib.sha256(user["password"].encode()).hexdigest()
        
        # Check if user exists
        cursor.execute("SELECT 1 FROM users WHERE username = %s LIMIT 1", (user["username"],))
        exists = cursor.fetchone()
        
        if exists:
            # Update existing user - match exact schema
            cursor.execute("""
                UPDATE users 
                SET email = %s, 
                    password_hash = %s, 
                    full_name = %s, 
                    role = %s, 
                    status = %s,
                    is_active = %s,
                    updated_at = NOW()
                WHERE username = %s
            """, (
                user["email"], 
                simple_hash, 
                user.get("full_name", user["username"]), 
                user["role"], 
                user.get("status", "active"),
                True,  # is_active
                user["username"]
            ))
        else:
            # Insert new user - match exact schema
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
                user["username"],
                user["email"],
                simple_hash,
                user.get("full_name", user["username"]),
                user["role"],
                user.get("status", "active"),
                True  # is_active
            ))
        
        conn.commit()
        cursor.close()
        conn.close()
        print(f"✅ Successfully synced {user['username']} to database")
        return True
        
    except Exception as e:
        print(f"❌ Database sync failed for {user['username']}: {e}")
        import traceback
        traceback.print_exc()
        return False

# Hardcoded admin user for testing (password is plaintext for simplicity)
ADMIN_USER = {
    "id": 1,
    "username": "admin",
    "email": "admin@college.edu",
    "password": "College@2025",  # Plain text for now
    "full_name": "System Administrator",
    "role": "main_admin",
    "status": "active"
}

# Simple token generation (without JWT library for now)
def create_simple_token(user_id: int) -> str:
    """Create a simple token (not JWT, just for testing)"""
    data = f"{user_id}:{datetime.now().isoformat()}"
    return hashlib.sha256(data.encode()).hexdigest()

# In-memory active sessions (for testing)
active_sessions = {}

# In-memory users storage (for testing)
users_db = [ADMIN_USER.copy()]  # Start with admin user
next_user_id = 2

# Initialize database sync on startup
def initialize_database_sync():
    """Sync existing users to database on startup"""
    print("🔄 Initializing database sync...")
    for user in users_db:
        sync_success = sync_user_to_database(user)
        if sync_success:
            print(f"✅ Synced existing user: {user['username']}")
        else:
            print(f"⚠️ Failed to sync user: {user['username']}")

# Run initialization
initialize_database_sync()

class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: bool = False

class CreateUserRequest(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str = "user"
    force_password_change: bool = False

class User(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    status: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

@simple_auth_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "authentication", "timestamp": datetime.utcnow()}

@simple_auth_router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """Simple login endpoint"""
    
    # Find user in database
    user = None
    for db_user in users_db:
        if db_user["username"] == login_data.username:
            user = db_user
            break
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Check password (simple string comparison for now)
    if login_data.password != user["password"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Create simple token
    access_token = create_simple_token(user["id"])
    
    # Store session
    active_sessions[access_token] = {
        "user_id": user["id"],
        "username": user["username"],
        "created_at": datetime.now().isoformat()
    }
    
    # Create user response
    user_response = User(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        status=user["status"]
    )
    
    return LoginResponse(
        access_token=access_token,
        user=user_response
    )

@simple_auth_router.get("/me")
async def get_current_user():
    """Get current user info"""
    user = User(
        id=ADMIN_USER["id"],
        username=ADMIN_USER["username"],
        email=ADMIN_USER["email"],
        full_name=ADMIN_USER["full_name"],
        role=ADMIN_USER["role"],
        status=ADMIN_USER["status"]
    )
    return user

@simple_auth_router.post("/logout")
async def logout():
    """Logout endpoint"""
    return {"message": "Successfully logged out"}

@simple_auth_router.get("/users")
async def get_users():
    """Get all users from PostgreSQL database (not in-memory)"""
    try:
        # Connect to database and fetch ALL users
        conn = psycopg2.connect(
            host="localhost",
            database="inventory_management", 
            user="postgres",
            password="gugan@2022"
        )
        cursor = conn.cursor()
        
        # Fetch all users from database with proper ordering
        cursor.execute("""
            SELECT id, username, email, full_name, role, status, 
                   is_active, created_at, updated_at
            FROM users 
            ORDER BY 
                CASE role 
                    WHEN 'main_admin' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'sub_admin' THEN 3
                    ELSE 4
                END, username
        """)
        
        db_users = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Convert database results to API format
        users = []
        for db_user in db_users:
            users.append({
                "id": db_user[0],
                "username": db_user[1],
                "email": db_user[2] or f"{db_user[1]}@college.edu",
                "full_name": db_user[3] or db_user[1].title(),
                "role": db_user[4],
                "status": db_user[5] or "active",
                "is_active": db_user[6],
                "created_at": db_user[7].isoformat() if db_user[7] else "2025-01-01T00:00:00Z",
                "last_login": db_user[8].isoformat() if db_user[8] else "2025-09-02T21:44:00Z"
            })
        
        print(f"📊 Returning {len(users)} users from database")
        return users
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        import traceback
        traceback.print_exc()
        
        # Fallback to in-memory users if database fails
        users = []
        for user in users_db:
            users.append({
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "full_name": user["full_name"],
                "role": user["role"],
                "status": user["status"],
                "created_at": "2025-01-01T00:00:00Z",
                "last_login": "2025-09-02T21:44:00Z"
            })
        
        print(f"⚠️  Using fallback: {len(users)} in-memory users")
        return users

@simple_auth_router.post("/users")
async def create_user(user_data: CreateUserRequest):
    """Create a new user"""
    global next_user_id
    
    # Check if username already exists
    for existing_user in users_db:
        if existing_user["username"] == user_data.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        if existing_user["email"] == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
    
    # Create new user
    new_user = {
        "id": next_user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password": user_data.password,  # In production, this should be hashed
        "full_name": user_data.full_name,
        "role": user_data.role,
        "status": "active",
        "force_password_change": user_data.force_password_change,
        "created_at": datetime.now().isoformat()
    }
    
    # Add to in-memory storage first (fast)
    users_db.append(new_user)
    next_user_id += 1
    
    # Return response immediately (don't wait for database sync)
    response = {
        "id": new_user["id"],
        "username": new_user["username"],
        "email": new_user["email"],
        "full_name": new_user["full_name"],
        "role": new_user["role"],
        "status": new_user["status"],
        "created_at": new_user["created_at"]
    }
    
    # 🚀 ASYNC: Sync to database in background (non-blocking)
    import threading
    def background_sync():
        sync_success = sync_user_to_database(new_user)
        if sync_success:
            print(f"✅ User {new_user['username']} synced to database")
        else:
            print(f"⚠️  Database sync failed for {new_user['username']}")
    
    # Start background sync (doesn't block response)
    threading.Thread(target=background_sync, daemon=True).start()
    
    return response

@simple_auth_router.put("/users/{user_id}")
async def update_user(user_id: int, user_data: dict):
    """Update user by ID"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update user fields
        update_fields = []
        values = []
        
        if 'full_name' in user_data:
            update_fields.append("full_name = %s")
            values.append(user_data['full_name'])
        
        if 'email' in user_data:
            update_fields.append("email = %s")
            values.append(user_data['email'])
        
        if 'role' in user_data:
            update_fields.append("role = %s")
            values.append(user_data['role'])
        
        if update_fields:
            values.append(user_id)
            query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(query, values)
            conn.commit()
        
        # Get updated user
        cursor.execute("""
            SELECT id, username, email, full_name, role, status, created_at, last_login
            FROM users WHERE id = %s
        """, (user_id,))
        
        updated_user = cursor.fetchone()
        if updated_user:
            return {
                "id": updated_user[0],
                "username": updated_user[1],
                "email": updated_user[2],
                "full_name": updated_user[3],
                "role": updated_user[4],
                "status": updated_user[5],
                "created_at": updated_user[6].isoformat() if updated_user[6] else None,
                "last_login": updated_user[7].isoformat() if updated_user[7] else None
            }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")
    finally:
        conn.close()

@simple_auth_router.delete("/users/{user_id}")
async def delete_user(user_id: int):
    """Delete user by ID"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT username FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Delete user
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": f"User {user[0]} deleted successfully"}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
    finally:
        conn.close()

@simple_auth_router.get("/audit-logs")
async def get_audit_logs(limit: int = 50):
    """Get audit logs (mock implementation)"""
    # For now, return mock audit logs since the full audit system isn't implemented
    mock_logs = [
        {
            "id": 1,
            "action": "User Login",
            "resource": "Authentication System",
            "details": "Successful login attempt",
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "ip_address": "192.168.1.100",
            "user_id": 1
        },
        {
            "id": 2,
            "action": "User Management",
            "resource": "User Database",
            "details": "User list accessed",
            "success": True,
            "timestamp": (datetime.now() - timedelta(minutes=30)).isoformat(),
            "ip_address": "192.168.1.100",
            "user_id": 1
        }
    ]
    return mock_logs

# Export the router
router = simple_auth_router
