/**
 * TalentStory History Page
 * Shows all previously generated TalentStories with ability to view, regenerate, or delete
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';

interface TalentStory {
  id: string;
  story: string;
  created_at: string;
  model: string;
  is_active: boolean;
  data: any;
}

export default function TalentStoryHistoryPage() {
  const router = useRouter();
  const [stories, setStories] = useState<TalentStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<TalentStory | null>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabaseClient
        .from('talent_stories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this TalentStory?')) return;

    try {
      const { error } = await supabaseClient
        .from('talent_stories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setStories(stories.filter(s => s.id !== id));
      if (selectedStory?.id === id) setSelectedStory(null);
      alert('✅ TalentStory deleted successfully!');
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('❌ Failed to delete story');
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      // Mark all as inactive
      await supabaseClient
        .from('talent_stories')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Mark selected as active
      const { error } = await supabaseClient
        .from('talent_stories')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;
      
      await fetchStories();
      alert('✅ Set as active TalentStory!');
    } catch (error) {
      console.error('Error setting active:', error);
      alert('❌ Failed to set as active');
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }}
      >
        <div className="text-white text-xl">Loading your TalentStories...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#FFFFFF' }}>
              📚 TalentStory History
            </h1>
            <p style={{ color: '#9AA4B2' }}>View and manage all your generated TalentStories</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 font-semibold transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                color: '#9AA4B2'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🏠 Main Menu
            </button>
            <button
              onClick={() => router.push('/talent-story/builder')}
              className="px-6 py-3 font-semibold transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                borderRadius: '14px',
                color: '#FFFFFF',
                boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 241, 227, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 241, 227, 0.3)';
              }}
            >
              ✨ Create New
            </button>
          </div>
        </div>

        {stories.length === 0 ? (
          <div
            className="p-12 text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
              borderRadius: '20px'
            }}
          >
            <p className="text-lg mb-4" style={{ color: '#9AA4B2' }}>No TalentStories yet</p>
            <button
              onClick={() => router.push('/talent-story/builder')}
              className="px-6 py-3 font-semibold transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                borderRadius: '14px',
                color: '#FFFFFF',
                boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 241, 227, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 241, 227, 0.3)';
              }}
            >
              Create Your First TalentStory
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Story List */}
            <div className="lg:col-span-1 space-y-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className="p-4 cursor-pointer transition-all duration-200"
                  style={{
                    background: selectedStory?.id === story.id ? 'rgba(79, 241, 227, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                    border: selectedStory?.id === story.id ? '2px solid rgba(79, 241, 227, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(25px)',
                    boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
                    borderRadius: '20px'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedStory?.id !== story.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedStory?.id !== story.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold" style={{ color: '#FFFFFF' }}>
                          {new Date(story.created_at).toLocaleDateString()}
                        </span>
                        {story.is_active && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{
                              background: 'rgba(74, 222, 128, 0.15)',
                              border: '1px solid rgba(74, 222, 128, 0.3)',
                              color: '#4ade80'
                            }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: '#9AA4B2' }}>
                        {new Date(story.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm line-clamp-3" style={{ color: '#E5E7EB' }}>
                    {story.story.substring(0, 100)}...
                  </p>
                  <div className="flex gap-2 mt-3">
                    {!story.is_active && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetActive(story.id);
                        }}
                        className="text-xs px-2 py-1 rounded transition-all duration-200"
                        style={{
                          background: 'rgba(74, 222, 128, 0.15)',
                          border: '1px solid rgba(74, 222, 128, 0.3)',
                          color: '#4ade80'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(74, 222, 128, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(74, 222, 128, 0.15)';
                        }}
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(story.id);
                      }}
                      className="text-xs px-2 py-1 rounded transition-all duration-200"
                      style={{
                        background: 'rgba(255, 60, 60, 0.15)',
                        border: '1px solid rgba(255, 60, 60, 0.4)',
                        color: '#ff6b6b'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 60, 60, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 60, 60, 0.15)';
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Story Preview */}
            <div className="lg:col-span-2">
              {selectedStory ? (
                <div
                  className="p-6 space-y-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(25px)',
                    boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
                    borderRadius: '20px'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-1" style={{ color: '#FFFFFF' }}>
                        TalentStory Preview
                      </h2>
                      <p className="text-sm" style={{ color: '#9AA4B2' }}>
                        Created: {new Date(selectedStory.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedStory.story)}
                        className="px-4 py-2 text-sm transition-all duration-200"
                        style={{
                          background: 'rgba(79, 241, 227, 0.15)',
                          border: '1px solid rgba(79, 241, 227, 0.3)',
                          borderRadius: '12px',
                          color: '#4ff1e3'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(79, 241, 227, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(79, 241, 227, 0.15)';
                        }}
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([selectedStory.story], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `talent-story-${selectedStory.id}.md`;
                          a.click();
                        }}
                        className="px-4 py-2 text-sm transition-all duration-200"
                        style={{
                          background: 'rgba(79, 241, 227, 0.15)',
                          border: '1px solid rgba(79, 241, 227, 0.3)',
                          borderRadius: '12px',
                          color: '#4ff1e3'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(79, 241, 227, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(79, 241, 227, 0.15)';
                        }}
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  </div>

                  <div
                    className="prose prose-invert prose-pink max-w-none"
                    style={{
                      color: '#FFFFFF'
                    }}
                  >
                    <ReactMarkdown>{selectedStory.story}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div
                  className="p-12 text-center h-full flex items-center justify-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(25px)',
                    boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
                    borderRadius: '20px'
                  }}
                >
                  <p style={{ color: '#9AA4B2' }}>Select a TalentStory to preview</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
