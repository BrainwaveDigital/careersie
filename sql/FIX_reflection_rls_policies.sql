-- ============================================================
-- Fix RLS policies to work with user_id from profiles table
-- ============================================================

-- The issue: profile_id in self_reflection_insights references profiles.id
-- But profiles.id might not equal auth.uid()
-- We need to check via the profiles table's user_id column

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own reflections" ON self_reflection_insights;
DROP POLICY IF EXISTS "Users can create own reflections" ON self_reflection_insights;
DROP POLICY IF EXISTS "Users can update own incomplete reflections" ON self_reflection_insights;
DROP POLICY IF EXISTS "Service role can manage all reflections" ON self_reflection_insights;
DROP POLICY IF EXISTS "Users can view own responses" ON reflection_responses;
DROP POLICY IF EXISTS "Service role can manage all responses" ON reflection_responses;

-- Create new policies that check via profiles.user_id
CREATE POLICY "Users can view own reflections"
  ON self_reflection_insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = self_reflection_insights.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own reflections"
  ON self_reflection_insights FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = self_reflection_insights.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own incomplete reflections"
  ON self_reflection_insights FOR UPDATE
  USING (
    completed = false 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = self_reflection_insights.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all reflections"
  ON self_reflection_insights FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view own responses"
  ON reflection_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM self_reflection_insights sri
      JOIN profiles p ON p.id = sri.profile_id
      WHERE sri.id = reflection_responses.reflection_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all responses"
  ON reflection_responses FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- SUCCESS! RLS policies updated to work with profiles.user_id
-- ============================================================
