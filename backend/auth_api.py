"""
Authentication API
Secure login, logout, user management with role-based access control
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import json
import secrets
import logging

from database_manager import get_db_session
from auth_models import (
    User, UserRole, UserStatus, UserSession, AuditLog, SystemSettings,
    create_access_token, create_refresh_token, verify_token,
    create_main_admin, DEFAULT_PERMISSIONS
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer()

# Health check endpoint for Docker
@router.get("/health")
async def health_check():
    """Health check endpoint for authentication service"""
    return {"status": "healthy", "service": "authentication", "timestamp": datetime.utcnow()}

# Pydantic models for request/response
class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: bool = False

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict
    expires_in: int

class CreateUserRequest(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    role: str = "sub_admin"
    permissions: Optional[Dict[str, List[str]]] = None
    force_password_change: bool = True

    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if not v.isalnum():
            raise ValueError('Username must contain only letters and numbers')
        return v.lower()

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    status: Optional[str] = None
    permissions: Optional[Dict[str, List[str]]] = None
    force_password_change: Optional[bool] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
    confirm_password: str

# Helper functions
def get_client_ip(request: Request) -> str:
    """Extract client IP address"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host

def get_user_agent(request: Request) -> str:
    """Extract user agent"""
    return request.headers.get("User-Agent", "Unknown")

def log_action(db: Session, user_id: Optional[int], action: str, 
               request: Request, resource: str = None, resource_id: str = None,
               details: str = None, success: bool = True):
    """Log user action for audit trail"""
    audit_log = AuditLog.log_action(
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=resource_id,
        details=details,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        success=success
    )
    db.add(audit_log)
    db.commit()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db_session)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is not active"
        )
    
    if user.is_locked():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is locked"
        )
    
    return user

async def require_main_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require main admin role"""
    if current_user.role != UserRole.MAIN_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Main admin access required"
        )
    return current_user

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role (main or sub)"""
    if current_user.role not in [UserRole.MAIN_ADMIN, UserRole.SUB_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# Authentication endpoints
@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    response: Response,
    login_data: LoginRequest,
    db: Session = Depends(get_db_session)
):
    """
    User login with secure authentication
    """
    try:
        # Find user by username or email
        user = db.query(User).filter(
            or_(User.username == login_data.username.lower(),
                User.email == login_data.username.lower())
        ).first()
        
        if not user:
            log_action(db, None, "LOGIN_FAILED", request, 
                      details=f"User not found: {login_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Check if account is locked
        if user.is_locked():
            log_action(db, user.id, "LOGIN_BLOCKED", request, 
                      details="Account locked")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is locked. Please try again later."
            )
        
        # Check if account is active
        if user.status != UserStatus.ACTIVE:
            log_action(db, user.id, "LOGIN_BLOCKED", request, 
                      details=f"Account status: {user.status.value}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is not active"
            )
        
        # Verify password
        if not user.check_password(login_data.password):
            user.increment_login_attempts()
            db.commit()
            log_action(db, user.id, "LOGIN_FAILED", request, 
                      details="Invalid password")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Reset login attempts on successful authentication
        user.reset_login_attempts()
        
        # Create tokens
        token_data = {"sub": str(user.id), "username": user.username, "role": user.role.value}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        # Create session
        session_token, _ = UserSession.generate_tokens()
        expires_at = datetime.utcnow() + timedelta(
            seconds=user.session_timeout if login_data.remember_me else 3600
        )
        
        user_session = UserSession(
            user_id=user.id,
            session_token=session_token,
            refresh_token=refresh_token,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
            expires_at=expires_at
        )
        
        db.add(user_session)
        db.commit()
        
        # Set secure HTTP-only cookie for refresh token
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            max_age=7*24*3600 if login_data.remember_me else 3600,
            httponly=True,
            secure=True,
            samesite="strict"
        )
        
        log_action(db, user.id, "LOGIN_SUCCESS", request)
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user.to_dict(),
            expires_in=user.session_timeout if login_data.remember_me else 3600
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        log_action(db, None, "LOGIN_ERROR", request, 
                  details=str(e), success=False)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    User logout with session cleanup
    """
    try:
        # Get authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = verify_token(token)
            
            if payload:
                # Invalidate all user sessions
                db.query(UserSession).filter(
                    UserSession.user_id == current_user.id,
                    UserSession.is_active == True
                ).update({"is_active": False})
                
                # Clear refresh token cookie
                response.delete_cookie("refresh_token")
                
                db.commit()
                
                log_action(db, current_user.id, "LOGOUT_SUCCESS", request)
                
                return {"message": "Successfully logged out"}
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token"
        )
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

@router.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db_session)
):
    """
    Refresh access token using refresh token
    """
    try:
        # Get refresh token from cookie
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not found"
            )
        
        # Verify refresh token
        payload = verify_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = int(payload.get("sub"))
        
        # Check if session exists and is valid
        session = db.query(UserSession).filter(
            UserSession.refresh_token == refresh_token,
            UserSession.user_id == user_id,
            UserSession.is_active == True
        ).first()
        
        if not session or session.is_expired():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired"
            )
        
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.status != UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new access token
        token_data = {"sub": str(user.id), "username": user.username, "role": user.role.value}
        new_access_token = create_access_token(token_data)
        
        # Extend session
        session.extend_session(user.session_timeout)
        db.commit()
        
        log_action(db, user.id, "TOKEN_REFRESH", request)
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": 3600
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user information
    """
    return current_user.to_dict()

