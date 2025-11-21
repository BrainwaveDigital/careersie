-- SIMPLIFIED FIX: RLS policies without app_admins dependency
-- Run this if app_admins table doesn't exist or to simplify policies

-- Drop all existing policies
DROP POLICY IF EXISTS "skills_profile_owner_or_admin" ON public.skills;
DROP POLICY IF EXISTS "skills_select_owner" ON public.skills;
DROP POLICY IF EXISTS "skills_insert_owner" ON public.skills;
DROP POLICY IF EXISTS "skills_update_owner" ON public.skills;
DROP POLICY IF EXISTS "skills_delete_owner" ON public.skills;

-- SELECT: User can view skills from their own profiles
CREATE POLICY "skills_select_owner" ON public.skills
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = skills.profile_id 
      AND p.user_id = auth.uid()
    )
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = skills.profile_id 
      AND p.user_id = auth.uid()
    )
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
  );

-- Verify policies
SELECT 
  policyname,
  cmd,
  '✅ Created' as status
FROM pg_policies 
WHERE tablename = 'skills'
ORDER BY cmd;
