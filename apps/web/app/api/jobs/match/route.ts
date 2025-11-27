import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerWithAuth } from '@/lib/supabase.server';
import { calculateRelevanceScore } from '@/lib/relevanceScorer';
import { ParsedJobData } from '@/lib/jobParser';

// Helper to extract access token from request headers/cookies
function extractTokenFromHeaders(headers: Headers) {
  const auth = headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.split(' ')[1];

  const cookieHeader = headers.get('cookie');
  if (!cookieHeader) return null;

  const cookieNames = ['sb:token', 'sb-access-token', 'sb-session', 'supabase-auth-token', 'sb:session', 'access_token'];
  const parts = cookieHeader.split(/;\s*/);
  for (const part of parts) {
    const [k, ...vParts] = part.split('=');
    const name = k?.trim();
    const val = vParts.join('=');
    if (!name) continue;
    if (!cookieNames.includes(name)) continue;
    try {
      const decoded = decodeURIComponent(val || '');
      const parsed = JSON.parse(decoded);
      if (parsed && parsed.access_token) return parsed.access_token;
    } catch (e) {
      // not JSON, return raw
      return decodeURIComponent(val || '');
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Extract and validate authentication token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const token = extractTokenFromHeaders(request.headers);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Missing session token.' }, { status: 401 });
    }

    // Validate token with Supabase
    const userRes = await fetch(new URL('/auth/v1/user', supabaseUrl).toString(), {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey }
    });
    
    if (!userRes.ok) {
      return NextResponse.json({ error: 'Unauthorized. Invalid session.' }, { status: 401 });
    }
    
    const user = await userRes.json();
    const userId = user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Unable to determine user.' }, { status: 401 });
    }

    // Get server-side Supabase client
    const supabase = await getSupabaseServerWithAuth();

    // Parse request body
    const body = await request.json();
    const { job_post_id, profile_id } = body;

    if (!job_post_id || !profile_id) {
      return NextResponse.json(
        { error: 'job_post_id and profile_id are required' },
        { status: 400 }
      );
    }

    // Fetch job post
    const { data: jobPost, error: jobError } = await supabase
      .from('job_posts')
      .select('*')
      .eq('id', job_post_id)
      .eq('user_id', userId)
      .single();

    if (jobError || !jobPost) {
      return NextResponse.json({ error: 'Job post not found' }, { status: 404 });
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile_id)
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Extract parsed job data
    const parsedJobData = jobPost.parsed_data as ParsedJobData;

    // Prepare profile data for scoring
    const profileData = {
      hard_skills: Array.isArray(profile.hard_skills) ? profile.hard_skills as string[] : [],
      soft_skills: Array.isArray(profile.soft_skills) ? profile.soft_skills as string[] : [],
      experience: Array.isArray(profile.experience) ? profile.experience as any[] : [],
      seniority: typeof profile.seniority === 'string' ? profile.seniority : 'mid',
    };

    // Calculate relevance score
    const { score_breakdown, match_details } = calculateRelevanceScore(
      profileData,
      parsedJobData
    );

    // Store the match score in database (optional - for future reference)
    // You can create a separate table for match scores if needed

    return NextResponse.json({
      success: true,
      score_breakdown,
      match_details,
      job_post: {
        id: jobPost.id,
        title: jobPost.title,
        company: jobPost.company,
      },
      profile: {
        id: profile.id,
        full_name: profile.full_name,
      },
    });
  } catch (error: any) {
    console.error('Error calculating match score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate match score', details: error.message },
      { status: 500 }
    );
  }
}
