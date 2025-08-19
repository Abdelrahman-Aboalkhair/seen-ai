-- Fix RLS policy for interview_sessions to allow public access via session token
DROP POLICY IF EXISTS "Candidates can access their own sessions" ON interview_sessions;
CREATE POLICY "Candidates can access their own sessions" ON interview_sessions
  FOR SELECT USING (
    session_token IS NOT NULL
  );

-- Also allow candidates to update their own sessions
DROP POLICY IF EXISTS "Candidates can update their own sessions" ON interview_sessions;
CREATE POLICY "Candidates can update their own sessions" ON interview_sessions
  FOR UPDATE USING (
    session_token IS NOT NULL
  );

-- Fix RLS policy for interview_answers to allow public access via session token
DROP POLICY IF EXISTS "Candidates can insert their own answers" ON interview_answers;
CREATE POLICY "Candidates can insert their own answers" ON interview_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions 
      WHERE interview_sessions.id = interview_answers.session_id
      AND interview_sessions.session_token IS NOT NULL
    )
  );
