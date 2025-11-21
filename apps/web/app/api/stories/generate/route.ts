/**
 * POST /api/stories/generate - Generate a STAR story using AI (GPT-4)
 */

import { getSupabaseServer } from '@/lib/supabase.server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateStorySchema, validateRequest } from '@/lib/storyValidation';
import type { GenerateStoryResponse, ImpactMetrics } from '@/lib/storyTypes';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for STAR story generation
const STAR_SYSTEM_PROMPT = `You are an expert career coach specializing in creating compelling STAR (Situation, Task, Action, Result) format stories for resumes and interviews.

Your job is to transform bullet points from a user's work experience into a structured STAR story that:
1. **Situation**: Sets context with specifics (team size, constraints, stakes)
2. **Task**: Clearly states the user's responsibility/goal
3. **Action**: Details what THEY specifically did (use "I", not "we")
4. **Result**: Shows measurable outcomes with numbers/percentages

CRITICAL RULES:
- Extract and highlight ALL quantifiable metrics (percentages, dollar amounts, time savings, user counts)
- Use first-person ("I" not "we") for Action section
- Be concise but specific (2-3 sentences per section)
- Focus on technical skills, leadership, and business impact
- Make it ATS-friendly (use industry keywords)

Return ONLY a JSON object with this exact structure:
{
  "situation": "string",
  "task": "string",
  "action": "string",
  "result": "string",
  "full_story": "string (combined narrative, 4-6 sentences)",
  "metrics": {
    "numbers": ["array of extracted metrics like '60%', '$1.2M', '10,000 users'"],
    "keywords": ["array of key skills/achievements like 'leadership', 'optimization', 'cost savings'"]
  }
}`;

interface STARGenerationResponse {
  situation: string;
  task: string;
  action: string;
  result: string;
  full_story: string;
  metrics: ImpactMetrics;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(generateStorySchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { experience_id, bullets, notes, skill_ids } = validation.data;

    // Fetch experience context (RLS will ensure user has access)
    const { data: experience, error: expError } = await supabase
      .from('experiences')
      .select(
        `
        id,
        title,
        company,
        start_date,
        end_date,
        description
      `
      )
      .eq('id', experience_id)
      .single();

    if (expError || !experience) {
      return NextResponse.json(
        { error: 'Experience not found or access denied' },
        { status: 404 }
      );
    }

    // Build context for AI generation
    const contextParts = [
      `Position: ${experience.title || 'Unknown role'}`,
      `Company: ${experience.company || 'Unknown company'}`,
    ];

    if (experience.start_date) {
      contextParts.push(`Period: ${experience.start_date} to ${experience.end_date || 'present'}`);
    }

    if (experience.description) {
      contextParts.push(`Background: ${experience.description}`);
    }

    const userPrompt = `
Context:
${contextParts.join('\n')}

Bullet Points:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

${notes ? `Additional Notes:\n${notes}` : ''}

Generate a compelling STAR story from these bullet points.`;

    // Call OpenAI GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: STAR_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse AI response
    let aiResponse: STARGenerationResponse;
    try {
      aiResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    // Validate response has required fields
    if (!aiResponse.situation || !aiResponse.task || !aiResponse.action || !aiResponse.result) {
      console.error('Incomplete STAR response:', aiResponse);
      return NextResponse.json(
        { error: 'AI generated incomplete story' },
        { status: 500 }
      );
    }

    // Create the story in database
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        experience_id,
        situation: aiResponse.situation,
        task: aiResponse.task,
        action: aiResponse.action,
        result: aiResponse.result,
        full_story: aiResponse.full_story,
        metrics: aiResponse.metrics,
        ai_generated: true,
        is_draft: false, // AI-generated stories are not drafts
        title: `Story for ${experience.title || 'experience'}`,
      })
      .select()
      .single();

    if (storyError) {
      console.error('Story creation error:', storyError);
      return NextResponse.json(
        { error: 'Failed to save generated story' },
        { status: 500 }
      );
    }

    // Link skills if provided
    if (skill_ids && skill_ids.length > 0) {
      const skillLinks = skill_ids.map((skill_id) => ({
        story_id: story.id,
        skill_id,
      }));

      await supabase.from('story_skills').insert(skillLinks);
    }

    // Create initial version
    await supabase.from('story_versions').insert({
      story_id: story.id,
      situation: aiResponse.situation,
      task: aiResponse.task,
      action: aiResponse.action,
      result: aiResponse.result,
      full_story: aiResponse.full_story,
      metrics: aiResponse.metrics,
      change_summary: 'AI-generated initial version',
      created_by_ai: true,
    });

    const response: GenerateStoryResponse = {
      story_id: story.id,
      situation: aiResponse.situation,
      task: aiResponse.task,
      action: aiResponse.action,
      result: aiResponse.result,
      full_story: aiResponse.full_story,
      metrics: aiResponse.metrics,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/stories/generate:', error);

    // Check for OpenAI-specific errors
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `AI service error: ${error.message}` },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
