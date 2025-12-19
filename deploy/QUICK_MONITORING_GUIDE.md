# 📊 Quick Monitoring Guide - Email Processing

## Real-Time Monitoring

### Watch Email Processing Live:
```bash
cd ~/optiohire
./deploy/monitor-email-processing.sh
```

This shows:
- ✅ New emails detected
- ✅ Email matching results
- ✅ CV processing status
- ✅ Application scores and status
- ⚠️ Any errors or unmatched emails

### Alternative: Watch All Logs
```bash
pm2 logs optiohire-backend --lines 0
```

Press `Ctrl+C` to stop.

## Quick Status Checks

### Check Recent Applications:
```bash
cd ~/optiohire/backend
npx tsx scripts/check-recent-applications.ts
```

### Check Email Reader Status:
```bash
curl http://localhost:3001/health/email-reader
```

### Check PM2 Status:
```bash
pm2 list
```

## What to Expect When Sending Applications

### ✅ Successful Processing Flow:

1. **Email Arrives** → `Found X unread email(s)`
2. **Matching** → `MATCH FOUND: Email subject matches job posting`
3. **Processing** → `Processing email from [email] for job: [Job Title]`
4. **CV Analysis** → `Processed CV for application [id], score: [X], status: [SHORTLIST/FLAG/REJECT]`
5. **Complete** → `Successfully processed email (CV extracted)`

### ⚠️ If Email Doesn't Match:

- `❌ NO MATCH: Email subject doesn't match any job posting`
- Email moved to "Failed" folder
- **Solution**: Ensure email subject contains the exact job title

## Email Subject Requirements

**✅ Must contain job title:**
- `"Software Developer"`
- `"Application for Software Developer"`
- `"Software Developer - My Application"`

**❌ Won't work:**
- `"Job Application"` (no job title)
- `"Resume"` (no job title)

## Processing Speed

- **Polling**: Every 1 second (real-time)
- **Processing**: Usually 1-5 seconds per email
- **Scale**: Handles thousands of emails automatically

## Troubleshooting

### Applications Not Appearing?

1. **Check logs**: `pm2 logs optiohire-backend --lines 50`
2. **Check database**: `npx tsx scripts/check-recent-applications.ts`
3. **Verify email subject** matches job title exactly
4. **Check Gmail** "Processed" and "Failed" folders

### Email Reader Not Running?

```bash
# Check status
curl http://localhost:3001/health/email-reader

# Restart if needed
pm2 restart optiohire-backend --update-env
```

---

**System Status**: ✅ Fully Operational  
**Processing**: Real-time (1 second polling)  
**Scale**: Ready for thousands of emails

