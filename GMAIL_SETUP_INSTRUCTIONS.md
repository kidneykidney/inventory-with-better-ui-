# Gmail Setup Instructions for Email Notifications

## 🚨 UPDATED: Gmail Setup Required

The email notification system needs proper Gmail authentication. Follow these steps:

### Step 1: Enable 2-Step Verification FIRST
1. Go to your Google Account: https://myaccount.google.com
2. Click on **Security** in the left sidebar
3. Look for **2-Step Verification** section
4. Click **2-Step Verification** and follow the setup process
5. **You MUST complete this step before App passwords will appear**

### Step 2: Find App Passwords (Only appears AFTER 2-Step is enabled)
1. Go back to Security settings
2. Look for **2-Step Verification** section
3. Click on **2-Step Verification**
4. Scroll down to find **App passwords**
5. If you don't see it, make sure 2-Step Verification is fully enabled

### Step 3: Generate App Password
1. Click "App passwords"
2. Select "Mail" from the dropdown
3. Select "Other (custom name)" and type "Inventory System"
4. Click "Generate"
5. **COPY THE 16-CHARACTER PASSWORD** (it will look like: abcd efgh ijkl mnop)

### Step 4: Update Configuration
1. Open the file: `backend/.env`
2. Replace `your-app-password` with the generated password:
   ```
   SENDER_PASSWORD=abcd efgh ijkl mnop
   ```
   (use the actual password you copied, including spaces)

## Alternative: Use Different Authentication

If 2-Step Verification is not available, we can use alternative methods:

### Option 1: Allow Less Secure Apps (Not Recommended)
1. Go to https://myaccount.google.com/lesssecureapps
2. Turn on "Allow less secure apps"
3. Use your regular Gmail password in SENDER_PASSWORD

### Option 2: Use Different Email Provider
Update `.env` file with:
```
SMTP_SERVER=smtp.outlook.com
SMTP_PORT=587
SENDER_EMAIL=your-outlook-email@outlook.com
SENDER_PASSWORD=your-outlook-password
```

### Step 5: Test the System
1. Run: `cd backend && python test_email.py`
2. If successful, emails will be sent automatically when orders become overdue

## Quick Links
- Google Account Security: https://myaccount.google.com/security
- 2-Step Verification Setup: https://myaccount.google.com/signinoptions/two-step-verification

## Current Status
- ✅ Email service code is working
- ✅ Database tables created
- ✅ Frontend integration complete
- ❌ Gmail App Password not configured

## Quick Test
After setting up the password, test by:
1. Going to Lending Management
2. Manually changing an order status to "Overdue"
3. Check for success/error alerts in the UI