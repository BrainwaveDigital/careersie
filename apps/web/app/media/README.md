# Media Library Setup Guide

## Overview
The Media Library feature allows users to upload, manage, and organize their media files (images, audio, video) separate from CV documents. This feature includes full CRUD operations and integrates with Supabase Storage.

## Database Setup

### 1. Run the Migration
Execute the SQL migration to create the `media_library` table:

```bash
# In Supabase SQL Editor, run:
sql/migrations/20251116_media_library_up.sql
```

This creates:
- `media_library` table with proper schema
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for `updated_at` timestamp

### 2. Create Storage Bucket

**Important:** You must manually create the storage bucket in Supabase Dashboard:

1. Go to **Storage** in Supabase Dashboard
2. Click **New bucket**
3. Configure:
   - **Name:** `media-library`
   - **Public:** `false` (requires authentication)
   - **File size limit:** 50MB (recommended)
   - **Allowed MIME types:** `image/*`, `video/*`, `audio/*`

4. Set up Storage Policies:

```sql
-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media-library' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'media-library' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media-library' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Note:** Storage policies use `profile_id` in folder structure: `{profile_id}/{file_type}/{timestamp}_{filename}`

## Features

### Upload Media
- **Supported formats:**
  - Images: JPG, PNG, GIF, WebP, etc.
  - Audio: MP3, WAV, OGG, etc.
  - Video: MP4, MOV, AVI, WebM, etc.
- **File metadata:**
  - Title (optional, user-friendly name)
  - Description (optional)
  - Tags (comma-separated, for categorization)

### View & Filter
- Grid view with thumbnails/previews
- Filter by type: All, Images, Audio, Video
- Inline media players:
  - Images: Display with object-fit
  - Video: HTML5 video player with controls
  - Audio: HTML5 audio player

### Edit
- Update title, description, and tags
- Inline editing interface
- File itself cannot be replaced (delete and re-upload instead)

### Delete
- Removes file from both Storage and Database
- Confirmation dialog before deletion
- Graceful error handling if storage deletion fails

## File Structure

```
apps/web/app/media/
  └── page.tsx                    # Main media library page (client component)

sql/migrations/
  ├── 20251116_media_library_up.sql     # Create table migration
  └── 20251116_media_library_down.sql   # Rollback migration
```

## Database Schema

### `media_library` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `profile_id` | UUID | Foreign key to `profiles.id` |
| `file_name` | TEXT | Sanitized filename |
| `file_type` | TEXT | 'image', 'audio', or 'video' |
| `mime_type` | TEXT | Full MIME type (e.g., 'image/jpeg') |
| `file_size` | BIGINT | Size in bytes |
| `storage_path` | TEXT | Full path in storage bucket |
| `storage_bucket` | TEXT | Bucket name (default: 'media-library') |
| `title` | TEXT | User-friendly title (nullable) |
| `description` | TEXT | User description (nullable) |
| `tags` | TEXT[] | Array of tags (nullable) |
| `metadata` | JSONB | Flexible metadata (dimensions, duration, etc.) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Storage Structure

Files are stored in Supabase Storage with the following path pattern:

```
media-library/
  └── {profile_id}/
      ├── image/
      │   ├── {timestamp}_{filename}
      │   └── ...
      ├── audio/
      │   └── {timestamp}_{filename}
      └── video/
          └── {timestamp}_{filename}
```

## Navigation

The media library is accessible from:
1. **Dashboard:** "🎬 Media Library" card with link
2. **Profile page:** "Media Library" button in navigation bar
3. **Direct URL:** `/media`

## Security

### Authentication
- All routes require authentication (redirects to `/login` if not authenticated)
- Must have a profile to upload media

### Row Level Security (RLS)
- Users can only view/edit/delete their own media
- Policies check `profile_id` against authenticated user's profile

### Storage Security
- Bucket is **private** (requires authentication)
- Storage policies enforce folder-level access control
- Each user can only access files in their `{profile_id}/` folder

## Usage Example

### Uploading a File

1. Navigate to `/media`
2. Click "Choose File" and select an image, audio, or video file
3. (Optional) Add title, description, and tags
4. Click "Upload File"
5. File is uploaded to Supabase Storage and metadata saved to database

### Editing Metadata

1. Find your media item in the grid
2. Click "Edit" button
3. Update title, description, or tags
4. Click "Save"

### Deleting a File

1. Find your media item in the grid
2. Click "Delete" button
3. Confirm deletion in dialog
4. File is removed from both storage and database

## Testing Checklist

- [ ] Run migration in Supabase
- [ ] Create `media-library` storage bucket
- [ ] Set up storage policies
- [ ] Upload test image
- [ ] Upload test audio file
- [ ] Upload test video file
- [ ] Filter by type (Images, Audio, Video)
- [ ] Edit metadata (title, description, tags)
- [ ] Delete file
- [ ] Verify RLS: User A cannot see User B's files
- [ ] Check file size limits
- [ ] Test with large files (~50MB)

## Troubleshooting

### "Failed to upload file" Error
- **Check:** Storage bucket exists and is named `media-library`
- **Check:** Storage policies are correctly configured
- **Check:** File size is within limits
- **Check:** MIME type is allowed

### "Failed to save file metadata" Error
- **Check:** Migration has been run successfully
- **Check:** User has a valid `profile_id`
- **Check:** RLS policies are enabled and correct

### Files not visible after upload
- **Check:** Storage policies allow SELECT for authenticated users
- **Check:** User's `profile_id` matches the folder structure
- **Check:** Browser console for errors

### Images/videos not displaying
- **Check:** Storage bucket is configured correctly
- **Check:** Public URL generation is working (check network tab)
- **Check:** CORS settings if accessing from different domain

## Rollback

To remove the media library feature:

```sql
-- Run in Supabase SQL Editor:
sql/migrations/20251116_media_library_down.sql
```

Then manually delete the `media-library` storage bucket from Supabase Dashboard.

## Future Enhancements

Potential improvements:
- [ ] Bulk upload (multiple files at once)
- [ ] Image editing (crop, resize, filters)
- [ ] Generate thumbnails for videos
- [ ] Organize into folders/albums
- [ ] Share media with recruiters/employers
- [ ] Embed media in profile/CV
- [ ] Search by filename or tags
- [ ] Download original files
- [ ] Display EXIF data for images
- [ ] Video transcoding for web playback
