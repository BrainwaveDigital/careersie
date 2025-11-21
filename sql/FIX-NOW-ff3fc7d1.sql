-- ONE-STEP FIX for Profile Ownership Issue
-- Copy this entire file and paste into Supabase SQL Editor

-- =============================================================================
-- PROFILE DETAILS
-- =============================================================================
-- Profile ID: ff3fc7d1-85de-40e3-9958-8fb361810c95
-- User ID: ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892
-- Problem: RLS blocking skill inserts due to ownership mismatch

-- =============================================================================
-- THE FIX (Run this entire block)
-- =============================================================================

DO $$
DECLARE
  v_profile_id uuid := 'ff3fc7d1-85de-40e3-9958-8fb361810c95';
  v_user_id uuid := 'ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892';
  v_old_user_id uuid;
  v_profile_exists boolean;
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = v_profile_id) INTO v_profile_exists;
  
  IF NOT v_profile_exists THEN
    RAISE NOTICE '❌ Profile does not exist!';
    RAISE NOTICE '   Profile ID: %', v_profile_id;
    RAISE NOTICE '   Action: Create a new profile in the app';
  ELSE
    -- Get current user_id
    SELECT user_id INTO v_old_user_id FROM profiles WHERE id = v_profile_id;
    
    -- Update the profile
    UPDATE profiles
    SET 
      user_id = v_user_id,
      updated_at = now()
    WHERE id = v_profile_id;
    
    -- Report results
    IF v_old_user_id IS NULL THEN
      RAISE NOTICE '✅ Fixed! Profile had NULL user_id';
    ELSIF v_old_user_id = v_user_id THEN
      RAISE NOTICE '✅ Already correct! No changes needed';
    ELSE
      RAISE NOTICE '✅ Fixed! Transferred ownership';
      RAISE NOTICE '   From: %', v_old_user_id;
      RAISE NOTICE '   To: %', v_user_id;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Profile updated successfully';
    
    -- Show final state
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL STATE ===';
    FOR r IN 
      SELECT 
        id,
        user_id,
        full_name,
        email,
        updated_at
      FROM profiles
      WHERE id = v_profile_id
    LOOP
      RAISE NOTICE 'Profile ID: %', r.id;
      RAISE NOTICE 'User ID: %', r.user_id;
      RAISE NOTICE 'Name: %', r.full_name;
      RAISE NOTICE 'Email: %', r.email;
      RAISE NOTICE 'Updated: %', r.updated_at;
    END LOOP;
  END IF;
END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Test 1: Can we insert skills now?
SELECT 
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95'
    AND p.user_id = 'ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892'
  ) as "✅ Can Insert Skills?";

-- Test 2: Profile details
SELECT 
  id as "Profile ID",
  user_id as "Owner User ID",
  full_name as "Name",
  email as "Email",
  CASE 
    WHEN user_id = 'ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892' THEN '✅ CORRECT'
    WHEN user_id IS NULL THEN '❌ NULL'
    ELSE '❌ WRONG USER'
  END as "Status"
FROM profiles
WHERE id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95';

-- Test 3: Count related records
SELECT 
  'Experiences' as "Record Type",
  COUNT(*) as "Count"
FROM experiences
WHERE profile_id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95'
UNION ALL
SELECT 'Education', COUNT(*) FROM education 
WHERE profile_id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95'
UNION ALL
SELECT 'Skills', COUNT(*) FROM skills 
WHERE profile_id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95'
UNION ALL
SELECT 'Certifications', COUNT(*) FROM certifications 
WHERE profile_id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95';

-- =============================================================================
-- Expected Results:
-- - Can Insert Skills? = true ✅
-- - Status = ✅ CORRECT
-- - All record counts should be visible (RLS allows access)
-- =============================================================================

-- After running this, go back to your app and try saving the profile again!
