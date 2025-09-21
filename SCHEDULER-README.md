# 📅 Automatic Overdue Notification System

## Overview
The inventory management system now includes an **automatic overdue notification system** that runs in the background to monitor lending orders and send email notifications when items become overdue.

## 🚀 Key Features

### ✅ Automatic Background Processing
- **Daily checks at 9:00 AM** - No manual intervention required
- **Startup checks** - Runs 2 minutes after server startup
- **Background scheduler** - Doesn't interfere with normal operations

### ✅ Smart Overdue Detection
- Automatically detects overdue lending orders
- Updates order status to "Overdue" in database
- Logs all overdue detection activities

### ✅ Email Notifications
- Sends professional email notifications to lenders
- Includes order details, due dates, and return instructions
- Configurable email templates and settings

### ✅ Admin Management
- Manual overdue checks via API endpoints
- Scheduler status monitoring
- Real-time logs and monitoring

## 🔧 Installation & Setup

### Option 1: Automatic Setup (Recommended)
```bash
# This installs everything including scheduler dependencies
npm run local
```

### Option 2: Manual Scheduler Setup
```bash
# Install just the scheduler dependencies
npm run setup-scheduler
# or
npm run install-scheduler
```

### Option 3: Direct Installation
```bash
cd backend
pip install apscheduler pytz
```

## 🎮 Usage Commands

### Start System with Scheduler
```bash
npm run local          # Complete system startup
npm run backend-with-scheduler  # Backend only with scheduler
```

### Scheduler Management
```bash
npm run scheduler-status    # Check if scheduler is running
npm run scheduler          # Manually trigger overdue check
```

### System Status
```bash
npm run local-status       # Check entire system status
```

## 🌐 API Endpoints

### Scheduler Status
```
GET http://localhost:8000/api/admin/scheduler/status
```
Returns current scheduler status and configuration.

### Manual Overdue Check
```
POST http://localhost:8000/api/admin/scheduler/manual-check
```
Triggers an immediate overdue check for testing purposes.

## 📋 Automatic Schedule

The system automatically runs overdue checks:
- **Daily at 9:00 AM** - Main scheduled check
- **2 minutes after startup** - Initial check when server starts
- **On-demand** - Via API endpoints or npm commands

## 🔍 How It Works

1. **Background Scheduler**: APScheduler runs continuously with the FastAPI server
2. **Database Monitoring**: Queries the database for orders past their due date
3. **Status Updates**: Automatically updates overdue orders in the database
4. **Email Notifications**: Sends professional emails to lenders about overdue items
5. **Logging**: Comprehensive logging for monitoring and debugging

## 📧 Email Configuration

The system uses the existing email service configuration:
- **SMTP Server**: Configured in environment variables
- **Email Templates**: Professional notification templates
- **University Branding**: Includes Sairam Engineering College branding

## 🛡️ Benefits

### For Users
- ✅ **No manual checking** - System handles everything automatically
- ✅ **Reliable notifications** - Never miss overdue items
- ✅ **Professional communication** - Automated professional emails

### For Administrators
- ✅ **Reduced workload** - No need to manually check for overdue items
- ✅ **Better compliance** - Automatic status updates and notifications
- ✅ **Audit trail** - Complete logging of all overdue processing

### For the System
- ✅ **Data integrity** - Automatic database updates
- ✅ **Performance** - Runs efficiently in background
- ✅ **Reliability** - Handles errors gracefully and logs issues

## 🚨 Troubleshooting

### Scheduler Not Starting
```bash
# Check if dependencies are installed
npm run setup-scheduler

# Check scheduler status
npm run scheduler-status
```

### Manual Testing
```bash
# Test overdue check manually
npm run scheduler

# Check server logs for scheduler messages
# Look for messages like "🚀 Overdue notification scheduler started"
```

### Dependencies Issues
```bash
# Reinstall scheduler dependencies
cd backend
pip install --upgrade apscheduler pytz
```

## 📊 Monitoring

The system provides comprehensive monitoring:
- **Startup logs**: Confirm scheduler initialization
- **Daily operation logs**: Track automatic checks
- **Error handling**: Graceful error handling with detailed logs
- **API status**: Real-time status via API endpoints

## 🎉 Success Indicators

When properly running, you'll see these log messages:
```
✅ Automatic overdue notification system is now active
📅 Daily checks scheduled for 9:00 AM
🚀 Overdue notification scheduler started successfully
```

The system is now fully integrated with your `npm run local` command and will start automatically with the rest of the inventory management system!