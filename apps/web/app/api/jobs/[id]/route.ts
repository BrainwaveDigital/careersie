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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const jobId = params.id;

    console.log('[API /jobs/[id]] Fetching job with ID:', jobId);

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

    console.log('[API /jobs/[id]] Querying for job:', { jobId, userId });

    // Fetch specific job post
    const { data: jobPost, error: fetchError } = await supabase
      .from('job_posts')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    console.log('[API /jobs/[id]] Query result:', { jobPost, fetchError });

    if (fetchError || !jobPost) {
      console.error('[API /jobs/[id]] Job not found:', fetchError);
      return NextResponse.json({ error: 'Job post not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job_post: jobPost,
    });
  } catch (error: any) {
    console.error('Error fetching job post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job post', details: error.message },
      { status: 500 }
    );
  }
}
