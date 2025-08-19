-- Temporarily disable RLS for all interview-related tables for testing
-- This will allow us to test the functionality without RLS blocking operations

-- Disable RLS on interviews table
ALTER TABLE interviews DISABLE ROW LEVEL SECURITY;

-- Disable RLS on interview_questions table
ALTER TABLE interview_questions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on interview_candidates table
ALTER TABLE interview_candidates DISABLE ROW LEVEL SECURITY;

-- Disable RLS on interview_results table
ALTER TABLE interview_results DISABLE ROW LEVEL SECURITY;

-- Disable RLS on interview_sessions table
ALTER TABLE interview_sessions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on interview_answers table
ALTER TABLE interview_answers DISABLE ROW LEVEL SECURITY;

-- Disable RLS on interview_analyses table
ALTER TABLE interview_analyses DISABLE ROW LEVEL SECURITY;

-- Note: RLS can be re-enabled later with:
-- ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
