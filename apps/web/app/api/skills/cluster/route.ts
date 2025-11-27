import { NextRequest, NextResponse } from "next/server";
import { clusterSkillsWithOpenAI, generateSkillEmbeddingsWithCache } from "@/lib/embeddingsClustering";
import { getSupabaseServerWithAuth } from "@/lib/supabase.server";



/**
 * POST /api/skills/cluster
 * Cluster skills using OpenAI embeddings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skills, numClusters, userId } = body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json(
        { error: "Invalid skills array" },
        { status: 400 }
      );
    }

    // Optional: Check if user is authenticated
    let supabaseServer;
    if (userId) {
      supabaseServer = await getSupabaseServerWithAuth();
      const authHeader = request.headers.get("authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error } = await supabaseServer.auth.getUser(token);
        if (error || !user || user.id !== userId) {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
          );
        }
      }
    }

    // Cluster with OpenAI
    console.log(`Clustering ${skills.length} skills...`);
    const nodes = await clusterSkillsWithOpenAI(skills, {
      numClusters: numClusters || Math.max(3, Math.ceil(skills.length / 6))
    });

    return NextResponse.json({
      success: true,
      nodes,
      metadata: {
        totalSkills: nodes.length,
        numClusters: Math.max(...nodes.map(n => n.clusterId || 0)) + 1,
        categories: Array.from(new Set(nodes.map(n => n.category))),
        avgWeight: nodes.reduce((sum, n) => sum + (n.weight || 1), 0) / nodes.length
      }
    });

  } catch (error) {
    console.error("Error clustering skills:", error);
    return NextResponse.json(
      {
        error: "Failed to cluster skills",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/skills/cluster?userId=xxx
 * Get cached clustering results for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter required" },
        { status: 400 }
      );
    }


    const supabaseServer = await getSupabaseServerWithAuth();
    // Fetch user's skills from database
    const { data: parsedDocs, error } = await supabaseServer
      .from("parsed_documents")
      .select("skills")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch user skills" },
        { status: 500 }
      );
    }

    if (!parsedDocs || parsedDocs.length === 0) {
      return NextResponse.json(
        { error: "No skills found for user" },
        { status: 404 }
      );
    }

    const skillsData = parsedDocs[0]?.skills;
    const skillsRaw = Array.isArray(skillsData) ? skillsData : [];
    // Remove duplicates
    const skills = [...new Set(skillsRaw.filter((s): s is string => typeof s === 'string'))];

    if (skills.length === 0) {
      return NextResponse.json(
        { error: "User has no skills" },
        { status: 404 }
      );
    }

    // Generate embeddings with caching
    const embeddings = await generateSkillEmbeddingsWithCache(skills);

    return NextResponse.json({
      success: true,
      skills,
      embeddingsCount: embeddings.length,
      cached: true
    });

  } catch (error) {
    console.error("Error fetching clustering data:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
