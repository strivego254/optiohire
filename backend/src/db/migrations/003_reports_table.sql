-- Migration: Create reports table for storing post-deadline hiring reports
-- Run with: psql $DATABASE_URL -f backend/src/db/migrations/003_reports_table.sql

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES job_postings(job_posting_id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  report_url text NOT NULL,
  report_type text DEFAULT 'post_deadline',
  status text DEFAULT 'completed',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_job_posting ON reports(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_reports_company ON reports(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Add unique constraint to prevent duplicate reports for same job
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_job_unique ON reports(job_posting_id) WHERE status = 'completed';


