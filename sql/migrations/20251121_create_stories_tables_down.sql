-- Rollback Migration: Drop Stories tables
-- Date: 2025-11-21
-- Description: Rollback Sprint 2.4 Stories feature

-- ============================================
-- DROP POLICIES
-- ============================================
DROP POLICY IF EXISTS story_skills_all_own ON public.story_skills;
DROP POLICY IF EXISTS story_versions_insert_own ON public.story_versions;
DROP POLICY IF EXISTS story_versions_select_own ON public.story_versions;
DROP POLICY IF EXISTS stories_delete_own ON public.stories;
DROP POLICY IF EXISTS stories_update_own ON public.stories;
DROP POLICY IF EXISTS stories_insert_own ON public.stories;
DROP POLICY IF EXISTS stories_select_own ON public.stories;

-- ============================================
-- DROP TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS trigger_set_version_number ON public.story_versions;
DROP TRIGGER IF EXISTS trigger_update_stories_timestamp ON public.stories;

-- ============================================
-- DROP FUNCTIONS
-- ============================================
DROP FUNCTION IF EXISTS set_story_version_number();
DROP FUNCTION IF EXISTS update_stories_updated_at();

-- ============================================
-- DROP INDEXES
-- ============================================
DROP INDEX IF EXISTS idx_story_skills_skill_id;
DROP INDEX IF EXISTS idx_story_skills_story_id;
DROP INDEX IF EXISTS idx_story_versions_created_at;
DROP INDEX IF EXISTS idx_story_versions_story_id;
DROP INDEX IF EXISTS idx_stories_is_draft;
DROP INDEX IF EXISTS idx_stories_updated_at;
DROP INDEX IF EXISTS idx_stories_experience_id;

-- ============================================
-- DROP TABLES (in dependency order)
-- ============================================
DROP TABLE IF EXISTS public.story_skills;
DROP TABLE IF EXISTS public.story_versions;
DROP TABLE IF EXISTS public.stories;
