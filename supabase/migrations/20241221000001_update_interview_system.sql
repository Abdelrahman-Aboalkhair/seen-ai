-- Update interviews table to support new test types and duration logic
ALTER TABLE interviews 
ADD COLUMN IF NOT EXISTS test_types JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS language_proficiency TEXT,
ADD COLUMN IF NOT EXISTS test_level TEXT DEFAULT 'intermediate' CHECK (test_level IN ('beginner', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update interview_questions table to support new question structure
ALTER TABLE interview_questions 
ADD COLUMN IF NOT EXISTS test_type TEXT,
ADD COLUMN IF NOT EXISTS model_answer TEXT,
ADD COLUMN IF NOT EXISTS skill_measured TEXT,
ADD COLUMN IF NOT EXISTS question_duration_seconds INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS question_order INTEGER DEFAULT 0;

-- Create interview_sessions table for candidate interview sessions
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES interview_candidates(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'started', 'completed', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interview_answers table for candidate responses
CREATE TABLE IF NOT EXISTS interview_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  time_taken_seconds INTEGER,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interview_analyses table for AI analysis results
CREATE TABLE IF NOT EXISTS interview_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  strengths TEXT[],
  weaknesses TEXT[],
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_interview_sessions_interview_id ON interview_sessions(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate_id ON interview_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_session_token ON interview_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interview_answers_session_id ON interview_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_answers_question_id ON interview_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_interview_analyses_session_id ON interview_analyses(session_id);

-- Enable RLS for new tables
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for interview_sessions
DROP POLICY IF EXISTS "Users can view sessions for their interviews" ON interview_sessions;
CREATE POLICY "Users can view sessions for their interviews" ON interview_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_sessions.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert sessions for their interviews" ON interview_sessions;
CREATE POLICY "Users can insert sessions for their interviews" ON interview_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_sessions.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update sessions for their interviews" ON interview_sessions;
CREATE POLICY "Users can update sessions for their interviews" ON interview_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_sessions.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

-- Allow candidates to access their own sessions via session token
DROP POLICY IF EXISTS "Candidates can access their own sessions" ON interview_sessions;
CREATE POLICY "Candidates can access their own sessions" ON interview_sessions
  FOR SELECT USING (
    session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
  );

-- Create RLS policies for interview_answers
DROP POLICY IF EXISTS "Users can view answers for their interviews" ON interview_answers;
CREATE POLICY "Users can view answers for their interviews" ON interview_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interview_sessions 
      JOIN interviews ON interviews.id = interview_sessions.interview_id
      WHERE interview_sessions.id = interview_answers.session_id 
      AND interviews.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Candidates can insert their own answers" ON interview_answers;
CREATE POLICY "Candidates can insert their own answers" ON interview_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions 
      WHERE interview_sessions.id = interview_answers.session_id
      AND interview_sessions.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
    )
  );

-- Create RLS policies for interview_analyses
DROP POLICY IF EXISTS "Users can view analyses for their interviews" ON interview_analyses;
CREATE POLICY "Users can view analyses for their interviews" ON interview_analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interview_sessions 
      JOIN interviews ON interviews.id = interview_sessions.interview_id
      WHERE interview_sessions.id = interview_analyses.session_id 
      AND interviews.user_id = auth.uid()
    )
  );

-- Create SQL functions
CREATE OR REPLACE FUNCTION generate_session_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_session_expired(session_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM interview_sessions 
    WHERE interview_sessions.session_token = session_token 
    AND expires_at < NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_interview_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_interview_sessions_updated_at ON interview_sessions;
CREATE TRIGGER update_interview_sessions_updated_at
  BEFORE UPDATE ON interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_interview_sessions_updated_at();
