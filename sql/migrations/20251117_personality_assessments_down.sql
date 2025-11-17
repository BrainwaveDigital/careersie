-- Rollback migration for personality assessment tables
-- Date: 2025-11-17

-- Drop view
DROP VIEW IF EXISTS public.personality_assessment_summary;

-- Drop policies
DROP POLICY IF EXISTS "Admins with permission can view personality responses" ON public.personality_responses;
DROP POLICY IF EXISTS "Admins with permission can view personality assessments" ON public.personality_assessments;
DROP POLICY IF EXISTS "Super admins can view all personality assessments" ON public.personality_assessments;
DROP POLICY IF EXISTS "Users can delete own personality responses" ON public.personality_responses;
DROP POLICY IF EXISTS "Users can insert own personality responses" ON public.personality_responses;
DROP POLICY IF EXISTS "Users can view own personality responses" ON public.personality_responses;
DROP POLICY IF EXISTS "Users can update own personality assessments" ON public.personality_assessments;
DROP POLICY IF EXISTS "Users can insert own personality assessments" ON public.personality_assessments;
DROP POLICY IF EXISTS "Users can view own personality assessments" ON public.personality_assessments;

-- Drop indexes
DROP INDEX IF EXISTS public.idx_personality_responses_dimension;
DROP INDEX IF EXISTS public.idx_personality_responses_assessment_id;
DROP INDEX IF EXISTS public.idx_personality_assessments_completed;
DROP INDEX IF EXISTS public.idx_personality_assessments_profile_id;

-- Drop tables
DROP TABLE IF EXISTS public.personality_responses CASCADE;
DROP TABLE IF EXISTS public.personality_assessments CASCADE;

-- Success message
SELECT 'Personality assessment tables dropped successfully!' as message;
