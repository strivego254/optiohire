# Fix Email Reader Issues - Step-by-Step Guide

This guide will help you fix the email processing issues on your server where applicants are not being analyzed.

## 🎯 What We're Fixing

The email reader (which processes applicant emails and analyzes CVs) may not be running on your server due to:
1. Missing or incorrect environment variables
2. Email reader disabled via `ENABLE_EMAIL_READER=false`
3. Backend not restarted after code updates
4. IMAP connection issues

## 📋 Prerequisites

- SSH access to your server (IP: 134.122.1.7)
- Access to your backend `.env` file
- PM2 installed on the server

---

## 🚀 Quick Fix (Automated Script)

**Option 1: Run the automated fix script**

```bash
# On your server
cd /opt/optiohire  # or ~/optiohire (wherever your app is)
chmod +x deploy/fix-email-reader.sh
./deploy/fix-email-reader.sh
```

This script will:
- ✅ Check all required environment variables
- ✅ Rebuild the backend with latest fixes
- ✅ Restart the backend
- ✅ Verify email reader status
- ✅ Show diagnostic information

---

## 📝 Manual Fix (Step-by-Step)

If you prefer to do it manually or the script doesn't work:

### Step 1: Connect to Your Server

```bash
ssh root@134.122.1.7
# or
ssh your-user@134.122.1.7
```

### Step 2: Navigate to Your App Directory

```bash
# Try one of these paths:
cd /opt/optiohire
# OR
cd ~/optiohire
# OR
cd /home/optiohire/optiohire
```

### Step 3: Check Environment Variables

```bash
cd backend
nano .env  # or use vi, vim, or your preferred editor
```

**Required IMAP variables** (must be present and not empty):

```env
# IMAP Configuration (for reading emails)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=hirebitapplications@gmail.com
IMAP_PASS=your_app_specific_password_here
IMAP_SECURE=true
IMAP_POLL_MS=10000

# IMPORTANT: Make sure this is NOT set to 'false'
# ENABLE_EMAIL_READER=false  <-- Remove this line or comment it out
```

**Critical checks:**
1. ✅ `IMAP_HOST` must be set (usually `imap.gmail.com`)
2. ✅ `IMAP_USER` must be your Gmail address
3. ✅ `IMAP_PASS` must be a Gmail App Password (NOT your regular password)
4. ✅ `ENABLE_EMAIL_READER` should NOT be `false` (remove or comment out if present)

**To get a Gmail App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and your device
3. Generate the 16-character password
4. Copy it to `IMAP_PASS` in your `.env` file

### Step 4: Rebuild the Backend

```bash
cd backend

# Install dependencies (if needed)
npm install --production=false

# Build TypeScript to JavaScript
npm run build

# Verify build succeeded
ls -la dist/server.js
```

You should see `dist/server.js` exists. If not, check for build errors.

### Step 5: Restart the Backend

```bash
# Check current PM2 processes
pm2 status

# Find your backend process name (usually "optiohire-backend" or "backend")
# Then restart it with updated environment:
pm2 restart optiohire-backend --update-env

# OR if using ecosystem.config.js:
cd ..  # Go back to project root
pm2 restart deploy/ecosystem.config.js --update-env

# Save PM2 configuration
pm2 save
```

### Step 6: Verify Email Reader Status

Wait 5-10 seconds for the backend to start, then check:

```bash
# Check health endpoint
curl http://localhost:3001/health/email-reader
```

**Expected response (if working):**
```json
{
  "status": "ok",
  "emailReader": {
    "enabled": true,
    "running": true,
    "disabledReason": null,
    "lastProcessedAt": null,
    "lastError": null
  },
  "timestamp": "2025-12-17T..."
}
```

**If `enabled: false` or `running: false`:**
- Check the `disabledReason` field for the cause
- Review PM2 logs (see Step 7)

### Step 7: Check PM2 Logs

```bash
# View recent logs
pm2 logs optiohire-backend --lines 50

# Or view all logs
pm2 logs
```

**Look for:**
- ✅ `IMAP email reader connected to imap.gmail.com:993` (success)
- ❌ `IMAP credentials not configured` (missing env vars)
- ❌ `Email reader is already running` (may need restart)
- ❌ `Failed to start email reader` (check error details)

### Step 8: Test Email Processing

1. **Send a test application email** to `hirebitapplications@gmail.com` with:
   - Subject: `SOFTWARE DEVELOPER AT Maverick - Test Application`
   - Attach a PDF or DOCX resume

