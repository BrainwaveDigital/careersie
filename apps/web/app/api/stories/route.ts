/**
 * POST /api/stories - Create a new story
 * GET /api/stories - List all stories for current user (not implemented - use by-experience endpoint)
 */

import { getSupabaseServer } from '@/lib/supabase.server';
import { NextRequest, NextResponse } from 'next/server';
import { createStorySchema, validateRequest } from '@/lib/storyValidation';
import type { Story, StorySkill } from '@/lib/storyTypes';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(createStorySchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { experience_id, skill_ids, ...storyData } = validation.data;

    // Verify user owns the experience
    const { data: experience, error: expError } = await supabase
      .from('experiences')
      .select('id, profile_id, profiles!inner(user_id)')
      .eq('id', experience_id)
      .single();

    if (expError || !experience) {
      return NextResponse.json(
        { error: 'Experience not found' },
        { status: 404 }
      );
    }

    // TypeScript workaround for nested select
    const profileData = experience.profiles as unknown as { user_id: string };
    if (profileData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Create the story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        experience_id,
        ...storyData,
        is_draft: true, // Always start as draft
      })
      .select()
      .single();

    if (storyError) {
      console.error('Story creation error:', storyError);
      return NextResponse.json(
        { error: 'Failed to create story' },
        { status: 500 }
      );
    }

    // Link skills if provided
    if (skill_ids && skill_ids.length > 0) {
      const skillLinks = skill_ids.map((skill_id) => ({
        story_id: story.id,
        skill_id,
      }));

      const { error: skillError } = await supabase
        .from('story_skills')
        .insert(skillLinks);

      if (skillError) {
        console.error('Skill linking error:', skillError);
        // Don't fail the request, story is already created
      }
    }

    // Create initial version snapshot
    const { error: versionError } = await supabase
      .from('story_versions')
      .insert({
        story_id: story.id,
        situation: story.situation,
        task: story.task,
        action: story.action,
        result: story.result,
        full_story: story.full_story,
        metrics: story.metrics,
        change_summary: 'Initial version',
        created_by_ai: false,
      });

    if (versionError) {
      console.error('Version creation error:', versionError);
      // Don't fail the request, story is already created
    }

    return NextResponse.json({ story } as { story: Story }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/stories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Not implemented - clients should use /api/stories/by-experience/:expId
  return NextResponse.json(
    { error: 'Use /api/stories/by-experience/:expId to list stories' },
    { status: 400 }
  );
}
