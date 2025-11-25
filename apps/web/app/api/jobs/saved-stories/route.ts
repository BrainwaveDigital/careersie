import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase.server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Fetch saved stories with job post details
    const { data: stories, error } = await supabase
      .from('customized_stories')
      .select(`
        id,
        version_name,
        match_score,
        created_at,
        job_post_id,
        job_posts (
          title,
          company
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved stories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch saved stories', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stories: stories || [],
    });
  } catch (error: any) {
    console.error('Error fetching saved stories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved stories', details: error.message },
      { status: 500 }
    );
  }
}
