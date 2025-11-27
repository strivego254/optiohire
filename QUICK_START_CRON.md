# 🚀 Quick Start: CRON Setup Complete!

## ✅ What's Already Done

1. ✅ **CRON_SECRET Generated & Added**
   - Value: `5d5677c04b162c6cfa720909e7ebf91133ee0035228d734f04046a1ea56a73be`
   - Location: `backend/.env`
   - Status: ✅ Ready

2. ✅ **Email Reader Enabled**
   - `ENABLE_EMAIL_READER=true` in `backend/.env`
   - Status: ✅ Ready (will start when backend runs)

3. ✅ **Report Scheduler Ready**
   - Automatically starts when backend runs
   - Checks every 10 minutes for past-deadline jobs
   - Status: ✅ Ready

## ⚠️ What You Need to Do

### 1. Update Gmail App Password

**Current**: `IMAP_PASS=your_app_specific_password` (placeholder)

**Action Required**: Replace with your actual Gmail App Password

**Steps to Get Gmail App Password:**
1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Go to: **App passwords** (under "2-Step Verification")
4. Select app: **Mail**
5. Select device: **Other (Custom name)** → Enter "HireBit"
6. Click **Generate**
7. Copy the **16-character password** (looks like: `abcd efgh ijkl mnop`)
8. Remove spaces and add to `backend/.env`:
   ```
   IMAP_PASS=abcdefghijklmnop
   ```

**Also update SMTP_PASS** (for sending emails):
```
SMTP_PASS=your_gmail_app_password_here
```

### 2. Start the Backend Server

```bash
cd backend
npm install  # Only if you haven't already
npm run dev
```

**Expected Output:**
```
✅ Backend listening on http://localhost:3001
✅ IMAP email reader connected to imap.gmail.com:993
✅ Report scheduler started - checking every 10 minutes for past-deadline jobs
```

### 3. Verify Everything Works

**Check the console for:**
- ✅ No IMAP authentication errors
- ✅ Email reader connected successfully
- ✅ Report scheduler started
- ✅ No missing environment variable warnings

## 📧 How to Test

### Test Email Format

Send an email to: `hirebitapplications@gmail.com`

**Subject**: `Application for [JobTitle] at [CompanyName]`

**Example**: 
- Subject: `Application for Software Developer at TechCorp`
- Body: (optional)
- Attachment: CV/Resume (PDF or DOCX)

### Expected Timeline

- **0-10 seconds**: Email detected by reader
- **10-30 seconds**: CV parsed and AI scored
- **30-60 seconds**: Feedback email sent to candidate
- **1-2 minutes**: Application appears in dashboard

### Check Dashboard

1. Go to: `http://localhost:3000/dashboard/jobs`
2. Click on your job posting
3. View candidates section
4. New application should appear with:
   - Candidate name
   - AI score (0-100)
   - Status (SHORTLIST/FLAG/REJECT)
   - Reasoning

## 🔄 How CRON Jobs Work

### Email Reader (Real-time)
- **Frequency**: Every 10 seconds (IMAP_POLL_MS=30000, but checks continuously)
- **What it does**:
  1. Monitors Gmail inbox
  2. Detects application emails
  3. Extracts CV attachments
  4. Parses and scores candidates
  5. Sends feedback emails
  6. Moves emails to "Processed" folder

### Report Scheduler (Every 10 minutes)
- **Frequency**: Every 10 minutes
- **What it does**:
  1. Finds jobs where deadline passed
  2. Generates PDF reports
  3. Sends reports to HR email
  4. Saves reports to database

## 📋 Current Configuration

**File**: `backend/.env`

**Key Settings:**
```bash
# ✅ CRON_SECRET (Added)
CRON_SECRET=5d5677c04b162c6cfa720909e7ebf91133ee0035228d734f04046a1ea56a73be

# ✅ Email Reader (Enabled)
ENABLE_EMAIL_READER=true
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=hirebitapplications@gmail.com
IMAP_PASS=your_app_specific_password  # ⚠️ NEEDS UPDATE
IMAP_SECURE=true
IMAP_POLL_MS=30000

# ✅ Report Scheduler (Auto-starts)
# No configuration needed - starts automatically
```

## 🎯 Next Steps

1. **Update `IMAP_PASS`** in `backend/.env` with Gmail App Password
2. **Update `SMTP_PASS`** in `backend/.env` with same Gmail App Password
3. **Start backend**: `cd backend && npm run dev`
4. **Verify connection**: Check console for success messages
5. **Create job posting** in dashboard
6. **Send test email** with CV attachment
7. **Watch it process** automatically!

## 🆘 Troubleshooting

### "IMAP credentials not configured"
- Check `IMAP_PASS` is set (not placeholder)
- Verify it's a Gmail App Password (16 characters, no spaces)

### "Authentication failed"
- Gmail App Password might be wrong
- Regenerate App Password and update `IMAP_PASS`

### "Connection refused"
- Check `IMAP_HOST=imap.gmail.com`
- Check `IMAP_PORT=993`
- Check internet connection

### Email Reader Not Starting
- Verify `ENABLE_EMAIL_READER=true` (not 'false')
- Check all IMAP_* variables are set
- Check backend logs for specific errors

---

## ✅ Summary

**Completed:**
- ✅ CRON_SECRET generated and added
- ✅ Email reader enabled
- ✅ Report scheduler ready

**Action Required:**
- ⚠️ Update `IMAP_PASS` with Gmail App Password
- ⚠️ Update `SMTP_PASS` with Gmail App Password
- ⚠️ Start backend server

**Once backend starts:**
- ✅ Email reader will monitor inbox automatically
- ✅ Report scheduler will check for deadlines automatically
- ✅ Ready to process applications in real-time!

---

**You're almost there!** Just update the Gmail App Password and start the backend. 🚀

