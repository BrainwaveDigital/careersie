-- Cleanup Orphaned Profile Data
-- This script deletes all records for a specific user_id/profile_id that doesn't exist in users table
-- Profile ID to delete: 5aad8d45-29af-46c3-ba03-5634a6ddbd8c

-- SAFETY: Uncomment the verification queries first to see what will be deleted

-- ============================================
-- VERIFICATION QUERIES (run these first!)
-- ============================================

-- Check if profile exists in users table
-- SELECT * FROM public.users WHERE id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- Check what data exists for this profile
-- SELECT 'profiles' as table_name, count(*) as records FROM public.profiles WHERE user_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
-- UNION ALL
-- SELECT 'media_library', count(*) FROM public.media_library WHERE profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
-- UNION ALL
-- SELECT 'personality_assessments', count(*) FROM public.personality_assessments WHERE profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
-- UNION ALL
-- SELECT 'certifications', count(*) FROM public.certifications WHERE profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
-- UNION ALL
-- SELECT 'memberships', count(*) FROM public.memberships WHERE profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
-- UNION ALL
-- SELECT 'voluntary_roles', count(*) FROM public.voluntary_roles WHERE profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
-- UNION ALL
-- SELECT 'app_admins', count(*) FROM public.app_admins WHERE user_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- ============================================
-- DELETION QUERIES (uncomment to execute)
-- ============================================

BEGIN;

-- Delete from media_library
DELETE FROM public.media_library 
WHERE profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- Delete from personality_assessments
DELETE FROM public.personality_assessments 
WHERE profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- Delete from certifications
DELETE FROM public.certifications 
WHERE profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- Delete from memberships
DELETE FROM public.memberships 
WHERE profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- Delete from voluntary_roles
DELETE FROM public.voluntary_roles 
WHERE profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- Delete from app_admins (if exists)
DELETE FROM public.app_admins 
WHERE user_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- Delete from profiles (main profile record)
DELETE FROM public.profiles 
WHERE user_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- If you also want to delete from auth.users (be careful!)
-- This will permanently delete the authentication account
-- DELETE FROM auth.users WHERE id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

COMMIT;

-- Success message
SELECT 'Cleanup complete! All records for profile 5aad8d45-29af-46c3-ba03-5634a6ddbd8c have been deleted.' as message;

-- Verification after deletion (should show 0 records)
SELECT 'profiles' as table_name, count(*) as remaining_records FROM public.profiles WHERE user_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
UNION ALL
SELECT 'media_library', count(*) FROM public.media_library WHERE profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
UNION ALL
SELECT 'personality_assessments', count(*) FROM public.personality_assessments WHERE profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
UNION ALL
SELECT 'certifications', count(*) FROM public.certifications WHERE profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
UNION ALL
SELECT 'memberships', count(*) FROM public.memberships WHERE profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
UNION ALL
SELECT 'voluntary_roles', count(*) FROM public.voluntary_roles WHERE profile_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
UNION ALL
SELECT 'app_admins', count(*) FROM public.app_admins WHERE user_id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';
