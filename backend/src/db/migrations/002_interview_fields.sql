-- Migration: Add interview scheduling fields to applications and job_postings
-- Run with: psql $DATABASE_URL -f backend/src/db/migrations/002_interview_fields.sql

-- Add interview fields to applications table
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS interview_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS interview_link TEXT,
ADD COLUMN IF NOT EXISTS interview_status TEXT DEFAULT 'PENDING';

-- Ensure meeting_link exists on job_postings (already added in schema.sql, but safe to add again)
ALTER TABLE job_postings
ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Remove deprecated google_calendar_link if it exists
ALTER TABLE job_postings
DROP COLUMN IF EXISTS google_calendar_link;

-- Add index for querying scheduled interviews
CREATE INDEX IF NOT EXISTS idx_applications_interview_time ON applications(interview_time) WHERE interview_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_applications_interview_status ON applications(interview_status);

