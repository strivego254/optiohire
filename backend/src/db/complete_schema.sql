-- ============================================================================
-- HireBit Recruitment System - Complete Consolidated Schema
-- ============================================================================
-- This is the complete, unified schema combining all migrations and features
-- Run this in your PostgreSQL database (Supabase, local, or production)
-- Usage: psql $DATABASE_URL -f complete_schema.sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE ai_status_enum AS ENUM ('SHORTLIST', 'FLAG', 'REJECT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- FUNCTIONS (Must be created before tables that use them)
-- ============================================================================

-- Function to update updated_at timestamp (safely handles missing column)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to set updated_at, catch error if column doesn't exist
  BEGIN
    NEW.updated_at = now();
  EXCEPTION
    WHEN SQLSTATE '42703' THEN
      -- Column doesn't exist (error 42703), skip setting it
      NULL;
    WHEN OTHERS THEN
      -- Re-raise other errors
      RAISE;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USERS TABLE (Backend Authentication)
-- ============================================================================
-- NOTE: Users table must be created FIRST because companies references it

CREATE TABLE IF NOT EXISTS users (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  company_role text CHECK (company_role IN ('hr', 'hiring_manager')),
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add columns if they don't exist (for existing tables - safe migration)
-- This ensures the schema works for both new and existing databases

-- Add name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'name'
  ) THEN
    ALTER TABLE users ADD COLUMN name text;
    RAISE NOTICE 'Added name column to users table';
  END IF;
END $$;

-- Add company_role column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'company_role'
  ) THEN
    ALTER TABLE users ADD COLUMN company_role text CHECK (company_role IN ('hr', 'hiring_manager'));
    RAISE NOTICE 'Added company_role column to users table';
  END IF;
END $$;

-- Add role column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));
    RAISE NOTICE 'Added role column to users table';
  END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN is_active boolean DEFAULT true;
    RAISE NOTICE 'Added is_active column to users table';
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
    RAISE NOTICE 'Added updated_at column to users table';
  END IF;
END $$;

-- Add admin_approval_status column for admin approval workflow
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'admin_approval_status'
  ) THEN
    ALTER TABLE users ADD COLUMN admin_approval_status text CHECK (admin_approval_status IN ('pending', 'approved', 'rejected')) DEFAULT NULL;
    RAISE NOTICE 'Added admin_approval_status column to users table';
  END IF;
END $$;

-- Add admin_permissions column for role-based permissions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'admin_permissions'
  ) THEN
    ALTER TABLE users ADD COLUMN admin_permissions jsonb DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added admin_permissions column to users table';
  END IF;
END $$;

-- Remove username column if it exists (migration to remove username)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    DROP INDEX IF EXISTS idx_users_username;
    ALTER TABLE users DROP COLUMN username;
    RAISE NOTICE 'Removed username column from users table';
  END IF;
END $$;

-- Add name column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'name'
  ) THEN
    ALTER TABLE users ADD COLUMN name text;
    RAISE NOTICE 'Added name column to users table';
  END IF;
END $$;

-- Add company_role column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'company_role'
  ) THEN
    ALTER TABLE users ADD COLUMN company_role text CHECK (company_role IN ('hr', 'hiring_manager'));
    RAISE NOTICE 'Added company_role column to users table';
  END IF;
END $$;

-- Update existing users to have default values if null (only if columns exist)
-- Use exception handling to safely handle cases where column might not exist
DO $$ 
BEGIN
  -- Try to update, catch error if column doesn't exist
  BEGIN
    EXECUTE 'UPDATE users SET role = ''user'' WHERE role IS NULL';
  EXCEPTION
    WHEN SQLSTATE '42703' THEN
      -- Column doesn't exist (error 42703), skip update
      NULL;
    WHEN OTHERS THEN
      -- Other errors, re-raise
      RAISE;
  END;
END $$;

DO $$ 
BEGIN
  -- Try to update, catch error if column doesn't exist
  BEGIN
    EXECUTE 'UPDATE users SET is_active = true WHERE is_active IS NULL';
  EXCEPTION
    WHEN SQLSTATE '42703' THEN
      -- Column doesn't exist (error 42703), skip update
      NULL;
    WHEN OTHERS THEN
      -- Other errors, re-raise
      RAISE;
  END;
END $$;

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_role) WHERE company_role IS NOT NULL;

-- Create indexes for role and is_active only if columns exist
-- Use exception handling to safely handle cases where column might not exist
DO $$ 
BEGIN
  BEGIN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)';
  EXCEPTION
    WHEN SQLSTATE '42703' THEN
      -- Column doesn't exist (error 42703), skip index creation
      NULL;
    WHEN OTHERS THEN
      -- Other errors, re-raise
      RAISE;
  END;
END $$;

