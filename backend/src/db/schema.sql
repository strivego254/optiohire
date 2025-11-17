-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
DO $$ BEGIN
  CREATE TYPE ai_status_enum AS ENUM ('SHORTLIST','FLAG','REJECT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- companies
CREATE TABLE IF NOT EXISTS companies (
  company_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  hr_email text NOT NULL,
  hiring_manager_email text NOT NULL,
  company_domain text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- job_postings
CREATE TABLE IF NOT EXISTS job_postings (
  job_posting_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  job_title text NOT NULL,
  job_description text NOT NULL,
  responsibilities text NOT NULL,
  skills_required text[] NOT NULL DEFAULT '{}',
  application_deadline timestamptz,
  interview_slots jsonb,
  interview_meeting_link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- applications
CREATE TABLE IF NOT EXISTS applications (
  application_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES job_postings(job_posting_id) ON DELETE CASCADE,
  candidate_name text,
  email text NOT NULL,
  phone text,
  resume_url text,
  parsed_resume_json jsonb,
  ai_score numeric,
  ai_status ai_status_enum,
  reasoning text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT applications_unique UNIQUE (job_posting_id, email)
);

-- audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id bigserial PRIMARY KEY,
  action text NOT NULL,
  company_id uuid,
  job_posting_id uuid,
  metadata jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_company ON job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_audit_company ON audit_logs(company_id);

-- users auth (for backend-only auth)
CREATE TABLE IF NOT EXISTS users (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- === Align to extended schema (safe-alter) ===
-- Companies extra fields
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_email text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Job postings extra fields
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS job_description_tsv tsvector;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS meeting_link text;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS google_calendar_link text;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS status text DEFAULT 'ACTIVE';
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS webhook_receiver_url text;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS webhook_secret text;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Full text index on description
CREATE INDEX IF NOT EXISTS idx_job_postings_description_tsv ON job_postings USING GIN(job_description_tsv);

-- Trigger to update tsvector on insert/update
CREATE OR REPLACE FUNCTION job_postings_tsv_trigger() RETURNS trigger AS $$
begin
  new.job_description_tsv := to_tsvector('english', coalesce(new.job_title,'') || ' ' || coalesce(new.job_description,''));
  return new;
end
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_postings_tsv ON job_postings;
CREATE TRIGGER trg_job_postings_tsv BEFORE INSERT OR UPDATE ON job_postings
FOR EACH ROW EXECUTE FUNCTION job_postings_tsv_trigger();

-- job_schedules table
CREATE TABLE IF NOT EXISTS job_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid REFERENCES job_postings(job_posting_id) ON DELETE CASCADE,
  type text NOT NULL,
  run_at timestamptz NOT NULL,
  payload jsonb,
  created_at timestamptz DEFAULT now(),
  executed boolean DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_job_schedules_due ON job_schedules (run_at, executed);

-- Applications extra fields for dedupe and company linkage
ALTER TABLE applications ADD COLUMN IF NOT EXISTS external_id text UNIQUE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(company_id) ON DELETE CASCADE;

-- Helpful indices
CREATE INDEX IF NOT EXISTS idx_job_postings_company_status_deadline ON job_postings(company_id, status, application_deadline);
CREATE INDEX IF NOT EXISTS idx_job_postings_skills_gin ON job_postings USING GIN (skills_required);



