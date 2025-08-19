-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  job_description TEXT,
  num_questions INTEGER DEFAULT 5,
  interview_type TEXT DEFAULT 'comprehensive' CHECK (interview_type IN ('comprehensive', 'technical', 'behavioral', 'mixed')),
  duration_minutes INTEGER DEFAULT 30,
  interview_mode TEXT DEFAULT 'biometric_with_questions' CHECK (interview_mode IN ('biometric_with_questions', 'questions_only', 'biometric_only')),
  status TEXT DEFAULT 'setup' CHECK (status IN ('setup', 'questions_ready', 'candidates_added', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interview_questions table
CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'general' CHECK (question_type IN ('general', 'technical', 'behavioral', 'situational')),
  is_ai_generated BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interview_candidates table
CREATE TABLE IF NOT EXISTS interview_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES talent_searches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  resume_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interview_results table (for dummy data)
CREATE TABLE IF NOT EXISTS interview_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES interview_candidates(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  notes TEXT,
  duration_minutes INTEGER,
  questions_answered INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  biometric_analysis JSONB, -- For future biometric data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interview_questions_interview_id ON interview_questions(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_candidates_interview_id ON interview_candidates(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_candidates_status ON interview_candidates(status);
CREATE INDEX IF NOT EXISTS idx_interview_results_interview_id ON interview_results(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_results_candidate_id ON interview_results(candidate_id);

-- Enable RLS
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for interviews
CREATE POLICY "Users can view their own interviews" ON interviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interviews" ON interviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interviews" ON interviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interviews" ON interviews
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for interview_questions
CREATE POLICY "Users can view questions for their interviews" ON interview_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_questions.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert questions for their interviews" ON interview_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_questions.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions for their interviews" ON interview_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_questions.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions for their interviews" ON interview_questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_questions.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

-- Create RLS policies for interview_candidates
CREATE POLICY "Users can view candidates for their interviews" ON interview_candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_candidates.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert candidates for their interviews" ON interview_candidates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_candidates.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update candidates for their interviews" ON interview_candidates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_candidates.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete candidates for their interviews" ON interview_candidates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_candidates.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

-- Create RLS policies for interview_results
CREATE POLICY "Users can view results for their interviews" ON interview_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_results.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert results for their interviews" ON interview_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_results.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update results for their interviews" ON interview_results
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_results.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete results for their interviews" ON interview_results
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_results.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_candidates_updated_at
  BEFORE UPDATE ON interview_candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
