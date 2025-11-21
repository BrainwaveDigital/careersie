"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import { FileText, CheckCircle, ChevronRight, ChevronLeft, Loader2, Brain, ArrowLeft } from 'lucide-react'

interface Question {
  id: string
  category: string
  text: string
  dimension: string
}

interface Scores {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  emotional_stability: number
}

export default function PersonalityQuestionnaire() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(0)
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [isComplete, setIsComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [startTime] = useState(Date.now())

  // Big Five OCEAN Model Questions
  const questions: Question[] = [
    // Openness (O)
    { id: 'o1', category: 'openness', text: 'I enjoy brainstorming new solutions, even if they might fail', dimension: 'Openness' },
    { id: 'o2', category: 'openness', text: 'I am curious about learning new approaches to problems', dimension: 'Openness' },
    { id: 'o3', category: 'openness', text: 'I prefer innovative methods over traditional approaches', dimension: 'Openness' },
    { id: 'o4', category: 'openness', text: 'I enjoy discussing abstract ideas and concepts', dimension: 'Openness' },
    
    // Conscientiousness (C)
    { id: 'c1', category: 'conscientiousness', text: 'I set personal deadlines before official ones', dimension: 'Conscientiousness' },
    { id: 'c2', category: 'conscientiousness', text: 'I pay close attention to details in my work', dimension: 'Conscientiousness' },
    { id: 'c3', category: 'conscientiousness', text: 'I follow through on commitments and meet deadlines', dimension: 'Conscientiousness' },
    { id: 'c4', category: 'conscientiousness', text: 'I prefer to plan ahead rather than be spontaneous', dimension: 'Conscientiousness' },
    
    // Extraversion (E)
    { id: 'e1', category: 'extraversion', text: 'I feel energized when presenting to others', dimension: 'Extraversion' },
    { id: 'e2', category: 'extraversion', text: 'I enjoy meeting new people and networking', dimension: 'Extraversion' },
    { id: 'e3', category: 'extraversion', text: 'I prefer working in collaborative team environments', dimension: 'Extraversion' },
    { id: 'e4', category: 'extraversion', text: 'I am comfortable being the center of attention', dimension: 'Extraversion' },
    
    // Agreeableness (A)
    { id: 'a1', category: 'agreeableness', text: 'I look for solutions that satisfy everyone involved', dimension: 'Agreeableness' },
    { id: 'a2', category: 'agreeableness', text: 'I remain receptive and attentive during disagreements', dimension: 'Agreeableness' },
    { id: 'a3', category: 'agreeableness', text: 'I value maintaining positive relationships with colleagues', dimension: 'Agreeableness' },
    { id: 'a4', category: 'agreeableness', text: 'I am willing to compromise to reach agreements', dimension: 'Agreeableness' },
    
    // Emotional Stability (N - reversed neuroticism)
    { id: 'n1', category: 'emotional_stability', text: 'I remain calm and effective under pressure', dimension: 'Emotional Stability' },
    { id: 'n2', category: 'emotional_stability', text: 'I handle unexpected changes with composure', dimension: 'Emotional Stability' },
    { id: 'n3', category: 'emotional_stability', text: 'I maintain a steady mood even during stressful situations', dimension: 'Emotional Stability' },
    { id: 'n4', category: 'emotional_stability', text: 'I recover quickly from setbacks or criticism', dimension: 'Emotional Stability' },
  ]

  const scaleOptions = [
    { value: 1, label: 'Strongly Disagree' },
    { value: 2, label: 'Disagree' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Agree' },
    { value: 5, label: 'Strongly Agree' }
  ]

  useEffect(() => {
    checkAuthAndLoadProgress()
  }, [])

  async function checkAuthAndLoadProgress() {
    try {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
      
      if (authError || !user) {
        router.push('/login')
        return
      }

      // Get profile_id
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        alert('Profile not found. Please complete your profile first.')
        router.push('/profile')
        return
      }

      setProfileId(profile.id)

      // Check if already completed
      const { data: existing, error: existingError } = await supabaseClient
        .from('personality_assessments')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('completed', true)
        .maybeSingle()

      if (existing) {
        setIsComplete(true)
        calculateAndSetScores(existing.responses)
      } else {
        // Load partial progress
        const { data: partial } = await supabaseClient
          .from('personality_assessments')
          .select('responses')
          .eq('profile_id', profile.id)
          .eq('completed', false)
          .maybeSingle()

        if (partial?.responses) {
          setResponses(partial.responses)
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/login')
    }
  }

  const questionsPerPage = 5
  const totalPages = Math.ceil(questions.length / questionsPerPage)
  
  const getCurrentPageQuestions = () => {
    const start = currentPage * questionsPerPage
    const end = start + questionsPerPage
    return questions.slice(start, end)
  }

  const handleResponseChange = (questionId: string, value: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
    
    // Auto-save progress
    saveProgress({
      ...responses,
      [questionId]: value
    })
  }

  async function saveProgress(currentResponses: Record<string, number>) {
    if (!profileId) return

    try {
      await supabaseClient
        .from('personality_assessments')
        .upsert({
          profile_id: profileId,
          completed: false,
          responses: currentResponses
        }, {
          onConflict: 'profile_id'
        })
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  const isPageComplete = () => {
    const currentQuestions = getCurrentPageQuestions()
    return currentQuestions.every(q => responses[q.id] !== undefined)
  }

  const calculateScores = (): Scores => {
    const categories: Record<string, number[]> = {
      openness: [],
      conscientiousness: [],
      extraversion: [],
      agreeableness: [],
      emotional_stability: []
    }

    questions.forEach(q => {
      const response = responses[q.id]
      if (response !== undefined && categories[q.category]) {
        categories[q.category]!.push(response)
      }
    })

    const scores: any = {}
    Object.keys(categories).forEach(category => {
      const values = categories[category]
      if (values && values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length
        scores[category] = Math.round(avg * 20) // Convert to 0-100 scale
      }
    })

    return scores as Scores
  }

  function calculateAndSetScores(savedResponses: Record<string, number>) {
    setResponses(savedResponses)
  }

  async function handleSubmit() {
    if (!profileId) {
      alert('Profile not found. Please refresh the page.')
      return
    }
    
    setSaving(true)

    try {
      const scores = calculateScores()
      const timeTaken = Math.round((Date.now() - startTime) / 1000)
      const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length

      console.log('Submitting assessment with scores:', scores)

      // Save main assessment
      const { data: assessment, error: assessmentError } = await supabaseClient
        .from('personality_assessments')
        .upsert({
          profile_id: profileId,
          completed: true,
          time_taken_seconds: timeTaken,
          openness_score: scores.openness,
          conscientiousness_score: scores.conscientiousness,
          extraversion_score: scores.extraversion,
          agreeableness_score: scores.agreeableness,
          emotional_stability_score: scores.emotional_stability,
          overall_score: parseFloat(overallScore.toFixed(2)),
          responses: responses
        }, {
          onConflict: 'profile_id'
        })
        .select()
        .single()

      if (assessmentError) {
        console.error('Assessment error details:', assessmentError)
        console.error('Full error object:', JSON.stringify(assessmentError, null, 2))
        
        // Check if it's a table not found error
        if (assessmentError.code === '42P01' || assessmentError.message?.includes('does not exist')) {
          throw new Error(
            'Database tables not found. Please run the migration:\n\n' +
            'sql/migrations/20251117_personality_assessments_up.sql\n\n' +
            'in Supabase SQL Editor, then try again.'
          )
        }
        
        // Check if it's a schema cache issue
        if (assessmentError.message?.includes('Could not find') && 
            assessmentError.message?.includes('in the schema cache')) {
          throw new Error(
            'Schema cache is stale. Please refresh it:\n\n' +
            '1. Run in Supabase SQL Editor:\n' +
            '   NOTIFY pgrst, \'reload schema\';\n\n' +
            '2. Or run: sql/fix-schema-cache.sql\n\n' +
            '3. Then refresh this page and try again.'
          )
        }
        
        throw new Error(
          assessmentError.message || 
          assessmentError.details || 
          'Failed to save assessment. Check console for details.'
        )
      }

      if (!assessment) {
        throw new Error('Assessment was not created')
      }

      console.log('Assessment saved:', assessment.id)

      // Save individual responses
      const responseRecords = Object.entries(responses).map(([questionId, value]) => {
        const question = questions.find(q => q.id === questionId)
        return {
          assessment_id: assessment.id,
          question_id: questionId,
          question_text: question?.text || '',
          dimension: question?.category || '',
          response_value: value
        }
      })

      console.log('Saving', responseRecords.length, 'individual responses')

      // Delete old responses first
      const { error: deleteError } = await supabaseClient
        .from('personality_responses')
        .delete()
        .eq('assessment_id', assessment.id)

      if (deleteError) {
        console.warn('Error deleting old responses (may not exist):', deleteError.message)
      }

      // Insert new responses
      const { error: insertError } = await supabaseClient
        .from('personality_responses')
        .insert(responseRecords)

      if (insertError) {
        console.error('Insert error details:', insertError)
        console.error('Full error object:', JSON.stringify(insertError, null, 2))
        
        if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
          throw new Error(
            'personality_responses table not found. Please run the migration:\n\n' +
            'sql/migrations/20251117_personality_assessments_up.sql\n\n' +
            'in Supabase SQL Editor.'
          )
        }
        
        throw new Error(
          insertError.message || 
          insertError.details || 
          'Failed to save individual responses'
        )
      }

      console.log('All responses saved successfully')
      setIsComplete(true)
    } catch (error) {
      console.error('Error submitting assessment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Show detailed alert with instructions
      alert(
        '❌ Failed to submit assessment\n\n' +
        errorMessage + '\n\n' +
        '📋 Next Steps:\n' +
        '1. Open Supabase Dashboard\n' +
        '2. Go to SQL Editor\n' +
        '3. Run: sql/migrations/20251117_personality_assessments_up.sql\n' +
        '4. Try submitting again\n\n' +
        'Check browser console for technical details.'
      )
    } finally {
      setSaving(false)
    }
  }

  const progressPercentage = (Object.keys(responses).length / questions.length) * 100

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#4ff1e3' }} />
      </div>
    )
  }

  if (isComplete) {
    const scores = calculateScores()
    return (
      <div
        className="min-h-screen p-6 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }}
      >
        <div
          className="p-8 max-w-2xl w-full"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}
        >
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#4ade80' }} />
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#FFFFFF' }}>Assessment Complete!</h2>
            <p style={{ color: '#9AA4B2' }}>Thank you for completing the personality questionnaire.</p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4" style={{ color: '#FFFFFF' }}>Your Scores:</h3>
            {Object.entries(scores).map(([category, score]) => (
              <div
                key={category}
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium capitalize" style={{ color: '#E5E7EB' }}>
                    {category.replace('_', ' ')}
                  </span>
                  <span className="font-bold" style={{ color: '#4ff1e3' }}>{score}/100</span>
                </div>
                <div
                  className="w-full rounded-full h-2"
                  style={{ background: 'rgba(79, 241, 227, 0.2)' }}
                >
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                      width: `${score}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-sm mt-6 text-center" style={{ color: '#9AA4B2' }}>
            These results have been saved to your application profile.
          </p>

          <div
            className="mt-6 rounded-xl p-4"
            style={{
              background: 'rgba(79, 241, 227, 0.1)',
              border: '1px solid rgba(79, 241, 227, 0.3)'
            }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#FFFFFF' }}>
              💡 Next Step: Self-Reflection Insights
            </h3>
            <p className="text-xs mb-3" style={{ color: '#9AA4B2' }}>
              Complete your career reflection to help us understand your goals, motivations, and aspirations.
            </p>
            <button
              onClick={() => router.push('/reflection')}
              className="w-full px-4 py-2 rounded-full transition-all duration-200 text-sm shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
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
              Start Reflection Questionnaire
            </button>
          </div>

          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 rounded-full transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
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
              <Brain className="w-8 h-8 mr-3" style={{ color: '#4ff1e3' }} />
              <h1 className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>Personality & Work Style Assessment</h1>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF'
              }}
            >
              <ArrowLeft size={18} />
              Back
            </button>
          </div>
          <p className="mb-6" style={{ color: '#9AA4B2' }}>
            Please rate how much you agree with each statement. This helps us understand your work style and preferences.
          </p>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2" style={{ color: '#9AA4B2' }}>
              <span>Progress: {Object.keys(responses).length} of {questions.length} questions</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div
              className="w-full rounded-full h-3"
              style={{ background: 'rgba(79, 241, 227, 0.2)' }}
            >
              <div 
                className="h-3 rounded-full transition-all duration-300 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                  width: `${progressPercentage}%`
                }}
              />
            </div>
          </div>
          
          <p className="text-sm" style={{ color: '#9AA4B2' }}>
            Page {currentPage + 1} of {totalPages}
          </p>
        </div>

        {/* Questions */}
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
          <div className="space-y-8">
            {getCurrentPageQuestions().map((question) => (
              <div
                key={question.id}
                className="pb-6 last:border-b-0"
                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                <div className="mb-4">
                  <span
                    className="text-sm font-medium uppercase tracking-wide"
                    style={{ color: '#4ff1e3' }}
                  >
                    {question.dimension}
                  </span>
                  <p className="text-lg mt-2 font-medium" style={{ color: '#FFFFFF' }}>
                    {question.text}
                  </p>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {scaleOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleResponseChange(question.id, option.value)}
                      className="px-4 py-3 rounded-xl transition-all duration-200"
                      style={{
                        border: responses[question.id] === option.value 
                          ? '2px solid rgba(79, 241, 227, 0.6)' 
                          : '2px solid rgba(255, 255, 255, 0.1)',
                        background: responses[question.id] === option.value
                          ? 'rgba(79, 241, 227, 0.15)'
                          : 'rgba(255, 255, 255, 0.04)',
                        color: responses[question.id] === option.value ? '#4ff1e3' : '#9AA4B2',
                        boxShadow: responses[question.id] === option.value
                          ? '0 4px 15px rgba(79, 241, 227, 0.2)'
                          : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (responses[question.id] !== option.value) {
                          e.currentTarget.style.borderColor = 'rgba(79, 241, 227, 0.3)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (responses[question.id] !== option.value) {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        }
                      }}
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1\">{option.value}</div>
                        <div className="text-xs\">{option.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(prev => prev - 1)}
            disabled={currentPage === 0}
            className="flex items-center px-6 py-3 rounded-full font-semibold transition-all duration-200"
            style={{
              background: currentPage === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: currentPage === 0 ? 'rgba(154, 164, 178, 0.5)' : '#9AA4B2',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>

          {currentPage === totalPages - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!isPageComplete() || saving}
              className="flex items-center px-8 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg"
              style={{
                background: !isPageComplete() || saving 
                  ? 'rgba(255, 255, 255, 0.02)' 
                  : 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: !isPageComplete() || saving ? 'rgba(154, 164, 178, 0.5)' : '#FFFFFF',
                cursor: !isPageComplete() || saving ? 'not-allowed' : 'pointer',
                boxShadow: !isPageComplete() || saving ? 'none' : '0 4px 15px rgba(79, 241, 227, 0.3)'
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Assessment
                  <CheckCircle className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!isPageComplete()}
              className="flex items-center px-6 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg"
              style={{
                background: !isPageComplete() 
                  ? 'rgba(255, 255, 255, 0.02)' 
                  : 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: !isPageComplete() ? 'rgba(154, 164, 178, 0.5)' : '#FFFFFF',
                cursor: !isPageComplete() ? 'not-allowed' : 'pointer',
                boxShadow: !isPageComplete() ? 'none' : '0 4px 15px rgba(79, 241, 227, 0.3)'
              }}
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
