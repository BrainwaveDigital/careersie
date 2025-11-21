// Skill Clustering Utilities
// Provides advanced clustering algorithms for skill visualization

import type { SkillNode } from "@/components/Profile3DOrb";

// ----------------------- Category Detection -----------------------
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  frontend: [
    "react", "vue", "angular", "html", "css", "javascript", "typescript",
    "jsx", "sass", "tailwind", "bootstrap", "webpack", "vite", "next.js", "nuxt"
  ],
  backend: [
    "node.js", "express", "fastify", "nest.js", "django", "flask", "rails",
    "spring", "asp.net", "laravel", "php", "java", "python", "ruby", "go", "rust"
  ],
  data: [
    "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "cassandra", "dynamodb", "firebase", "prisma", "sequelize", "typeorm"
  ],
  cloud: [
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
    "jenkins", "github actions", "gitlab ci", "circleci", "heroku", "vercel", "netlify"
  ],
  mobile: [
    "react native", "flutter", "swift", "kotlin", "ios", "android",
    "xamarin", "ionic", "cordova"
  ],
  design: [
    "figma", "sketch", "adobe xd", "photoshop", "illustrator",
    "ui/ux", "wireframing", "prototyping"
  ]
};

/**
 * Auto-detect skill category based on keywords
 */
export function detectCategory(skill: string): string {
  const normalized = skill.toLowerCase().trim();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      return category;
    }
  }
  
  return "default";
}

// ----------------------- Weight Calculation -----------------------
export interface SkillInput {
  skill: string;
  frequency?: number;
  recency?: Date;
  yearsOfExperience?: number;
  isPrimary?: boolean;
}

/**
 * Calculate skill weight based on multiple factors
 * Higher weight = larger node in visualization
 */
export function calculateSkillWeight(input: SkillInput): number {
  let weight = 1.0;
  
  // Frequency contribution (0-2x)
  if (input.frequency) {
    weight *= Math.min(1 + (input.frequency / 10), 2);
  }
  
  // Recency contribution (0.5-1.5x)
  if (input.recency) {
    const monthsSince = (Date.now() - input.recency.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const recencyFactor = Math.max(0.5, 1.5 - (monthsSince / 24)); // Decay over 2 years
    weight *= recencyFactor;
  }
  
  // Experience contribution (1-3x)
  if (input.yearsOfExperience) {
    weight *= Math.min(1 + (input.yearsOfExperience / 5), 3);
  }
  
  // Primary skill boost (1.5x)
  if (input.isPrimary) {
    weight *= 1.5;
  }
  
  // Normalize to reasonable range (0.5 - 4.0)
  return Math.max(0.5, Math.min(weight, 4.0));
}

// ----------------------- Enhanced Clustering -----------------------
/**
 * Extract skills from parsed CV data
 */
export function extractSkillsFromCV(parsedData: any): SkillInput[] {
  const skills: SkillInput[] = [];
  
  // Extract from skills section
  if (parsedData.skills && Array.isArray(parsedData.skills)) {
    parsedData.skills.forEach((skill: string) => {
      skills.push({
        skill,
        frequency: 1,
        isPrimary: true
      });
    });
  }
  
  // Extract from experience descriptions
  if (parsedData.experience && Array.isArray(parsedData.experience)) {
    parsedData.experience.forEach((exp: any) => {
      const description = exp.description || "";
      // Simple keyword extraction (in production, use NLP)
      const techWords = description.match(/\b[A-Z][a-z]+(?:\.[a-z]+)?|\b(?:Node\.js|React|Vue|Angular)\b/g) || [];
      techWords.forEach((word: string) => {
        const existing = skills.find(s => s.skill.toLowerCase() === word.toLowerCase());
        if (existing) {
          existing.frequency = (existing.frequency || 1) + 1;
        } else {
          skills.push({
            skill: word,
            frequency: 1,
            recency: exp.end_date ? new Date(exp.end_date) : new Date()
          });
        }
      });
    });
  }
  
  return skills;
}

/**
 * Convert skill inputs to SkillNode with categories and weights
 */
export function prepareSkillNodes(inputs: SkillInput[]): SkillNode[] {
  return inputs.map((input, index) => ({
    id: `skill_${index}`,
    label: input.skill,
    category: detectCategory(input.skill),
    weight: calculateSkillWeight(input),
    clusterId: 0 // Will be assigned by clustering algorithm
  }));
}

// ----------------------- Semantic Clustering (Placeholder for OpenAI) -----------------------
/**
 * Group skills using semantic similarity (OpenAI embeddings)
 * This is a placeholder - implement with OpenAI API in production
 */
export async function clusterSkillsWithEmbeddings(
  skills: string[],
  apiKey?: string
): Promise<SkillNode[]> {
  // TODO: Implement with OpenAI embeddings API
  // For now, fallback to category-based clustering
  console.warn("OpenAI embeddings not configured, using category-based clustering");
  
  const nodes = skills.map((skill, index) => ({
    id: `skill_${index}`,
    label: skill,
    category: detectCategory(skill),
    weight: 1 + Math.random() * 2,
    clusterId: 0
  }));
  
  // Assign cluster IDs based on categories
  const categoryMap = new Map<string, number>();
  let currentCluster = 0;
  
  nodes.forEach(node => {
    if (!categoryMap.has(node.category)) {
      categoryMap.set(node.category, currentCluster++);
    }
    node.clusterId = categoryMap.get(node.category)!;
  });
  
  return nodes;
}

// ----------------------- Export Utilities -----------------------
/**
 * Generate embeddable HTML for skill visualization
 */
export function generateEmbedCode(skills: SkillNode[], width = 800, height = 600): string {
  const dataJson = JSON.stringify(skills, null, 2);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Skill Visualization</title>
  <style>
    body { margin: 0; padding: 0; overflow: hidden; background: #0D1117; }
    #container { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="container"></div>
  <script type="module">
    // Add Three.js and D3.js from CDN
    import * as THREE from 'https://cdn.skypack.dev/three@0.150.0';
    import { OrbitControls } from 'https://cdn.skypack.dev/three@0.150.0/examples/jsm/controls/OrbitControls';
    
    const skills = ${dataJson};
    
    // Initialize visualization here
    // (Full implementation would mirror Profile3DOrb.tsx)
  </script>
</body>
</html>
  `.trim();
}

/**
 * Export skill data as JSON
 */
export function exportSkillDataJSON(nodes: SkillNode[]): Blob {
  const data = {
    version: "1.0",
    exportDate: new Date().toISOString(),
    skills: nodes,
    categories: Array.from(new Set(nodes.map(n => n.category))),
    totalSkills: nodes.length,
    clusters: Math.max(...nodes.map(n => n.clusterId || 0)) + 1
  };
  
  return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
}
