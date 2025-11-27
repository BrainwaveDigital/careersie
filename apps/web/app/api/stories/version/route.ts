/**
 * POST /api/stories/version - Create a version snapshot
 */

import { getSupabaseServerWithAuth } from '@/lib/supabase.server';
import { NextRequest, NextResponse } from 'next/server';
import { createVersionSchema, validateRequest } from '@/lib/storyValidation';
import type { StoryVersion } from '@/lib/storyTypes';

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerWithAuth();

    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(createVersionSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { story_id, change_summary } = validation.data;

    // Fetch the story to create a snapshot
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', story_id)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Create version snapshot
    const { data: version, error: versionError } = await supabase
      .from('story_versions')
      .insert({
        id: crypto.randomUUID(),
        story_id,
        version_number: 1, // TODO: increment if needed
        situation: story.situation,
        task: story.task,
        action: story.action,
        result: story.result,
        full_story: story.full_story,
        metrics: story.metrics as unknown as import('@/types/supabase').Json,
        change_summary: change_summary || 'Manual version save',
        created_by_ai: false,
      })
      .select()
      .single();

    if (versionError) {
      console.error('Version creation error:', versionError);
      return NextResponse.json(
        { error: 'Failed to create version' },
        { status: 500 }
      );
    }

    return NextResponse.json({ version: version as StoryVersion }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/stories/version:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
