# CV Processing Flow - Complete Guide

## Overview
This document explains the complete flow of how applicant CVs are processed, analyzed, and scored in the HireBit system.

## Current Issue
**Problem**: CVs are being extracted and saved, but the parsing step is failing with error:
```
TypeError: (0 , import_pdf_parse.default) is not a function
```

**Root Cause**: The `pdf-parse` package (v2.4.5) is a CommonJS module, and the ES module import syntax was incorrect.

**Fix Applied**: Changed import to use `createRequire` for CommonJS compatibility.

---

## Complete CV Processing Flow

### Step 1: Email Reception & Monitoring
**Location**: `backend/src/server/email-reader.ts`

1. **Email Reader Service** monitors the IMAP inbox (Gmail)
   - Polls every 10 seconds (configurable via `IMAP_POLL_MS`)
   - Searches for unread emails with subject matching: `"Application for {JobTitle} at {CompanyName}"`

2. **Email Detection**:
   - Extracts email subject
   - Matches subject to active job postings in database
   - Finds matching job by exact title match

### Step 2: CV Extraction
**Location**: `backend/src/server/email-reader.ts` → `processEmailForJob()`

1. **Attachment Processing**:
   - Parses email using `mailparser`
   - Searches for PDF, DOCX, or DOC attachments
   - Extracts attachment buffer and MIME type

2. **File Storage**:
   - Saves CV to Supabase Storage
   - Path format: `cvs/{job_posting_id}_{timestamp}_{filename}`
   - Returns public URL for the saved file

3. **Application Record Creation**:
   - Creates entry in `applications` table with:
     - `job_posting_id`
     - `company_id`
     - `candidate_name` (from email sender)
     - `email` (from email sender)
     - `resume_url` (Supabase storage URL)
     - `phone` (null initially)

### Step 3: CV Parsing & Text Extraction
**Location**: `backend/src/lib/cv-parser.ts` → `parseCVBuffer()`

1. **File Type Detection**:
   - Checks MIME type: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, etc.

2. **Text Extraction**:
   - **PDF Files**: Uses `pdf-parse` to extract text content
   - **DOCX/DOC Files**: Uses `mammoth` to extract text and HTML (for hidden links)
   - **Fallback**: Attempts PDF parsing, then plain text extraction

3. **Link Extraction**:
   - Extracts all URLs using regex: `https?://[^\s)]+`
   - Categorizes links:
     - **LinkedIn**: Links containing `linkedin.com`
     - **GitHub**: Links containing `github.com`
     - **Other Links**: All other URLs
   - Extracts email addresses from text and `mailto:` links

4. **Output**: Returns `ParsedCV` object:
   ```typescript
   {
     textContent: string,      // Cleaned text content
     linkedin: string | null,  // LinkedIn profile URL
     github: string | null,    // GitHub profile URL
     emails: string[],         // All email addresses found
     other_links: string[]      // Other URLs (portfolio, etc.)
   }
   ```

5. **Database Update**:
   - Updates `applications.parsed_resume_json` with extracted data

### Step 4: Skill Extraction
**Location**: `backend/src/lib/cv-parser.ts` → `extractSkills()`

1. **Skill Matching**:
   - Takes job's `required_skills` array
   - Searches CV text for each skill (case-insensitive, word boundary matching)
   - Returns array of matched skills

### Step 5: AI Scoring & Analysis
**Location**: `backend/src/lib/ai-scoring.ts` → `scoreCandidate()`

1. **Input Preparation**:
   - Job details: `title`, `description`, `required_skills`
   - CV text content (limited to 4000 characters to prevent token overflow)

2. **AI Model Selection**:
   - **Primary**: Google Gemini (if `GEMINI_API_KEY` is set)
     - Model: `gemini-1.5-flash` (configurable via `SCORING_MODEL`)
     - Uses key rotation: `GEMINI_API_KEY` → `GEMINI_API_KEY_002` → `GEMINI_API_KEY_003`
   - **Fallback**: Rule-based scoring (if no API key)

3. **AI Prompt**:
   - System instruction: "You are an expert HR recruiter. Analyze candidates objectively..."
   - Job title, description, required skills
   - Candidate CV text
   - Instructions for objective scoring (no discrimination)

4. **AI Response Processing**:
   - Extracts JSON from response (handles markdown wrapping)
   - Parses: `{ score: number, status: string, reasoning: string }`
   - Validates and normalizes score (0-100)

5. **Status Assignment** (Mandatory Rules):
   - **SHORTLIST**: Score 80-100 (strong match)
   - **FLAGGED**: Score 50-79 (partial match, needs review)
   - **REJECTED**: Score <50 (poor match)

