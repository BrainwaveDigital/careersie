-- Main Self-Reflection Insights Table
CREATE TABLE IF NOT EXISTS self_reflection_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Metadata
  completed BOOLEAN DEFAULT false,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_taken_seconds INTEGER,
  
  -- Career Goals & Aspirations (stored as TEXT/JSONB for flexibility)
  career_goals_3_5_years TEXT,
  has_clear_career_direction INTEGER CHECK (has_clear_career_direction >= 1 AND has_clear_career_direction <= 5),
  role_within_next_year VARCHAR(100),
  
  -- Motivations & Values
  career_motivations JSONB, -- Array of selected motivations
  sense_of_fulfillment TEXT,
  career_fulfillment_rating INTEGER CHECK (career_fulfillment_rating >= 1 AND career_fulfillment_rating <= 5),
  
  -- Strengths & Development
  professional_strengths TEXT,
  skills_to_develop TEXT,
  seeks_development_rating INTEGER CHECK (seeks_development_rating >= 1 AND seeks_development_rating <= 5),
  
  -- Work Style Preferences
  preferred_work_environment VARCHAR(100),
  problem_solving_approach VARCHAR(100),
  leadership_preference_rating INTEGER CHECK (leadership_preference_rating >= 1 AND leadership_preference_rating <= 5),
  
  -- Past Experiences & Learnings
  proudest_achievement TEXT,
  biggest_challenge_and_learning TEXT,
  reflects_regularly_rating INTEGER CHECK (reflects_regularly_rating >= 1 AND reflects_regularly_rating <= 5),
  
  -- Store full response data as JSONB for complete flexibility
  all_responses JSONB,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual Reflection Responses Table (normalized approach for detailed analysis)
CREATE TABLE IF NOT EXISTS reflection_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reflection_id UUID NOT NULL REFERENCES self_reflection_insights(id) ON DELETE CASCADE,
  
  question_id VARCHAR(10) NOT NULL, -- e.g., 'cg1', 'mv2', 'ws3'
  question_text TEXT NOT NULL,
  question_category VARCHAR(50) NOT NULL, -- career_goals, motivations, strengths, work_style, experiences
  question_type VARCHAR(20) NOT NULL, -- scale, textarea, multiple, checkbox
  response_value TEXT, -- Can store text, number, or JSON array
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_self_reflection_profile ON self_reflection_insights(profile_id);
CREATE INDEX IF NOT EXISTS idx_self_reflection_date ON self_reflection_insights(submission_date);
CREATE INDEX IF NOT EXISTS idx_self_reflection_completed ON self_reflection_insights(completed);
CREATE INDEX IF NOT EXISTS idx_reflection_responses_reflection ON reflection_responses(reflection_id);
CREATE INDEX IF NOT EXISTS idx_reflection_responses_category ON reflection_responses(question_category);
CREATE INDEX IF NOT EXISTS idx_reflection_responses_type ON reflection_responses(question_type);

-- GIN index for JSONB columns to enable fast searches
CREATE INDEX IF NOT EXISTS idx_self_reflection_motivations ON self_reflection_insights USING GIN (career_motivations);
CREATE INDEX IF NOT EXISTS idx_self_reflection_all_responses ON self_reflection_insights USING GIN (all_responses);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_self_reflection_updated_at ON self_reflection_insights;
CREATE TRIGGER update_self_reflection_updated_at
  BEFORE UPDATE ON self_reflection_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View for easy querying and analysis
