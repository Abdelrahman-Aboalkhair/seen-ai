-- Add missing columns to existing cv_analyses table for bulk analysis support
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS bulk_analysis_id UUID;
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS cv_index INTEGER;
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS cv_type TEXT;
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS cv_text TEXT;
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS analysis_result JSONB;
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add foreign key constraint for bulk_analysis_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'cv_analyses_bulk_analysis_id_fkey'
  ) THEN
    ALTER TABLE cv_analyses 
    ADD CONSTRAINT cv_analyses_bulk_analysis_id_fkey 
    FOREIGN KEY (bulk_analysis_id) REFERENCES bulk_cv_analyses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add check constraint for cv_type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'cv_analyses_cv_type_check'
  ) THEN
    ALTER TABLE cv_analyses 
    ADD CONSTRAINT cv_analyses_cv_type_check 
    CHECK (cv_type IN ('file', 'text'));
  END IF;
END $$;

-- Create index for bulk_analysis_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_cv_analyses_bulk_analysis_id ON cv_analyses(bulk_analysis_id);
