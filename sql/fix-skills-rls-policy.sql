-- Fix RLS policy for skills table
-- Issue: New row violates row-level security policy for table "skills"
-- Root cause: The policy checks profile ownership, but might not work correctly for new inserts

-- Drop existing policy
DROP POLICY IF EXISTS "skills_profile_owner_or_admin" ON public.skills;

-- Recreate with explicit INSERT, SELECT, UPDATE, DELETE policies
-- This ensures that checks work correctly for different operations

-- SELECT: User can view skills from their own profiles
CREATE POLICY "skills_select_owner" ON public.skills
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = public.skills.profile_id 
      AND p.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = auth.uid())
  );

-- INSERT: User can insert skills for their own profiles
-- The WITH CHECK verifies the profile_id being inserted belongs to the user
CREATE POLICY "skills_insert_owner" ON public.skills
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = public.skills.profile_id 
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
      WHERE p.id = public.skills.profile_id 
      AND p.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = public.skills.profile_id 
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
      WHERE p.id = public.skills.profile_id 
      AND p.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = auth.uid())
  );

-- Verify policies are active
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'skills';
