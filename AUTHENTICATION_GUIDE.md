# College Inventory Management System - Authentication Documentation

## 🔐 Complete Secure Authentication System

This document describes the comprehensive authentication system implemented for the College Inventory Management System, featuring enterprise-grade security, role-based access control, and Docker deployment.

## 🏗️ System Architecture

### Backend Components

#### 1. Authentication Models (`backend/auth_models.py`)
- **User Model**: Complete user management with secure password hashing
- **Role System**: Main Admin, Sub Admin, and Viewer roles with specific permissions
- **Session Management**: JWT-based secure session handling with refresh tokens
- **Audit Logging**: Complete activity tracking for security compliance
- **System Settings**: Configurable security parameters

#### 2. Authentication API (`backend/auth_api.py`)
- **Login/Logout**: Secure authentication with bcrypt password hashing
- **User Management**: CRUD operations for user accounts with role-based access
- **Session Security**: JWT token management with automatic refresh
- **Audit Trail**: Complete logging of all security-related actions
- **Password Policies**: Configurable password requirements and account lockout

#### 3. Database Integration (`backend/auth_schema.sql`)
- **PostgreSQL Tables**: Users, sessions, audit logs, and system settings
- **Security Indexes**: Optimized for authentication query performance
- **Default Admin**: Automatic creation of main admin on system initialization

### Frontend Components

#### 1. Login Interface (`src/components/LoginPage.jsx`)
- **Professional Design**: Modern Material-UI interface with animations
- **Security Features**: Secure form validation and error handling
- **System Initialization**: First-time setup wizard for main admin
- **Responsive Design**: Works on all device sizes

#### 2. User Management (`src/components/UserManagement.jsx`)
- **Admin Dashboard**: Complete user management interface
- **Role Assignment**: Easy role management for main admins
- **Audit Viewer**: Security log monitoring capabilities
- **Permission Controls**: Granular permission management

#### 3. App Integration (`src/App.jsx`)
- **Authentication State**: Global user authentication management
- **Protected Routes**: Role-based navigation protection
- **Secure Context**: JWT token management and automatic refresh

## 🔑 Security Features

### Password Security
- **Bcrypt Hashing**: Industry-standard password protection
- **Password Policies**: Configurable minimum length and complexity
- **Force Password Change**: Automatic password expiration
- **Account Lockout**: Protection against brute force attacks

### Session Security
- **JWT Tokens**: Secure, stateless authentication
- **Token Refresh**: Automatic session extension
- **Session Tracking**: Complete session monitoring
- **IP & User Agent**: Device tracking for security

### Role-Based Access Control
- **Main Admin**: Full system access and user management
- **Sub Admin**: Limited administrative capabilities
- **Viewer**: Read-only access to system features
- **Permission Matrix**: Granular feature access control

### Audit & Compliance
- **Complete Logging**: All user actions tracked
- **Security Events**: Login attempts, role changes, etc.
- **Compliance Ready**: Audit trail for security reviews
- **Real-time Monitoring**: Live security event tracking

## 🚀 Deployment Options

### Option 1: Local Development (start-quick.bat)
```bash
.\start-quick.bat
```
- **Virtual Environment**: Automatic Python environment setup
- **Dependency Installation**: Auto-install all Python and Node packages
- **Database Check**: PostgreSQL connection verification
- **Parallel Startup**: Backend and frontend in separate windows
- **Browser Launch**: Automatic opening at http://localhost:5173

### Option 2: Docker Deployment (start-docker.bat)
```bash
.\start-docker.bat
```
- **Containerized**: Complete system in Docker containers
- **Database Included**: PostgreSQL container with authentication schema
- **Production Ready**: Optimized for production deployment
- **Health Checks**: Automatic service health monitoring
- **Volume Persistence**: Data survives container restarts

## 🔧 Configuration

### Environment Variables
```bash
# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database Configuration
DATABASE_URL=postgresql://postgres:password123@localhost:5432/inventory_db

# CORS Configuration
CORS_ORIGINS=http://localhost:5173
```

### Default Credentials
```
Username: admin
Password: College@2025
Email: admin@college.edu
Role: main_admin
```

