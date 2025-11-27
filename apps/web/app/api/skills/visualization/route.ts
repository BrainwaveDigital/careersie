import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerWithAuth } from "@/lib/supabase.server";
import { prepareSkillNodes, extractSkillsFromCV, type SkillInput } from "@/lib/skillClustering";



/**
 * GET /api/skills/visualization
 * Retrieve and cluster skills for 3D visualization
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const supabaseServer = await getSupabaseServerWithAuth();
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's most recent parsed CV
    const { data: parsedDocs, error: dbError } = await supabaseServer
      .from("parsed_documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }

    if (!parsedDocs || parsedDocs.length === 0) {
      return NextResponse.json({
        error: "No parsed CV found. Please upload a CV first.",
        skills: [],
        nodes: []
      }, { status: 404 });
    }

    const parsedDoc = parsedDocs[0];
    if (!parsedDoc) {
      return NextResponse.json(
        { error: "Parsed document not found" },
        { status: 404 }
      );
    }

    // Extract skills from parsed CV
    const skillInputs: SkillInput[] = extractSkillsFromCV(parsedDoc);

    // Prepare skill nodes with categories and weights
    const nodes = prepareSkillNodes(skillInputs);

    // Return both raw skills and prepared nodes
    return NextResponse.json({
      success: true,
      skills: skillInputs.map(s => s.skill),
      nodes,
      metadata: {
        totalSkills: nodes.length,
        categories: Array.from(new Set(nodes.map(n => n.category))),
        avgWeight: nodes.reduce((acc, n) => acc + (n.weight || 1), 0) / nodes.length,
        source: parsedDoc.file_name,
        userId: user.id
      }
    });

  } catch (error) {
    console.error("Error generating skill visualization:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

/**
 * POST /api/skills/visualization
 * Generate skill clusters from custom skill list
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skills, useEmbeddings = false } = body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json({ error: "Invalid skills array" }, { status: 400 });
    }

    // Create skill inputs from raw skills
    const skillInputs: SkillInput[] = skills.map((skill: string) => ({
      skill,
      frequency: 1,
      isPrimary: true
    }));

    // Prepare nodes
    const nodes = prepareSkillNodes(skillInputs);

    return NextResponse.json({
      success: true,
      skills,
      nodes,
      metadata: {
        totalSkills: nodes.length,
        categories: Array.from(new Set(nodes.map(n => n.category))),
        avgWeight: nodes.reduce((acc, n) => acc + (n.weight || 1), 0) / nodes.length
      }
    });

  } catch (error) {
    console.error("Error processing skills:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
