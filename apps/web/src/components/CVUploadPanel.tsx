/**
 * CV & Media Upload Component
 * 
 * Step 1 of TalentStory generation flow:
 * - Upload CV (PDF, DOCX)
 * - Add optional media (images, videos, PDFs, portfolio links)
 * - Auto-parse CV data into ProfileStoryInput
 */

'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'portfolio' | 'document';
  url: string;
  file?: File;
  caption?: string;
}

interface CVUploadPanelProps {
  onComplete: (data: { cvParsed: boolean; media: MediaItem[] }) => void;
}

export default function CVUploadPanel({ onComplete }: CVUploadPanelProps) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvParsing, setCvParsing] = useState(false);
  const [cvParsed, setCvParsed] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  const cvInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Handle CV file selection
  const handleCVFile = async (file: File) => {
    setCvFile(file);
    setCvParsing(true);

    try {
      // Upload and parse CV
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parsing/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse CV');
      }

      const data = await response.json();
      setCvParsed(true);
      
    } catch (error) {
      console.error('CV parsing error:', error);
      alert('Failed to parse CV. Please try again.');
    } finally {
      setCvParsing(false);
    }
  };

  // Handle drag & drop for CV
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || 
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        handleCVFile(file);
      } else {
        alert('Please upload a PDF or DOCX file');
      }
    }
  };

  // Handle media file selection
  const handleMediaFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      const mediaType = file.type.startsWith('image/') ? 'image' : 
                       file.type.startsWith('video/') ? 'video' : 'document';
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const newMedia: MediaItem = {
          id: Math.random().toString(36).substr(2, 9),
          type: mediaType,
          url: e.target?.result as string,
          file,
          caption: '',
        };
        setMedia(prev => [...prev, newMedia]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Add portfolio link
  const addPortfolioLink = () => {
    const url = prompt('Enter portfolio URL (GitHub, Behance, etc.):');
    if (url) {
      setMedia(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        type: 'portfolio',
        url,
        caption: '',
      }]);
    }
  };

  // Update media caption
  const updateCaption = (id: string, caption: string) => {
    setMedia(prev => prev.map(m => m.id === id ? { ...m, caption } : m));
  };

  // Remove media item
  const removeMedia = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  // Proceed to next step
  const handleContinue = () => {
    if (!cvParsed) {
      alert('Please upload and parse a CV first');
      return;
    }
    onComplete({ cvParsed, media });
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="text-center">
        <div className="text-sm text-pink-400 font-semibold mb-2">STEP 1</div>
        <h2 className="text-2xl font-bold text-white mb-2">Upload Your CV & Media</h2>
        <p className="text-pink-300">
          Start by uploading your CV. Optionally add portfolio items, screenshots, or videos.
        </p>
      </div>

      {/* CV Upload */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📄 CV/Resume</h3>
        
        {!cvFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              dragActive 
                ? 'border-pink-500 bg-pink-500/10' 
                : 'border-pink-500/30 bg-pink-500/5 hover:border-pink-500/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-white font-medium mb-2">Drag & drop your CV here</p>
            <p className="text-pink-300 text-sm mb-4">or click to browse</p>
            <Button
              onClick={() => cvInputRef.current?.click()}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              Choose File
            </Button>
            <p className="text-xs text-pink-400/60 mt-3">Supports PDF and DOCX</p>
            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              aria-label="Upload CV file"
              onChange={(e) => e.target.files?.[0] && handleCVFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="bg-black/20 rounded-lg p-4 border border-pink-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-medium">{cvFile.name}</div>
                  <div className="text-xs text-pink-400">
                    {cvParsing ? '⏳ Parsing...' : cvParsed ? '✅ Parsed successfully' : '⚠️ Parsing failed'}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => {
                  setCvFile(null);
                  setCvParsed(false);
                }}
                variant="outline"
                size="sm"
                className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
              >
                Remove
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Media Upload (Optional) */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">🎨 Media & Portfolio (Optional)</h3>
            <p className="text-sm text-pink-300 mt-1">Add screenshots, videos, or portfolio links</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => mediaInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              + Upload Media
            </Button>
            <Button
              onClick={addPortfolioLink}
              variant="outline"
              size="sm"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              + Add Link
            </Button>
          </div>
          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/*,.pdf"
            multiple
            className="hidden"
            aria-label="Upload media files"
            onChange={(e) => e.target.files && handleMediaFiles(e.target.files)}
          />
        </div>

        {media.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {media.map((item) => (
              <div key={item.id} className="bg-black/20 rounded-lg p-3 border border-purple-500/30">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs text-purple-400 font-medium uppercase">{item.type}</div>
                  <button
                    onClick={() => removeMedia(item.id)}
                    className="text-pink-400 hover:text-pink-300"
                    aria-label="Remove media item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {item.type === 'image' && item.url && (
                  <img src={item.url} alt="Preview" className="w-full h-24 object-cover rounded mb-2" />
                )}
                {item.type === 'portfolio' && (
                  <div className="text-xs text-purple-300 mb-2 truncate">{item.url}</div>
                )}
                <input
                  type="text"
                  value={item.caption}
                  onChange={(e) => updateCaption(item.id, e.target.value)}
                  placeholder="Add caption..."
                  className="w-full p-2 text-sm rounded bg-black/30 border border-purple-500/30 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-pink-400/60 text-sm">
            No media added yet. This is optional.
          </div>
        )}
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!cvParsed || cvParsing}
        className="w-full py-6 text-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white disabled:opacity-50"
      >
        {cvParsing ? 'Parsing CV...' : cvParsed ? 'Continue to Customization →' : 'Upload CV to Continue'}
      </Button>
    </div>
  );
}
