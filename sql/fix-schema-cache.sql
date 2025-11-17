-- Fix: Refresh Supabase Schema Cache
-- Run this if you get "Could not find the 'profile_id' column" error
-- This forces Supabase to reload the table schema

-- Step 1: Drop and recreate the constraint to refresh cache
ALTER TABLE public.personality_assessments 
  DROP CONSTRAINT IF EXISTS personality_assessments_profile_id_key;

ALTER TABLE public.personality_assessments 
  ADD CONSTRAINT personality_assessments_profile_id_key UNIQUE (profile_id);

-- Step 2: Notify Supabase to reload schema
NOTIFY pgrst, 'reload schema';

-- Step 3: Verify the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'personality_assessments'
ORDER BY ordinal_position;

-- You should see profile_id in the list

-- If profile_id is missing, the table wasn't created correctly
-- Check if it exists:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'personality_assessments';

-- If table doesn't exist, run:
-- sql/migrations/20251117_personality_assessments_up.sql

SELECT 'Schema cache refresh complete!' as message;
