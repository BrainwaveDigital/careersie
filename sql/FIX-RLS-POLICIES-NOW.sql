-- URGENT FIX: Update RLS policies for skills table
-- Profile ownership is correct but policies are blocking inserts
-- Run this entire script in Supabase SQL Editor

-- =============================================================================
-- STEP 1: Check current policies
-- =============================================================================
SELECT 
  policyname,
  cmd as "Command",
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies 
WHERE tablename = 'skills'
ORDER BY cmd;

-- =============================================================================
-- STEP 2: Drop old policies
-- =============================================================================
DROP POLICY IF EXISTS "skills_profile_owner_or_admin" ON public.skills;
DROP POLICY IF EXISTS "skills_select_owner" ON public.skills;
DROP POLICY IF EXISTS "skills_insert_owner" ON public.skills;
DROP POLICY IF EXISTS "skills_update_owner" ON public.skills;
DROP POLICY IF EXISTS "skills_delete_owner" ON public.skills;

-- =============================================================================
-- STEP 3: Create new working policies
-- =============================================================================

-- SELECT: User can view skills from their own profiles
CREATE POLICY "skills_select_owner" ON public.skills
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = skills.profile_id 
      AND p.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = auth.uid())
  );

-- INSERT: User can insert skills for their own profiles
CREATE POLICY "skills_insert_owner" ON public.skills
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = skills.profile_id 
      AND p.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = auth.uid())
  );

-- UPDATE: User can update skills from their own profiles
CREATE POLICY "skills_update_owner" ON public.skills
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = skills.profile_id 
      AND p.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = skills.profile_id 
      AND p.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = auth.uid())
  );

-- DELETE: User can delete skills from their own profiles
CREATE POLICY "skills_delete_owner" ON public.skills
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = skills.profile_id 
      AND p.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = auth.uid())
  );

-- =============================================================================
-- STEP 4: Test the policies with your specific data
-- =============================================================================

-- Test as the authenticated user (this simulates what the app does)
-- Set the user context to match your browser session
SET LOCAL "request.jwt.claims" = '{"sub": "ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892"}';

-- Test: Can we insert a skill now?
SELECT 
  'Test INSERT permission' as test,
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95'
    AND p.user_id = 'ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892'
  ) as profile_check,
  'ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892' as auth_uid;

-- =============================================================================
-- STEP 5: Verify new policies
-- =============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as "Command",
  permissive as "Permissive",
  '✅ Policy active' as status
FROM pg_policies 
WHERE tablename = 'skills'
ORDER BY cmd;

-- Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- All should show "✅ Policy active"
