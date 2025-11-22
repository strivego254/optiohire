# Database Migration Guide

This guide explains how to ensure your database schema matches the implementation.

## Required Columns

The following columns must exist in your database:

### Users Table
- `name` (text) - User's full name from signup
- `company_role` (text) - Either 'hr' or 'hiring_manager'
- `email` (text, UNIQUE, NOT NULL)
- `password_hash` (text, NOT NULL)
- `role` (text) - Either 'user' or 'admin'
- `is_active` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Companies Table
- `company_id` (uuid, PRIMARY KEY)
- `user_id` (uuid, REFERENCES users)
- `company_name` (text, NOT NULL)
- `company_email` (text, NOT NULL)
- `hr_email` (text, NOT NULL)
- `hiring_manager_email` (text, NOT NULL)
- `company_domain` (text, NOT NULL)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Analytics Events Table (for cookie tracking)
- `event_id` (uuid, PRIMARY KEY)
- `event_type` (text, NOT NULL)
- `session_id` (text, NOT NULL)
- `user_id` (uuid, REFERENCES users)
- `event_data` (jsonb)
- `url` (text)
- `path` (text)
- `created_at` (timestamptz)

## Running the Complete Schema

### Run Complete Schema (Works for both new and existing databases)

```bash
cd backend
psql $DATABASE_URL -f src/db/complete_schema.sql
```

The complete schema is idempotent and will:
- Create all tables if they don't exist
- Add missing columns if they don't exist
- Create all indexes
- Set up triggers and functions
- Create admin user

**You only need to run this once!**

## Verifying Schema

To check if all columns exist, run:

```sql
-- Check users table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check companies table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- Check analytics_events table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'analytics_events';
```

## Manual Column Addition (if needed)

If migrations fail, you can manually add columns:

```sql
-- Add name column
ALTER TABLE users ADD COLUMN IF NOT EXISTS name text;

-- Add company_role column
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_role text 
  CHECK (company_role IN ('hr', 'hiring_manager'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_role) WHERE company_role IS NOT NULL;
```

## Notes

- The schema uses `DO $$ ... END $$;` blocks to safely add columns only if they don't exist
- All migrations are idempotent (safe to run multiple times)
- The complete_schema.sql file includes all necessary tables and columns

