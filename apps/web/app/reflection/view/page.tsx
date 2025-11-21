"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';
import { Lightbulb, ArrowLeft, Calendar, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ReflectionData {
  id: string;
  submission_date: string;
  time_taken_seconds: number;
  career_goals_3_5_years: string;
  has_clear_career_direction: number;
  role_within_next_year: string;
  career_motivations: string[];
  sense_of_fulfillment: string;
  career_fulfillment_rating: number;
  professional_strengths: string;
  skills_to_develop: string;
  seeks_development_rating: number;
  preferred_work_environment: string;
  problem_solving_approach: string;
  leadership_preference_rating: number;
  proudest_achievement: string;
  biggest_challenge_and_learning: string;
  reflects_regularly_rating: number;
}

export default function ViewReflectionPage() {
  const router = useRouter();
  const [reflection, setReflection] = useState<ReflectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReflection = async () => {
      try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        
        if (authError || !user) {
          router.push('/login');
          return;
        }

        // Look up the profile_id from the user_id
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          setError('Profile not found. Please create a profile first.');
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabaseClient
          .from('self_reflection_insights')
          .select('*')
          .eq('profile_id', profile.id)  // Use the actual profile ID
          .eq('completed', true)
          .order('submission_date', { ascending: false })
          .limit(1)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('No reflection found. Please complete the questionnaire first.');
          } else {
            setError('Error loading reflection data.');
            console.error('Fetch error:', fetchError);
          }
        } else {
          // Parse career_motivations if it's a string
          if (data.career_motivations && typeof data.career_motivations === 'string') {
            try {
              data.career_motivations = JSON.parse(data.career_motivations);
            } catch (e) {
              console.error('Error parsing career_motivations:', e);
              data.career_motivations = [];
            }
          }
          setReflection(data);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchReflection();
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getRatingLabel = (rating: number) => {
    const labels = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
    return labels[rating - 1] || 'N/A';
  };

  if (loading) {
    return (
      <div
        className="min-h-screen p-6 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: '#4ff1e3' }} />
          <h2 className="text-xl font-semibold" style={{ color: '#FFFFFF' }}>Loading your insights...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen p-6 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }}
      >
        <div
          className="p-8 max-w-2xl w-full text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}
        >
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#FFFFFF' }}>{error}</h2>
          <div className="mt-6 flex gap-4 justify-center">
            <button
              className="px-6 py-3 rounded-full transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF'
              }}
            >
              <Link href="/dashboard">Back to Dashboard</Link>
            </button>
            <button
              className="px-6 py-3 rounded-full transition-all duration-200 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                color: '#FFFFFF',
                boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)'
              }}
            >
              <Link href="/reflection">Complete Reflection</Link>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reflection) {
    return null;
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div
          className="p-8 mb-6"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Lightbulb className="w-8 h-8 mr-3" style={{ color: '#4ff1e3' }} />
              <div>
                <h1 className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>Your Self-Reflection Insights</h1>
                <p className="text-sm mt-1" style={{ color: '#9AA4B2' }}>Review your career journey reflections</p>
              </div>
            </div>
            <button
              className="px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF'
              }}
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </button>
          </div>

          <div
            className="flex gap-6 text-sm pt-4"
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#9AA4B2'
            }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Completed: {formatDate(reflection.submission_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Time taken: {formatTime(reflection.time_taken_seconds)}</span>
            </div>
          </div>
        </div>

        {/* Career Goals & Aspirations */}
        <div
          className="p-8 mb-6"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}
        >
          <h2
            className="text-2xl font-bold mb-6 pb-3"
            style={{
              color: '#FFFFFF',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            Career Goals & Aspirations
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#9AA4B2' }}>Primary Career Goals (3-5 years)</h3>
              <p
                className="rounded-lg p-4"
                style={{
                  color: '#FFFFFF',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >{reflection.career_goals_3_5_years}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#9AA4B2' }}>Career Direction Clarity</h3>
                <div
                  className="rounded-lg p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium" style={{ color: '#E5E7EB' }}>{getRatingLabel(reflection.has_clear_career_direction)}</span>
                    <span className="font-bold" style={{ color: '#4ff1e3' }}>{reflection.has_clear_career_direction}/5</span>
                  </div>
                  <div
                    className="w-full rounded-full h-2"
                    style={{ background: 'rgba(79, 241, 227, 0.2)' }}
                  >
                    <div 
                      className="h-2 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                        width: `${(reflection.has_clear_career_direction / 5) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#9AA4B2' }}>Desired Role (Next Year)</h3>
                <p
                  className="rounded-lg p-4"
                  style={{
                    color: '#E5E7EB',
                    background: 'rgba(255, 255, 255, 0.06)'
                  }}
                >{reflection.role_within_next_year}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Motivations & Values */}
        <div
          className="p-8 mb-6"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}
        >
          <h2
            className="text-2xl font-bold mb-6 pb-3"
            style={{
              color: '#FFFFFF',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            Motivations & Values
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#9AA4B2' }}>Career Motivators</h3>
              <div className="flex flex-wrap gap-2">
                {reflection.career_motivations && Array.isArray(reflection.career_motivations) && reflection.career_motivations.map((motivation, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full text-sm font-medium"
                    style={{
                      background: 'rgba(79, 241, 227, 0.15)',
                      border: '1px solid rgba(79, 241, 227, 0.3)',
                      color: '#4ff1e3'
                    }}
                  >
                    {motivation}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#9AA4B2' }}>Sense of Fulfillment</h3>
              <p
                className="rounded-lg p-4"
                style={{
                  color: '#E5E7EB',
                  background: 'rgba(255, 255, 255, 0.06)'
                }}
              >{reflection.sense_of_fulfillment}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#9AA4B2' }}>Career Path Fulfillment</h3>
              <div
                className="rounded-lg p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium" style={{ color: '#E5E7EB' }}>{getRatingLabel(reflection.career_fulfillment_rating)}</span>
                  <span className="font-bold" style={{ color: '#4ff1e3' }}>{reflection.career_fulfillment_rating}/5</span>
                </div>
                <div
                  className="w-full rounded-full h-2"
                  style={{ background: 'rgba(79, 241, 227, 0.2)' }}
                >
                  <div 
                    className="h-2 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                      width: `${(reflection.career_fulfillment_rating / 5) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Development */}
        <div
          className="p-8 mb-6"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}
        >
          <h2
            className="text-2xl font-bold mb-6 pb-3"
            style={{
              color: '#FFFFFF',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            Strengths & Development
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#9AA4B2' }}>Professional Strengths</h3>
              <p
                className="rounded-lg p-4 whitespace-pre-wrap"
                style={{
                  color: '#E5E7EB',
                  background: 'rgba(255, 255, 255, 0.06)'
                }}
              >{reflection.professional_strengths}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#9AA4B2' }}>Skills to Develop</h3>
              <p
                className="rounded-lg p-4 whitespace-pre-wrap"
                style={{
                  color: '#E5E7EB',
                  background: 'rgba(255, 255, 255, 0.06)'
                }}
              >{reflection.skills_to_develop}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#9AA4B2' }}>Development Seeking Behavior</h3>
              <div
                className="rounded-lg p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium" style={{ color: '#E5E7EB' }}>{getRatingLabel(reflection.seeks_development_rating)}</span>
                  <span className="font-bold" style={{ color: '#4ff1e3' }}>{reflection.seeks_development_rating}/5</span>
                </div>
                <div
                  className="w-full rounded-full h-2"
                  style={{ background: 'rgba(79, 241, 227, 0.2)' }}
                >
                  <div 
                    className="h-2 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                      width: `${(reflection.seeks_development_rating / 5) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Work Style Preferences */}
        <div
          className="p-8 mb-6"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}
        >
          <h2
            className="text-2xl font-bold mb-6 pb-3"
            style={{
              color: '#FFFFFF',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            Work Style Preferences
          </h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#9AA4B2' }}>Preferred Work Environment</h3>
                <p
                  className="rounded-lg p-4"
                  style={{
                    color: '#E5E7EB',
                    background: 'rgba(255, 255, 255, 0.06)'
                  }}
                >{reflection.preferred_work_environment}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#9AA4B2' }}>Problem-Solving Approach</h3>
                <p
                  className="rounded-lg p-4"
                  style={{
                    color: '#E5E7EB',
                    background: 'rgba(255, 255, 255, 0.06)'
                  }}
                >{reflection.problem_solving_approach}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#9AA4B2' }}>Leadership Preference</h3>
              <div
                className="rounded-lg p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium" style={{ color: '#E5E7EB' }}>{getRatingLabel(reflection.leadership_preference_rating)}</span>
                  <span className="font-bold" style={{ color: '#4ff1e3' }}>{reflection.leadership_preference_rating}/5</span>
                </div>
                <div
                  className="w-full rounded-full h-2"
                  style={{ background: 'rgba(79, 241, 227, 0.2)' }}
                >
                  <div 
                    className="h-2 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                      width: `${(reflection.leadership_preference_rating / 5) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Past Experiences & Learnings */}
        <div
          className="p-8 mb-6"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}
        >
          <h2
            className="text-2xl font-bold mb-6 pb-3"
            style={{
              color: '#FFFFFF',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            Past Experiences & Learnings
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#9AA4B2' }}>Proudest Achievement</h3>
              <p
                className="rounded-lg p-4 whitespace-pre-wrap"
                style={{
                  color: '#E5E7EB',
                  background: 'rgba(255, 255, 255, 0.06)'
                }}
              >{reflection.proudest_achievement}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#9AA4B2' }}>Biggest Challenge & Learning</h3>
              <p
                className="rounded-lg p-4 whitespace-pre-wrap"
                style={{
                  color: '#E5E7EB',
                  background: 'rgba(255, 255, 255, 0.06)'
                }}
              >{reflection.biggest_challenge_and_learning}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#9AA4B2' }}>Regular Reflection Habit</h3>
              <div
                className="rounded-lg p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium" style={{ color: '#E5E7EB' }}>{getRatingLabel(reflection.reflects_regularly_rating)}</span>
                  <span className="font-bold" style={{ color: '#4ff1e3' }}>{reflection.reflects_regularly_rating}/5</span>
                </div>
                <div
                  className="w-full rounded-full h-2"
                  style={{ background: 'rgba(79, 241, 227, 0.2)' }}
                >
                  <div 
                    className="h-2 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                      width: `${(reflection.reflects_regularly_rating / 5) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className="p-6 flex justify-between items-center"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}
        >
          <p className="text-sm" style={{ color: '#9AA4B2' }}>
            Your reflections are confidential and help us support your career journey.
          </p>
          <Button
            asChild
            className="font-semibold transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
              borderRadius: '14px',
              color: '#FFFFFF',
              boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)',
              border: 'none'
            }}
          >
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
