-- Migration: Create Stories tables for Sprint 2.4
-- Date: 2025-11-21
-- Description: STAR-format narrative stories for experiences with versioning support

-- ============================================
-- STORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- STAR content fields
  situation TEXT,
  task TEXT,
  action TEXT,
  result TEXT,
  full_story TEXT, -- Combined narrative for quick rendering
  
  -- AI metadata
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  metrics JSONB, -- Extracted impact metrics: { numbers: [], keywords: [] }
  
  -- Story metadata
  title VARCHAR(255), -- Optional title for the story
  tags TEXT[], -- Skill tags or keywords
  is_draft BOOLEAN NOT NULL DEFAULT true,
  
  -- Scoring and relevance (future integration with Sprint 2.2)
  relevance_score DECIMAL(5,2), -- Overall quality/relevance score
  job_match_scores JSONB -- { job_id: score } pairs
);

-- ============================================
-- STORY VERSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.story_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version_number INTEGER NOT NULL,
  
  -- Snapshot of story content at this version
  situation TEXT,
  task TEXT,
  action TEXT,
  result TEXT,
  full_story TEXT,
  metrics JSONB,
  
  -- Version metadata
  change_summary TEXT, -- What changed in this version
  created_by_ai BOOLEAN NOT NULL DEFAULT false,
  
  UNIQUE(story_id, version_number)
);

-- ============================================
-- STORY-SKILL JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.story_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(story_id, skill_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stories_experience_id ON public.stories(experience_id);
CREATE INDEX IF NOT EXISTS idx_stories_updated_at ON public.stories(updated_at);
CREATE INDEX IF NOT EXISTS idx_stories_is_draft ON public.stories(is_draft);
CREATE INDEX IF NOT EXISTS idx_story_versions_story_id ON public.story_versions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_versions_created_at ON public.story_versions(created_at);
CREATE INDEX IF NOT EXISTS idx_story_skills_story_id ON public.story_skills(story_id);
CREATE INDEX IF NOT EXISTS idx_story_skills_skill_id ON public.story_skills(skill_id);

-- ============================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stories_timestamp
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION update_stories_updated_at();

-- ============================================
-- AUTO-VERSION NUMBER TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION set_story_version_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-increment version number for this story
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO NEW.version_number
  FROM public.story_versions
  WHERE story_id = NEW.story_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_version_number
  BEFORE INSERT ON public.story_versions
  FOR EACH ROW
  WHEN (NEW.version_number IS NULL)
  EXECUTE FUNCTION set_story_version_number();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_skills ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own stories
CREATE POLICY stories_select_own ON public.stories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.experiences e
      JOIN public.profiles p ON p.id = e.profile_id
      WHERE e.id = stories.experience_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Users can insert stories for their own experiences
CREATE POLICY stories_insert_own ON public.stories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.experiences e
      JOIN public.profiles p ON p.id = e.profile_id
      WHERE e.id = experience_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own stories
CREATE POLICY stories_update_own ON public.stories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.experiences e
      JOIN public.profiles p ON p.id = e.profile_id
      WHERE e.id = stories.experience_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own stories
CREATE POLICY stories_delete_own ON public.stories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.experiences e
      JOIN public.profiles p ON p.id = e.profile_id
      WHERE e.id = stories.experience_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Users can view versions of their own stories
CREATE POLICY story_versions_select_own ON public.story_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      JOIN public.experiences e ON e.id = s.experience_id
      JOIN public.profiles p ON p.id = e.profile_id
      WHERE s.id = story_versions.story_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Users can insert versions for their own stories
CREATE POLICY story_versions_insert_own ON public.story_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories s
      JOIN public.experiences e ON e.id = s.experience_id
      JOIN public.profiles p ON p.id = e.profile_id
      WHERE s.id = story_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Users can manage skill associations for their own stories
CREATE POLICY story_skills_all_own ON public.story_skills
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      JOIN public.experiences e ON e.id = s.experience_id
      JOIN public.profiles p ON p.id = e.profile_id
      WHERE s.id = story_skills.story_id
      AND p.user_id = auth.uid()
    )
  );

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE public.stories IS 'STAR-format narrative stories for work experiences';
COMMENT ON TABLE public.story_versions IS 'Version history for story edits';
COMMENT ON TABLE public.story_skills IS 'Junction table linking stories to demonstrated skills';
COMMENT ON COLUMN public.stories.situation IS 'STAR: Situation/context';
COMMENT ON COLUMN public.stories.task IS 'STAR: Task/challenge';
COMMENT ON COLUMN public.stories.action IS 'STAR: Action taken';
COMMENT ON COLUMN public.stories.result IS 'STAR: Result/outcome with metrics';
COMMENT ON COLUMN public.stories.full_story IS 'Combined narrative for display';
COMMENT ON COLUMN public.stories.metrics IS 'Extracted impact metrics: { numbers: ["60%", "$1.2M"], keywords: ["efficiency", "leadership"] }';
COMMENT ON COLUMN public.stories.relevance_score IS 'Overall quality/impact score (0-100)';
COMMENT ON COLUMN public.stories.job_match_scores IS 'Job-specific relevance scores: { "job-uuid": 85.5 }';
