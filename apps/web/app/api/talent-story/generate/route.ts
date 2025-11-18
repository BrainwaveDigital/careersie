/**
 * TalentStory Generation API
 * 
 * POST /api/talent-story/generate
 * - Generates a new TalentStory from user's profile data
 * - Stores in database with version tracking
 * 
 * GET /api/talent-story
 * - Retrieves user's active TalentStory
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getProfileStory } from "@/lib/profileStoryService";
import { generateTalentStory } from "@/lib/talentStoryEngine";
import { ProfileStoryPrompt } from "@/lib/profileStoryPrompt";

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

/**
 * POST /api/talent-story/generate
 * Generate a new TalentStory for the authenticated user
 */
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

    // Initialize Supabase server client once
    const supabaseServer = getSupabaseServer();

    // Get profile ID from request body (optional - can use user_id to find profile)
    const body = await request.json();
    const { profileId, model, promptConfig } = body as {
      profileId?: string;
      model?: string;
      promptConfig?: Partial<ProfileStoryPrompt>;
    };

    // Find profile ID if not provided
    let actualProfileId: string = profileId || '';
    if (!actualProfileId) {
      const { data: profile, error: profileError } = await supabaseServer
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: "Profile not found. Please create a profile first." },
          { status: 404 }
        );
      }

      actualProfileId = profile.id;
    }

    // Get normalized profile data using server client
    const profileStory = await getProfileStory(actualProfileId, supabaseServer);

    if (!profileStory) {
      return NextResponse.json(
        { error: "Failed to retrieve profile data" },
        { status: 500 }
      );
    }

    // Generate TalentStory using OpenAI with custom prompt config
    const story = await generateTalentStory(
      profileStory, 
      promptConfig || {}, 
      model || "gpt-4o-mini"
    );

    // Mark existing stories as inactive
    await supabaseServer
      .from("talent_stories")
      .update({ is_active: false })
      .eq("user_id", userId);

    // Store in database (including prompt config for regeneration)
    const { data: savedStory, error: saveError } = await supabaseServer
      .from("talent_stories")
      .insert({
        user_id: userId,
        story,
        data: {
          ...profileStory,
          _promptConfig: promptConfig, // Store prompt config with data
        },
        model: model || "gpt-4o-mini",
        is_active: true,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving TalentStory:", saveError);
      return NextResponse.json(
        { error: "Failed to save TalentStory" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      story: savedStory.story, // Return just the markdown string, not the entire row
      id: savedStory.id,
    });
  } catch (error) {
    console.error("Error in TalentStory generation:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate TalentStory",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/talent-story/generate
 * Get active TalentStory for authenticated user
 */
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

    // Get active TalentStory
    const supabaseServer = getSupabaseServer();
    const { data: story, error: storyError } = await supabaseServer
      .from("talent_stories")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (storyError) {
      if (storyError.code === "PGRST116") {
        // No story found
        return NextResponse.json(
          { error: "No TalentStory found. Generate one first." },
          { status: 404 }
        );
      }
      
      console.error("Error fetching TalentStory:", storyError);
      return NextResponse.json(
        { error: "Failed to fetch TalentStory" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      story,
    });
  } catch (error) {
    console.error("Error in TalentStory retrieval:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to retrieve TalentStory",
      },
      { status: 500 }
    );
  }
}