2. **Wait 10-30 seconds** (polling interval is 10 seconds)

3. **Check if it was processed:**
   ```bash
   # Check PM2 logs for processing activity
   pm2 logs optiohire-backend --lines 20
   
   # Look for messages like:
   # "Email subject matches job posting: ..."
   # "Processing email from ..."
   # "CV extracted and saved: ..."
   ```

4. **Check the dashboard** - the applicant should appear with analysis

---

## 🔍 Troubleshooting

### Issue: Email reader shows `enabled: false`

**Solution:**
```bash
cd backend
nano .env
# Remove or comment out: ENABLE_EMAIL_READER=false
# Save and restart: pm2 restart optiohire-backend --update-env
```

### Issue: Email reader shows `running: false` with `disabledReason: "IMAP credentials not configured"`

**Solution:**
1. Check that all IMAP variables are set in `.env`
2. Verify `IMAP_PASS` is a Gmail App Password (not regular password)
3. Restart backend: `pm2 restart optiohire-backend --update-env`

### Issue: IMAP connection fails

**Possible causes:**
- Wrong `IMAP_PASS` (must be App Password, not regular password)
- Gmail account has 2FA disabled (App Passwords require 2FA)
- Network/firewall blocking IMAP port 993

**Solution:**
1. Verify App Password at https://myaccount.google.com/apppasswords
2. Ensure 2FA is enabled on Gmail account
3. Test IMAP connection manually:
   ```bash
   # Install mailutils for testing
   sudo apt-get install mailutils
   # Test connection (will prompt for password)
   ```

### Issue: Backend won't start

**Check:**
```bash
# View error logs
pm2 logs optiohire-backend --err --lines 50

# Check if port 3001 is in use
lsof -i :3001

# Check if dist/server.js exists
ls -la backend/dist/server.js
```

### Issue: Emails are received but not processed

**Check:**
1. **Subject line must match job title exactly:**
   - Job title in database: `SOFTWARE DEVELOPER AT Maverick`
   - Email subject must contain: `SOFTWARE DEVELOPER AT Maverick`
   - Case-insensitive matching is used

2. **Check PM2 logs for processing messages:**
   ```bash
   pm2 logs optiohire-backend | grep -i "email\|applicant\|cv"
   ```

3. **Verify job posting exists and is ACTIVE:**
   - Check dashboard that job shows as "ACTIVE"
   - Job title in database must match email subject

---

## ✅ Verification Checklist

After completing the fix, verify:

- [ ] `curl http://localhost:3001/health/email-reader` shows `enabled: true` and `running: true`
- [ ] PM2 logs show: `IMAP email reader connected to imap.gmail.com:993`
- [ ] No errors in PM2 logs related to IMAP or email reader
- [ ] Test email with matching subject is processed within 30 seconds
- [ ] Applicant appears in dashboard with analysis

---

## 📞 Still Having Issues?

If the email reader is still not working after following these steps:

1. **Check PM2 logs for detailed errors:**
   ```bash
   pm2 logs optiohire-backend --lines 100
   ```

2. **Verify environment variables are loaded:**
   ```bash
   # The backend should log env vars on startup (masked)
   pm2 logs optiohire-backend | grep -i "imap\|email"
   ```

3. **Test IMAP connection manually:**
   - Use an email client or IMAP tool to verify credentials work

4. **Check database connection:**
   ```bash
   curl http://localhost:3001/health/db
   ```

5. **Review the new health endpoint:**
   ```bash
   curl http://localhost:3001/health/email-reader | python3 -m json.tool
   ```

---

## 🎉 Success Indicators

When everything is working, you should see:

1. **Health endpoint:**
   ```json
   {
     "emailReader": {
       "enabled": true,
       "running": true
     }
   }
   ```

2. **PM2 logs show:**
   ```
   [INFO] IMAP email reader connected to imap.gmail.com:993
   [INFO] Email subject matches job posting: "SOFTWARE DEVELOPER AT Maverick" -> Job: SOFTWARE DEVELOPER AT Maverick
   [INFO] Processing email from candidate@example.com for job: SOFTWARE DEVELOPER AT Maverick
   [INFO] CV extracted and saved: resume.pdf
   [INFO] Successfully processed application - CV extracted and analyzed
   ```

3. **Dashboard shows:**
   - Applicants appear with scores and analysis
   - Total applicants count increases
   - Applications are categorized (SHORTLIST, FLAG, REJECT)

---

**Last Updated:** December 17, 2025
**Version:** 1.0