DO $$ 
BEGIN
  BEGIN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)';
  EXCEPTION
    WHEN SQLSTATE '42703' THEN
      -- Column doesn't exist (error 42703), skip index creation
      NULL;
    WHEN OTHERS THEN
      -- Other errors, re-raise
      RAISE;
  END;
END $$;

-- ============================================================================
-- COMPANIES TABLE
-- ============================================================================
-- NOTE: Companies table created AFTER users because it references users(user_id)

CREATE TABLE IF NOT EXISTS companies (
  company_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(user_id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_email text NOT NULL,
  hr_email text NOT NULL,
  hiring_manager_email text NOT NULL,
  company_domain text NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add user_id column to companies if it doesn't exist (for existing databases)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN user_id uuid REFERENCES users(user_id) ON DELETE CASCADE;
    RAISE NOTICE 'Added user_id column to companies table';
  END IF;
END $$;

-- Make company_email NOT NULL if it's currently nullable (for existing databases)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' 
    AND column_name = 'company_email' 
    AND is_nullable = 'YES'
  ) THEN
    -- First, set any NULL values to a default (use hr_email as fallback)
    UPDATE companies 
    SET company_email = COALESCE(company_email, hr_email) 
    WHERE company_email IS NULL;
    
    -- Then make it NOT NULL
    ALTER TABLE companies ALTER COLUMN company_email SET NOT NULL;
    RAISE NOTICE 'Made company_email NOT NULL in companies table';
  END IF;
END $$;

-- Indexes for companies (created AFTER column migration to ensure column exists)
DO $$ 
BEGIN
  -- Only create index if user_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id) WHERE user_id IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(company_domain);
CREATE INDEX IF NOT EXISTS idx_companies_hr_email ON companies(hr_email);
CREATE INDEX IF NOT EXISTS idx_companies_company_email ON companies(company_email) WHERE company_email IS NOT NULL;

-- ============================================================================
-- JOB POSTINGS TABLE
-- ============================================================================

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
  interview_start_time timestamptz,
  meeting_link text,
  status text DEFAULT 'ACTIVE',
  webhook_receiver_url text,
  webhook_secret text,
  job_description_tsv tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for job_postings
CREATE INDEX IF NOT EXISTS idx_job_postings_company ON job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_company_status_deadline ON job_postings(company_id, status, application_deadline);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_deadline ON job_postings(application_deadline) WHERE application_deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_postings_skills_gin ON job_postings USING GIN (skills_required);
CREATE INDEX IF NOT EXISTS idx_job_postings_description_tsv ON job_postings USING GIN(job_description_tsv);
CREATE INDEX IF NOT EXISTS idx_job_postings_interview_start_time ON job_postings(interview_start_time) WHERE interview_start_time IS NOT NULL;

-- Full-text search trigger for job descriptions
CREATE OR REPLACE FUNCTION job_postings_tsv_trigger() RETURNS trigger AS $$
BEGIN
  new.job_description_tsv := to_tsvector('english', 
    coalesce(new.job_title, '') || ' ' || 
    coalesce(new.job_description, '') || ' ' || 
    coalesce(new.responsibilities, '')
  );
  new.updated_at := now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_postings_tsv ON job_postings;
CREATE TRIGGER trg_job_postings_tsv 
  BEFORE INSERT OR UPDATE ON job_postings
  FOR EACH ROW 
  EXECUTE FUNCTION job_postings_tsv_trigger();

-- Migrate interview_meeting_link to meeting_link if needed
UPDATE job_postings 
SET meeting_link = interview_meeting_link 
WHERE meeting_link IS NULL AND interview_meeting_link IS NOT NULL;

