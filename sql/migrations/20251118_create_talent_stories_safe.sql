-- Create talent_stories table (safe version - handles existing objects)
-- Stores generated TalentStory narratives and the source data used to create them

-- Drop existing constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'talent_stories_user_id_fkey'
    ) THEN
        ALTER TABLE talent_stories DROP CONSTRAINT talent_stories_user_id_fkey;
    END IF;
END $$;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS talent_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
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
  is_active BOOLEAN DEFAULT true
);

-- Add foreign key constraint
ALTER TABLE talent_stories 
ADD CONSTRAINT talent_stories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_talent_stories_user_id ON talent_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_talent_stories_is_active ON talent_stories(user_id, is_active);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_talent_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_talent_stories_updated_at ON talent_stories;
CREATE TRIGGER trigger_talent_stories_updated_at
  BEFORE UPDATE ON talent_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_talent_stories_updated_at();

-- Enable Row Level Security
ALTER TABLE talent_stories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own talent stories" ON talent_stories;
DROP POLICY IF EXISTS "Users can insert their own talent stories" ON talent_stories;
DROP POLICY IF EXISTS "Users can update their own talent stories" ON talent_stories;
DROP POLICY IF EXISTS "Users can delete their own talent stories" ON talent_stories;

-- Create RLS Policies
CREATE POLICY "Users can view their own talent stories"
  ON talent_stories
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own talent stories"
  ON talent_stories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own talent stories"
  ON talent_stories
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own talent stories"
  ON talent_stories
  FOR DELETE
  USING (auth.uid() = user_id);
