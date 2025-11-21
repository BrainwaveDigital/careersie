"use client";

import { useEffect, useState } from "react";
import Profile3DOrb, { type SkillNode } from "@/components/Profile3DOrb";
import { prepareSkillNodes, detectCategory, calculateSkillWeight, type SkillInput } from "@/lib/skillClustering";
import { supabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SkillVisualizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillNodes, setSkillNodes] = useState<SkillNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [useCustomData, setUseCustomData] = useState(false);

  // Demo data for testing
  const demoSkills = [
    "React", "TypeScript", "Node.js", "Python", "SQL", "PostgreSQL",
    "AWS", "Docker", "Kubernetes", "Terraform", "Git", "REST APIs",
    "GraphQL", "MongoDB", "Redis", "Next.js", "Express.js", "Django",
    "Flask", "FastAPI", "Vue.js", "Angular", "Tailwind CSS", "SASS",
    "Webpack", "Vite", "Jest", "Cypress", "GitHub Actions", "Jenkins"
  ];

  useEffect(() => {
    loadUserSkills();
  }, []);

  async function loadUserSkills() {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) {
        setLoading(false);
        setSkills(demoSkills);
        return;
      }

      // Fetch user's parsed CV data
      const { data: parsedDocs } = await supabaseClient
        .from("parsed_documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (parsedDocs && parsedDocs.length > 0) {
        const doc = parsedDocs[0];
        const extractedSkills = doc.skills || demoSkills;
        setSkills(extractedSkills);

        // Create enhanced skill nodes with weights and categories
        const skillInputs: SkillInput[] = extractedSkills.map((skill: string) => ({
          skill,
          frequency: 1 + Math.floor(Math.random() * 5),
          recency: new Date(),
          yearsOfExperience: Math.floor(Math.random() * 10),
          isPrimary: Math.random() > 0.7
        }));

        const nodes = prepareSkillNodes(skillInputs);
        setSkillNodes(nodes);
      } else {
        setSkills(demoSkills);
      }
    } catch (error) {
      console.error("Error loading skills:", error);
      setSkills(demoSkills);
    } finally {
      setLoading(false);
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
          <p style={{ color: "#9AA4B2", fontSize: "14px" }}>Loading your skills...</p>
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
              fontSize: "14px",
              transition: "all 0.2s"
            }}
          >
            ← Back
          </button>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#FFFFFF",
              margin: 0
            }}
          >
            3D Skill Visualization
          </h1>
        </div>

        <div
          style={{
            padding: "20px",
            background: "rgba(79, 241, 227, 0.1)",
            border: "1px solid rgba(79, 241, 227, 0.3)",
            borderRadius: "12px",
            marginBottom: "24px"
          }}
        >
          <p style={{ color: "#E5E7EB", margin: "0 0 12px", fontSize: "14px" }}>
            <strong style={{ color: "#4ff1e3" }}>Interactive 3D Skill Orb:</strong> Explore your
            skills in an immersive 3D environment. Skills are clustered by category and sized by
            proficiency. Use your mouse to orbit, zoom, and hover over nodes for details.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#E5E7EB", fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={useCustomData}
                onChange={(e) => setUseCustomData(e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              Use custom skill nodes (with categories and weights)
            </label>
          </div>
        </div>
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
          borderRadius: "24px",
          boxShadow: "0 0 30px rgba(0, 0, 0, 0.4)"
        }}
      >
        <Profile3DOrb
          skills={skills}
          initialNodes={useCustomData && skillNodes.length > 0 ? skillNodes : undefined}
          width={1100}
          height={700}
          onSelect={(node) => setSelectedNode(node)}
        />

        {/* Selected Skill Details */}
        {selectedNode && (
          <div
            style={{
              marginTop: "24px",
              padding: "20px",
              background: "rgba(79, 241, 227, 0.08)",
              border: "1px solid rgba(79, 241, 227, 0.2)",
              borderRadius: "12px"
            }}
          >
            <h3 style={{ color: "#4ff1e3", margin: "0 0 12px", fontSize: "20px" }}>
              {selectedNode.label}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              <div>
                <p style={{ color: "#9AA4B2", fontSize: "12px", margin: "0 0 4px" }}>Category</p>
                <p style={{ color: "#FFFFFF", fontSize: "14px", margin: 0 }}>
                  {selectedNode.category || "Uncategorized"}
                </p>
              </div>
              <div>
                <p style={{ color: "#9AA4B2", fontSize: "12px", margin: "0 0 4px" }}>Cluster ID</p>
                <p style={{ color: "#FFFFFF", fontSize: "14px", margin: 0 }}>
                  #{selectedNode.clusterId}
                </p>
              </div>
              <div>
                <p style={{ color: "#9AA4B2", fontSize: "12px", margin: "0 0 4px" }}>Proficiency Weight</p>
                <p style={{ color: "#FFFFFF", fontSize: "14px", margin: 0 }}>
                  {selectedNode.weight?.toFixed(2) || "1.00"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "32px auto 0",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px"
        }}
      >
        <div
          style={{
            padding: "24px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "16px"
          }}
        >
          <h3 style={{ color: "#4ff1e3", margin: "0 0 12px", fontSize: "18px" }}>Controls</h3>
          <ul style={{ color: "#E5E7EB", fontSize: "14px", lineHeight: "1.8", paddingLeft: "20px" }}>
            <li>
              <strong>Orbit:</strong> Left-click and drag
            </li>
            <li>
              <strong>Zoom:</strong> Mouse wheel
            </li>
            <li>
              <strong>Pan:</strong> Right-click and drag
            </li>
            <li>
              <strong>Select:</strong> Hover or click on a node
            </li>
          </ul>
        </div>

        <div
          style={{
            padding: "24px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "16px"
          }}
        >
          <h3 style={{ color: "#4ff1e3", margin: "0 0 12px", fontSize: "18px" }}>Color Legend</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { color: "#4fc3f7", label: "Default/General" },
              { color: "#81c784", label: "Frontend" },
              { color: "#ffb74d", label: "Backend" },
              { color: "#ba68c8", label: "Data" },
              { color: "#ff8a65", label: "Cloud/DevOps" }
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "4px",
                    background: item.color
                  }}
                />
                <span style={{ color: "#E5E7EB", fontSize: "14px" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: "24px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "16px"
          }}
        >
          <h3 style={{ color: "#4ff1e3", margin: "0 0 12px", fontSize: "18px" }}>Statistics</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#9AA4B2", fontSize: "14px" }}>Total Skills:</span>
              <span style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                {skills.length}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#9AA4B2", fontSize: "14px" }}>Clusters:</span>
              <span style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                {Math.max(...(skillNodes.length > 0 ? skillNodes.map(n => n.clusterId || 0) : [0])) + 1}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#9AA4B2", fontSize: "14px" }}>Avg Weight:</span>
              <span style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                {skillNodes.length > 0
                  ? (skillNodes.reduce((acc, n) => acc + (n.weight || 1), 0) / skillNodes.length).toFixed(2)
                  : "1.00"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
