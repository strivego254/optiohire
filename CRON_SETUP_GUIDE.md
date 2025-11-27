# 🕐 CRON Setup Guide - Activate Full Workflow

## What is CRON?

**CRON** stands for "Command Run On Notice" - it's a way to run scheduled tasks automatically. In HireBit, CRON jobs handle:
1. **Email Monitoring** - Checks Gmail inbox every 10 seconds for new applications
2. **Report Generation** - Automatically generates reports after job deadlines pass (every 10 minutes)
3. **Daily Scoring** - Scores any applications that haven't been scored yet

## Step-by-Step Setup

### Step 1: Generate CRON_SECRET

CRON_SECRET is a security key that protects your automated endpoints. It's already generated for you:

```
CRON_SECRET=5d5677c04b162c6cfa720909e7ebf91133ee0035228d734f04046a1ea56a73be
```

### Step 2: Check Your Backend Environment File

You need to have a `backend/.env` file with all required settings. Let's check if it exists and what's in it.

### Step 3: Add CRON_SECRET to backend/.env

Add this line to your `backend/.env` file:
```
CRON_SECRET=5d5677c04b162c6cfa720909e7ebf91133ee0035228d734f04046a1ea56a73be
```

### Step 4: Verify IMAP Settings (For Email Monitoring)

Make sure these are set in `backend/.env`:
```
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=hirebitapplications@gmail.com
IMAP_PASS=your_app_specific_password
IMAP_SECURE=true
IMAP_POLL_MS=10000
ENABLE_EMAIL_READER=true
```

**Important**: `IMAP_PASS` should be a Gmail App Password, not your regular Gmail password.

### Step 5: Start the Backend Server

The CRON jobs start automatically when you start the backend server:

```bash
cd backend
npm run dev
```

You should see:
- ✅ "IMAP email reader connected to imap.gmail.com:993"
- ✅ "Report scheduler started - checking every 10 minutes for past-deadline jobs"

### Step 6: Verify Everything is Running

Check the backend logs for:
1. Email reader connection success
2. Report scheduler started message
3. No errors about missing credentials

## How It Works

### Email Reader (Real-time)
- **Frequency**: Checks every 10 seconds (IMAP_POLL_MS)
- **What it does**: 
  - Monitors Gmail inbox
  - Detects emails with subject: "Application for <JobTitle> at <CompanyName>"
  - Extracts CV attachments (PDF, DOCX)
  - Parses CV and extracts candidate data
  - Scores candidate using AI
  - Sends feedback email to candidate
  - Moves email to "Processed" folder

### Report Scheduler (Every 10 minutes)
- **Frequency**: Checks every 10 minutes
- **What it does**:
  - Finds jobs where deadline has passed
  - Generates PDF reports automatically
  - Sends reports to HR via email

### Daily Scoring (On-demand)
- **Frequency**: Can be run manually or via external cron
- **What it does**:
  - Scores any applications without ai_status
  - Useful for bulk processing

## Troubleshooting

### Email Reader Not Starting
- Check `IMAP_HOST`, `IMAP_USER`, `IMAP_PASS` are set
- Verify `ENABLE_EMAIL_READER=true` (or not set to 'false')
- Check Gmail App Password is correct
- Ensure 2FA is enabled on Gmail account

### Report Scheduler Not Running
- Check backend server is running
- Verify `DISABLE_REPORT_SCHEDULER` is not set to 'true'
- Check backend logs for errors

### CRON_SECRET Issues
- Make sure `CRON_SECRET` is set in `backend/.env`
- Verify it matches when calling protected endpoints
- Use header: `x-cron-secret: your_secret` or query: `?secret=your_secret`

## Testing the Workflow

1. **Create a job posting** in the dashboard
2. **Send a test email** to the Gmail account with:
   - Subject: "Application for [JobTitle] at [CompanyName]"
   - Attach a CV (PDF or DOCX)
3. **Wait 10-30 seconds** - Email reader should process it
4. **Check dashboard** - New application should appear with AI score
5. **Check candidate email** - They should receive feedback email

## Next Steps

After setup:
1. ✅ CRON_SECRET added to backend/.env
2. ✅ IMAP credentials verified
3. ✅ Backend server started
4. ✅ Email reader connected
5. ✅ Report scheduler running
6. ✅ Create your first job posting
7. ✅ Test with real application emails

---

**Status**: Ready to process applications in real-time! 🚀