@router.post("/change-password")
async def change_password(
    request: Request,
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Change user password
    """
    try:
        # Verify current password
        if not current_user.check_password(password_data.current_password):
            log_action(db, current_user.id, "PASSWORD_CHANGE_FAILED", request,
                      details="Invalid current password")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Set new password
        current_user.set_password(password_data.new_password)
        db.commit()
        
        # Invalidate all other sessions
        db.query(UserSession).filter(
            UserSession.user_id == current_user.id,
            UserSession.is_active == True
        ).update({"is_active": False})
        db.commit()
        
        log_action(db, current_user.id, "PASSWORD_CHANGED", request)
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password change error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )

# User management endpoints (Main Admin only)
@router.post("/users", dependencies=[Depends(require_main_admin)])
async def create_user(
    request: Request,
    user_data: CreateUserRequest,
    current_user: User = Depends(require_main_admin),
    db: Session = Depends(get_db_session)
):
    """
    Create new user (Main Admin only)
    """
    try:
        # Check if username or email already exists
        existing_user = db.query(User).filter(
            or_(User.username == user_data.username.lower(),
                User.email == user_data.email.lower())
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already exists"
            )
        
        # Validate role
        try:
            role = UserRole(user_data.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
            )
        
        # Only main admin can create other main admins
        if role == UserRole.MAIN_ADMIN and current_user.role != UserRole.MAIN_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only main admin can create main admin accounts"
            )
        
        # Create user
        new_user = User(
            username=user_data.username.lower(),
            email=user_data.email.lower(),
            full_name=user_data.full_name,
            role=role,
            status=UserStatus.ACTIVE,
            created_by=current_user.id,
            force_password_change=user_data.force_password_change
        )
        
        new_user.set_password(user_data.password)
        
        # Set permissions
        if user_data.permissions:
            new_user.permissions = json.dumps(user_data.permissions)
        else:
            # Use default permissions for role
            new_user.permissions = json.dumps(DEFAULT_PERMISSIONS.get(role, {}))
        
        db.add(new_user)
        db.commit()
        
        log_action(db, current_user.id, "USER_CREATED", request,
                  resource="user", resource_id=str(new_user.id),
                  details=f"Created user: {new_user.username}")
        
        return new_user.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User creation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User creation failed"
        )

@router.get("/users", dependencies=[Depends(require_main_admin)])
async def list_users(
    current_user: User = Depends(require_main_admin),
    db: Session = Depends(get_db_session),
    skip: int = 0,
    limit: int = 100
):
    """
    List all users (Main Admin only)
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return [user.to_dict() for user in users]

@router.put("/users/{user_id}", dependencies=[Depends(require_main_admin)])
async def update_user(
    user_id: int,
    request: Request,
    user_data: UpdateUserRequest,
    current_user: User = Depends(require_main_admin),
    db: Session = Depends(get_db_session)
):
    """
    Update user (Main Admin only)
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update fields
        if user_data.full_name is not None:
            user.full_name = user_data.full_name
        
        if user_data.email is not None:
            # Check if email is already taken
            existing = db.query(User).filter(
                User.email == user_data.email.lower(),
                User.id != user_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already exists"
                )
            user.email = user_data.email.lower()
        
        if user_data.role is not None:
            try:
                new_role = UserRole(user_data.role)
                user.role = new_role
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid role"
                )
        
        if user_data.status is not None:
            try:
                user.status = UserStatus(user_data.status)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid status"
                )
        
        if user_data.permissions is not None:
            user.permissions = json.dumps(user_data.permissions)
        
        if user_data.force_password_change is not None:
            user.force_password_change = user_data.force_password_change
        
        user.updated_at = datetime.utcnow()
        db.commit()
        
        log_action(db, current_user.id, "USER_UPDATED", request,
                  resource="user", resource_id=str(user_id),
                  details=f"Updated user: {user.username}")
        
        return user.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User update failed"
        )

@router.delete("/users/{user_id}", dependencies=[Depends(require_main_admin)])
async def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_main_admin),
    db: Session = Depends(get_db_session)
):
    """
    Delete user (Main Admin only)
    """
    try:
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Soft delete - just deactivate
        user.status = UserStatus.INACTIVE
        user.updated_at = datetime.utcnow()
        
        # Invalidate all sessions
        db.query(UserSession).filter(
            UserSession.user_id == user_id
        ).update({"is_active": False})
        
        db.commit()
        
        log_action(db, current_user.id, "USER_DELETED", request,
                  resource="user", resource_id=str(user_id),
                  details=f"Deleted user: {user.username}")
        
        return {"message": "User deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User deletion error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User deletion failed"
        )

# System initialization endpoint
@router.post("/init-system")
async def initialize_system(
    request: Request,
    db: Session = Depends(get_db_session)
):
    """
    Initialize system with main admin (only if no users exist)
    """
    try:
        # Check if any users exist
        user_count = db.query(User).count()
        if user_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="System already initialized"
            )
        
        # Create main admin
        main_admin = create_main_admin(
            db, 
            username="admin",
            password="College@2025",  # Strong default password
            email="admin@college.edu",
            full_name="System Administrator"
        )
        
        log_action(db, main_admin.id, "SYSTEM_INITIALIZED", request,
                  details="System initialized with main admin")
        
        return {
            "message": "System initialized successfully",
            "admin_username": "admin",
            "admin_email": "admin@college.edu",
            "default_password": "College@2025",
            "note": "Please change the default password immediately"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"System initialization error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="System initialization failed"
        )

# Audit log endpoints
@router.get("/audit-logs", dependencies=[Depends(require_main_admin)])
async def get_audit_logs(
    current_user: User = Depends(require_main_admin),
    db: Session = Depends(get_db_session),
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    action: Optional[str] = None
):
    """
    Get audit logs (Main Admin only)
    """
    query = db.query(AuditLog)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    
    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    return [{
        "id": log.id,
        "user_id": log.user_id,
        "action": log.action,
        "resource": log.resource,
        "resource_id": log.resource_id,
        "details": log.details,
        "ip_address": log.ip_address,
        "success": log.success,
        "timestamp": log.timestamp.isoformat()
    } for log in logs]
