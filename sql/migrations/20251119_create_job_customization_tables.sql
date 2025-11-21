-- Job Posts and Customization Schema
-- Tables for storing job descriptions, parsed data, and customized story versions

-- Job posts table
CREATE TABLE IF NOT EXISTS job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Original data
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  location VARCHAR(255),
  raw_description TEXT NOT NULL,
  job_url TEXT,
  
  -- Parsed structured data (JSONB)
  parsed_data JSONB NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'active', -- active, archived, applied
  applied_at TIMESTAMPTZ
);

-- Customized story versions table
CREATE TABLE IF NOT EXISTS customized_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_post_id UUID REFERENCES job_posts(id) ON DELETE CASCADE,
  
  -- Customized content
  story TEXT NOT NULL,
  reordered_experience JSONB, -- Array of experience IDs in custom order
  highlighted_skills TEXT[],
  
  -- Relevance scoring
  match_score INT NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  score_breakdown JSONB NOT NULL, -- { hard_skills: 40, soft_skills: 20, etc }
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  version_name VARCHAR(255)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_job_posts_user_id ON job_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_status ON job_posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_customized_stories_user_id ON customized_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_customized_stories_job_post_id ON customized_stories(job_post_id);
CREATE INDEX IF NOT EXISTS idx_customized_stories_is_active ON customized_stories(user_id, is_active);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_job_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_job_posts_updated_at
  BEFORE UPDATE ON job_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_job_posts_updated_at();

CREATE OR REPLACE FUNCTION update_customized_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_customized_stories_updated_at
  BEFORE UPDATE ON customized_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_customized_stories_updated_at();

-- Enable Row Level Security
ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customized_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_posts
CREATE POLICY "Users can view their own job posts"
  ON job_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job posts"
  ON job_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job posts"
  ON job_posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job posts"
  ON job_posts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for customized_stories
CREATE POLICY "Users can view their own customized stories"
  ON customized_stories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customized stories"
  ON customized_stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customized stories"
  ON customized_stories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customized stories"
  ON customized_stories FOR DELETE
  USING (auth.uid() = user_id);
