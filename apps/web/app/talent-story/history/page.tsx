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
      <div className="min-h-screen bg-gradient-to-br from-pink-950/40 via-purple-900/20 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading your TalentStories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-950/40 via-purple-900/20 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-2">
              📚 TalentStory History
            </h1>
            <p className="text-gray-400">View and manage all your generated TalentStories</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 rounded-lg bg-gray-500/20 border border-gray-500/30 text-gray-300 hover:bg-gray-500/30 font-semibold"
            >
              🏠 Main Menu
            </button>
            <button
              onClick={() => router.push('/talent-story/builder')}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold"
            >
              ✨ Create New
            </button>
          </div>
        </div>

        {stories.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">No TalentStories yet</p>
            <button
              onClick={() => router.push('/talent-story/builder')}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold"
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
                  className={`glass-card p-4 cursor-pointer transition-all ${
                    selectedStory?.id === story.id
                      ? 'ring-2 ring-pink-500 bg-pink-500/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold">
                          {new Date(story.created_at).toLocaleDateString()}
                        </span>
                        {story.is_active && (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {new Date(story.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm line-clamp-3">
                    {story.story.substring(0, 100)}...
                  </p>
                  <div className="flex gap-2 mt-3">
                    {!story.is_active && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetActive(story.id);
                        }}
                        className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(story.id);
                      }}
                      className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
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
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        TalentStory Preview
                      </h2>
                      <p className="text-gray-400 text-sm">
                        Created: {new Date(selectedStory.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedStory.story)}
                        className="px-4 py-2 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-400 hover:bg-pink-500/30 text-sm"
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
                        className="px-4 py-2 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-400 hover:bg-pink-500/30 text-sm"
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  </div>

                  <div className="prose prose-invert prose-pink max-w-none">
                    <ReactMarkdown>{selectedStory.story}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-12 text-center h-full flex items-center justify-center">
                  <p className="text-gray-400">Select a TalentStory to preview</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
