/**
 * Story Testing Page
 * 
 * Development page for testing Sprint 2.4 Stories feature.
 * Access at: http://localhost:3000/story-test
 */

'use client';

import { useState, useEffect } from 'react';
import { AddStoryModal } from '@/components/AddStoryModal';
import { StoryList } from '@/components/StoryList';
import { StoryEditor } from '@/components/StoryEditor';
import { VersionHistory } from '@/components/VersionHistory';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { getSupabaseServer } from '@/lib/supabase.server';
import { supabaseClient } from '@/lib/supabase';
import { ArrowLeft, Plus, Edit, History, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Experience {
  id: string;
  title: string;
  company: string;
}

export default function StoryTestPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [experienceId, setExperienceId] = useState('');
  const [storyId, setStoryId] = useState('');
  const [experienceTitle, setExperienceTitle] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's experiences
  useEffect(() => {
    async function fetchExperiences() {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { data, error } = await supabaseClient
          .from('experiences')
          .select('id, title, company, profiles!inner(user_id)')
          .order('start_date', { ascending: false });

        if (!error && data) {
          setExperiences(data);
          // Auto-select first experience
          if (data.length > 0) {
            setExperienceId(data[0].id);
            setExperienceTitle(`${data[0].title} at ${data[0].company}`);
          }
        }
      } catch (err) {
        console.error('Error fetching experiences:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchExperiences();
  }, []);

  const handleExperienceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setExperienceId(selectedId);
    const exp = experiences.find(e => e.id === selectedId);
    if (exp) {
      setExperienceTitle(`${exp.title} at ${exp.company}`);
    }
  };

  const handleEditStory = (id: string) => {
    setStoryId(id);
    setShowEditor(true);
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;
    
    try {
      const response = await fetch(`/api/stories/${id}`, { method: 'DELETE' });
      if (response.ok) {
        // Refresh the story list
        window.location.reload();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleViewVersions = (id: string) => {
    setStoryId(id);
    setShowVersions(true);
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }} className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '8px 16px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                cursor: 'pointer'
              }}
              className="hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            <h1 style={{ color: '#FFFFFF' }} className="text-4xl font-bold mb-2">
              STAR Stories
            </h1>
            <p style={{ color: '#9AA4B2' }} className="text-lg">
              Create achievement narratives for your resume and interviews
            </p>
          </div>
        </div>

        {/* Experience Selection */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(25px)',
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#FFFFFF' }} className="text-xl font-semibold mb-4">Select Experience</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="experienceSelect" style={{ color: '#FFFFFF', marginBottom: '8px', display: 'block' }}>
                Choose a role to create stories for
              </Label>
              {loading ? (
                <p style={{ color: '#9AA4B2' }}>Loading your experiences...</p>
              ) : experiences.length === 0 ? (
                <p style={{ color: '#9AA4B2' }}>No experiences found. Create one in your profile first.</p>
              ) : (
                <select
                  id="experienceSelect"
                  value={experienceId}
                  onChange={handleExperienceChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  {experiences.map((exp) => (
                    <option key={exp.id} value={exp.id} style={{ background: '#0D1117', color: '#FFFFFF' }}>
                      {exp.title} at {exp.company}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Story List */}
        {experienceId && (
          <div className="mt-8">
            <StoryList
              experienceId={experienceId}
              experienceTitle={experienceTitle}
              onEditStory={handleEditStory}
            />
          </div>
        )}

        {/* Modals */}
        {showModal && experienceId && (
          <AddStoryModal
            experienceId={experienceId}
            experienceTitle={experienceTitle}
            onClose={() => setShowModal(false)}
            onSuccess={(id) => {
              setStoryId(id);
              setShowModal(false);
            }}
          />
        )}

        {showEditor && storyId && (
          <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
            <StoryEditor
              storyId={storyId}
              onClose={() => setShowEditor(false)}
            />
          </div>
        )}

        {showVersions && storyId && (
          <VersionHistory
            storyId={storyId}
            open={showVersions}
            onClose={() => setShowVersions(false)}
          />
        )}
      </div>
    </div>
  );
}
