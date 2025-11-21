import { NextRequest, NextResponse } from 'next/server';
import { parseJobDescription } from '@/lib/jobParser';
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

    // Parse request body
    const body = await request.json();
    const { title, company, location, raw_description, job_url } = body;

    if (!title || !raw_description) {
      return NextResponse.json(
        { error: 'Title and job description are required' },
        { status: 400 }
      );
    }

    // Parse the job description using GPT-4
    console.log('Parsing job description...');
    const parsedData = await parseJobDescription(raw_description);
    console.log('Job parsed successfully:', parsedData);

    // Get server-side Supabase client
    const supabase = getSupabaseServer();
    
    // Insert into database
    const { data: jobPost, error: insertError } = await supabase
      .from('job_posts')
      .insert({
        user_id: userId,
        title,
        company: company || null,
        location: location || null,
        raw_description,
        job_url: job_url || null,
        parsed_data: parsedData,
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting job post:', insertError);
      return NextResponse.json(
        { error: 'Failed to save job post', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      job_post: jobPost,
      parsed_data: parsedData,
    });
  } catch (error: any) {
    console.error('Error parsing job description:', error);
    return NextResponse.json(
      { error: 'Failed to parse job description', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user's job posts
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'active';

    // Fetch job posts
    const { data: jobPosts, error: fetchError } = await supabase
      .from('job_posts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching job posts:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch job posts', details: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      job_posts: jobPosts || [],
    });
  } catch (error: any) {
    console.error('Error fetching job posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job posts', details: error.message },
      { status: 500 }
    );
  }
}
