"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, Image, Music, Video, Trash2, Edit2, X, Save } from 'lucide-react'
import Link from 'next/link'

interface MediaItem {
  id: string
  profile_id: string
  file_name: string
  file_type: 'image' | 'audio' | 'video'
  mime_type: string
  file_size: number
  storage_path: string
  storage_bucket: string
  title: string | null
  description: string | null
  tags: string[] | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  publicUrl?: string
}

export default function MediaLibraryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [filter, setFilter] = useState<'all' | 'image' | 'audio' | 'video'>('all')
  
  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadTags, setUploadTags] = useState('')
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTags, setEditTags] = useState('')

  // Preview modal state
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)

  useEffect(() => {
    loadMediaLibrary()
  }, [])

  async function loadMediaLibrary() {
    try {
      const { data: authData } = await supabaseClient.auth.getUser()
      if (!authData?.user) {
        router.push('/login')
        return
      }

      // Get user's profile
      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .limit(1)

      if (!profiles || profiles.length === 0) {
        router.push('/profile/choose')
        return
      }

      const userProfileId = profiles[0].id
      setProfileId(userProfileId)

      // Load media items
      await refreshMediaItems(userProfileId)
      setLoading(false)
    } catch (error) {
      console.error('Error loading media library:', error)
      setLoading(false)
    }
  }

  async function refreshMediaItems(profId: string) {
    const { data: items, error } = await supabaseClient
      .from('media_library')
      .select('*')
      .eq('profile_id', profId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching media items:', error)
      return
    }

    // Get URLs for all items
    const itemsWithUrls = await Promise.all(
      (items || []).map(async (item: any) => {
        // Try signed URL first
        const { data: signedData, error: signedError } = await supabaseClient.storage
          .from(item.storage_bucket)
          .createSignedUrl(item.storage_path, 3600)
        
        if (signedError) {
          console.error('Error creating signed URL for', item.file_name, signedError)
          
          // Fallback to public URL (will work if bucket is public or has correct policies)
          const { data: publicData } = supabaseClient.storage
            .from(item.storage_bucket)
            .getPublicUrl(item.storage_path)
          
          console.log('Using public URL for', item.file_name, ':', publicData.publicUrl)
          return { ...item, publicUrl: publicData.publicUrl }
        }
        
        const signedUrl = signedData?.signedUrl || null
        console.log('Generated signed URL for', item.file_name, ':', signedUrl ? 'Success' : 'Failed')
        
        return { ...item, publicUrl: signedUrl }
      })
    )

    setMediaItems(itemsWithUrls)
  }

  async function handleFileUpload() {
    if (!uploadFile || !profileId) return

    setUploading(true)
    try {
      // Determine file type
      const fileType = uploadFile.type.startsWith('image/') 
        ? 'image' 
        : uploadFile.type.startsWith('video/')
        ? 'video'
        : uploadFile.type.startsWith('audio/')
        ? 'audio'
        : null

      if (!fileType) {
        alert('Invalid file type. Please upload an image, video, or audio file.')
        setUploading(false)
        return
      }

      // Create unique file path: profile_id/file_type/timestamp_filename
      const timestamp = Date.now()
      const sanitizedFileName = uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const storagePath = `${profileId}/${fileType}/${timestamp}_${sanitizedFileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('media-library')
        .upload(storagePath, uploadFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Failed to upload file: ' + uploadError.message)
        setUploading(false)
        return
      }

      console.log('File uploaded successfully to path:', storagePath)
      console.log('Upload response:', uploadData)

      // Extract metadata
      const metadata: Record<string, any> = {}
      if (fileType === 'image' && uploadFile.type.startsWith('image/')) {
        // For images, we could extract dimensions using FileReader/Image
        metadata.originalName = uploadFile.name
      } else if (fileType === 'video' || fileType === 'audio') {
        metadata.originalName = uploadFile.name
      }

      // Insert record into database
      const { error: dbError } = await supabaseClient
        .from('media_library')
        .insert({
          profile_id: profileId,
          file_name: sanitizedFileName,
          file_type: fileType,
          mime_type: uploadFile.type,
          file_size: uploadFile.size,
          storage_path: storagePath,
          storage_bucket: 'media-library',
          title: uploadTitle || sanitizedFileName,
          description: uploadDescription || null,
          tags: uploadTags ? uploadTags.split(',').map(t => t.trim()) : null,
          metadata
        })

      if (dbError) {
        console.error('Database error:', dbError)
        alert('Failed to save file metadata: ' + dbError.message)
        setUploading(false)
        return
      }

      // Reset form
      setUploadFile(null)
      setUploadTitle('')
      setUploadDescription('')
      setUploadTags('')
      
      // Refresh list
      await refreshMediaItems(profileId)
      alert('File uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      alert('An error occurred during upload.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Delete "${item.title || item.file_name}"?`)) return

    try {
      // Delete from storage
      const { error: storageError } = await supabaseClient.storage
        .from(item.storage_bucket)
        .remove([item.storage_path])

      if (storageError) {
        console.error('Storage delete error:', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabaseClient
        .from('media_library')
        .delete()
        .eq('id', item.id)

      if (dbError) {
        console.error('Database delete error:', dbError)
        alert('Failed to delete file: ' + dbError.message)
        return
      }

      // Refresh list
      if (profileId) await refreshMediaItems(profileId)
    } catch (error) {
      console.error('Delete error:', error)
      alert('An error occurred while deleting.')
    }
  }

  function startEdit(item: MediaItem) {
    setEditingId(item.id)
    setEditTitle(item.title || '')
    setEditDescription(item.description || '')
    setEditTags(item.tags ? item.tags.join(', ') : '')
  }

  async function saveEdit(item: MediaItem) {
    try {
      const { error } = await supabaseClient
        .from('media_library')
        .update({
          title: editTitle || null,
          description: editDescription || null,
          tags: editTags ? editTags.split(',').map(t => t.trim()) : null
        })
        .eq('id', item.id)

      if (error) {
        console.error('Update error:', error)
        alert('Failed to update: ' + error.message)
        return
      }

      setEditingId(null)
      if (profileId) await refreshMediaItems(profileId)
    } catch (error) {
      console.error('Save error:', error)
      alert('An error occurred while saving.')
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
    setEditTags('')
  }

  const filteredItems = filter === 'all' 
    ? mediaItems 
    : mediaItems.filter(item => item.file_type === filter)

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-pink-400 text-lg">Loading media library...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-white">Media Library</h1>
          <p className="text-purple-200 mt-1">Upload and manage your images, audio, and video files</p>
        </div>

        {/* Upload Section */}
        <Card className="mb-6 bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Upload className="w-5 h-5 mr-2 text-pink-400" />
              Upload New Media
            </CardTitle>
            <CardDescription className="text-purple-200">Supported: Images (JPG, PNG, GIF), Audio (MP3, WAV), Video (MP4, MOV)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="media-file-upload" className="block text-sm font-medium mb-2 text-purple-200">Choose File</label>
                <input
                  id="media-file-upload"
                  type="file"
                  accept="image/*,audio/*,video/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-purple-200
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-gradient-to-r file:from-pink-500 file:to-purple-500 file:text-white
                    hover:file:scale-105 file:transition-transform"
                />
                {uploadFile && (
                  <p className="text-sm text-purple-300 mt-2">
                    Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="upload-title" className="block text-sm font-medium mb-2 text-purple-200">Title (optional)</label>
                <input
                  id="upload-title"
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter a title for this media"
                  className="w-full px-3 py-2 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="upload-description" className="block text-sm font-medium mb-2 text-purple-200">Description (optional)</label>
                <textarea
                  id="upload-description"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Add a description"
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="upload-tags" className="block text-sm font-medium mb-2 text-purple-200">Tags (optional, comma-separated)</label>
                <input
                  id="upload-tags"
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="e.g., portfolio, presentation, demo"
                  className="w-full px-3 py-2 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                />
              </div>

              <Button
                onClick={handleFileUpload}
                disabled={!uploadFile || uploading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
            className={filter === 'all' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30'}
          >
            All ({mediaItems.length})
          </Button>
          <Button
            variant={filter === 'image' ? 'default' : 'outline'}
            onClick={() => setFilter('image')}
            size="sm"
            className={filter === 'image' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30'}
          >
            <Image className="w-4 h-4 mr-1" />
            Images ({mediaItems.filter(i => i.file_type === 'image').length})
          </Button>
          <Button
            variant={filter === 'audio' ? 'default' : 'outline'}
            onClick={() => setFilter('audio')}
            size="sm"
            className={filter === 'audio' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30'}
          >
            <Music className="w-4 h-4 mr-1" />
            Audio ({mediaItems.filter(i => i.file_type === 'audio').length})
          </Button>
          <Button
            variant={filter === 'video' ? 'default' : 'outline'}
            onClick={() => setFilter('video')}
            size="sm"
            className={filter === 'video' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30'}
          >
            <Video className="w-4 h-4 mr-1" />
            Video ({mediaItems.filter(i => i.file_type === 'video').length})
          </Button>
        </div>

        {/* Media Grid */}
        {filteredItems.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="py-12 text-center">
              <p className="text-purple-200">No media files uploaded yet.</p>
              <p className="text-sm text-purple-300 mt-2">Upload your first file using the form above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden bg-white/10 backdrop-blur-xl border-white/20">
                {/* Media Preview - Clickable */}
                <div 
                  className="aspect-video bg-white/5 relative cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setPreviewItem(item)}
                >
                  {!item.publicUrl && (
                    <div className="absolute inset-0 flex items-center justify-center text-purple-300 text-sm">
                      Failed to load preview
                    </div>
                  )}
                  {item.file_type === 'image' && item.publicUrl && (
                    <img
                      src={item.publicUrl}
                      alt={item.title || item.file_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        console.error('Image failed to load:', item.file_name)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  {item.file_type === 'video' && item.publicUrl && (
                    <video
                      src={item.publicUrl}
                      controls
                      preload="metadata"
                      className="w-full h-full object-contain bg-black"
                      onError={(e) => {
                        console.error('Video failed to load:', item.file_name)
                      }}
                    >
                      <source src={item.publicUrl} type={item.mime_type} />
                      Your browser does not support video playback.
                    </video>
                  )}
                  {item.file_type === 'audio' && item.publicUrl && (
                    <div className="flex flex-col items-center justify-center h-full p-4 bg-slate-900">
                      <Music className="w-16 h-16 text-pink-400 mb-4" />
                      <audio 
                        controls 
                        className="w-full"
                        onError={(e) => {
                          console.error('Audio failed to load:', item.file_name)
                        }}
                      >
                        <source src={item.publicUrl} type={item.mime_type} />
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  )}
                  
                  {/* Type Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 rounded-full bg-pink-500/80 backdrop-blur-sm text-white text-xs font-medium">
                      {item.file_type}
                    </span>
                  </div>
                </div>

                <CardContent className="p-4">
                  {editingId === item.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full px-2 py-1 bg-white/5 border-2 border-white/20 rounded-lg text-white placeholder-purple-300 text-sm"
                        aria-label="Edit media title"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                        rows={2}
                        className="w-full px-2 py-1 bg-white/5 border-2 border-white/20 rounded-lg text-white placeholder-purple-300 text-sm"
                        aria-label="Edit media description"
                      />
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="Tags (comma-separated)"
                        className="w-full px-2 py-1 bg-white/5 border-2 border-white/20 rounded-lg text-white placeholder-purple-300 text-sm"
                        aria-label="Edit media tags"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(item)} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:scale-105 transition-transform">
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-full">
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-2">
                      <h3 className="font-semibold truncate text-white">{item.title || item.file_name}</h3>
                      {item.description && (
                        <p className="text-sm text-purple-200 line-clamp-2">{item.description}</p>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-pink-500/20 text-pink-300 text-xs rounded-full border border-pink-400/30">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-purple-300 pt-2 border-t border-white/10">
                        <div>{formatFileSize(item.file_size)}</div>
                        <div>{new Date(item.created_at).toLocaleDateString()}</div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(item)}
                          className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-full"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item)}
                          className="flex-1 bg-red-500/80 text-white hover:bg-red-600 rounded-full"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {previewItem && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewItem(null)}
          >
            <div 
              className="bg-white/10 backdrop-blur-xl border-white/20 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/20">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold truncate text-white">
                    {previewItem.title || previewItem.file_name}
                  </h2>
                  <p className="text-sm text-purple-200">
                    {previewItem.mime_type} • {formatFileSize(previewItem.file_size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewItem(null)}
                  className="ml-4 bg-white/20 hover:bg-white/30 text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-8">
                {previewItem.file_type === 'image' && previewItem.publicUrl && (
                  <img
                    src={previewItem.publicUrl}
                    alt={previewItem.title || previewItem.file_name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      console.error('Image failed to load in modal:', previewItem.file_name)
                    }}
                  />
                )}
                {previewItem.file_type === 'video' && previewItem.publicUrl && (
                  <video
                    src={previewItem.publicUrl}
                    controls
                    autoPlay
                    className="max-w-full max-h-full"
                    onError={(e) => {
                      console.error('Video failed to load in modal:', previewItem.file_name)
                    }}
                  >
                    <source src={previewItem.publicUrl} type={previewItem.mime_type} />
                    Your browser does not support video playback.
                  </video>
                )}
                {previewItem.file_type === 'audio' && previewItem.publicUrl && (
                  <div className="text-center w-full max-w-xl">
                    <Music className="w-24 h-24 text-white/50 mx-auto mb-6" />
                    <audio 
                      controls 
                      autoPlay
                      className="w-full"
                      onError={(e) => {
                        console.error('Audio failed to load in modal:', previewItem.file_name)
                      }}
                    >
                      <source src={previewItem.publicUrl} type={previewItem.mime_type} />
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t bg-white space-y-3">
                {previewItem.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{previewItem.description}</p>
                  </div>
                )}
                {previewItem.tags && previewItem.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {previewItem.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    Added on {new Date(previewItem.created_at).toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewItem(null)
                        startEdit(previewItem)
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setPreviewItem(null)
                        handleDelete(previewItem)
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
