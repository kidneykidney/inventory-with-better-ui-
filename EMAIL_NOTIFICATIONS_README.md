# Email Notification System

## Overview
The inventory management system now includes automated email notifications for overdue equipment returns. When an order becomes overdue, the system automatically:

1. **Updates the order status** to "overdue"
2. **Sends a warning email** to the student with detailed information
3. **Sends an admin notification** to the administrator with student details and recommended actions

## Setup Instructions

### 1. Email Service Configuration

Create a `.env` file in the `backend` directory with your email settings:

```bash
# Email Service Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password
ADMIN_EMAIL=admin@university.edu
UNIVERSITY_NAME=University Name
```

### 2. Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Use the App Password** in the `SENDER_PASSWORD` field
4. **Update email addresses** with your actual Gmail and admin email

### 3. Other Email Providers

**Outlook/Hotmail:**
```bash
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
```

**Yahoo:**
```bash
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
```

## Features

### Student Warning Email
- **Professional design** with university branding
- **Detailed order information** including items, values, and dates
- **Clear action items** and return instructions
- **Contact information** for assistance
- **Days overdue calculation** 

### Admin Notification Email
- **Complete student details** including contact information
- **Order summary** with overdue duration
- **Recommended actions** checklist
- **Total value at risk** calculation
- **Professional formatting** for record keeping

### Database Tracking
- **Email log table** tracks all sent notifications
- **Success/failure status** for both student and admin emails
- **Error logging** for troubleshooting
- **Timestamp tracking** for audit trails

## How It Works

### Automatic Detection
1. **Periodic checks** when users access the Lending Management page
2. **Date comparison** against expected return dates
3. **Status updates** for overdue orders
4. **Email triggers** for newly overdue items

### Manual Triggers
Administrators can manually send overdue notifications:
```bash
POST /api/orders/{order_id}/send-overdue-notification
```

### Email Templates
The system includes rich HTML templates with:
- **Responsive design** for mobile devices
- **Professional styling** with university colors
- **Clear information hierarchy** 
- **Actionable instructions**
- **Branded headers and footers**

## Testing

Run the test script to verify email functionality:

```bash
cd backend
python test_email.py
```

This will:
- Check email configuration
- Send test notifications
- Report success/failure status
- Provide troubleshooting information

## Security Features

- **App passwords** instead of main account passwords
- **TLS encryption** for email transmission
- **Error handling** to prevent crashes
- **Logging** for security monitoring

## Troubleshooting

### Common Issues

**"Authentication failed"**
- Verify app password is correct
- Ensure 2-factor authentication is enabled
- Check email address format

**"Connection refused"**
- Verify SMTP server and port
- Check firewall settings
- Confirm internet connectivity

**"Email not received"**
- Check spam/junk folders
- Verify recipient email addresses
- Review email logs in database

### Debug Mode
Enable detailed logging by setting environment variable:
```bash
export PYTHONPATH=backend
export EMAIL_DEBUG=true
```

## Database Schema

```sql
CREATE TABLE email_notifications (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    student_email VARCHAR(255),
    admin_email VARCHAR(255),
    student_sent BOOLEAN DEFAULT FALSE,
    admin_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    errors TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Configuration Options

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_SERVER` | Email server address | `smtp.gmail.com` |
| `SMTP_PORT` | Server port | `587` |
| `SENDER_EMAIL` | System email address | `system@university.edu` |
| `SENDER_PASSWORD` | Email password/app password | `generated-app-password` |
| `ADMIN_EMAIL` | Administrator email | `admin@university.edu` |
| `UNIVERSITY_NAME` | Institution name | `University Name` |

## Future Enhancements

- **Email scheduling** for reminder sequences
- **Email templates customization** through admin interface
- **Bulk notification processing** for performance
- **Integration with SMS** notifications
- **Student response tracking** and acknowledgments