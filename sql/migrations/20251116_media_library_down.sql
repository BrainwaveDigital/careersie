-- Rollback migration for media library
-- Run this to remove the media_library table and related objects

-- Drop policies
DROP POLICY IF EXISTS "Users can delete own media" ON public.media_library;
DROP POLICY IF EXISTS "Users can update own media" ON public.media_library;
DROP POLICY IF EXISTS "Users can insert own media" ON public.media_library;
DROP POLICY IF EXISTS "Users can view own media" ON public.media_library;

-- Drop trigger and function
DROP TRIGGER IF EXISTS trigger_update_media_library_updated_at ON public.media_library;
DROP FUNCTION IF EXISTS update_media_library_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_media_library_created_at;
DROP INDEX IF EXISTS idx_media_library_file_type;
DROP INDEX IF EXISTS idx_media_library_profile_id;

-- Drop table
DROP TABLE IF EXISTS public.media_library;

-- Note: Storage bucket 'media-library' should be manually deleted in Supabase Dashboard
