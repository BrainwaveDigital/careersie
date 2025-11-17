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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-pink-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-white">Loading your insights...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-2xl w-full text-center border border-white/20">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">{error}</h2>
          <div className="mt-6 flex gap-4 justify-center">
            <button className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white border border-white/30 hover:bg-white/30 transition-all">
              <Link href="/dashboard">Back to Dashboard</Link>
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white hover:scale-105 transition-transform shadow-lg">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Lightbulb className="w-8 h-8 text-pink-400 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-white">Your Self-Reflection Insights</h1>
                <p className="text-purple-200 text-sm mt-1">Review your career journey reflections</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white border border-white/30 hover:bg-white/30 transition-all flex items-center gap-2">
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </button>
          </div>

          <div className="flex gap-6 text-sm text-purple-200 pt-4 border-t border-white/20">
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
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/20 pb-3">
            Career Goals & Aspirations
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-purple-200 mb-2">Primary Career Goals (3-5 years)</h3>
              <p className="text-white bg-white/5 rounded-lg p-4 border border-white/10">{reflection.career_goals_3_5_years}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-purple-200 mb-2">Career Direction Clarity</h3>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-800 font-medium">{getRatingLabel(reflection.has_clear_career_direction)}</span>
                    <span className="text-purple-600 font-bold">{reflection.has_clear_career_direction}/5</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(reflection.has_clear_career_direction / 5) * 100}%` } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Desired Role (Next Year)</h3>
                <p className="text-gray-800 bg-purple-50 rounded-lg p-4">{reflection.role_within_next_year}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Motivations & Values */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-6 border-b border-purple-200 pb-3">
            Motivations & Values
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Career Motivators</h3>
              <div className="flex flex-wrap gap-2">
                {reflection.career_motivations && Array.isArray(reflection.career_motivations) && reflection.career_motivations.map((motivation, index) => (
                  <span key={index} className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                    {motivation}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Sense of Fulfillment</h3>
              <p className="text-gray-800 bg-purple-50 rounded-lg p-4">{reflection.sense_of_fulfillment}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Career Path Fulfillment</h3>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-800 font-medium">{getRatingLabel(reflection.career_fulfillment_rating)}</span>
                  <span className="text-purple-600 font-bold">{reflection.career_fulfillment_rating}/5</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(reflection.career_fulfillment_rating / 5) * 100}%` } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Development */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-6 border-b border-purple-200 pb-3">
            Strengths & Development
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Professional Strengths</h3>
              <p className="text-gray-800 bg-purple-50 rounded-lg p-4 whitespace-pre-wrap">{reflection.professional_strengths}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Skills to Develop</h3>
              <p className="text-gray-800 bg-purple-50 rounded-lg p-4 whitespace-pre-wrap">{reflection.skills_to_develop}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Development Seeking Behavior</h3>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-800 font-medium">{getRatingLabel(reflection.seeks_development_rating)}</span>
                  <span className="text-purple-600 font-bold">{reflection.seeks_development_rating}/5</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(reflection.seeks_development_rating / 5) * 100}%` } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Work Style Preferences */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-6 border-b border-purple-200 pb-3">
            Work Style Preferences
          </h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Preferred Work Environment</h3>
                <p className="text-gray-800 bg-purple-50 rounded-lg p-4">{reflection.preferred_work_environment}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Problem-Solving Approach</h3>
                <p className="text-gray-800 bg-purple-50 rounded-lg p-4">{reflection.problem_solving_approach}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Leadership Preference</h3>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-800 font-medium">{getRatingLabel(reflection.leadership_preference_rating)}</span>
                  <span className="text-purple-600 font-bold">{reflection.leadership_preference_rating}/5</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(reflection.leadership_preference_rating / 5) * 100}%` } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Past Experiences & Learnings */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-6 border-b border-purple-200 pb-3">
            Past Experiences & Learnings
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Proudest Achievement</h3>
              <p className="text-gray-800 bg-purple-50 rounded-lg p-4 whitespace-pre-wrap">{reflection.proudest_achievement}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Biggest Challenge & Learning</h3>
              <p className="text-gray-800 bg-purple-50 rounded-lg p-4 whitespace-pre-wrap">{reflection.biggest_challenge_and_learning}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Regular Reflection Habit</h3>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-800 font-medium">{getRatingLabel(reflection.reflects_regularly_rating)}</span>
                  <span className="text-purple-600 font-bold">{reflection.reflects_regularly_rating}/5</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(reflection.reflects_regularly_rating / 5) * 100}%` } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Your reflections are confidential and help us support your career journey.
          </p>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
