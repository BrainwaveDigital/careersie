-- Comprehensive diagnosis for profile ownership issue
-- Profile ID: 5aad8d45-29af-46c3-ba03-5634a6ddbd8c

-- Step 1: Check who you are currently authenticated as
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_email;

-- Step 2: Check if this profile exists at all
SELECT 
  id,
  user_id,
  full_name,
  email,
  created_at
FROM public.profiles
WHERE id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- Step 3: Check if YOU have any profiles
SELECT 
  id,
  user_id,
  full_name,
  email,
  created_at,
  (user_id = auth.uid()) as is_mine
FROM public.profiles
WHERE user_id = auth.uid();

-- Step 4: Check all profiles (to see if profile exists but belongs to someone else)
-- Note: This might fail due to RLS if you're not an admin
SELECT 
  id,
  user_id,
  full_name,
  email,
  (user_id = auth.uid()) as is_mine
FROM public.profiles
LIMIT 10;

-- Step 5: Check if you're in the app_admins table
SELECT 
  user_id,
  email,
  created_at
FROM public.app_admins
WHERE user_id = auth.uid();

-- Step 6: Try to see the specific profile with RLS context
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  auth.uid() as current_user,
  (p.user_id = auth.uid()) as ownership_match
FROM public.profiles p
WHERE p.id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- Step 7: Check if the profile was created with the correct user_id
-- (Using service role key or as admin)
-- If the above query returns no rows, run this with elevated permissions:
/*
SELECT 
  id,
  user_id,
  full_name,
  email,
  created_at
FROM public.profiles
WHERE id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';
*/

-- DIAGNOSIS RESULTS:
-- If Step 1 shows a user_id but Step 2 returns no rows:
--   → Profile doesn't exist (was never created or was deleted)
--
-- If Step 2 returns a row but user_id doesn't match Step 1:
--   → Profile belongs to a different user (bug in profile creation)
--
-- If Step 2 returns a row and user_id matches Step 1:
--   → RLS policy has a bug (shouldn't happen if policies are correct)
--
-- If Step 3 returns different profile(s):
--   → You created profile(s) but not with the ID you're trying to use
