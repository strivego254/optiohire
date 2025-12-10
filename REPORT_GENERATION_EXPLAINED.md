# Report Generation & Ready Reports - Explained

## When Reports Are Generated

Reports are automatically generated in the following scenarios:

### 1. **Automatic Generation (Cron Scheduler)**
Reports are automatically generated when **ALL** of these conditions are met:
- ✅ Job's `application_deadline` has passed (`application_deadline < NOW()`)
  - **OR** the job status is `'CLOSED'`
- ✅ No report exists yet for that job (`reports.id IS NULL`)

The scheduler runs:
- **Immediately** when the server starts
- **Every 10 minutes** thereafter

**Location:** `backend/src/cron/reportScheduler.ts`

### 2. **Manual Generation**
Reports can be manually generated via API endpoint:
- **Endpoint:** `POST /api/hr/reports/generate`
- **Body:** `{ "jobPostingId": "<uuid>" }`
- This bypasses the deadline check and generates immediately

**Location:** `backend/src/api/reportsController.ts`

---

## What Happens When a Report Is Generated

When `generatePostDeadlineReport()` is called, it:

1. ✅ **Checks if report already exists** - If yes, returns existing report
2. ✅ **Fetches job, company, and applicant data**
3. ✅ **Generates AI analysis** (if `GEMINI_API_KEY` is configured)
4. ✅ **Creates PDF report** with statistics and analysis
5. ✅ **Saves PDF to storage** (local filesystem or cloud bucket)
6. ✅ **Inserts record into `reports` table** with:
   - `status = 'completed'` (default)
   - `report_url` pointing to the PDF file
   - `job_posting_id` and `company_id`
7. ✅ **Sends email to HR** with report summary and download link
8. ✅ **Logs audit entry** for tracking

**Location:** `backend/src/services/reports/reportService.ts`

---

## Dashboard Metrics Explained

The Overview dashboard shows two report metrics:

### **Reports Generated** (`totalReports`)
- **Definition:** Total count of ALL reports in the `reports` table for your company
- **Query:** `COUNT(*) FROM reports WHERE company_id IN (...)`
- **Meaning:** Total number of reports that have been generated (regardless of status)

### **Ready Reports** (`readyReports`)
- **Definition:** Count of reports with `status = 'completed'`
- **Query:** `COUNT(*) FILTER (WHERE status = 'completed') FROM reports WHERE company_id IN (...)`
- **Meaning:** Number of reports that are completed and ready to view/download

**Note:** Currently, both metrics should show the same value since reports default to `status = 'completed'` when generated. However, if a report fails or is in a different status, they may differ.

**Location:** `frontend/src/app/api/job-postings/route.ts` (lines 209-220)

---

## Why Your Dashboard Shows Zero Reports

If you downloaded a report but the dashboard shows **0 Reports Generated** and **0 Ready Reports**, it means:

### ❌ **The report was never actually generated**

Possible reasons:

1. **Report generation failed silently**
   - Check backend logs for errors
   - The PDF might have been created but database insert failed
   - Check for unique constraint violations

2. **You downloaded a report from elsewhere**
   - If you downloaded from email or a direct link, it might not be in the database
   - Only reports generated through the system are tracked

3. **Database constraint issue**
   - The unique constraint `idx_reports_job_unique` prevents duplicate completed reports
   - If a report with `status != 'completed'` exists, the INSERT might fail
   - The `ON CONFLICT` clause might not match the partial unique index correctly

4. **Report exists with different status**
   - Check database: `SELECT * FROM reports WHERE job_posting_id = '<your-job-id>'`
   - If status is not `'completed'`, it won't count as "Ready Reports"

---

## How to Verify Report Generation

### 1. Check Database Directly
```sql
-- Check if report exists for your job
SELECT id, job_posting_id, status, report_url, created_at 
FROM reports 
WHERE job_posting_id = '<your-job-posting-id>';

-- Check all reports for your company
SELECT r.id, r.status, jp.job_title, r.created_at
FROM reports r
JOIN job_postings jp ON jp.job_posting_id = r.job_posting_id
WHERE r.company_id = '<your-company-id>';
```

### 2. Check Backend Logs
Look for log entries like:
```
✅ Report generated successfully: <report-id> for job <job-id>
```

### 3. Manually Trigger Report Generation
```bash
# Via API
curl -X POST http://localhost:3001/api/hr/reports/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"jobPostingId": "<your-job-posting-id>"}'
```

---

## Fixing the Issue

If your closed job doesn't have a report:

### Option 1: Wait for Automatic Generation
- The cron scheduler runs every 10 minutes
- It should detect your CLOSED job and generate a report automatically

### Option 2: Manually Generate Report
- Use the API endpoint or UI button to generate the report immediately
- This will create the database entry and update dashboard metrics

### Option 3: Check for Failed Generations
- Review backend logs for errors during report generation
- Check if PDF storage is working correctly
- Verify database connection and permissions

---

## Database Schema

```sql
CREATE TABLE reports (
  id uuid PRIMARY KEY,
  job_posting_id uuid NOT NULL,
  company_id uuid NOT NULL,
  report_url text NOT NULL,
  report_type text DEFAULT 'post_deadline',
  status text DEFAULT 'completed',  -- 'completed', 'pending', 'failed'
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: Only ONE completed report per job
CREATE UNIQUE INDEX idx_reports_job_unique 
  ON reports(job_posting_id) 
  WHERE status = 'completed';
```

---

## Summary

- **Reports Generated** = Total reports created (all statuses)
- **Ready Reports** = Reports with `status = 'completed'`
- Reports are auto-generated when deadline passes OR job is CLOSED
- Downloading a report file ≠ generating a report (must be in database)
- If metrics show 0, the report was likely never generated in the database
