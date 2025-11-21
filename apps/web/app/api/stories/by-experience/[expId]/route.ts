/**
 * GET /api/stories/by-experience/:expId - List all stories for an experience
 */

import { getSupabaseServer } from '@/lib/supabase.server';
import { NextRequest, NextResponse } from 'next/server';
import type { Story } from '@/lib/storyTypes';

interface RouteContext {
  params: Promise<{ expId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = getSupabaseServer();
    const { expId } = await context.params;

    // Fetch all stories for this experience
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select(
        `
        *,
        story_skills(
          skills(id, skill)
        )
      `
      )
      .eq('experience_id', expId)
      .order('updated_at', { ascending: false });

    if (storiesError) {
      console.error('Stories fetch error:', storiesError);
      return NextResponse.json(
        { error: 'Failed to fetch stories' },
        { status: 500 }
      );
    }

    // Format response with skills
    const formattedStories = stories.map((story) => ({
      ...story,
      skills: (story.story_skills as any[])?.map((ss: any) => ss.skills) || [],
    }));

    return NextResponse.json({ stories: formattedStories as Story[] });
  } catch (error) {
    console.error('Unexpected error in GET /api/stories/by-experience/:expId:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
