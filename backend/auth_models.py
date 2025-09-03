"""
Authentication Models and Database Schema
Secure user management system with role-based access control
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import enum
import bcrypt
import jwt
import secrets
import os

# Import Base from database_manager to use the same declarative base
from database_manager import Base

class UserRole(enum.Enum):
    MAIN_ADMIN = "main_admin"
    SUB_ADMIN = "sub_admin"
    VIEWER = "viewer"

class UserStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"

class User(Base):
    """
    User model for authentication and authorization
    Secure user management with hashed passwords and role-based access
    """
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.SUB_ADMIN)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    
    # Security fields
    last_login = Column(DateTime, nullable=True)
    login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_password_change = Column(DateTime, default=datetime.utcnow)
    
    # Permissions and access
    permissions = Column(Text, nullable=True)  # JSON string of permissions
    session_timeout = Column(Integer, default=3600)  # Session timeout in seconds
    force_password_change = Column(Boolean, default=False)
    
    # Relationships
    created_users = relationship("User", backref="creator", remote_side=[id])
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    
    def set_password(self, password: str):
        """Hash and set password securely"""
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        self.last_password_change = datetime.utcnow()
        self.force_password_change = False
    
    def check_password(self, password: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def is_locked(self) -> bool:
        """Check if account is locked due to failed attempts"""
        if self.locked_until and self.locked_until > datetime.utcnow():
            return True
        return False
    
    def lock_account(self, duration_minutes: int = 30):
        """Lock account for specified duration"""
        self.locked_until = datetime.utcnow() + timedelta(minutes=duration_minutes)
        self.status = UserStatus.SUSPENDED
    
    def unlock_account(self):
        """Unlock account and reset login attempts"""
        self.locked_until = None
        self.login_attempts = 0
        if self.status == UserStatus.SUSPENDED:
            self.status = UserStatus.ACTIVE
    
    def increment_login_attempts(self):
        """Increment failed login attempts"""
        self.login_attempts += 1
        if self.login_attempts >= 5:  # Lock after 5 failed attempts
            self.lock_account()
    
    def reset_login_attempts(self):
        """Reset login attempts after successful login"""
        self.login_attempts = 0
        self.last_login = datetime.utcnow()
    
    def generate_reset_token(self) -> str:
        """Generate password reset token"""
        token = secrets.token_urlsafe(32)
        self.password_reset_token = token
        self.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        return token
    
    def verify_reset_token(self, token: str) -> bool:
        """Verify password reset token"""
        if (self.password_reset_token == token and 
            self.password_reset_expires and 
            self.password_reset_expires > datetime.utcnow()):
            return True
        return False
    
    def clear_reset_token(self):
        """Clear password reset token"""
        self.password_reset_token = None
        self.password_reset_expires = None
    
    def can_access_module(self, module: str) -> bool:
        """Check if user has permission to access a module"""
        if self.role == UserRole.MAIN_ADMIN:
            return True
        
        if self.permissions:
            import json
            try:
                perms = json.loads(self.permissions)
                return module in perms.get('modules', [])
            except:
                return False
        
        # Default permissions for sub-admin
        default_modules = ['products', 'students', 'orders', 'invoicing']
        return module in default_modules
    
    def to_dict(self):
        """Convert user to dictionary (excluding sensitive data)"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role.value,
            'status': self.status.value,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat(),
            'force_password_change': self.force_password_change,
            'permissions': self.permissions
        }

class UserSession(Base):
    """
    User session management for secure login tracking
    """
    __tablename__ = 'user_sessions'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    session_token = Column(String(255), unique=True, nullable=False)
    refresh_token = Column(String(255), unique=True, nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    last_activity = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationship
    user = relationship("User", back_populates="sessions")
    
    def is_expired(self) -> bool:
        """Check if session is expired"""
        return datetime.utcnow() > self.expires_at
    
    def extend_session(self, duration_seconds: int = 3600):
        """Extend session expiry"""
        self.expires_at = datetime.utcnow() + timedelta(seconds=duration_seconds)
        self.last_activity = datetime.utcnow()
    
    def invalidate(self):
        """Invalidate session"""
        self.is_active = False
    
    @staticmethod
    def generate_tokens():
        """Generate session and refresh tokens"""
        session_token = secrets.token_urlsafe(32)
        refresh_token = secrets.token_urlsafe(32)
        return session_token, refresh_token

class AuditLog(Base):
    """
    Audit logging for security and compliance
    """
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=True)
    resource_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    success = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="audit_logs")
    
    @staticmethod
    def log_action(user_id: int, action: str, resource: str = None, 
                  resource_id: str = None, details: str = None, 
                  ip_address: str = None, user_agent: str = None, 
                  success: bool = True):
        """Create audit log entry"""
        return AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success
        )

class SystemSettings(Base):
    """
    System-wide authentication settings
    """
    __tablename__ = 'system_settings'
    
    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(Text, nullable=True)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    @staticmethod
    def get_setting(key: str, default=None):
        """Get system setting value"""
        # This would be implemented with database session
        pass
    
    @staticmethod
    def set_setting(key: str, value: str, description: str = None):
        """Set system setting value"""
        # This would be implemented with database session
        pass

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', secrets.token_urlsafe(32))
JWT_ALGORITHM = 'HS256'
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.JWTError:
        return None

# Initial system setup
def create_main_admin(session, username: str = "admin", password: str = "admin123", 
                     email: str = "admin@college.edu", full_name: str = "System Administrator"):
    """
    Create the initial main admin user
    This should only be called during system setup
    """
    # Check if main admin already exists
    existing_admin = session.query(User).filter_by(role=UserRole.MAIN_ADMIN).first()
    if existing_admin:
        return existing_admin
    
    # Create main admin
    main_admin = User(
        username=username,
        email=email,
        full_name=full_name,
        role=UserRole.MAIN_ADMIN,
        status=UserStatus.ACTIVE,
        force_password_change=True  # Force password change on first login
    )
    main_admin.set_password(password)
    
    session.add(main_admin)
    session.commit()
    
    # Log the creation
    audit_log = AuditLog.log_action(
        user_id=main_admin.id,
        action="CREATE_MAIN_ADMIN",
        details="Initial main admin account created"
    )
    session.add(audit_log)
    session.commit()
    
    return main_admin

# Default permissions for different roles
DEFAULT_PERMISSIONS = {
    UserRole.MAIN_ADMIN: {
        "modules": ["dashboard", "products", "students", "orders", "invoicing", "reports", "tools", "settings", "users"],
        "actions": ["create", "read", "update", "delete", "export", "import", "admin"]
    },
    UserRole.SUB_ADMIN: {
        "modules": ["dashboard", "products", "students", "orders", "invoicing", "reports"],
        "actions": ["create", "read", "update", "delete", "export"]
    },
    UserRole.VIEWER: {
        "modules": ["dashboard", "products", "students", "orders", "invoicing", "reports"],
        "actions": ["read", "export"]
    }
}
