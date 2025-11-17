-- Media Library Table
-- Stores user-uploaded media files (images, audio, video) separate from CV documents
-- Each media item belongs to a profile and is stored in Supabase Storage

CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- File metadata
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image', 'audio', 'video'
  mime_type TEXT NOT NULL, -- 'image/jpeg', 'video/mp4', etc.
  file_size BIGINT NOT NULL, -- Size in bytes
  
  -- Storage reference
  storage_path TEXT NOT NULL, -- Path in Supabase Storage bucket
  storage_bucket TEXT NOT NULL DEFAULT 'media-library',
  
  -- Optional metadata
  title TEXT, -- User-friendly title
  description TEXT, -- User description
  tags TEXT[], -- Array of tags for categorization
  
  -- Media-specific metadata (stored as JSONB for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb, -- duration for video/audio, dimensions for images, etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Indexes
  CONSTRAINT valid_file_type CHECK (file_type IN ('image', 'audio', 'video'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_media_library_profile_id ON public.media_library(profile_id);
CREATE INDEX IF NOT EXISTS idx_media_library_file_type ON public.media_library(file_type);
CREATE INDEX IF NOT EXISTS idx_media_library_created_at ON public.media_library(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own media
CREATE POLICY "Users can view own media"
  ON public.media_library
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own media
CREATE POLICY "Users can insert own media"
  ON public.media_library
  FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Users can update their own media
CREATE POLICY "Users can update own media"
  ON public.media_library
  FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Users can delete their own media
CREATE POLICY "Users can delete own media"
  ON public.media_library
  FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_media_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_media_library_updated_at
  BEFORE UPDATE ON public.media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_media_library_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_library TO authenticated;

-- Create storage bucket (Note: This needs to be run manually in Supabase Dashboard or via API)
-- Bucket name: 'media-library'
-- Public: false (requires authentication)
-- File size limit: 50MB recommended
-- Allowed MIME types: image/*, video/*, audio/*

COMMENT ON TABLE public.media_library IS 'Stores user media files (images, audio, video) separate from CV documents';
COMMENT ON COLUMN public.media_library.file_type IS 'Type of media: image, audio, or video';
COMMENT ON COLUMN public.media_library.storage_path IS 'Full path in Supabase Storage bucket';
COMMENT ON COLUMN public.media_library.metadata IS 'Flexible JSON field for media-specific data like duration, dimensions, etc.';
