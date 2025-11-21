-- Verify profile ownership and RLS setup for debugging
-- Run this to check if a user can insert skills into their profile

-- Check current user
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_email;

-- Check profiles for current user
SELECT 
  id,
  user_id,
  full_name,
  email,
  created_at
FROM public.profiles
WHERE user_id = auth.uid();

-- Check if RLS is enabled on skills table
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'skills';

-- Check all RLS policies on skills table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'skills'
ORDER BY cmd;

-- Test if current user can see their profile (this should return rows)
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  (p.user_id = auth.uid()) as is_owner
FROM public.profiles p
WHERE p.user_id = auth.uid();

-- Try to verify the RLS check that's failing
-- This simulates what happens when inserting a skill
SELECT 
  '<test-profile-id>' as profile_id,
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = '<test-profile-id>' 
    AND p.user_id = auth.uid()
  ) as can_insert_skill;

-- Note: Replace '<test-profile-id>' with the actual profile_id from your app
