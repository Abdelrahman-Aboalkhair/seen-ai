-- Add bulk_analysis_id column to existing cv_analyses table
ALTER TABLE cv_analyses 
ADD COLUMN IF NOT EXISTS bulk_analysis_id UUID REFERENCES bulk_cv_analyses(id) ON DELETE CASCADE;

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_cv_analyses_bulk_analysis_id ON cv_analyses(bulk_analysis_id);
