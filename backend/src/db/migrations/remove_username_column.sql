-- ============================================================================
-- Migration: Remove username column from users table
-- ============================================================================
-- This migration removes the username column from the users table
-- Run this after ensuring all code references to username have been removed
-- Usage: psql $DATABASE_URL -f remove_username_column.sql
-- ============================================================================

-- Drop the index on username if it exists
DROP INDEX IF EXISTS idx_users_username;

-- Drop the username column if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    ALTER TABLE users DROP COLUMN username;
    RAISE NOTICE 'Dropped username column from users table';
  ELSE
    RAISE NOTICE 'Username column does not exist, skipping drop';
  END IF;
END $$;
