-- Update existing interview status values to match new flow
UPDATE interviews 
SET status = 'pending' 
WHERE status = 'draft';

UPDATE interviews 
SET status = 'active' 
WHERE status = 'questions_ready' AND id IN (
  SELECT DISTINCT interview_id 
  FROM interview_candidates 
  WHERE interview_id = interviews.id
);

-- Update interview status based on session completion
UPDATE interviews 
SET status = 'completed', updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT interview_id 
  FROM interview_sessions 
  WHERE status = 'completed'
  AND interview_id NOT IN (
    SELECT DISTINCT interview_id 
    FROM interview_sessions 
    WHERE status != 'completed'
  )
);

-- Update interviews with pending/started sessions to have 'active' status
UPDATE interviews 
SET status = 'active', updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT interview_id 
  FROM interview_sessions 
  WHERE status IN ('pending', 'started')
  AND interview_id NOT IN (
    SELECT DISTINCT interview_id 
    FROM interview_sessions 
    WHERE status = 'completed'
  )
);
