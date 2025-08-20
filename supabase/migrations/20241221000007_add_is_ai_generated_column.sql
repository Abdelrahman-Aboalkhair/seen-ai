-- Add missing is_ai_generated column to interview_questions table
ALTER TABLE interview_questions 
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT true;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_interview_questions_is_ai_generated ON interview_questions(is_ai_generated);

-- Update existing records to have is_ai_generated = true (since they were likely AI-generated)
UPDATE interview_questions 
SET is_ai_generated = true 
WHERE is_ai_generated IS NULL;
