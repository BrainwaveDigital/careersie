-- Create talent_stories table
-- Stores generated TalentStory narratives and the source data used to create them

CREATE TABLE IF NOT EXISTS talent_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Generated story content (markdown)
  story TEXT NOT NULL,
  
  -- Source data used to generate this story (JSONB for flexibility)
  -- This is the ProfileStoryInput that was used
  data JSONB NOT NULL,
  
  -- Model used for generation
  model VARCHAR(50) DEFAULT 'gpt-4o',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Version tracking (for regeneration)
  version INTEGER DEFAULT 1,
  
  -- Optional: Track if this is the "active" story for the user
  is_active BOOLEAN DEFAULT true,
  
  CONSTRAINT talent_stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Add index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_talent_stories_user_id ON talent_stories(user_id);

-- Add index on is_active for filtering active stories
CREATE INDEX IF NOT EXISTS idx_talent_stories_is_active ON talent_stories(user_id, is_active);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_talent_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_talent_stories_updated_at
  BEFORE UPDATE ON talent_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_talent_stories_updated_at();

-- Enable Row Level Security
ALTER TABLE talent_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own talent stories
CREATE POLICY "Users can view their own talent stories"
  ON talent_stories
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own talent stories
CREATE POLICY "Users can insert their own talent stories"
  ON talent_stories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own talent stories
CREATE POLICY "Users can update their own talent stories"
  ON talent_stories
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own talent stories
CREATE POLICY "Users can delete their own talent stories"
  ON talent_stories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Optional: Allow public viewing (for sharing TalentStories)
-- Uncomment if you want to enable public sharing
-- CREATE POLICY "Anyone can view active talent stories"
--   ON talent_stories
--   FOR SELECT
--   USING (is_active = true);