-- ============================================================================
-- APPLICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS applications (
  application_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES job_postings(job_posting_id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(company_id) ON DELETE CASCADE,
  candidate_name text,
  email text NOT NULL,
  phone text,
  resume_url text,
  parsed_resume_json jsonb,
  ai_score numeric,
  ai_status ai_status_enum,
  reasoning text,
  external_id text UNIQUE,
  interview_time timestamptz,
  interview_link text,
  interview_status text DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT applications_unique UNIQUE (job_posting_id, email)
);

-- Indexes for applications
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_ai_status ON applications(ai_status);
CREATE INDEX IF NOT EXISTS idx_applications_interview_time ON applications(interview_time) WHERE interview_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_applications_interview_status ON applications(interview_status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_external_id ON applications(external_id) WHERE external_id IS NOT NULL;

-- Create view/alias for 'applicants' table (frontend compatibility)
CREATE OR REPLACE VIEW applicants AS SELECT * FROM applications;
CREATE OR REPLACE VIEW applicants_view AS SELECT * FROM applications;

-- ============================================================================
-- RECRUITMENT ANALYTICS TABLE
-- ============================================================================
-- This table stores aggregated analytics for job postings

CREATE TABLE IF NOT EXISTS recruitment_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES job_postings(job_posting_id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(company_id) ON DELETE CASCADE,
  total_applicants integer DEFAULT 0,
  total_applicants_shortlisted integer DEFAULT 0,
  total_applicants_rejected integer DEFAULT 0,
  total_applicants_flagged_to_hr integer DEFAULT 0,
  ai_overall_analysis text,
  processing_status text DEFAULT 'processing' CHECK (processing_status IN ('processing', 'in_progress', 'finished')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_posting_id)
);

-- Indexes for recruitment_analytics
CREATE INDEX IF NOT EXISTS idx_recruitment_analytics_job ON recruitment_analytics(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_analytics_company ON recruitment_analytics(company_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_analytics_status ON recruitment_analytics(processing_status);
CREATE INDEX IF NOT EXISTS idx_recruitment_analytics_updated ON recruitment_analytics(updated_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_recruitment_analytics_updated_at ON recruitment_analytics;
CREATE TRIGGER trg_recruitment_analytics_updated_at
  BEFORE UPDATE ON recruitment_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- REPORTS TABLE
-- ============================================================================

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

-- Indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_job_posting ON reports(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_reports_company ON reports(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Unique constraint to prevent duplicate reports for same job
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_job_unique 
  ON reports(job_posting_id) 
  WHERE status = 'completed';

-- ============================================================================
-- JOB SCHEDULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid REFERENCES job_postings(job_posting_id) ON DELETE CASCADE,
  type text NOT NULL,
  run_at timestamptz NOT NULL,
  payload jsonb,
  executed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes for job_schedules
CREATE INDEX IF NOT EXISTS idx_job_schedules_due ON job_schedules (run_at, executed);
CREATE INDEX IF NOT EXISTS idx_job_schedules_job ON job_schedules(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_schedules_type ON job_schedules(type);

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  action text NOT NULL,
  company_id uuid REFERENCES companies(company_id) ON DELETE SET NULL,
  job_posting_id uuid REFERENCES job_postings(job_posting_id) ON DELETE SET NULL,
  candidate_id uuid REFERENCES applications(application_id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_job ON audit_logs(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_audit_candidate ON audit_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
-- Note: update_updated_at_column() function is defined earlier in this file

-- Apply updated_at triggers to all tables that need it
DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_job_postings_updated_at ON job_postings;
CREATE TRIGGER trg_job_postings_updated_at
  BEFORE UPDATE ON job_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_applications_updated_at ON applications;
CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_reports_updated_at ON reports;
CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (For Supabase)
-- ============================================================================
-- Note: These policies are for Supabase. If using regular PostgreSQL,
-- you can comment out or remove this section.

-- Enable RLS on all tables (optional - only for Supabase)
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE job_schedules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Companies: Users can only see companies they're associated with
-- CREATE POLICY "Users can view their own companies"
--   ON companies FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM auth.users 
--       WHERE auth.users.id = auth.uid()
--     )
--   );

-- Allow service role to do everything (for backend operations)
-- CREATE POLICY "Service role has full access to companies"
--   ON companies FOR ALL
--   USING (auth.role() = 'service_role');

-- Job Postings: Users can view job postings for their companies
-- CREATE POLICY "Users can view job postings for their companies"
--   ON job_postings FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM companies 
--       WHERE companies.company_id = job_postings.company_id
--     )
--   );

-- CREATE POLICY "Service role has full access to job_postings"
--   ON job_postings FOR ALL
--   USING (auth.role() = 'service_role');

-- Applications: Users can view applications for their company's job postings
-- CREATE POLICY "Users can view applications for their company jobs"
--   ON applications FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM job_postings jp
--       JOIN companies c ON c.company_id = jp.company_id
--       WHERE jp.job_posting_id = applications.job_posting_id
--     )
--   );

-- CREATE POLICY "Service role has full access to applications"
--   ON applications FOR ALL
--   USING (auth.role() = 'service_role');

-- Reports: Users can view reports for their companies
-- CREATE POLICY "Users can view reports for their companies"
--   ON reports FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM companies 
--       WHERE companies.company_id = reports.company_id
--     )
--   );

-- CREATE POLICY "Service role has full access to reports"
--   ON reports FOR ALL
--   USING (auth.role() = 'service_role');

-- Job Schedules: Service role only (internal use)
-- CREATE POLICY "Service role has full access to job_schedules"
--   ON job_schedules FOR ALL
--   USING (auth.role() = 'service_role');

-- Audit Logs: Users can view audit logs for their companies
-- CREATE POLICY "Users can view audit logs for their companies"
--   ON audit_logs FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM companies 
--       WHERE companies.company_id = audit_logs.company_id
--     )
--   );

