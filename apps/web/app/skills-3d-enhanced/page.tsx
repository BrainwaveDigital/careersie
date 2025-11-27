"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Profile3DOrbOptimized from "@/components/Profile3DOrbOptimized";
import type { SkillNode } from "@/components/Profile3DOrb";
import {
  highlightSkillsForJob,
  calculateSkillGap,
  getRecommendedSkills,
  type JobRequirement,
  type HighlightedSkillNode
} from "@/lib/jobSkillMatching";
import { supabaseClient } from "@/lib/supabase";

export default function EnhancedSkillVisualization() {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [clustering, setClustering] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillNodes, setSkillNodes] = useState<SkillNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [useEmbeddings, setUseEmbeddings] = useState(false);
  const [targetJob, setTargetJob] = useState<JobRequirement | null>(null);
  const [skillGap, setSkillGap] = useState<ReturnType<typeof calculateSkillGap> | null>(null);
  const [recommendations, setRecommendations] = useState<ReturnType<typeof getRecommendedSkills>>([]);

  // Parse jobId from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("jobId");
      if (id) setJobId(id);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (jobId && skills.length > 0) {
      loadJobRequirements(jobId);
    }
  }, [jobId, skills]);

  async function loadUserData() {
    try {
      console.log("🔵 Loading user data...");
      const { data: { user } } = await supabaseClient.auth.getUser();
      console.log("User:", user?.id, user?.email);
      
      if (!user) {
        console.warn("⚠️ No user found");
        setLoading(false);
        return;
      }

      // Fetch user's profile
      console.log("📤 Fetching profile for user:", user.id);
      const { data: profiles, error: profileError } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      console.log("📥 Profile response:", { profiles, profileError });

      if (!profiles || profiles.length === 0) {
        console.warn("⚠️ No profile found for user");
        setLoading(false);
        return;
      }

      const profileId = profiles[0].id;
      console.log("📄 Profile ID:", profileId);

      // Fetch skills for this profile
      console.log("📤 Fetching skills for profile:", profileId);
      const { data: skillsData, error: skillsError } = await supabaseClient
        .from("skills")
        .select("skill")
        .eq("profile_id", profileId);

      console.log("📥 Skills response:", { skillsData, skillsError });

      if (skillsData && skillsData.length > 0) {
        const extractedSkills = skillsData.map((s: { skill: string }) => s.skill);
        console.log("✅ Extracted skills:", extractedSkills.length, extractedSkills);
        setSkills(extractedSkills);
      } else {
        console.warn("⚠️ No skills found for profile");
      }
    } catch (error) {
      console.error("❌ Error loading user data:", error);
    } finally {
      setLoading(false);
      console.log("🏁 Loading finished");
    }
  }

  async function loadJobRequirements(jobId: string) {
    try {
      // Mock job data - replace with actual API call
      const mockJob: JobRequirement = {
        id: jobId,
        title: "Senior Full Stack Developer",
        requiredSkills: ["React", "TypeScript", "Node.js", "PostgreSQL", "REST APIs"],
        niceToHaveSkills: ["GraphQL", "Docker", "AWS", "Redis"],
        tools: ["Git", "VS Code", "Jira"],
        description: "Build scalable web applications"
      };

      setTargetJob(mockJob);

      // Calculate skill gap
      const gap = calculateSkillGap(skills, mockJob);
      setSkillGap(gap);

      // Get recommendations
      const recs = getRecommendedSkills(skills, [mockJob], 5);
      setRecommendations(recs);

    } catch (error) {
      console.error("Error loading job requirements:", error);
    }
  }

  async function clusterWithOpenAI() {
    console.log("🔵 clusterWithOpenAI called");
    console.log("Skills count:", skills.length);
    console.log("Skills:", skills);
    
    if (skills.length === 0) {
      console.warn("⚠️ No skills to cluster");
      alert("No skills found. Please upload a CV first.");
      return;
    }

    setClustering(true);
    console.log("🟡 Clustering started...");
    
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      console.log("User ID:", user?.id);
      
      const requestBody = {
        skills,
        numClusters: Math.max(3, Math.ceil(skills.length / 6)),
        userId: user?.id
      };
      console.log("📤 Sending request:", requestBody);
      
      // Call API endpoint for server-side clustering
      const response = await fetch("/api/skills/cluster", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API error response:", errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Received data:", data);
      
      const nodes = data.nodes as SkillNode[];
      console.log("Nodes count:", nodes.length);
      
      // Apply job highlighting if available
      if (targetJob) {
        const highlighted = highlightSkillsForJob(nodes, targetJob);
        setSkillNodes(highlighted as SkillNode[]);
      } else {
        setSkillNodes(nodes);
      }

      setUseEmbeddings(true);
      console.log("🟢 Clustering completed successfully");
    } catch (error) {
      console.error("❌ Error clustering with OpenAI:", error);
      alert(`Failed to cluster with OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setClustering(false);
      console.log("🔴 Clustering finished");
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "3px solid rgba(79, 241, 227, 0.3)",
              borderTopColor: "#4ff1e3",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px"
            }}
          />
          <p style={{ color: "#9AA4B2", fontSize: "14px" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show message if no skills found
  if (!loading && skills.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px"
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            padding: "40px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "16px",
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#FFFFFF", marginBottom: "12px" }}>
            No Skills Found
          </h2>
          <p style={{ color: "#9AA4B2", fontSize: "16px", marginBottom: "24px", lineHeight: "1.6" }}>
            No skills were found in your parsed CV data. Please ensure your CV has been parsed successfully.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #4ff1e3, #536dfe)",
              border: "1px solid rgba(79, 241, 227, 0.3)",
              borderRadius: "8px",
              color: "#FFFFFF",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: 600
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)",
        padding: "40px 20px"
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: "1400px", margin: "0 auto 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: "8px 16px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#9AA4B2",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
            Enhanced 3D Skills
          </h1>
        </div>

        {/* Feature toggles */}
        <div
          style={{
            padding: "20px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "12px",
            marginBottom: "24px"
          }}
        >
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={(e) => {
                console.log("🔴 BUTTON CLICKED!", e);
                console.log("Clustering state:", clustering);
                console.log("Skills length:", skills.length);
                clusterWithOpenAI();
              }}
              disabled={clustering || skills.length === 0}
              style={{
                padding: "10px 20px",
                background: clustering ? "rgba(255, 255, 255, 0.06)" : "linear-gradient(135deg, #4ff1e3, #536dfe)",
                border: "1px solid rgba(79, 241, 227, 0.3)",
                borderRadius: "8px",
                color: "#FFFFFF",
                cursor: clustering ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: 600,
                opacity: clustering ? 0.5 : 1
              }}
            >
              {clustering ? "Clustering..." : "🧠 Cluster with AI"}
            </button>

            <div style={{ color: "#9AA4B2", fontSize: "14px" }}>
              {useEmbeddings && "✓ Using semantic clustering"}
            </div>
          </div>
        </div>

        {/* Job match info */}
        {targetJob && skillGap && (
          <div
            style={{
              padding: "20px",
              background: "rgba(79, 241, 227, 0.08)",
              border: "1px solid rgba(79, 241, 227, 0.2)",
              borderRadius: "12px",
              marginBottom: "24px"
            }}
          >
            <h3 style={{ color: "#4ff1e3", margin: "0 0 12px", fontSize: "18px" }}>
              📊 Match Analysis: {targetJob.title}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <p style={{ color: "#9AA4B2", fontSize: "12px", margin: "0 0 4px" }}>Coverage Score</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      flex: 1,
                      height: "8px",
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        width: `${skillGap.coverageScore * 100}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #4ff1e3, #4ade80)",
                        transition: "width 0.3s"
                      }}
                    />
                  </div>
                  <span style={{ color: "#4ff1e3", fontWeight: 600, fontSize: "14px" }}>
                    {(skillGap.coverageScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div>
                <p style={{ color: "#9AA4B2", fontSize: "12px", margin: "0 0 4px" }}>Required Skills</p>
                <p style={{ color: "#FFFFFF", fontSize: "14px", margin: 0 }}>
                  {skillGap.matchedRequired.length} / {targetJob.requiredSkills.length} matched
                </p>
              </div>
              <div>
                <p style={{ color: "#9AA4B2", fontSize: "12px", margin: "0 0 4px" }}>Missing</p>
                <p style={{ color: "#ff6b6b", fontSize: "14px", margin: 0 }}>
                  {skillGap.missingRequired.length} required
                </p>
              </div>
            </div>

            {/* Missing skills */}
            {skillGap.missingRequired.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: "#9AA4B2", fontSize: "12px", margin: "0 0 8px" }}>
                  Missing Required Skills:
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {skillGap.missingRequired.map((skill, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "4px 12px",
                        background: "rgba(255, 107, 107, 0.15)",
                        border: "1px solid rgba(255, 107, 107, 0.3)",
                        borderRadius: "6px",
                        color: "#ff6b6b",
                        fontSize: "12px"
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3D Visualization */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "32px",
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(25px)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "24px"
        }}
      >
        <Profile3DOrbOptimized
          skills={skills}
          initialNodes={skillNodes.length > 0 ? skillNodes : undefined}
          width={1100}
          height={700}
          onSelect={setSelectedNode}
          useInstancing={skills.length > 50}
        />
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div
          style={{
            maxWidth: "1400px",
            margin: "32px auto 0",
            padding: "24px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "16px"
          }}
        >
          <h3 style={{ color: "#4ff1e3", margin: "0 0 16px", fontSize: "18px" }}>
            💡 Recommended Skills to Learn
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "12px" }}>
            {recommendations.map((rec, i) => (
              <div
                key={i}
                style={{
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: `1px solid ${
                    rec.priority === "high" ? "rgba(74, 222, 128, 0.3)" :
                    rec.priority === "medium" ? "rgba(251, 191, 36, 0.3)" :
                    "rgba(156, 163, 175, 0.3)"
                  }`,
                  borderRadius: "8px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 600 }}>
                    {rec.skill}
                  </span>
                  <span
                    style={{
                      padding: "2px 8px",
                      background: rec.priority === "high" ? "rgba(74, 222, 128, 0.15)" :
                        rec.priority === "medium" ? "rgba(251, 191, 36, 0.15)" :
                        "rgba(156, 163, 175, 0.15)",
                      color: rec.priority === "high" ? "#4ade80" :
                        rec.priority === "medium" ? "#fbbf24" :
                        "#9ca3af",
                      fontSize: "10px",
                      fontWeight: 600,
                      borderRadius: "4px",
                      textTransform: "uppercase"
                    }}
                  >
                    {rec.priority}
                  </span>
                </div>
                <p style={{ color: "#9AA4B2", fontSize: "12px", margin: "4px 0 0" }}>
                  Required by {rec.demandCount} job{rec.demandCount > 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