6. **Fallback Scoring** (if AI fails):
   - Skill match percentage (0-70 points)
   - Experience indicators (+15 points)
   - Education keywords (+10 points)
   - Total capped at 100

7. **Output**: Returns `ScoringResult`:
   ```typescript
   {
     score: number,           // 0-100
     status: 'SHORTLIST' | 'FLAGGED' | 'REJECTED',
     reasoning: string         // Transparent explanation
   }
   ```

### Step 6: Database Update with Scores
**Location**: `backend/src/repositories/applicationRepository.ts` → `updateScoring()`

1. **Updates `applications` table**:
   - `ai_score`: The calculated score (0-100)
   - `ai_status`: `'SHORTLIST'`, `'FLAG'`, or `'REJECT'` (mapped from AI status)
   - `reasoning`: ExplanatiAttempts PDF parsing, then plain text extraction
on of the score
   - `parsed_resume_json`: Complete parsed CV data (if not already set)

### Step 7: Email Notifications
**Location**: `backend/src/services/emailService.ts`

1. **HR Notification**:
   - Sends email to company HR about new application
   - Includes candidate name, email, job title

2. **Candidate Response** (based on status):
   - **SHORTLIST**: Sends shortlist email with interview link
   - **REJECTED**: Sends rejection email
   - **FLAGGED**: No automatic email (manual review needed)

### Step 8: Email Folder Management
**Location**: `backend/src/server/email-reader.ts`

1. **Success Path**:
   - Marks email as read (`\Seen` flag)
   - Moves to `Processed` folder

2. **Failure Path**:
   - Keeps email unread
   - Moves to `Failed` folder
   - Logs error for manual review

---

## Database Schema

### `applications` Table Fields:
- `application_id` (UUID): Primary key
- `job_posting_id` (UUID): Foreign key to job_postings
- `company_id` (UUID): Foreign key to companies
- `candidate_name` (TEXT): From email sender
- `email` (TEXT): Candidate email
- `phone` (TEXT): Phone number (usually null initially)
- `resume_url` (TEXT): Supabase storage URL
- `parsed_resume_json` (JSONB): Parsed CV data with links, emails
- `ai_score` (INTEGER): Match score 0-100
- `ai_status` (ENUM): 'SHORTLIST', 'FLAG', 'REJECT', or NULL
- `reasoning` (TEXT): Explanation of score
- `created_at` (TIMESTAMP): Application timestamp

---

## Environment Variables Required

```bash
# Email Reading
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password
IMAP_POLL_MS=10000

# AI Scoring (Optional - falls back to rule-based if not set)
GEMINI_API_KEY=your-gemini-api-key
# Or use fallback keys:
GEMINI_API_KEY_002=backup-key-1
GEMINI_API_KEY_003=backup-key-2
SCORING_MODEL=gemini-1.5-flash  # Optional, defaults to gemini-1.5-flash

# Email Sending (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## Troubleshooting

### Issue: CV Parsing Fails
**Error**: `TypeError: (0 , import_pdf_parse.default) is not a function`

**Solution**: Fixed by using `createRequire` for CommonJS module compatibility.

**Check**:
1. Ensure `pdf-parse` is installed: `npm list pdf-parse`
2. Check logs for parsing errors
3. Verify CV file is valid PDF/DOCX

### Issue: AI Scoring Not Working
**Symptoms**: `ai_score` and `ai_status` remain NULL

**Check**:
1. Verify `GEMINI_API_KEY` is set in `.env`
2. Check API key is valid and has quota
3. Review logs for AI scoring errors
4. System will fallback to rule-based scoring if AI fails

### Issue: Applications Created But Not Scored
**Symptoms**: Applications in database but `ai_score` is NULL

**Possible Causes**:
1. CV parsing failed (check Step 3)
2. AI scoring failed and fallback also failed
3. Error in `processCandidateCV()` method

**Solution**: Check application logs for errors in CV processing pipeline.

---

## Manual Re-scoring

If an application was created but not scored, you can manually trigger scoring:

**API Endpoint**: `POST /api/applications/score`
```json
{
  "application_id": "uuid-here",
  "job_posting_id": "uuid-here"
}
```

This will:
1. Fetch the application and job details
2. Parse the CV if not already parsed
3. Run AI scoring
4. Update the application record

---

## Summary

The complete flow is:
1. **Email** → 2. **CV Extraction** → 3. **CV Parsing** → 4. **Skill Extraction** → 5. **AI Scoring** → 6. **Database Update** → 7. **Email Notifications** → 8. **Folder Management**

Each step must succeed for the next to proceed. The main failure point was Step 3 (CV Parsing), which has now been fixed.

