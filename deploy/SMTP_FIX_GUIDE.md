# 🔧 SMTP Connection Timeout - Fix Guide

## Problem
```
[ERROR] Email service: SMTP connection verification failed: Connection timeout
```

This means your server **cannot connect** to Gmail's SMTP servers to send emails.

## Root Cause
**Firewall blocking outbound SMTP traffic** on ports 465 (SSL) or 587 (TLS).

## Quick Fix

### Step 1: Run the Diagnostic Script
```bash
cd ~/optiohire
chmod +x deploy/fix-smtp-connection.sh
./deploy/fix-smtp-connection.sh
```

This will:
- ✅ Test which SMTP ports are accessible
- ✅ Check UFW firewall rules
- ✅ Update configuration if needed
- ✅ Test SMTP connection

### Step 2: Fix UFW Firewall (On Server)

If ports are blocked, run:
```bash
# Allow outbound SMTP traffic
sudo ufw allow out 465/tcp
sudo ufw allow out 587/tcp
sudo ufw reload

# Verify
sudo ufw status | grep -E "465|587"
```

### Step 3: Fix DigitalOcean Firewall (In Dashboard)

**CRITICAL**: DigitalOcean firewall can block outbound traffic even if UFW allows it.

1. Go to: https://cloud.digitalocean.com/networking/firewalls
2. Find your server's firewall
3. Click "Edit" or "Add Rule"
4. Add **OUTBOUND** rules:

   **Rule 1:**
   - Type: Custom
   - Protocol: TCP
   - Port Range: `465`
   - Destination: All IPv4
   - Description: SMTP SSL

   **Rule 2:**
   - Type: Custom
   - Protocol: TCP
   - Port Range: `587`
   - Destination: All IPv4
   - Description: SMTP TLS

5. Click "Save"

### Step 4: Verify Gmail App Password

**IMPORTANT**: Gmail requires an **App Password**, not your regular password.

1. Enable 2-Step Verification:
   - https://myaccount.google.com/security
   - Turn on "2-Step Verification"

2. Generate App Password:
   - https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the **16-character password** (format: `xxxx xxxx xxxx xxxx`)

3. Update `backend/.env`:
   ```env
   MAIL_USER=your-email@gmail.com
   MAIL_PASS=xxxx xxxx xxxx xxxx  # Use the App Password, not your regular password
   MAIL_PORT=465  # or 587 if 465 is blocked
   ```

### Step 5: Restart Backend
```bash
pm2 restart optiohire-backend --update-env
```

### Step 6: Verify It Works
```bash
# Check logs for successful SMTP connection
pm2 logs optiohire-backend | grep -i "smtp\|email"

# Should see:
# ✅ Email service: SMTP connection verified successfully
```

## Alternative: Use Port 587 (TLS)

If port 465 is blocked but 587 works:

1. Update `backend/.env`:
   ```env
   MAIL_PORT=587
   ```

2. Restart backend:
   ```bash
   pm2 restart optiohire-backend --update-env
   ```

Port 587 uses TLS (STARTTLS) instead of SSL, which is often less restricted by firewalls.

## Testing SMTP Connection

Test if SMTP works:
```bash
cd ~/optiohire/backend
node -e "
const nodemailer = require('nodemailer');
require('dotenv').config();
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '465'),
  secure: parseInt(process.env.MAIL_PORT || '465') === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});
transporter.verify().then(() => console.log('✅ SMTP OK')).catch(e => console.error('❌', e.message));
"
```

## Common Issues

### Issue 1: "Connection timeout"
- **Cause**: Firewall blocking outbound SMTP
- **Fix**: Configure UFW and DigitalOcean firewall (see above)

### Issue 2: "Authentication failed"
- **Cause**: Using regular Gmail password instead of App Password
- **Fix**: Generate App Password and update `MAIL_PASS`

### Issue 3: "Port 465 blocked"
- **Cause**: Firewall or ISP blocking SSL port
- **Fix**: Switch to port 587 (TLS) by setting `MAIL_PORT=587`

### Issue 4: "Both ports blocked"
- **Cause**: Strict firewall rules
- **Fix**: 
  1. Check DigitalOcean firewall settings
  2. Contact your hosting provider
  3. Consider using SendGrid (see below)

## Future: SendGrid Integration

For better reliability and deliverability, consider using SendGrid:

1. **Benefits**:
   - ✅ No firewall issues (uses API, not SMTP)
   - ✅ Better deliverability
   - ✅ Higher sending limits
   - ✅ Analytics and tracking

2. **Setup** (when ready):
   - Sign up at https://sendgrid.com
   - Get API key
   - Update email service to use SendGrid API

## Verification Checklist

- [ ] UFW allows outbound ports 465 and 587
- [ ] DigitalOcean firewall allows outbound SMTP
- [ ] `MAIL_USER` is set in `backend/.env`
- [ ] `MAIL_PASS` is a Gmail App Password (16 chars)
- [ ] `MAIL_PORT` is set (465 or 587)
- [ ] Backend restarted with `--update-env`
- [ ] SMTP connection test passes
- [ ] Logs show "SMTP connection verified successfully"

## Still Not Working?

Run comprehensive diagnostic:
```bash
./deploy/diagnose-email-reader.sh
```

Check logs:
```bash
pm2 logs optiohire-backend --lines 100 | grep -i "smtp\|email\|error"
```

---

**Status**: After fixing firewall rules, SMTP should work automatically.  
**Email Processing**: Applications are being analyzed ✅  
**Email Sending**: Will work after firewall fix ✅

