-- Function to update interview status based on session status
CREATE OR REPLACE FUNCTION update_interview_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all sessions for this interview are completed
  IF EXISTS (
    SELECT 1 FROM interview_sessions 
    WHERE interview_id = NEW.interview_id 
    AND status != 'completed'
  ) THEN
    -- Not all sessions are completed, keep interview status as 'active'
    UPDATE interviews 
    SET status = 'active', updated_at = NOW()
    WHERE id = NEW.interview_id AND status != 'active';
  ELSE
    -- All sessions are completed, update interview status to 'completed'
    UPDATE interviews 
    SET status = 'completed', updated_at = NOW()
    WHERE id = NEW.interview_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update interview status when session status changes
DROP TRIGGER IF EXISTS trigger_update_interview_status ON interview_sessions;
CREATE TRIGGER trigger_update_interview_status
  AFTER UPDATE OF status ON interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_interview_status();

-- Also create trigger for when new sessions are inserted
DROP TRIGGER IF EXISTS trigger_update_interview_status_insert ON interview_sessions;
CREATE TRIGGER trigger_update_interview_status_insert
  AFTER INSERT ON interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_interview_status();

-- Update existing interviews that have completed sessions to have 'completed' status
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

-- Update interviews with pending/started sessions to have 'in_progress' status
UPDATE interviews 
SET status = 'in_progress', updated_at = NOW()
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
