-- Enterprise Recruitment System Schema
-- Aligns with existing schema (uses company_id, job_posting_id)
-- Run with: psql $DATABASE_URL -f backend/src/db/migrations/004_enterprise_schema.sql

-- Companies table - add missing columns
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_email text;

-- Job postings - add missing columns and align
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS interview_start_time timestamptz;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS meeting_link text;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Use existing interview_meeting_link as meeting_link if meeting_link is null
UPDATE job_postings SET meeting_link = interview_meeting_link WHERE meeting_link IS NULL AND interview_meeting_link IS NOT NULL;

-- Convert skills_required from text[] to jsonb if needed (keep both for compatibility)
-- We'll handle this in application code

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES job_postings(job_posting_id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  candidate_name text,
  email text NOT NULL,
  cv_url text,
  score numeric,
  status text CHECK (status IN ('SHORTLIST', 'FLAGGED', 'REJECTED')),
  parsedlinkedin text,
  parsedgithub text,
  parsedemail text,
  reasoning text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_posting_id, email)
);

CREATE INDEX IF NOT EXISTS idx_candidates_job ON candidates(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_candidates_company ON candidates(company_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_score ON candidates(score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES job_postings(job_posting_id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  report_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_posting_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_job ON reports(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_reports_company ON reports(company_id);

-- Interview scheduling fields (add to candidates if not exists)
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS interview_date_time timestamptz,
ADD COLUMN IF NOT EXISTS interview_link text;

CREATE INDEX IF NOT EXISTS idx_candidates_interview_time ON candidates(interview_date_time) WHERE interview_date_time IS NOT NULL;

-- Audit logs for tracking (update if exists)
CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  action text NOT NULL,
  company_id uuid REFERENCES companies(company_id),
  job_posting_id uuid REFERENCES job_postings(job_posting_id),
  candidate_id uuid REFERENCES candidates(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_job ON audit_logs(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
