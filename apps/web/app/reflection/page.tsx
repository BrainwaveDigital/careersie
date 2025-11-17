"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';
import { Lightbulb, CheckCircle, ChevronRight, ChevronLeft, Target, Loader2, Save } from 'lucide-react';
import GlassPageLayout, { GlassCard } from '@/components/GlassPageLayout';

export default function SelfReflectionInsights() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(performance.now());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  // Self-reflection questions organized by category
  const questions = [
    // Career Goals & Aspirations
    {
      id: 'cg1',
      category: 'career_goals',
      type: 'textarea',
      text: 'What are your primary career goals for the next 3-5 years?',
      placeholder: 'Describe where you see yourself professionally...',
      section: 'Career Goals & Aspirations'
    },
    {
      id: 'cg2',
      category: 'career_goals',
      type: 'scale',
      text: 'I have a clear long-term career direction',
      section: 'Career Goals & Aspirations'
    },
    {
      id: 'cg3',
      category: 'career_goals',
      type: 'multiple',
      text: 'What role do you see yourself in within the next year?',
      options: [
        'Individual contributor / specialist',
        'Team lead / supervisor',
        'Manager',
        'Senior leadership',
        'Entrepreneur / business owner',
        'Still exploring options'
      ],
      section: 'Career Goals & Aspirations'
    },

    // Motivations & Values
    {
      id: 'mv1',
      category: 'motivations',
      type: 'checkbox',
      text: 'What motivates you most in a career? (Select all that apply)',
      options: [
        'Making a meaningful impact',
        'Financial security and growth',
        'Work-life balance',
        'Learning and development',
        'Recognition and advancement',
        'Creative freedom',
        'Helping others',
        'Solving complex problems'
      ],
      section: 'Motivations & Values'
    },
    {
      id: 'mv2',
      category: 'motivations',
      type: 'textarea',
      text: 'What gives you the greatest sense of fulfillment at work?',
      placeholder: 'Share what makes your work meaningful...',
      section: 'Motivations & Values'
    },
    {
      id: 'mv3',
      category: 'motivations',
      type: 'scale',
      text: 'I find my current/recent career path fulfilling',
      section: 'Motivations & Values'
    },

    // Strengths & Development
    {
      id: 'sd1',
      category: 'strengths',
      type: 'textarea',
      text: 'What are your three greatest professional strengths?',
      placeholder: 'List and briefly describe your key strengths...',
      section: 'Strengths & Development'
    },
    {
      id: 'sd2',
      category: 'strengths',
      type: 'textarea',
      text: 'What skills or areas would you like to develop further?',
      placeholder: 'Identify areas where you want to grow...',
      section: 'Strengths & Development'
    },
    {
      id: 'sd3',
      category: 'strengths',
      type: 'scale',
      text: 'I actively seek out professional development opportunities',
      section: 'Strengths & Development'
    },

    // Work Style Preferences
    {
      id: 'ws1',
      category: 'work_style',
      type: 'multiple',
      text: 'Which work environment do you thrive in most?',
      options: [
        'Collaborative team environment',
        'Independent/autonomous work',
        'Mix of both collaboration and independent work',
        'Fast-paced, dynamic environment',
        'Structured, predictable environment',
        'Remote/hybrid flexibility'
      ],
      section: 'Work Style Preferences'
    },
    {
      id: 'ws2',
      category: 'work_style',
      type: 'multiple',
      text: 'How do you prefer to approach challenges?',
      options: [
        'Systematic, step-by-step planning',
        'Creative brainstorming and innovation',
        'Research and data-driven decisions',
        'Collaborative problem-solving',
        'Quick action and iteration',
        'Seeking mentorship and guidance'
      ],
      section: 'Work Style Preferences'
    },
    {
      id: 'ws3',
      category: 'work_style',
      type: 'scale',
      text: 'I prefer leadership roles over individual contributor roles',
      section: 'Work Style Preferences'
    },

    // Past Experiences & Learnings
    {
      id: 'pe1',
      category: 'experiences',
      type: 'textarea',
      text: 'Describe a professional achievement you are most proud of and why',
      placeholder: 'Share your accomplishment and its impact...',
      section: 'Past Experiences & Learnings'
    },
    {
      id: 'pe2',
      category: 'experiences',
      type: 'textarea',
      text: 'What has been your biggest professional challenge, and what did you learn from it?',
      placeholder: 'Reflect on a difficult experience and the lessons learned...',
      section: 'Past Experiences & Learnings'
    },
    {
      id: 'pe3',
      category: 'experiences',
      type: 'scale',
      text: 'I regularly reflect on my work experiences to improve',
      section: 'Past Experiences & Learnings'
    },
  ];

  const scaleOptions = [
    { value: 1, label: 'Strongly Disagree' },
    { value: 2, label: 'Disagree' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Agree' },
    { value: 5, label: 'Strongly Agree' }
  ];

  const questionsPerPage = 3;
  const totalPages = Math.ceil(questions.length / questionsPerPage);

  // Check authentication and load saved progress
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        
        if (error || !user) {
          router.push('/login');
          return;
        }

        setUserId(user.id);

        // Look up the profile_id from the user_id
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          console.warn('Profile not found for user');
          setLoading(false);
          return;
        }

        // Check for existing incomplete reflection
        const { data: existing } = await supabaseClient
          .from('self_reflection_insights')
          .select('all_responses')
          .eq('profile_id', profile.id)  // Use the actual profile ID
          .eq('completed', false)
          .single();

        if (existing && existing.all_responses) {
          setResponses(existing.all_responses);
        }
      } catch (err) {
        console.error('Error initializing:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [router]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (!userId || Object.keys(responses).length === 0) return;

    const autoSave = async () => {
      try {
        setSaveStatus('saving');
        const response = await fetch('/api/reflection', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, responses })
        });

        if (response.ok) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus(null), 2000);
        } else {
          setSaveStatus('error');
        }
      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveStatus('error');
      }
    };

    const interval = setInterval(autoSave, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [userId, responses]);

  const getCurrentPageQuestions = () => {
    const start = currentPage * questionsPerPage;
    const end = start + questionsPerPage;
    return questions.slice(start, end);
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId: string, option: string) => {
    const current = (responses[questionId] as string[]) || [];
    const updated = current.includes(option)
      ? current.filter(item => item !== option)
      : [...current, option];
    
    setResponses(prev => ({
      ...prev,
      [questionId]: updated
    }));
  };

  const isPageComplete = () => {
    const currentQuestions = getCurrentPageQuestions();
    return currentQuestions.every(q => {
      const response = responses[q.id];
      if (q.type === 'checkbox') {
        return response && (response as string[]).length > 0;
      }
      if (q.type === 'textarea') {
        return response && (response as string).trim().length > 0;
      }
      return response !== undefined;
    });
  };

  const handleSubmit = async () => {
    if (!userId) {
      alert('User not authenticated');
      return;
    }

    setSaving(true);
    const endTime = performance.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);

    try {
      console.log('Submitting reflection:', { userId, responseCount: Object.keys(responses).length, timeTaken });
      
      const response = await fetch('/api/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, responses, timeTaken })
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Get the response text first to see what we're actually getting
      const responseText = await response.text();
      console.log('API Response text:', responseText);
      
      // Try to parse it as JSON
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('API Response parsed:', result);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.error('Raw response:', responseText);
        alert('Server returned invalid response. Check console for details.');
        return;
      }

      if (response.ok && result.success) {
        setIsComplete(true);
      } else {
        const errorMsg = result.error || result.message || 'Unknown error';
        alert('Error saving reflection: ' + errorMsg);
        console.error('Save error - Full response:', { status: response.status, result });
      }
    } catch (error) {
      console.error('Error submitting reflection:', error);
      alert('Failed to save reflection. Please try again. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const progressPercentage = (Object.keys(responses).length / questions.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-pink-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-white">Loading your reflection...</h2>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-white/20">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Insights Captured!</h2>
            <p className="text-purple-200">Thank you for sharing your professional reflections.</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 mb-6 border border-purple-400/30">
            <h3 className="text-xl font-semibold text-white mb-3">What's Next?</h3>
            <ul className="space-y-2 text-purple-100">
              <li className="flex items-start">
                <Target className="w-5 h-5 text-pink-400 mr-2 mt-1 flex-shrink-0" />
                <span>Your insights will help us match you with roles that align with your career goals and values</span>
              </li>
              <li className="flex items-start">
                <Target className="w-5 h-5 text-pink-400 mr-2 mt-1 flex-shrink-0" />
                <span>Employers can better understand your motivations and work style preferences</span>
              </li>
              <li className="flex items-start">
                <Target className="w-5 h-5 text-pink-400 mr-2 mt-1 flex-shrink-0" />
                <span>You'll receive more personalized career development recommendations</span>
              </li>
            </ul>
          </div>
          
          <p className="text-sm text-purple-300 text-center mb-6">
            These reflections will remain confidential and help us support your career journey.
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => window.location.href = '/reflection/view'}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:scale-105 shadow-lg font-semibold transition-transform"
            >
              View My Insights
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-full hover:bg-white/30 shadow-lg font-semibold transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Lightbulb className="w-8 h-8 text-pink-400 mr-3" />
              <h1 className="text-3xl font-bold text-white">Self-Reflection Insights</h1>
            </div>
            {saveStatus && (
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                    <span className="text-purple-200">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Saved</span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <span className="text-red-400">Save failed</span>
                )}
              </div>
            )}
          </div>
          <p className="text-gray-600 mb-6">
            Take a moment to reflect on your career journey, goals, and what matters most to you professionally. 
            Your thoughtful responses help us understand you better and find the right opportunities.
            <span className="text-purple-600 font-medium ml-2">✨ Auto-saves every 30 seconds</span>
          </p>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress: {Object.keys(responses).length} of {questions.length} questions</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` } as React.CSSProperties}
              />
            </div>
          </div>
          
          <p className="text-sm text-purple-300">
            Page {currentPage + 1} of {totalPages}
          </p>
        </div>

        {/* Questions */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-6 border border-white/20">
          <div className="space-y-8">
            {getCurrentPageQuestions().map((question) => (
              <div key={question.id} className="border-b border-white/10 pb-6 last:border-b-0">
                <div className="mb-4">
                  <span className="text-sm font-medium text-pink-400 uppercase tracking-wide">
                    {question.section}
                  </span>
                  <p className="text-lg text-white mt-2 font-medium">
                    {question.text}
                  </p>
                </div>

                {/* Textarea Type */}
                {question.type === 'textarea' && (
                  <textarea
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    placeholder={question.placeholder}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-lg text-white placeholder-purple-300 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all"
                    aria-label={question.text}
                  />
                )}

                {/* Scale Type */}
                {question.type === 'scale' && (
                  <div className="grid grid-cols-5 gap-2">
                    {scaleOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleResponseChange(question.id, option.value)}
                        className={`
                          px-4 py-3 rounded-lg border-2 transition-all duration-200
                          ${responses[question.id] === option.value
                            ? 'border-purple-600 bg-purple-50 text-purple-700 font-semibold'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                          }
                        `}
                      >
                        <div className="text-center">
                          <div className="text-2xl font-bold mb-1">{option.value}</div>
                          <div className="text-xs">{option.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Multiple Choice Type */}
                {question.type === 'multiple' && question.options && (
                  <div className="space-y-2">
                    {question.options.map(option => (
                      <button
                        key={option}
                        onClick={() => handleResponseChange(question.id, option)}
                        className={`
                          w-full px-4 py-3 rounded-lg border-2 text-left transition-all duration-200
                          ${responses[question.id] === option
                            ? 'border-purple-600 bg-purple-50 text-purple-700 font-semibold'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                          }
                        `}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {/* Checkbox Type */}
                {question.type === 'checkbox' && question.options && (
                  <div className="space-y-2">
                    {question.options.map(option => {
                      const isSelected = ((responses[question.id] as string[]) || []).includes(option);
                      return (
                        <label
                          key={option}
                          className={`
                            flex items-center px-4 py-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                            ${isSelected
                              ? 'border-purple-600 bg-purple-50 text-purple-700 font-semibold'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCheckboxChange(question.id, option)}
                            className="mr-3 h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(prev => prev - 1)}
            disabled={currentPage === 0}
            className={`
              flex items-center px-6 py-3 rounded-lg font-semibold transition-all
              ${currentPage === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white text-purple-600 hover:bg-purple-50 shadow-md'
              }
            `}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>

          {currentPage === totalPages - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!isPageComplete() || saving}
              className={`
                flex items-center px-8 py-3 rounded-lg font-semibold transition-all
                ${!isPageComplete() || saving
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'
                }
              `}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Reflection
                  <CheckCircle className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!isPageComplete()}
              className={`
                flex items-center px-6 py-3 rounded-lg font-semibold transition-all
                ${!isPageComplete()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'
                }
              `}
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
