-- SIMPLE FIX: Copy and paste these queries one by one into Supabase SQL Editor
-- Profile: ff3fc7d1-85de-40e3-9958-8fb361810c95
-- User: ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892

-- Step 1: Check current state
SELECT 
  id,
  user_id,
  full_name,
  email,
  CASE 
    WHEN user_id = 'ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892' THEN '✅ Already correct'
    WHEN user_id IS NULL THEN '❌ NULL - needs fix'
    ELSE '❌ Wrong user: ' || user_id
  END as status
FROM profiles
WHERE id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95';

-- Step 2: Fix the ownership
UPDATE profiles
SET 
  user_id = 'ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892',
  updated_at = now()
WHERE id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95';

-- Step 3: Verify the fix
SELECT 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95'
    AND user_id = 'ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892'
  ) as can_insert_skills;
-- Expected: true

-- Step 4: View final state
SELECT 
  id,
  user_id,
  full_name,
  email,
  '✅ FIXED!' as status
FROM profiles
WHERE id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95';

-- Done! Now try saving your profile in the app.
