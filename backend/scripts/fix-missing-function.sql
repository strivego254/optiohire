-- Quick fix: Create the missing update_updated_at_column() function
-- Run this if you got the error: "function update_updated_at_column() does not exist"

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

-- Now create the missing trigger for recruitment_analytics
DROP TRIGGER IF EXISTS trg_recruitment_analytics_updated_at ON recruitment_analytics;
CREATE TRIGGER trg_recruitment_analytics_updated_at
  BEFORE UPDATE ON recruitment_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

