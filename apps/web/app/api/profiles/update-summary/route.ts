/**
 * Update Profile Summary API
 * POST /api/profiles/update-summary
 * - Updates profile summary/about with TalentStory content
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerWithAuth } from "@/lib/supabase.server";

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

    // Get request body
    const body = await request.json();
    const { profileId, summary, note } = body as {
      profileId?: string;
      summary: string;
      note?: string;
    };

    if (!summary) {
      return NextResponse.json({ error: 'Summary is required' }, { status: 400 });
    }

    // Initialize Supabase server client
    const supabaseServer = await getSupabaseServerWithAuth();

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

    // Update profile with new summary
    // Using 'about' field as it's typically for longer biographical text
    const { data: updatedProfile, error: updateError } = await supabaseServer
      .from("profiles")
      .update({
        about: summary,
        summary: note || summary.substring(0, 200), // Use note as summary, or truncated story
        updated_at: new Date().toISOString()
      })
      .eq("id", actualProfileId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error in profile update:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update profile",
      },
      { status: 500 }
    );
  }
}
