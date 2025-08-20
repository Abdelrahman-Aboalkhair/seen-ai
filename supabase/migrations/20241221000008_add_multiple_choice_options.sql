-- Add multiple choice options to interview_questions table
ALTER TABLE interview_questions 
ADD COLUMN IF NOT EXISTS question_options JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS correct_answer TEXT,
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'text' CHECK (question_type IN ('text', 'multiple_choice'));

-- Add comment to explain the structure
COMMENT ON COLUMN interview_questions.question_options IS 'JSON array of multiple choice options: [{"id": "A", "text": "Option text"}, ...]';
COMMENT ON COLUMN interview_questions.correct_answer IS 'Correct answer for multiple choice questions (e.g., "A", "B", "C", "D")';
COMMENT ON COLUMN interview_questions.question_type IS 'Type of question: text (free response) or multiple_choice';
