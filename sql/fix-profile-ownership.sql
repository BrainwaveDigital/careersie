-- Fix profile ownership issue
-- This script should be run with SERVICE ROLE permissions (not as the user)
-- Run in Supabase SQL Editor with service role access

-- IMPORTANT: Replace these values with actual IDs from diagnosis
-- Current authenticated user ID (from auth.uid() in diagnosis)
-- Profile ID that needs fixing: 5aad8d45-29af-46c3-ba03-5634a6ddbd8c

-- Option 1: Update existing profile to correct user_id
-- Only run if diagnosis shows profile exists but has wrong user_id
/*
UPDATE public.profiles
SET user_id = '<CORRECT-USER-ID-FROM-STEP-1>'
WHERE id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';
*/

-- Option 2: Delete orphaned profile and let user recreate
-- Only run if profile is orphaned or belongs to wrong user
/*
DELETE FROM public.profiles
WHERE id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';
*/

-- Option 3: Check for duplicate profiles for same user
-- If user accidentally created multiple profiles
SELECT 
  id,
  user_id,
  full_name,
  email,
  created_at,
  updated_at
FROM public.profiles
WHERE user_id = '<USER-ID-FROM-DIAGNOSIS>'
ORDER BY created_at DESC;

-- Option 4: If profile doesn't exist at all, check parsed_documents
-- Maybe the profile_id is from parsed_documents instead?
SELECT 
  id,
  profile_id,
  user_id,
  file_name,
  created_at
FROM public.parsed_documents
WHERE id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
   OR profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- Verification query after fix:
-- Run this to confirm the fix worked
/*
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.email,
  COUNT(s.id) as skill_count,
  COUNT(e.id) as experience_count,
  COUNT(ed.id) as education_count
FROM public.profiles p
LEFT JOIN public.skills s ON s.profile_id = p.id
LEFT JOIN public.experiences e ON e.profile_id = p.id
LEFT JOIN public.education ed ON ed.profile_id = p.id
WHERE p.id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
GROUP BY p.id, p.user_id, p.full_name, p.email;
*/
