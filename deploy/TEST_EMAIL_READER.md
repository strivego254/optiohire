# Testing Email Reader - Real-Time Monitoring Guide

## ✅ Prerequisites (Already Done)
- ✅ Database mismatch fixed
- ✅ User account created
- ✅ Email reader enabled and configured
- ✅ IMAP_POLL_MS set to 1000ms (1 second)

## 📋 Step-by-Step Testing Process

### Step 1: Create Your Job Post
1. Go to your dashboard at `optiohire.com`
2. Create a new job posting
3. **Important**: Note the exact **Job Title** you enter
   - Example: "Software Developer" or "Frontend Engineer"
   - The email subject must match this exactly

### Step 2: Email Subject Format
When applicants send emails, the subject line should be:
```
Application for {JobTitle} at {CompanyName}
```

**Example:**
- Job Title: "Software Developer"
- Company Name: "Maverick"
- Email Subject: "Application for Software Developer at Maverick"

**OR** the email subject can just be the job title:
```
Software Developer
```

The system will match:
1. Exact match (case-insensitive, trimmed)
2. Substring match (job title contained in email subject)
3. Prefix match (email subject starts with job title)

### Step 3: Start Real-Time Monitoring

**On your server, run this command to watch logs in real-time:**

```bash
pm2 logs optiohire-backend --lines 0
```

This will show:
- ✅ Email reader connection status
- ✅ Jobs found in database
- ✅ Emails being processed
- ✅ CV extraction status
- ✅ AI scoring results
- ❌ Any errors

### Step 4: What to Expect When Applications Arrive

**Successful Flow:**
```
[INFO] IMAP email reader connected
[INFO] Checking 1 active jobs
[INFO] Found unread email: Application for Software Developer at Maverick
[DEBUG] Normalized email subject: "software developer at maverick"
[DEBUG] Normalized job title: "software developer"
[INFO] Email subject matches job posting: Software Developer (job_id: xxx)
[INFO] Processing email from: applicant@example.com
[INFO] CV extracted and saved: resume.pdf -> cvs/xxx_timestamp_resume.pdf
[INFO] CV successfully processed for application xxx
[INFO] Processing CV for application xxx, score: 85, status: SHORTLIST
[INFO] Email processed successfully, marking as read
```

**If CV is Missing:**
```
[WARN] No CV attachment found in email from applicant@example.com
[INFO] Application created but CV processing skipped
```

**If Subject Doesn't Match:**
```
[DEBUG] Skipping email (subject doesn't match any job posting): Wrong Subject
[DEBUG] Available jobs: Software Developer, Frontend Engineer
```

### Step 5: Check Application Status

**Option A: Via Dashboard**
- Go to your job posting
- Check the "Applications" tab
- You should see applicants with:
  - Name
  - Email
  - Score (0-100)
  - Status (SHORTLIST, FLAGGED, REJECTED)
  - CV download link

**Option B: Via Database (Server)**
```bash
cd ~/optiohire/backend
npx tsx scripts/check-jobs.ts
```

### Step 6: Verify Email Reader Health

**Check health endpoint:**
```bash
curl http://localhost:3999/health/email-reader
```

Should return:
```json
{
  "status": "ok",
  "emailReader": {
    "enabled": true,
    "running": true,
    "disabledReason": null,
    "lastProcessedAt": "2025-12-18T12:45:00.000Z",
    "lastError": null
  }
}
```

## 🔍 Troubleshooting

### Email Reader Not Running
```bash
# Check if enabled
grep ENABLE_EMAIL_READER ~/optiohire/backend/.env

# Should be: ENABLE_EMAIL_READER=true

# Restart backend
pm2 restart optiohire-backend

# Check logs
pm2 logs optiohire-backend --lines 50
```

### No Jobs Found
```bash
cd ~/optiohire/backend
npx tsx scripts/check-jobs.ts
```

If no jobs, make sure:
1. Job status is "ACTIVE" (case-insensitive)
2. Job is created in the same database backend uses
3. Job title matches email subject

### Subject Not Matching
The system logs will show:
- Normalized email subject
- Normalized job title
- Available jobs in database

Check the logs to see why matching failed.

## 📊 Expected Processing Time

- **Email Detection**: < 1 second (polls every 1 second)
- **CV Extraction**: 1-3 seconds
- **CV Parsing**: 2-5 seconds
- **AI Scoring**: 3-10 seconds (depends on AI API response)
- **Total**: ~10-20 seconds per application

## ✅ Success Indicators

1. ✅ Email reader shows `"running": true` in health check
2. ✅ Logs show "Checking X active jobs" (X > 0)
3. ✅ Applications appear in dashboard within 30 seconds
4. ✅ Applicants have scores and statuses
5. ✅ CV files are downloadable

## 🚨 Common Issues

**Issue**: Email reader shows `"running": false`
- **Fix**: Check IMAP credentials in `backend/.env`
- **Fix**: Ensure `ENABLE_EMAIL_READER=true`

**Issue**: "No jobs found in database"
- **Fix**: Verify job status is "ACTIVE"
- **Fix**: Check database connection

**Issue**: "Subject doesn't match"
- **Fix**: Check exact job title spelling
- **Fix**: Check email subject format
- **Fix**: Review debug logs for normalized values

