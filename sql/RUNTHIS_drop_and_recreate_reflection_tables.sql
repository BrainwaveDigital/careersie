-- ============================================================
-- IMPORTANT: Run this ENTIRE script in Supabase SQL Editor
-- This will drop old tables and recreate with profile_id
-- ============================================================

-- Step 1: Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS reflection_responses CASCADE;
DROP TABLE IF EXISTS self_reflection_insights CASCADE;

-- Step 2: Drop existing views
DROP VIEW IF EXISTS reflection_insights_summary CASCADE;
DROP VIEW IF EXISTS reflection_analytics CASCADE;

-- Step 3: Create new tables with profile_id

-- Main Self-Reflection Insights Table
CREATE TABLE self_reflection_insights (
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
  career_motivations JSONB,
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

-- Individual Reflection Responses Table
CREATE TABLE reflection_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reflection_id UUID NOT NULL REFERENCES self_reflection_insights(id) ON DELETE CASCADE,
  
  question_id VARCHAR(10) NOT NULL,
  question_text TEXT NOT NULL,
  question_category VARCHAR(50) NOT NULL,
  question_type VARCHAR(20) NOT NULL,
  response_value TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX idx_self_reflection_profile ON self_reflection_insights(profile_id);
CREATE INDEX idx_self_reflection_date ON self_reflection_insights(submission_date);
CREATE INDEX idx_self_reflection_completed ON self_reflection_insights(completed);
CREATE INDEX idx_reflection_responses_reflection ON reflection_responses(reflection_id);
CREATE INDEX idx_reflection_responses_category ON reflection_responses(question_category);
CREATE INDEX idx_reflection_responses_type ON reflection_responses(question_type);
CREATE INDEX idx_self_reflection_motivations ON self_reflection_insights USING GIN (career_motivations);
CREATE INDEX idx_self_reflection_all_responses ON self_reflection_insights USING GIN (all_responses);

-- Step 5: Create trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_self_reflection_updated_at
  BEFORE UPDATE ON self_reflection_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Create views
CREATE VIEW reflection_insights_summary AS
SELECT 
  sri.id,
  sri.profile_id,
  p.full_name,
  p.email,
  sri.submission_date,
  sri.completed,
  
  CASE 
    WHEN sri.has_clear_career_direction >= 4 THEN 'Clear'
    WHEN sri.has_clear_career_direction = 3 THEN 'Somewhat Clear'
    ELSE 'Exploring'
  END as career_clarity,
  
  sri.role_within_next_year,
  
  CASE 
    WHEN sri.career_motivations IS NOT NULL 
    THEN jsonb_array_length(sri.career_motivations)
    ELSE 0
  END as motivation_count,
  
  CASE 
    WHEN sri.career_fulfillment_rating >= 4 THEN 'Fulfilled'
    WHEN sri.career_fulfillment_rating = 3 THEN 'Neutral'
    ELSE 'Seeking Fulfillment'
  END as fulfillment_level,
  
  CASE 
    WHEN sri.seeks_development_rating >= 4 THEN 'Proactive'
    WHEN sri.seeks_development_rating = 3 THEN 'Moderate'
    ELSE 'Passive'
  END as development_orientation,
  
  sri.preferred_work_environment,
  sri.problem_solving_approach,
  
  CASE 
    WHEN sri.leadership_preference_rating >= 4 THEN 'Leadership-Oriented'
    WHEN sri.leadership_preference_rating = 3 THEN 'Balanced'
    ELSE 'Individual Contributor'
  END as leadership_inclination,
  
  CASE 
    WHEN sri.reflects_regularly_rating >= 4 THEN 'Regular Reflector'
    ELSE 'Occasional Reflector'
  END as reflection_habit
  
FROM self_reflection_insights sri
LEFT JOIN profiles p ON sri.profile_id = p.id;

CREATE VIEW reflection_analytics AS
SELECT 
  COUNT(*) as total_reflections,
  COUNT(CASE WHEN has_clear_career_direction >= 4 THEN 1 END) as clear_career_direction_count,
  COUNT(CASE WHEN has_clear_career_direction = 3 THEN 1 END) as somewhat_clear_count,
  COUNT(CASE WHEN has_clear_career_direction <= 2 THEN 1 END) as exploring_count,
  AVG(career_fulfillment_rating) as avg_career_fulfillment,
  AVG(seeks_development_rating) as avg_development_seeking,
  AVG(leadership_preference_rating) as avg_leadership_preference,
  preferred_work_environment,
  COUNT(*) as env_count
FROM self_reflection_insights
WHERE completed = true
GROUP BY preferred_work_environment
ORDER BY env_count DESC;

-- Step 7: Enable RLS
ALTER TABLE self_reflection_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_responses ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies
CREATE POLICY "Users can view own reflections"
  ON self_reflection_insights FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can create own reflections"
  ON self_reflection_insights FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own incomplete reflections"
  ON self_reflection_insights FOR UPDATE
  USING (auth.uid() = profile_id AND completed = false);

CREATE POLICY "Service role can manage all reflections"
  ON self_reflection_insights FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view own responses"
  ON reflection_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM self_reflection_insights 
      WHERE id = reflection_id 
      AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all responses"
  ON reflection_responses FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Step 9: Add comments
COMMENT ON TABLE self_reflection_insights IS 'Stores self-reflection questionnaire responses for career development insights';
COMMENT ON TABLE reflection_responses IS 'Normalized storage of individual reflection question responses for detailed analysis';
COMMENT ON COLUMN self_reflection_insights.all_responses IS 'JSONB backup of all responses for flexibility and data preservation';

-- ============================================================
-- SUCCESS! Tables recreated with profile_id
-- ============================================================
