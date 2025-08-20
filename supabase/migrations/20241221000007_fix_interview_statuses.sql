-- Function to manually update interview statuses based on session status
CREATE OR REPLACE FUNCTION fix_interview_statuses()
RETURNS void AS $$
BEGIN
  -- Update interviews with all completed sessions to 'completed'
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
  
  -- Update interviews with some pending/started sessions to 'in_progress'
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
  
  -- Update interviews with no sessions to 'questions_ready'
  UPDATE interviews 
  SET status = 'questions_ready', updated_at = NOW()
  WHERE id NOT IN (
    SELECT DISTINCT interview_id FROM interview_sessions
  );
END;
$$ LANGUAGE plpgsql;

-- Execute the function to fix current statuses
SELECT fix_interview_statuses();

-- Create a function to get interview statistics
CREATE OR REPLACE FUNCTION get_interview_statistics()
RETURNS TABLE (
  total_interviews INTEGER,
  questions_ready INTEGER,
  in_progress INTEGER,
  completed INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_interviews,
    COUNT(*) FILTER (WHERE status = 'questions_ready')::INTEGER as questions_ready,
    COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER as in_progress,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed
  FROM interviews;
END;
$$ LANGUAGE plpgsql;
