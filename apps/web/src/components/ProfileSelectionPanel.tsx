/**
 * Profile Selection Panel
 * 
 * Allows users to select from their existing parsed profiles
 * to generate a TalentStory
 */

'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

interface ParsedProfile {
  id: string;
  created_at: string;
  filename: string;
  data: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
    skills?: string[];
    experience?: Array<{
      title?: string;
      company?: string;
      duration?: string;
    }>;
  };
}

interface ProfileSelectionPanelProps {
  onSelect: (profileId: string, profileData: any) => void;
}

export default function ProfileSelectionPanel({ onSelect }: ProfileSelectionPanelProps) {
  const [profiles, setProfiles] = useState<ParsedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      // Fetch profiles with their parsed documents for this user
      const { data: profilesData, error } = await supabaseClient
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          phone,
          location,
          summary,
          headline,
          created_at,
          parsed_documents (
            id,
            file_name,
            parsed_json,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to expected format
      const transformed = profilesData?.map((profile: any) => ({
        id: profile.id,
        created_at: profile.created_at,
        filename: profile.parsed_documents?.[0]?.file_name || 'Profile',
        data: {
          fullName: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          summary: profile.summary || profile.headline,
          // We'll load full data including skills, experience when selected
        }
      })) || [];

      setProfiles(transformed);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (profile: ParsedProfile) => {
    setSelectedId(profile.id);
  };

  const handleContinue = async () => {
    if (!selectedId) {
      alert('Please select a profile first');
      return;
    }

    try {
      // Fetch complete profile data including skills, experience, education
      const [profileRes, skillsRes, experienceRes, educationRes] = await Promise.all([
        supabaseClient.from('profiles').select('*').eq('id', selectedId).single(),
        supabaseClient.from('skills').select('*').eq('profile_id', selectedId),
        supabaseClient.from('experiences').select('*').eq('profile_id', selectedId).order('order_index', { ascending: true }),
        supabaseClient.from('education').select('*').eq('profile_id', selectedId).order('start_year', { ascending: false })
      ]);

      if (profileRes.error) throw profileRes.error;

      // Combine all data into a comprehensive profile object
      const completeProfileData = {
        ...profileRes.data,
        fullName: profileRes.data.full_name,
        preferredName: profileRes.data.preferred_name,
        skills: skillsRes.data?.map((s: any) => s.skill) || [],
        skillsData: skillsRes.data || [],
        experience: experienceRes.data || [],
        education: educationRes.data || [],
        // Also check parsed_json from parsed_documents for additional data
        parsed_json: profileRes.data.parsed_json || {}
      };

      onSelect(selectedId, completeProfileData);
    } catch (error) {
      console.error('Error loading complete profile:', error);
      alert('Failed to load profile data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-pink-300">Loading your profiles...</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Profiles Found</h3>
        <p className="text-pink-300 mb-6">
          You need to upload and parse a CV first before generating a TalentStory.
        </p>
        <Button
          onClick={() => window.location.href = '/profile/upload'}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        >
          Upload CV Now
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-sm text-pink-400 font-semibold mb-2">STEP 1</div>
        <h2 className="text-2xl font-bold text-white mb-2">Select Your Profile</h2>
        <p className="text-pink-300">
          Choose which CV you'd like to use for your TalentStory
        </p>
      </div>

      {/* Profile Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map((profile) => {
          const data = profile.data || {};
          const isSelected = selectedId === profile.id;

          return (
            <button
              key={profile.id}
              onClick={() => handleSelect(profile)}
              className={`glass-card p-6 text-left transition-all ${
                isSelected 
                  ? 'border-2 border-pink-500 bg-pink-500/10' 
                  : 'border border-pink-500/20 hover:border-pink-500/40'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {data.fullName || 'Unnamed Profile'}
                  </h3>
                  <p className="text-sm text-pink-400">
                    {profile.filename || 'CV'}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-2 text-sm">
                {data.email && (
                  <div className="flex items-center text-pink-300">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {data.email}
                  </div>
                )}
                {data.location && (
                  <div className="flex items-center text-pink-300">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {data.location}
                  </div>
                )}
                {data.skills && data.skills.length > 0 && (
                  <div className="flex items-start text-pink-300">
                    <svg className="w-4 h-4 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="line-clamp-2">
                      {data.skills.slice(0, 5).join(', ')}
                      {data.skills.length > 5 && ` +${data.skills.length - 5} more`}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-pink-500/20">
                <p className="text-xs text-pink-400/60">
                  Uploaded {new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!selectedId}
        className="w-full py-6 text-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white disabled:opacity-50"
      >
        Continue with Selected Profile →
      </Button>

      {/* Upload New Option */}
      <div className="text-center">
        <button
          onClick={() => window.location.href = '/profile/upload'}
          className="text-pink-400 hover:text-pink-300 text-sm underline"
        >
          Or upload a new CV
        </button>
      </div>
    </div>
  );
}