CREATE OR REPLACE VIEW reflection_insights_summary AS
SELECT 
  sri.id,
  sri.profile_id,
  p.full_name,
  p.email,
  sri.submission_date,
  sri.completed,
  
  -- Career direction clarity
  CASE 
    WHEN sri.has_clear_career_direction >= 4 THEN 'Clear'
    WHEN sri.has_clear_career_direction = 3 THEN 'Somewhat Clear'
    ELSE 'Exploring'
  END as career_clarity,
  
  sri.role_within_next_year,
  
  -- Motivation count
  CASE 
    WHEN sri.career_motivations IS NOT NULL 
    THEN jsonb_array_length(sri.career_motivations)
    ELSE 0
  END as motivation_count,
  
  -- Career fulfillment level
  CASE 
    WHEN sri.career_fulfillment_rating >= 4 THEN 'Fulfilled'
    WHEN sri.career_fulfillment_rating = 3 THEN 'Neutral'
    ELSE 'Seeking Fulfillment'
  END as fulfillment_level,
  
  -- Development orientation
  CASE 
    WHEN sri.seeks_development_rating >= 4 THEN 'Proactive'
    WHEN sri.seeks_development_rating = 3 THEN 'Moderate'
    ELSE 'Passive'
  END as development_orientation,
  
  sri.preferred_work_environment,
  sri.problem_solving_approach,
  
  -- Leadership inclination
  CASE 
    WHEN sri.leadership_preference_rating >= 4 THEN 'Leadership-Oriented'
    WHEN sri.leadership_preference_rating = 3 THEN 'Balanced'
    ELSE 'Individual Contributor'
  END as leadership_inclination,
  
  -- Self-reflection habit
  CASE 
    WHEN sri.reflects_regularly_rating >= 4 THEN 'Regular Reflector'
    ELSE 'Occasional Reflector'
  END as reflection_habit
  
FROM self_reflection_insights sri
LEFT JOIN profiles p ON sri.profile_id = p.id;

-- Analytics view for hiring managers
CREATE OR REPLACE VIEW reflection_analytics AS
SELECT 
  COUNT(*) as total_reflections,
  
  -- Career clarity distribution
  COUNT(CASE WHEN has_clear_career_direction >= 4 THEN 1 END) as clear_career_direction_count,
  COUNT(CASE WHEN has_clear_career_direction = 3 THEN 1 END) as somewhat_clear_count,
  COUNT(CASE WHEN has_clear_career_direction <= 2 THEN 1 END) as exploring_count,
  
  -- Fulfillment levels
  AVG(career_fulfillment_rating) as avg_career_fulfillment,
  
  -- Development seeking
  AVG(seeks_development_rating) as avg_development_seeking,
  
  -- Leadership preference
  AVG(leadership_preference_rating) as avg_leadership_preference,
  
  -- Most common work environments
  preferred_work_environment,
  COUNT(*) as env_count
  
FROM self_reflection_insights
WHERE completed = true
GROUP BY preferred_work_environment
ORDER BY env_count DESC;

-- Row Level Security (RLS) Policies
ALTER TABLE self_reflection_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own reflections
DROP POLICY IF EXISTS "Users can view own reflections" ON self_reflection_insights;
CREATE POLICY "Users can view own reflections"
  ON self_reflection_insights
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Policy: Users can insert their own reflections
DROP POLICY IF EXISTS "Users can create own reflections" ON self_reflection_insights;
CREATE POLICY "Users can create own reflections"
  ON self_reflection_insights
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Policy: Users can update their own incomplete reflections
DROP POLICY IF EXISTS "Users can update own incomplete reflections" ON self_reflection_insights;
CREATE POLICY "Users can update own incomplete reflections"
  ON self_reflection_insights
  FOR UPDATE
  USING (auth.uid() = profile_id AND completed = false);

-- Policy: Service role can view all reflections (for admin)
DROP POLICY IF EXISTS "Service role can manage all reflections" ON self_reflection_insights;
CREATE POLICY "Service role can manage all reflections"
  ON self_reflection_insights
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Policy: Responses follow same access as parent reflection
DROP POLICY IF EXISTS "Users can view own responses" ON reflection_responses;
CREATE POLICY "Users can view own responses"
  ON reflection_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM self_reflection_insights 
      WHERE id = reflection_id 
      AND profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can manage all responses" ON reflection_responses;
CREATE POLICY "Service role can manage all responses"
  ON reflection_responses
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Comments for documentation
COMMENT ON TABLE self_reflection_insights IS 'Stores self-reflection questionnaire responses for career development insights';
COMMENT ON TABLE reflection_responses IS 'Normalized storage of individual reflection question responses for detailed analysis';
COMMENT ON COLUMN self_reflection_insights.all_responses IS 'JSONB backup of all responses for flexibility and data preservation';
COMMENT ON VIEW reflection_insights_summary IS 'Provides human-readable summary of reflection data with categorizations';
COMMENT ON VIEW reflection_analytics IS 'Aggregated analytics for hiring managers and career counselors';