-- CREATE POLICY "Service role has full access to audit_logs"
--   ON audit_logs FOR ALL
--   USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get company ID from user email (helper for RLS)
CREATE OR REPLACE FUNCTION get_user_company_id(user_email text)
RETURNS uuid AS $$
DECLARE
  company_uuid uuid;
BEGIN
  SELECT company_id INTO company_uuid
  FROM companies
  WHERE hr_email = user_email OR hiring_manager_email = user_email
  LIMIT 1;
  RETURN company_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE companies IS 'Company information and settings';
COMMENT ON TABLE users IS 'Backend authentication users';
COMMENT ON TABLE job_postings IS 'Job postings with full-text search support';
COMMENT ON TABLE applications IS 'Candidate applications with AI scoring';
COMMENT ON TABLE reports IS 'Post-deadline hiring reports';
COMMENT ON TABLE job_schedules IS 'Scheduled tasks for job postings';
COMMENT ON TABLE audit_logs IS 'Audit trail for all system actions';

COMMENT ON COLUMN applications.ai_status IS 'AI evaluation status: SHORTLIST, FLAG, or REJECT';
COMMENT ON COLUMN applications.interview_status IS 'Interview status: PENDING, SCHEDULED, COMPLETED, CANCELLED';
COMMENT ON COLUMN job_postings.status IS 'Job posting status: ACTIVE, CLOSED, DRAFT';
COMMENT ON COLUMN reports.report_type IS 'Type of report: post_deadline, weekly, monthly, etc.';


-- ============================================================================
-- ANALYTICS EVENTS TABLE (For Cookie Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  session_id text NOT NULL,
  user_id uuid REFERENCES users(user_id) ON DELETE SET NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  url text,
  path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);

-- ============================================================================
-- USER PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  preference_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  email_notifications boolean DEFAULT true,
  report_notifications boolean DEFAULT true,
  application_notifications boolean DEFAULT true,
  interview_reminders boolean DEFAULT true,
  weekly_summary boolean DEFAULT true,
  auto_generate_reports boolean DEFAULT true,
  notification_frequency text DEFAULT 'realtime' CHECK (notification_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- ============================================================================
-- INITIAL ADMIN USER
-- ============================================================================

-- Create default admin user
-- Email: hirebitapplications@gmail.com
-- Password: Admin@hirebit2025
-- Uses dynamic SQL to handle optional columns gracefully
DO $$ 
DECLARE
  has_username boolean;
  has_name boolean;
  has_company_role boolean;
  has_role boolean;
  has_is_active boolean;
  has_updated_at boolean;
  sql_text text;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'username'
  ) INTO has_username;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'name'
  ) INTO has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'company_role'
  ) INTO has_company_role;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) INTO has_role;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) INTO has_is_active;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) INTO has_updated_at;
  
  -- Build dynamic SQL based on existing columns
  sql_text := 'INSERT INTO users (email, password_hash';
  IF has_username THEN sql_text := sql_text || ', username'; END IF;
  IF has_name THEN sql_text := sql_text || ', name'; END IF;
  IF has_company_role THEN sql_text := sql_text || ', company_role'; END IF;
  IF has_role THEN sql_text := sql_text || ', role'; END IF;
  IF has_is_active THEN sql_text := sql_text || ', is_active'; END IF;
  sql_text := sql_text || ') VALUES (';
  sql_text := sql_text || quote_literal('hirebitapplications@gmail.com') || ', ';
  sql_text := sql_text || quote_literal('$2b$10$jVhbE8a4vYJ1JRFkh.JsI.N9DrEJa6NrLcFzrbgdy6NgmO5SohAQm');
  IF has_username THEN sql_text := sql_text || ', ' || quote_literal('admin'); END IF;
  IF has_name THEN sql_text := sql_text || ', NULL'; END IF;
  IF has_company_role THEN sql_text := sql_text || ', NULL'; END IF;
  IF has_role THEN sql_text := sql_text || ', ' || quote_literal('admin'); END IF;
  IF has_is_active THEN sql_text := sql_text || ', true'; END IF;
  sql_text := sql_text || ') ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash';
  IF has_username THEN sql_text := sql_text || ', username = COALESCE(users.username, EXCLUDED.username)'; END IF;
  IF has_role THEN sql_text := sql_text || ', role = ' || quote_literal('admin'); END IF;
  IF has_is_active THEN sql_text := sql_text || ', is_active = true'; END IF;
  IF has_updated_at THEN sql_text := sql_text || ', updated_at = now()'; END IF;
  
  EXECUTE sql_text;
  
  RAISE NOTICE 'Admin user created/updated successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating admin user: %', SQLERRM;
END $$;

-- ============================================================================
-- END OF COMPLETE SCHEMA
-- ============================================================================
