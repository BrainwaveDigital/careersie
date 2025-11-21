'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';

interface SavedStory {
  id: string;
  version_name: string;
  match_score: number;
  created_at: string;
  job_post_id: string;
  job_posts: {
    title: string;
    company: string;
  };
}

export default function SavedStoriesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedStories();
  }, []);

  const fetchSavedStories = async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/jobs/saved-stories?userId=${user.id}`);
      const data = await response.json();

      if (response.ok) {
        setStories(data.stories || []);
      } else {
        setError(data.error || 'Failed to load saved stories');
      }
    } catch (err) {
      console.error('Error fetching saved stories:', err);
      setError('Failed to load saved stories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this saved story?')) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/saved-stories/${storyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setStories(stories.filter(s => s.id !== storyId));
      } else {
        alert('Failed to delete story');
      }
    } catch (err) {
      console.error('Error deleting story:', err);
      alert('Failed to delete story');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div style={{ borderColor: '#4ff1e3' }} className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"></div>
          <p style={{ marginTop: '16px', color: '#9AA4B2' }}>Loading your saved stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }} className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 style={{ color: '#FFFFFF' }} className="text-4xl font-bold">Saved Customized Stories</h1>
            <button
              onClick={() => router.push('/jobs/customize')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                color: '#FFFFFF',
                fontWeight: '600',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)',
                transition: 'all 0.2s ease'
              }}
              className="hover:shadow-[0_6px_20px_rgba(79,241,227,0.4)] hover:-translate-y-0.5"
            >
              + Create New
            </button>
          </div>
          <p style={{ color: '#9AA4B2' }}>
            View and manage your customized stories for different job applications
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 60, 60, 0.15)',
            border: '1px solid rgba(255, 60, 60, 0.4)',
            color: '#ff6b6b',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        {stories.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '24px',
            padding: '48px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#FFFFFF', marginBottom: '8px' }}>No saved stories yet</h3>
            <p style={{ color: '#9AA4B2', marginBottom: '24px' }}>
              Create your first customized story by analyzing a job description
            </p>
            <button
              onClick={() => router.push('/jobs/customize')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                color: '#FFFFFF',
                fontWeight: '600',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)',
                transition: 'all 0.2s ease'
              }}
              className="hover:shadow-[0_6px_20px_rgba(79,241,227,0.4)] hover:-translate-y-0.5"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <div
                key={story.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(25px)',
                  boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
                className="hover:shadow-[0_0_40px_rgba(0,0,0,0.5)] hover:-translate-y-1"
              >
                <div style={{ padding: '24px' }}>
                  {/* Match Score Badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      background: story.match_score >= 80 ? 'rgba(74, 222, 128, 0.15)' : story.match_score >= 60 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 60, 60, 0.15)',
                      color: story.match_score >= 80 ? '#4ade80' : story.match_score >= 60 ? '#fbbf24' : '#ff6b6b',
                      border: story.match_score >= 80 ? '1px solid rgba(74, 222, 128, 0.3)' : story.match_score >= 60 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255, 60, 60, 0.3)'
                    }}>
                      {story.match_score}% Match
                    </div>
                    <button
                      onClick={() => handleDelete(story.id)}
                      title="Delete"
                      style={{
                        color: '#9AA4B2',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease'
                      }}
                      className="hover:text-red-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Version Name */}
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>
                    {story.version_name}
                  </h3>

                  {/* Job Info */}
                  <div style={{ fontSize: '14px', marginBottom: '16px' }}>
                    <p style={{ fontWeight: '600', color: '#9AA4B2' }}>{story.job_posts?.title}</p>
                    {story.job_posts?.company && (
                      <p style={{ color: '#6B7280' }}>{story.job_posts.company}</p>
                    )}
                  </div>

                  {/* Date */}
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px' }}>
                    Saved {new Date(story.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => router.push(`/jobs/match/${story.job_post_id}`)}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#9AA4B2',
                        fontWeight: '500',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                      }}
                      className="hover:bg-white/10"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        // TODO: View/edit the customized story
                        alert('Story viewer coming soon!');
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                        color: '#FFFFFF',
                        fontWeight: '500',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        boxShadow: '0 2px 10px rgba(79, 241, 227, 0.2)',
                        transition: 'all 0.2s ease'
                      }}
                      className="hover:shadow-[0_4px_15px_rgba(79,241,227,0.3)] hover:-translate-y-0.5"
                    >
                      View Story
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              color: '#4ff1e3',
              fontWeight: '500',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease'
            }}
            className="hover:opacity-80"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
