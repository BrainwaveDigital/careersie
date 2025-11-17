-- Personality Assessment Tables Migration
-- Creates tables for storing personality questionnaire data
-- Date: 2025-11-17

-- Main personality assessments table
CREATE TABLE IF NOT EXISTS public.personality_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  assessment_date TIMESTAMPTZ DEFAULT now(),
  time_taken_seconds INTEGER,
  
  -- Big Five OCEAN scores (0-100)
  openness_score NUMERIC(5,2),
  conscientiousness_score NUMERIC(5,2),
  extraversion_score NUMERIC(5,2),
  agreeableness_score NUMERIC(5,2),
  emotional_stability_score NUMERIC(5,2),
  overall_score NUMERIC(5,2),
  
  -- Store all responses as JSONB for flexibility
  responses JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure one assessment per profile
  UNIQUE(profile_id)
);

-- Individual responses table for detailed analysis
CREATE TABLE IF NOT EXISTS public.personality_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.personality_assessments(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_text TEXT,
  dimension TEXT, -- openness, conscientiousness, extraversion, agreeableness, emotional_stability
  response_value INTEGER NOT NULL CHECK (response_value BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_personality_assessments_profile_id 
  ON public.personality_assessments(profile_id);
  
CREATE INDEX IF NOT EXISTS idx_personality_assessments_completed 
  ON public.personality_assessments(completed);
  
CREATE INDEX IF NOT EXISTS idx_personality_responses_assessment_id 
  ON public.personality_responses(assessment_id);
  
CREATE INDEX IF NOT EXISTS idx_personality_responses_dimension 
  ON public.personality_responses(dimension);

-- RLS Policies
ALTER TABLE public.personality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own personality assessments" ON public.personality_assessments;
DROP POLICY IF EXISTS "Users can insert own personality assessments" ON public.personality_assessments;
DROP POLICY IF EXISTS "Users can update own personality assessments" ON public.personality_assessments;
DROP POLICY IF EXISTS "Users can view own personality responses" ON public.personality_responses;
DROP POLICY IF EXISTS "Users can insert own personality responses" ON public.personality_responses;
DROP POLICY IF EXISTS "Users can delete own personality responses" ON public.personality_responses;
DROP POLICY IF EXISTS "Super admins can view all personality assessments" ON public.personality_assessments;
DROP POLICY IF EXISTS "Admins with permission can view personality assessments" ON public.personality_assessments;
DROP POLICY IF EXISTS "Admins with permission can view personality responses" ON public.personality_responses;

-- Users can view/insert/update their own assessments
CREATE POLICY "Users can view own personality assessments"
  ON public.personality_assessments
  FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own personality assessments"
  ON public.personality_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own personality assessments"
  ON public.personality_assessments
  FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Users can view their own responses
CREATE POLICY "Users can view own personality responses"
  ON public.personality_responses
  FOR SELECT
  TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM public.personality_assessments
      WHERE profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Users can insert their own responses
CREATE POLICY "Users can insert own personality responses"
  ON public.personality_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM public.personality_assessments
      WHERE profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Users can delete their own responses (for updates)
CREATE POLICY "Users can delete own personality responses"
  ON public.personality_responses
  FOR DELETE
  TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM public.personality_assessments
      WHERE profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Super admins can view all assessments (using helper function to avoid recursion)
CREATE POLICY "Super admins can view all personality assessments"
  ON public.personality_assessments
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Admins with permission can view assessments (using helper function)
CREATE POLICY "Admins with permission can view personality assessments"
  ON public.personality_assessments
  FOR SELECT
  TO authenticated
  USING (has_permission('view_personality_assessments'));

-- Admins with permission can view responses (using helper function)
CREATE POLICY "Admins with permission can view personality responses"
  ON public.personality_responses
  FOR SELECT
  TO authenticated
  USING (has_permission('view_personality_assessments'));

-- Create view for admin dashboard
CREATE OR REPLACE VIEW public.personality_assessment_summary AS
SELECT 
  pa.id,
  pa.profile_id,
  p.full_name,
  p.email,
  pa.completed,
  pa.assessment_date,
  pa.time_taken_seconds,
  pa.openness_score,
  pa.conscientiousness_score,
  pa.extraversion_score,
  pa.agreeableness_score,
  pa.emotional_stability_score,
  pa.overall_score,
  pa.created_at
FROM public.personality_assessments pa
JOIN public.profiles p ON pa.profile_id = p.id
ORDER BY pa.assessment_date DESC;

-- Grant access to the view
GRANT SELECT ON public.personality_assessment_summary TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.personality_assessments IS 'Stores Big Five OCEAN personality assessment results';
COMMENT ON TABLE public.personality_responses IS 'Stores individual question responses for detailed analysis';
COMMENT ON VIEW public.personality_assessment_summary IS 'Admin view of all personality assessments with user details';

-- Success message
SELECT 'Personality assessment tables created successfully!' as message;