**⚠️ CRITICAL: Change the default password immediately after first login!**

## 📋 API Endpoints

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/change-password` - Password change
- `GET /api/auth/me` - Current user info
- `GET /api/auth/health` - Service health check

### User Management Endpoints (Admin Only)
- `POST /api/auth/users` - Create new user
- `GET /api/auth/users` - List all users
- `PUT /api/auth/users/{user_id}` - Update user
- `DELETE /api/auth/users/{user_id}` - Delete user
- `POST /api/auth/users/{user_id}/toggle-status` - Enable/disable user

### System Endpoints
- `POST /api/auth/initialize` - System initialization
- `GET /api/auth/audit-logs` - View audit logs
- `GET /api/auth/system-info` - System information

## 🎯 User Workflows

### 1. First Time Setup
1. Run `.\start-quick.bat` or `.\start-docker.bat`
2. Access http://localhost:5173
3. Login with default admin credentials
4. **Change default password immediately**
5. Configure system settings as needed

### 2. Adding Sub-Admins
1. Login as main admin
2. Navigate to User Management
3. Click "Add New User"
4. Fill in user details and assign "sub_admin" role
5. Share credentials with new user securely
6. New user must change password on first login

### 3. Regular Operations
1. Users login with their credentials
2. System automatically manages sessions
3. Role-based access controls what users can see
4. All actions are logged for audit purposes

## 🛡️ Security Best Practices

### For Administrators
1. **Change Default Password**: Immediately after installation
2. **Regular Password Updates**: Enforce password rotation
3. **Monitor Audit Logs**: Review security events regularly
4. **Principle of Least Privilege**: Give users minimum required access
5. **Regular Backups**: Backup user data and settings

### For Users
1. **Strong Passwords**: Use complex passwords
2. **Secure Logout**: Always logout when finished
3. **Report Issues**: Report suspicious activity immediately
4. **Browser Security**: Keep browsers updated

## 📚 Technical Documentation

### Database Schema
- **users**: User accounts and authentication data
- **user_sessions**: Active sessions and JWT tokens
- **audit_logs**: Security and activity logs
- **system_settings**: Configurable system parameters

### Frontend Architecture
- **React Components**: Modular authentication UI
- **Material-UI**: Professional design system
- **Context API**: Global authentication state
- **Protected Routes**: Role-based navigation

### Backend Architecture
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM with PostgreSQL
- **JWT Tokens**: Stateless authentication
- **Bcrypt**: Password hashing

## 🔍 Troubleshooting

### Common Issues

#### "Authentication failed"
- Check username/password combination
- Verify account is not locked
- Check if password needs to be changed

#### "Database connection error"
- Ensure PostgreSQL is running
- Verify database credentials
- Check if database exists

#### "Port already in use"
- Kill existing processes on ports 8000/5173
- Use `.\stop-system.bat` to clean shutdown

### Log Locations
- **Backend Logs**: Check terminal running main.py
- **Frontend Logs**: Browser console (F12)
- **Docker Logs**: `docker compose logs -f`
- **Audit Logs**: Available in User Management interface

## 📞 Support & Maintenance

### Regular Maintenance
1. **Monitor Audit Logs**: Weekly security review
2. **Update Dependencies**: Monthly package updates
3. **Database Backup**: Daily automated backups
4. **Performance Monitoring**: Resource usage tracking

### Security Updates
1. **Password Policy Review**: Quarterly assessment
2. **User Access Review**: Monthly access audit
3. **Session Monitoring**: Real-time session tracking
4. **Vulnerability Scanning**: Regular security scans

---

## 🎉 Success!

Your College Inventory Management System now includes:

✅ **Complete Authentication System**
✅ **Role-Based Access Control**
✅ **Secure Password Management**
✅ **Session Security**
✅ **Audit Logging**
✅ **User Management Interface**
✅ **Docker Deployment**
✅ **One-Click Startup**
✅ **Production-Ready Security**
✅ **Comprehensive Documentation**

The system is now ready for deployment to your college with enterprise-grade security features that protect user credentials and ensure proper access control throughout the application.

**🔐 Security First - Your data is protected!**
