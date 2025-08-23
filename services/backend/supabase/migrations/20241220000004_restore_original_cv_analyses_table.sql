-- Remove bulk analysis related columns from cv_analyses table
ALTER TABLE cv_analyses DROP COLUMN IF EXISTS bulk_analysis_id;
ALTER TABLE cv_analyses DROP COLUMN IF EXISTS cv_index;
ALTER TABLE cv_analyses DROP COLUMN IF EXISTS cv_type;
ALTER TABLE cv_analyses DROP COLUMN IF EXISTS cv_text;
ALTER TABLE cv_analyses DROP COLUMN IF EXISTS analysis_result;
ALTER TABLE cv_analyses DROP COLUMN IF EXISTS error_message;

-- Drop the bulk_cv_analyses table if it exists
DROP TABLE IF EXISTS bulk_cv_analyses CASCADE;

-- Drop related indexes
DROP INDEX IF EXISTS idx_cv_analyses_bulk_analysis_id;

-- Drop related constraints
ALTER TABLE cv_analyses DROP CONSTRAINT IF EXISTS cv_analyses_bulk_analysis_id_fkey;
ALTER TABLE cv_analyses DROP CONSTRAINT IF EXISTS cv_analyses_cv_type_check;

-- Ensure the cv_analyses table has the original structure
-- The table should have these columns (based on the original single CV analysis):
-- id, user_id, job_title, job_description, required_skills, file_count, results, credits_cost, status, created_at

-- Add any missing original columns if they don't exist
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS required_skills TEXT[];
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS file_count INTEGER DEFAULT 0;
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS results JSONB;
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS credits_cost INTEGER DEFAULT 5;

-- Ensure the status column has the correct default and check constraint
ALTER TABLE cv_analyses ALTER COLUMN status SET DEFAULT 'processing';
ALTER TABLE cv_analyses DROP CONSTRAINT IF EXISTS cv_analyses_status_check;
ALTER TABLE cv_analyses ADD CONSTRAINT cv_analyses_status_check 
  CHECK (status IN ('processing', 'completed', 'failed'));

-- Recreate the original indexes
CREATE INDEX IF NOT EXISTS idx_cv_analyses_user_id ON cv_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_analyses_status ON cv_analyses(status);
CREATE INDEX IF NOT EXISTS idx_cv_analyses_created_at ON cv_analyses(created_at);
