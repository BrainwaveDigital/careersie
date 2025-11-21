'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';

interface JobPost {
  id: string;
  title: string;
  company: string;
  location: string;
  raw_description: string;
  parsed_data: any;
  created_at: string;
}

interface MatchScore {
  score_breakdown: {
    hard_skills: number;
    soft_skills: number;
    responsibilities: number;
    keywords: number;
    seniority: number;
    overall: number;
  };
  match_details: {
    matched_hard_skills: string[];
    missing_hard_skills: string[];
    matched_soft_skills: string[];
    missing_soft_skills: string[];
    matched_keywords: string[];
    experience_alignment: string;
  };
}

export default function JobMatchPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobPost, setJobPost] = useState<JobPost | null>(null);
  const [matchScore, setMatchScore] = useState<MatchScore | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  
  // Save functionality
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch job post details
  useEffect(() => {
    async function fetchJobPost() {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        const data = await response.json();

        if (response.ok && data.job_post) {
          setJobPost(data.job_post);
        } else {
          setError(data.error || 'Job post not found');
        }
      } catch (err) {
        console.error('Error fetching job post:', err);
        setError('Failed to load job post');
      }
    }

    if (jobId) {
      fetchJobPost();
    }
  }, [jobId]);

  // Fetch user profiles
  useEffect(() => {
    async function fetchProfiles() {
      try {
        // Get current user from Supabase auth
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
          console.error('No authenticated user');
          setLoading(false);
          return;
        }

        // Fetch user's profile
        const response = await fetch(`/api/profiles?userId=${user.id}`);
        
        if (!response.ok) {
          console.error('Failed to fetch user profile');
          setLoading(false);
          return;
        }

        const userData = await response.json();
        
        // The API returns a single profile in { data } format
        if (userData.data) {
          const profile = userData.data;
          setProfiles([profile]);
          setSelectedProfileId(profile.id);
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, []);

  // Calculate match score when profile is selected
  useEffect(() => {
    if (!selectedProfileId || !jobId) return;

    async function calculateMatch() {
      try {
        const response = await fetch('/api/jobs/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_post_id: jobId,
            profile_id: selectedProfileId,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setMatchScore({
            score_breakdown: data.score_breakdown,
            match_details: data.match_details,
          });
        }
      } catch (err) {
        console.error('Error calculating match:', err);
      }
    }

    calculateMatch();
  }, [selectedProfileId, jobId]);

  const handleSaveCustomizedStory = async () => {
    if (!versionName.trim()) {
      alert('Please enter a name for this customized version');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/jobs/save-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_post_id: jobId,
          profile_id: selectedProfileId,
          version_name: versionName,
          match_score: matchScore?.score_breakdown.overall || 0,
          score_breakdown: matchScore?.score_breakdown,
          match_details: matchScore?.match_details,
        }),
      });

      if (response.ok) {
        setShowSaveModal(false);
        setVersionName('');
        // Redirect to saved stories list
        router.push('/jobs/saved');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save customized story');
      }
    } catch (err) {
      console.error('Error saving:', err);
      alert('Failed to save customized story');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !jobPost) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div style={{
            padding: '16px',
            background: 'rgba(255, 60, 60, 0.15)',
            border: '1px solid rgba(255, 60, 60, 0.4)',
            borderRadius: '12px',
            color: '#ff6b6b'
          }}>
            {error || 'Job post not found'}
          </div>
          <button
            onClick={() => router.push('/jobs/customize')}
            style={{
              marginTop: '16px',
              color: '#4ff1e3',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            className="hover:opacity-80"
          >
            ← Back to Job Customizer
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }} className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/jobs/customize')}
            style={{ color: '#4ff1e3', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            className="mb-4 inline-flex items-center hover:opacity-80 transition"
          >
            ← Back to Job Customizer
          </button>
          <h1 style={{ color: '#FFFFFF' }} className="text-3xl font-bold">Job Match Analysis</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Info Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
              borderRadius: '20px',
              padding: '24px'
            }}>
              <h2 style={{ color: '#FFFFFF' }} className="text-2xl font-bold">{jobPost.title}</h2>
              {jobPost.company && (
                <p style={{ color: '#9AA4B2' }} className="text-lg mt-1">{jobPost.company}</p>
              )}
              {jobPost.location && (
                <p style={{ color: '#9AA4B2', fontSize: '14px' }} className="mt-1">{jobPost.location}</p>
              )}

              <div className="mt-4">
                <h3 style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: '8px' }}>Parsed Requirements:</h3>
                <div className="space-y-3">
                  {jobPost.parsed_data.hard_skills &&
                    jobPost.parsed_data.hard_skills.length > 0 && (
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#9AA4B2' }}>Hard Skills:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {jobPost.parsed_data.hard_skills.map((skill: string, idx: number) => (
                            <span
                              key={idx}
                              style={{
                                padding: '4px 8px',
                                background: 'rgba(79, 241, 227, 0.15)',
                                color: '#4ff1e3',
                                fontSize: '12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(79, 241, 227, 0.3)'
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {jobPost.parsed_data.soft_skills &&
                    jobPost.parsed_data.soft_skills.length > 0 && (
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#9AA4B2' }}>Soft Skills:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {jobPost.parsed_data.soft_skills.map((skill: string, idx: number) => (
                            <span
                              key={idx}
                              style={{
                                padding: '4px 8px',
                                background: 'rgba(83, 109, 254, 0.15)',
                                color: '#536dfe',
                                fontSize: '12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(83, 109, 254, 0.3)'
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {jobPost.parsed_data.tools && jobPost.parsed_data.tools.length > 0 && (
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#9AA4B2' }}>Tools & Technologies:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {jobPost.parsed_data.tools.map((tool: string, idx: number) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 8px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: '#9AA4B2',
                              fontSize: '12px',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Match Details Card */}
            {matchScore && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(25px)',
                boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
                borderRadius: '20px',
                padding: '24px'
              }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Match Details</h3>

                <div className="space-y-4">
                  {matchScore.match_details.matched_hard_skills.length > 0 && (
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#4ade80', marginBottom: '8px' }}>
                        ✓ Matching Hard Skills ({matchScore.match_details.matched_hard_skills.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {matchScore.match_details.matched_hard_skills.map((skill, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 8px',
                              background: 'rgba(74, 222, 128, 0.15)',
                              color: '#4ade80',
                              fontSize: '12px',
                              borderRadius: '8px',
                              border: '1px solid rgba(74, 222, 128, 0.3)'
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchScore.match_details.missing_hard_skills.length > 0 && (
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#ff6b6b', marginBottom: '8px' }}>
                        ✗ Missing Hard Skills ({matchScore.match_details.missing_hard_skills.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {matchScore.match_details.missing_hard_skills.map((skill, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 8px',
                              background: 'rgba(255, 60, 60, 0.15)',
                              color: '#ff6b6b',
                              fontSize: '12px',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 60, 60, 0.3)'
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Match Score */}
          <div className="space-y-6">
            {/* Profile Selector */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
              borderRadius: '20px',
              padding: '24px'
            }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#9AA4B2', marginBottom: '8px' }}>
                Select Profile:
              </label>
              <select
                value={selectedProfileId || ''}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                title="Select your profile"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#FFFFFF',
                  outline: 'none'
                }}
                className="focus:ring-2 focus:ring-cyan-400"
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id} style={{ background: '#1a1f2e', color: '#FFFFFF' }}>
                    {profile.name || 'Unnamed Profile'}
                  </option>
                ))}
              </select>
            </div>

            {/* Overall Score Card */}
            {matchScore && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(25px)',
                boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
                borderRadius: '20px',
                padding: '24px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '16px' }}>Match Score</h3>

                <div
                  style={{
                    background: matchScore.score_breakdown.overall >= 80 ? 'rgba(74, 222, 128, 0.15)' : matchScore.score_breakdown.overall >= 60 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 60, 60, 0.15)',
                    border: matchScore.score_breakdown.overall >= 80 ? '1px solid rgba(74, 222, 128, 0.3)' : matchScore.score_breakdown.overall >= 60 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255, 60, 60, 0.3)',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: matchScore.score_breakdown.overall >= 80 ? '#4ade80' : matchScore.score_breakdown.overall >= 60 ? '#fbbf24' : '#ff6b6b'
                  }}>
                    {matchScore.score_breakdown.overall}
                  </div>
                  <p style={{ fontSize: '14px', color: '#9AA4B2', marginTop: '8px' }}>Overall Match</p>
                </div>

                <div className="mt-6 space-y-3">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                      <span style={{ color: '#9AA4B2' }}>Hard Skills</span>
                      <span style={{ color: matchScore.score_breakdown.hard_skills >= 80 ? '#4ade80' : matchScore.score_breakdown.hard_skills >= 60 ? '#fbbf24' : '#ff6b6b' }}>
                        {matchScore.score_breakdown.hard_skills}%
                      </span>
                    </div>
                    <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', height: '8px', overflow: 'hidden' }}>
                      <div
                        style={{
                          background: 'linear-gradient(90deg, #4ff1e3, #536dfe)',
                          height: '8px',
                          borderRadius: '12px',
                          width: `${matchScore.score_breakdown.hard_skills}%`,
                          transition: 'width 0.3s ease'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                      <span style={{ color: '#9AA4B2' }}>Soft Skills</span>
                      <span style={{ color: matchScore.score_breakdown.soft_skills >= 80 ? '#4ade80' : matchScore.score_breakdown.soft_skills >= 60 ? '#fbbf24' : '#ff6b6b' }}>
                        {matchScore.score_breakdown.soft_skills}%
                      </span>
                    </div>
                    <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', height: '8px', overflow: 'hidden' }}>
                      <div
                        style={{
                          background: 'linear-gradient(90deg, #4ff1e3, #536dfe)',
                          height: '8px',
                          borderRadius: '12px',
                          width: `${matchScore.score_breakdown.soft_skills}%`,
                          transition: 'width 0.3s ease'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                      <span style={{ color: '#9AA4B2' }}>Responsibilities</span>
                      <span style={{ color: matchScore.score_breakdown.responsibilities >= 80 ? '#4ade80' : matchScore.score_breakdown.responsibilities >= 60 ? '#fbbf24' : '#ff6b6b' }}>
                        {matchScore.score_breakdown.responsibilities}%
                      </span>
                    </div>
                    <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', height: '8px', overflow: 'hidden' }}>
                      <div
                        style={{
                          background: 'linear-gradient(90deg, #4ff1e3, #536dfe)',
                          height: '8px',
                          borderRadius: '12px',
                          width: `${matchScore.score_breakdown.responsibilities}%`,
                          transition: 'width 0.3s ease'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                      <span style={{ color: '#9AA4B2' }}>Keywords</span>
                      <span style={{ color: matchScore.score_breakdown.keywords >= 80 ? '#4ade80' : matchScore.score_breakdown.keywords >= 60 ? '#fbbf24' : '#ff6b6b' }}>
                        {matchScore.score_breakdown.keywords}%
                      </span>
                    </div>
                    <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', height: '8px', overflow: 'hidden' }}>
                      <div
                        style={{
                          background: 'linear-gradient(90deg, #4ff1e3, #536dfe)',
                          height: '8px',
                          borderRadius: '12px',
                          width: `${matchScore.score_breakdown.keywords}%`,
                          transition: 'width 0.3s ease'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                      <span style={{ color: '#9AA4B2' }}>Seniority</span>
                      <span style={{ color: matchScore.score_breakdown.seniority >= 80 ? '#4ade80' : matchScore.score_breakdown.seniority >= 60 ? '#fbbf24' : '#ff6b6b' }}>
                        {matchScore.score_breakdown.seniority}%
                      </span>
                    </div>
                    <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', height: '8px', overflow: 'hidden' }}>
                      <div
                        style={{
                          background: 'linear-gradient(90deg, #4ff1e3, #536dfe)',
                          height: '8px',
                          borderRadius: '12px',
                          width: `${matchScore.score_breakdown.seniority}%`,
                          transition: 'width 0.3s ease'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowSaveModal(true)}
                  disabled={!matchScore}
                  style={{
                    width: '100%',
                    marginTop: '24px',
                    background: !matchScore ? 'rgba(79, 241, 227, 0.4)' : 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                    color: '#FFFFFF',
                    fontWeight: '600',
                    padding: '12px 24px',
                    borderRadius: '14px',
                    border: 'none',
                    cursor: !matchScore ? 'not-allowed' : 'pointer',
                    boxShadow: !matchScore ? 'none' : '0 4px 15px rgba(79, 241, 227, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  className={matchScore ? 'hover:shadow-[0_6px_20px_rgba(79,241,227,0.4)] hover:-translate-y-0.5' : ''}
                >
                  Save Customized Story
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div style={{ position: 'fixed', inset: '0', background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px', backdropFilter: 'blur(5px)' }}>
          <div style={{
            background: 'rgba(13, 17, 23, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(25px)',
            borderRadius: '24px',
            boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)',
            maxWidth: '28rem',
            width: '100%',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '16px' }}>Save Customized Story</h3>
            
            <p style={{ color: '#9AA4B2', marginBottom: '16px' }}>
              Give this customized version a name to identify it later:
            </p>

            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="e.g., Software Engineer - Tech Corp"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 0.2s ease',
                color: '#FFFFFF',
                marginBottom: '24px'
              }}
              className="placeholder-gray-500 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setVersionName('');
                }}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'rgba(255, 60, 60, 0.15)',
                  border: '1px solid rgba(255, 60, 60, 0.4)',
                  color: '#ff6b6b',
                  fontWeight: '500',
                  borderRadius: '14px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? '0.5' : '1',
                  transition: 'all 0.2s ease'
                }}
                className="hover:bg-opacity-25"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomizedStory}
                disabled={saving || !versionName.trim()}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: (saving || !versionName.trim()) ? 'rgba(79, 241, 227, 0.4)' : 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                  color: '#FFFFFF',
                  fontWeight: '600',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: (saving || !versionName.trim()) ? 'not-allowed' : 'pointer',
                  boxShadow: (saving || !versionName.trim()) ? 'none' : '0 4px 15px rgba(79, 241, 227, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                className={(!saving && versionName.trim()) ? 'hover:shadow-[0_6px_20px_rgba(79,241,227,0.4)] hover:-translate-y-0.5' : ''}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
