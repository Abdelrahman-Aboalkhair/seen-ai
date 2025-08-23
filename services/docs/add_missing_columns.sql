-- Add missing credits_used column to interviews table
ALTER TABLE interviews 
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;

-- Add other missing columns that might be needed
ALTER TABLE interviews 
ADD COLUMN IF NOT EXISTS test_types JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS language_proficiency TEXT,
ADD COLUMN IF NOT EXISTS test_level TEXT DEFAULT 'intermediate',
ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to interview_questions table
ALTER TABLE interview_questions 
ADD COLUMN IF NOT EXISTS test_type TEXT,
ADD COLUMN IF NOT EXISTS model_answer TEXT,
ADD COLUMN IF NOT EXISTS skill_measured TEXT,
ADD COLUMN IF NOT EXISTS question_duration_seconds INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS question_order INTEGER DEFAULT 0;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'interviews' 
AND column_name IN ('credits_used', 'test_types', 'language_proficiency', 'test_level', 'required_skills', 'expires_at');
