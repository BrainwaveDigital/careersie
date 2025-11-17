-- Storage Policies for media-library bucket
-- Run this in Supabase SQL Editor after creating the 'media-library' storage bucket

-- First, ensure the bucket exists (this is informational, bucket must be created via Dashboard/API)
-- Bucket name: 'media-library'
-- Public: false

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files" ON storage.objects;

-- Policy 1: Allow authenticated users to upload (INSERT) files
CREATE POLICY "Users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media-library' AND
  auth.role() = 'authenticated'
);

-- Policy 2: Allow authenticated users to read (SELECT) files
-- This is critical for createSignedUrl() to work
CREATE POLICY "Users can read files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'media-library' AND
  auth.role() = 'authenticated'
);

-- Policy 3: Allow authenticated users to update files
CREATE POLICY "Users can update files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media-library' AND
  auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'media-library' AND
  auth.role() = 'authenticated'
);

-- Policy 4: Allow authenticated users to delete files
CREATE POLICY "Users can delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-library' AND
  auth.role() = 'authenticated'
);

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%files%'
ORDER BY policyname;
