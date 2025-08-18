-- First, create the bulk_cv_analyses table if it doesn't exist
CREATE TABLE IF NOT EXISTS bulk_cv_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  job_description TEXT,
  skills_required TEXT NOT NULL,
  total_cvs INTEGER NOT NULL DEFAULT 0,
  processed_cvs INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'completed_with_errors', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check if cv_analyses table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cv_analyses') THEN
    CREATE TABLE cv_analyses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bulk_analysis_id UUID REFERENCES bulk_cv_analyses(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      cv_index INTEGER NOT NULL,
      cv_type TEXT NOT NULL CHECK (cv_type IN ('file', 'text')),
      job_title TEXT NOT NULL,
      job_description TEXT,
      skills_required TEXT NOT NULL,
      cv_text TEXT,
      analysis_result JSONB,
      error_message TEXT,
      status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add missing columns to cv_analyses table if they don't exist
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS bulk_analysis_id UUID REFERENCES bulk_cv_analyses(id) ON DELETE CASCADE;
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS cv_index INTEGER;
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS cv_type TEXT CHECK (cv_type IN ('file', 'text'));
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS cv_text TEXT;
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS analysis_result JSONB;
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed'));

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_bulk_cv_analyses_user_id ON bulk_cv_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_cv_analyses_status ON bulk_cv_analyses(status);
CREATE INDEX IF NOT EXISTS idx_cv_analyses_bulk_analysis_id ON cv_analyses(bulk_analysis_id);
CREATE INDEX IF NOT EXISTS idx_cv_analyses_user_id ON cv_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_analyses_status ON cv_analyses(status);

-- Enable RLS
ALTER TABLE bulk_cv_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_analyses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own bulk analyses" ON bulk_cv_analyses;
DROP POLICY IF EXISTS "Users can insert their own bulk analyses" ON bulk_cv_analyses;
DROP POLICY IF EXISTS "Users can update their own bulk analyses" ON bulk_cv_analyses;
DROP POLICY IF EXISTS "Users can view their own CV analyses" ON cv_analyses;
DROP POLICY IF EXISTS "Users can insert their own CV analyses" ON cv_analyses;
DROP POLICY IF EXISTS "Users can update their own CV analyses" ON cv_analyses;

-- Create RLS policies for bulk_cv_analyses
CREATE POLICY "Users can view their own bulk analyses" ON bulk_cv_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bulk analyses" ON bulk_cv_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bulk analyses" ON bulk_cv_analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for cv_analyses
CREATE POLICY "Users can view their own CV analyses" ON cv_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own CV analyses" ON cv_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CV analyses" ON cv_analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_bulk_cv_analyses_updated_at ON bulk_cv_analyses;
DROP TRIGGER IF EXISTS update_cv_analyses_updated_at ON cv_analyses;

-- Create triggers for updated_at
CREATE TRIGGER update_bulk_cv_analyses_updated_at
  BEFORE UPDATE ON bulk_cv_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cv_analyses_updated_at
  BEFORE UPDATE ON cv_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
