import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// Question definitions (must match frontend)
const QUESTIONS = [
  { id: 'cg1', category: 'career_goals', type: 'textarea', text: 'What are your primary career goals for the next 3-5 years?' },
  { id: 'cg2', category: 'career_goals', type: 'scale', text: 'I have a clear long-term career direction' },
  { id: 'cg3', category: 'career_goals', type: 'multiple', text: 'What role do you see yourself in within the next year?' },
  { id: 'mv1', category: 'motivations', type: 'checkbox', text: 'What motivates you most in a career?' },
  { id: 'mv2', category: 'motivations', type: 'textarea', text: 'What gives you the greatest sense of fulfillment at work?' },
  { id: 'mv3', category: 'motivations', type: 'scale', text: 'I find my current/recent career path fulfilling' },
  { id: 'sd1', category: 'strengths', type: 'textarea', text: 'What are your three greatest professional strengths?' },
  { id: 'sd2', category: 'strengths', type: 'textarea', text: 'What skills or areas would you like to develop further?' },
  { id: 'sd3', category: 'strengths', type: 'scale', text: 'I actively seek out professional development opportunities' },
  { id: 'ws1', category: 'work_style', type: 'multiple', text: 'Which work environment do you thrive in most?' },
  { id: 'ws2', category: 'work_style', type: 'multiple', text: 'How do you prefer to approach challenges?' },
  { id: 'ws3', category: 'work_style', type: 'scale', text: 'I prefer leadership roles over individual contributor roles' },
  { id: 'pe1', category: 'experiences', type: 'textarea', text: 'Describe a professional achievement you are most proud of and why' },
  { id: 'pe2', category: 'experiences', type: 'textarea', text: 'What has been your biggest professional challenge, and what did you learn from it?' },
  { id: 'pe3', category: 'experiences', type: 'scale', text: 'I regularly reflect on my work experiences to improve' }
];

// POST - Save self-reflection insights
export async function POST(request: NextRequest) {
  try {
    const { userId, responses, timeTaken } = await request.json();

    if (!userId || !responses) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and responses' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Look up the profile_id from the user_id (auth.uid)
    console.log('Looking up profile for user_id:', userId);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile lookup error:', profileError);
      return NextResponse.json(
        { 
          error: 'Profile not found. Please create a profile first.',
          details: profileError?.message,
          code: profileError?.code
        },
        { status: 404 }
      );
    }

    console.log('Found profile_id:', profile.id);

    // Map responses to structured fields
    const structuredData = {
      profile_id: profile.id,  // Use the actual profile ID, not user_id
      completed: true,
      time_taken_seconds: timeTaken || null,
      
      // Career Goals
      career_goals_3_5_years: responses.cg1 || null,
      has_clear_career_direction: responses.cg2 || null,
      role_within_next_year: responses.cg3 || null,
      
      // Motivations & Values
      career_motivations: responses.mv1 ? JSON.stringify(responses.mv1) : null,
      sense_of_fulfillment: responses.mv2 || null,
      career_fulfillment_rating: responses.mv3 || null,
      
      // Strengths & Development
      professional_strengths: responses.sd1 || null,
      skills_to_develop: responses.sd2 || null,
      seeks_development_rating: responses.sd3 || null,
      
      // Work Style
      preferred_work_environment: responses.ws1 || null,
      problem_solving_approach: responses.ws2 || null,
      leadership_preference_rating: responses.ws3 || null,
      
      // Experiences
      proudest_achievement: responses.pe1 || null,
      biggest_challenge_and_learning: responses.pe2 || null,
      reflects_regularly_rating: responses.pe3 || null,
      
      // Store all responses as JSONB backup
      all_responses: responses
    };

    // Insert main reflection record
    console.log('Attempting to insert reflection for user:', userId);
    const { data: reflection, error: reflectionError } = await supabase
      .from('self_reflection_insights')
      .insert(structuredData)
      .select()
      .single();

    if (reflectionError) {
      console.error('Error saving reflection:', reflectionError);
      console.error('Error details:', JSON.stringify(reflectionError, null, 2));
      return NextResponse.json(
        { 
          error: reflectionError.message,
          details: reflectionError.details,
          hint: reflectionError.hint,
          code: reflectionError.code
        },
        { status: 500 }
      );
    }

    // Insert individual responses for detailed analysis
    const responseRecords = Object.entries(responses).map(([questionId, value]) => {
      const question = QUESTIONS.find(q => q.id === questionId);
      if (!question) return null;

      return {
        reflection_id: reflection.id,
        question_id: questionId,
        question_text: question.text,
        question_category: question.category,
        question_type: question.type,
        response_value: typeof value === 'object' ? JSON.stringify(value) : String(value)
      };
    }).filter(Boolean);

    if (responseRecords.length > 0) {
      const { error: responsesError } = await supabase
        .from('reflection_responses')
        .insert(responseRecords);

      if (responsesError) {
        console.error('Error saving individual responses:', responsesError);
        // Don't fail the request - main data is saved
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: reflection 
    });
  } catch (error) {
    console.error('Error in POST /api/reflection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Retrieve reflection insights for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Look up the profile_id from the user_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: 'No profile found for this user'
      });
    }

    const { data, error } = await supabase
      .from('self_reflection_insights')
      .select(`
        *,
        reflection_responses (*)
      `)
      .eq('profile_id', profile.id)  // Use the actual profile ID
      .order('submission_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          success: true, 
          data: null,
          message: 'No reflection found for this user'
        });
      }
      console.error('Error fetching reflection:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    console.error('Error in GET /api/reflection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Save partial progress (for auto-save functionality)
export async function PUT(request: NextRequest) {
  try {
    const { userId, responses } = await request.json();

    if (!userId || !responses) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and responses' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Look up the profile_id from the user_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile lookup error:', profileError);
      return NextResponse.json(
        { 
          error: 'Profile not found. Please create a profile first.',
          details: profileError?.message
        },
        { status: 404 }
      );
    }

    // Check if there's an existing incomplete reflection
    const { data: existing } = await supabase
      .from('self_reflection_insights')
      .select('id')
      .eq('profile_id', profile.id)  // Use the actual profile ID
      .eq('completed', false)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('self_reflection_insights')
        .update({ all_responses: responses })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating reflection progress:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        data 
      });
    } else {
      // Create new
      const { data, error } = await supabase
        .from('self_reflection_insights')
        .insert({
          profile_id: profile.id,  // Use the actual profile ID
          completed: false,
          all_responses: responses
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating reflection progress:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        data 
      });
    }
  } catch (error) {
    console.error('Error in PUT /api/reflection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
