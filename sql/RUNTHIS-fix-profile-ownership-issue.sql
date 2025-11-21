-- QUICK FIX: Profile Ownership Mismatch
-- Run this in Supabase SQL Editor to diagnose and fix the issue

-- =============================================================================
-- STEP 1: DIAGNOSIS - Run these queries first
-- =============================================================================

-- 1a. Who am I currently logged in as?
SELECT 
  auth.uid() as my_user_id,
  auth.email() as my_email;

-- 1b. Does the problem profile exist and who owns it?
SELECT 
  id as profile_id,
  user_id as owner_user_id,
  full_name,
  email,
  created_at
FROM public.profiles
WHERE id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- 1c. Do I have any other profiles?
SELECT 
  id as profile_id,
  user_id,
  full_name,
  email,
  created_at,
  'This is MY profile' as note
FROM public.profiles
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- =============================================================================
-- STEP 2: IDENTIFY THE ISSUE
-- =============================================================================
-- Compare the results:
-- - If query 1b returns NO rows: Profile doesn't exist (deleted or wrong ID)
-- - If query 1b returns a row but user_id ≠ my_user_id: Wrong owner
-- - If query 1b returns a row but user_id is NULL: Missing user_id
-- - If query 1c shows different profile(s): User has other profiles

-- =============================================================================
-- STEP 3: FIX OPTIONS (Choose ONE based on diagnosis)
-- =============================================================================

-- FIX A: Profile has NULL user_id - Set the correct owner
-- Uncomment and run if owner_user_id was NULL in step 1b
/*
UPDATE public.profiles
SET 
  user_id = auth.uid(),
  updated_at = now()
WHERE id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
  AND user_id IS NULL;

-- Verify the fix
SELECT id, user_id, full_name, 'Fixed!' as status
FROM public.profiles
WHERE id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';
*/

-- FIX B: Profile belongs to wrong user - Transfer ownership
-- ONLY run this if you're sure the profile should belong to current user
-- WARNING: This will transfer ALL related data (skills, experiences, etc.)
/*
UPDATE public.profiles
SET 
  user_id = auth.uid(),
  updated_at = now()
WHERE id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- Verify the fix
SELECT id, user_id, full_name, 'Ownership transferred!' as status
FROM public.profiles
WHERE id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';
*/

-- FIX C: Delete orphaned profile and start fresh
-- Use this if the profile is corrupted or you want to recreate it
/*
DELETE FROM public.profiles
WHERE id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- Note: Cascading deletes will remove:
-- - All experiences
-- - All education entries  
-- - All skills
-- - All certifications
-- - All organizations/memberships
-- User will need to recreate profile from scratch
*/

-- FIX D: Profile doesn't exist - Check if it's a parsed_document ID
-- Sometimes the frontend might confuse profile_id with document_id
/*
SELECT 
  pd.id as document_id,
  pd.profile_id,
  pd.user_id,
  pd.file_name,
  p.id as actual_profile_id,
  p.full_name
FROM public.parsed_documents pd
LEFT JOIN public.profiles p ON p.id = pd.profile_id
WHERE pd.id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
   OR pd.profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';
*/

-- =============================================================================
-- STEP 4: VERIFICATION
-- =============================================================================

-- After applying a fix, run this to confirm everything works
/*
SELECT 
  'Test Result' as test_name,
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c' 
    AND p.user_id = auth.uid()
  ) as can_insert_skills,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c' 
      AND p.user_id = auth.uid()
    ) THEN '✅ FIX SUCCESSFUL - You can now insert skills'
    ELSE '❌ Still broken - Try another fix option'
  END as status;
*/

-- =============================================================================
-- STEP 5: PREVENT FUTURE ISSUES
-- =============================================================================

-- Ensure all profiles have user_id (find orphans)
SELECT 
  id,
  full_name,
  email,
  created_at,
  'ORPHANED - Missing user_id' as issue
FROM public.profiles
WHERE user_id IS NULL;

-- Check for duplicate profiles (same user, multiple profiles)
SELECT 
  user_id,
  COUNT(*) as profile_count,
  ARRAY_AGG(id ORDER BY created_at DESC) as profile_ids,
  CASE 
    WHEN COUNT(*) > 1 THEN '⚠️ Multiple profiles found - consider consolidating'
    ELSE '✅ OK'
  END as status
FROM public.profiles
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;
