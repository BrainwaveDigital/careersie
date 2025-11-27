/**
 * GET /api/stories/:id - Fetch a story with details
 * PATCH /api/stories/:id - Update a story (with autosave support)
 * DELETE /api/stories/:id - Delete a story
 */

import { getSupabaseServerWithAuth } from '@/lib/supabase.server';
import { NextRequest, NextResponse } from 'next/server';
import { updateStorySchema, validateRequest } from '@/lib/storyValidation';
import type { Story, StoryWithDetails } from '@/lib/storyTypes';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await getSupabaseServerWithAuth();
    const { id } = await context.params;
    // Get authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = userData.user;

    // Fetch story with all details
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(
        `
        *,
        experiences!inner(
          id,
          title,
          company,
          start_date,
          end_date,
          profiles!inner(user_id)
        ),
        story_skills(
          skills(id, skill)
        ),
        story_versions(*)
      `
      )
      .eq('id', id)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Verify ownership through experience -> profile -> user_id
    const experience = story.experiences as any;
    const profile = experience?.profiles as any;
    if (profile?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Format response with typed data
    const storyWithDetails: StoryWithDetails = {
      ...story,
      metrics: story.metrics
        ? (typeof story.metrics === 'string'
            ? JSON.parse(story.metrics)
            : story.metrics) as import('@/lib/storyTypes').ImpactMetrics
        : null,
      job_match_scores: story.job_match_scores
        ? (typeof story.job_match_scores === 'string'
            ? JSON.parse(story.job_match_scores)
            : story.job_match_scores) as Record<string, number>
        : null,
      experience: {
        id: experience.id,
        title: experience.title,
        company: experience.company,
        start_date: experience.start_date,
        end_date: experience.end_date,
      },
      skills: (story.story_skills as any[])?.map((ss: any) => ss.skills) || [],
      versions: (story.story_versions as any[]) || [],
      latest_version: (story.story_versions as any[])?.[0] || undefined,
    };

    return NextResponse.json({ story: storyWithDetails });
  } catch (error) {
    console.error('Unexpected error in GET /api/stories/:id:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await getSupabaseServerWithAuth();
    const { id } = await context.params;
    // Get authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = userData.user;

    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(updateStorySchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { skill_ids, autosave, ...updateData } = validation.data;

    // Verify ownership first
    const { data: existingStory, error: checkError } = await supabase
      .from('stories')
      .select(
        `
        id,
        experiences!inner(
          id,
          profiles!inner(user_id)
        )
      `
      )
      .eq('id', id)
      .single();

    if (checkError || !existingStory) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    const experience = existingStory.experiences as any;
    const profile = experience?.profiles as any;
    if (profile?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the story
    const { data: updatedStory, error: updateError } = await supabase
      .from('stories')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Story update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update story' },
        { status: 500 }
      );
    }

    // Update skill links if provided
    if (skill_ids !== undefined) {
      // Delete existing links
      await supabase.from('story_skills').delete().eq('story_id', id);

      // Insert new links
      if (skill_ids.length > 0) {
        const skillLinks = skill_ids.map((skill_id) => ({
          id: crypto.randomUUID(),
          story_id: id,
          skill_id,
        }));

        await supabase.from('story_skills').insert(skillLinks);
      }
    }

    // Create version snapshot unless it's an autosave
    if (!autosave) {
      await supabase.from('story_versions').insert({
        id: crypto.randomUUID(),
        story_id: id,
        version_number: 1, // TODO: increment based on existing versions if needed
        situation: updatedStory.situation,
        task: updatedStory.task,
        action: updatedStory.action,
        result: updatedStory.result,
        full_story: updatedStory.full_story,
        metrics: updatedStory.metrics,
        change_summary: 'Manual save',
        created_by_ai: false,
      });
    }

    return NextResponse.json({ story: updatedStory as Story });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/stories/:id:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await getSupabaseServerWithAuth();
    const { id } = await context.params;
    // Get authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = userData.user;

    // Delete the story
    const { data: existingStory, error: checkError } = await supabase
      .from('stories')
      .select(
        `
        id,
        experiences!inner(
          id,
          profiles!inner(user_id)
        )
      `
      )
      .eq('id', id)
      .single();

    if (checkError || !existingStory) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    const experience = existingStory.experiences as any;
    const profile = experience?.profiles as any;
    if (profile?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the story (CASCADE will handle versions and skills)
    const { error: deleteError } = await supabase
      .from('stories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Story deletion error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete story' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/stories/:id:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
