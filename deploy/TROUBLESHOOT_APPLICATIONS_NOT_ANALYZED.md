# 🔧 Troubleshooting: Applications Not Being Analyzed

## Quick Diagnosis

Run this on your server to diagnose the issue:

```bash
cd ~/optiohire
./deploy/diagnose-new-applications.sh
```

This will check:
- ✅ PM2 status
- ✅ Email reader health
- ✅ Recent backend logs
- ✅ Email reader configuration
- ✅ Recent applications in database
- ✅ Active job postings
- ✅ Email processing errors

## Common Issues & Solutions

### 1. Email Subject Doesn't Match Job Title

**Problem**: The email subject must contain the job title for the system to match it.

**Solution**: 
- Email subject should contain the **exact job title** (case-insensitive)
- Examples:
  - ✅ `"Software Developer"` (exact match)
  - ✅ `"Software Developer - Application"` (prefix match)
  - ✅ `"Application for Software Developer"` (contains match)
  - ❌ `"Job Application"` (no job title)

**Check**:
```bash
# On server, check recent logs for matching attempts
pm2 logs optiohire-backend --lines 100 | grep -i "match\|subject\|job"
```

### 2. Email Reader Not Running

**Problem**: Email reader might be disabled or crashed.

**Check**:
```bash
# Check email reader status
curl http://localhost:3001/health/email-reader

# Check if enabled in .env
cd ~/optiohire/backend
grep ENABLE_EMAIL_READER .env
```

**Fix**:
```bash
# Enable email reader
cd ~/optiohire/backend
echo "ENABLE_EMAIL_READER=true" >> .env

# Restart backend
pm2 restart optiohire-backend --update-env
```

### 3. Job Status Not "ACTIVE"

**Problem**: Job might be created with a different status.

**Check**:
```bash
cd ~/optiohire/backend
source .env
PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "
  SELECT job_posting_id, job_title, status, created_at
  FROM job_postings
  ORDER BY created_at DESC
  LIMIT 5;
"
```

**Fix**: The system now matches jobs regardless of status, but if you see issues, ensure jobs are created with `status = 'ACTIVE'` or `NULL`.

### 4. Email Already Read

**Problem**: If an email was already marked as read, it won't be processed.

**Check**: Look in Gmail "Processed" or "Failed" folders.

**Fix**: The system only processes **unread** emails. If you need to reprocess:
1. Mark email as unread in Gmail
2. Move it back to Inbox
3. System will process it automatically

### 5. IMAP Connection Issues

**Problem**: IMAP connection might be dropping.

**Check**:
```bash
pm2 logs optiohire-backend --lines 50 | grep -i "imap\|connection\|error"
```

**Fix**: The system now auto-reconnects, but if issues persist:
```bash
# Restart backend
pm2 restart optiohire-backend --update-env

# Check IMAP credentials
cd ~/optiohire/backend
grep IMAP .env
```

## Step-by-Step Diagnosis

### Step 1: Check Recent Applications

```bash
cd ~/optiohire/backend
npx tsx scripts/check-recent-applications.ts
```

This shows:
- Recent job postings
- Recent applications
- Jobs with no applications
- Active jobs for matching

### Step 2: Check Email Reader Logs

```bash
# Real-time logs
pm2 logs optiohire-backend --lines 0

# Or check recent logs
pm2 logs optiohire-backend --lines 100 | grep -i "email\|application\|match"
```

Look for:
- `✅ Found X unread email(s)` - Emails detected
- `✅ MATCH FOUND` - Email matched to job
- `❌ NO MATCH` - Email subject doesn't match
- `✅ Successfully processed email` - Application created

### Step 3: Verify Email Subject Format

**For each job posting**, applicants should send emails with subject containing the job title:

**Example**:
- Job Title: `"Senior Software Engineer"`
- ✅ Email Subject: `"Senior Software Engineer"`
- ✅ Email Subject: `"Application for Senior Software Engineer"`
- ✅ Email Subject: `"Senior Software Engineer - My Application"`
- ❌ Email Subject: `"Job Application"` (no job title)

### Step 4: Check Gmail Inbox

1. Log into Gmail: `hirebitapplications@gmail.com`
2. Check **Inbox** for unread emails
3. Check **Processed** folder for successfully processed emails
4. Check **Failed** folder for unmatched emails

### Step 5: Manual Test

1. Create a test job posting
2. Note the **exact job title**
3. Send a test email with subject = job title
4. Watch logs: `pm2 logs optiohire-backend --lines 0`
5. Check if application appears in database

## Improved Email Matching

The system now supports:

1. **Exact Match**: `"Software Developer"` = `"Software Developer"`
2. **Prefix Match**: `"Software Developer - Application"` starts with `"Software Developer"`
3. **Substring Match**: `"Application for Software Developer"` contains `"Software Developer"`
4. **Reverse Match**: `"Developer"` found in `"Senior Software Developer"` (if subject >= 5 chars)

## Scale Considerations

For **thousands of emails**:

1. **Email reader polls every 1 second** (real-time)
2. **Processes emails sequentially** (one at a time)
3. **Moves processed emails** to "Processed" folder
4. **Moves failed emails** to "Failed" folder
5. **Auto-reconnects** on connection drops

**Performance**:
- ~1 email/second processing rate
- Handles connection drops automatically
- Logs all matching attempts for debugging

## Quick Fix Commands

```bash
# 1. Check status
pm2 list
curl http://localhost:3001/health/email-reader

# 2. Check logs
pm2 logs optiohire-backend --lines 50

# 3. Restart if needed
pm2 restart optiohire-backend --update-env

# 4. Check recent applications
cd ~/optiohire/backend
npx tsx scripts/check-recent-applications.ts

# 5. Run full diagnosis
cd ~/optiohire
./deploy/diagnose-new-applications.sh
```

## Still Not Working?

1. **Check the exact job title** in database vs email subject
2. **Verify email is unread** in Gmail inbox
3. **Check logs** for specific error messages
4. **Verify IMAP credentials** are correct
5. **Ensure email reader is enabled** (`ENABLE_EMAIL_READER=true`)

---

**Last Updated**: December 19, 2025

