import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

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
    const supabase = getSupabaseServer();

    // Parse request body
    const body = await request.json();
    const { job_post_id, profile_id, version_name, match_score, score_breakdown, match_details } = body;

    if (!job_post_id || !profile_id || !version_name) {
      return NextResponse.json(
        { error: 'job_post_id, profile_id, and version_name are required' },
        { status: 400 }
      );
    }

    // Save customized story version
    const { data: customizedStory, error: insertError } = await supabase
      .from('customized_stories')
      .insert({
        user_id: userId,
        profile_id,
        job_post_id,
        story: `Customized story for ${version_name}`, // Placeholder - will be generated later
        highlighted_skills: match_details?.matched_hard_skills || [],
        match_score: Math.round(match_score) || 0,
        score_breakdown: score_breakdown || {},
        version_name,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving customized story:', insertError);
      return NextResponse.json(
        { error: 'Failed to save customized story', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customized_story: customizedStory,
    });
  } catch (error: any) {
    console.error('Error saving customized story:', error);
    return NextResponse.json(
      { error: 'Failed to save customized story', details: error.message },
      { status: 500 }
    );
  }
}
