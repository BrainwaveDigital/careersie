// Job-Specific Skill Highlighting for 3D Visualization
// Highlights user skills that match job requirements

import type { SkillNode } from "@/components/Profile3DOrb";
import { findSimilarSkills } from "./embeddingsClustering";

export interface JobRequirement {
  id: string;
  title: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  tools: string[];
  description?: string;
}

export interface SkillMatch {
  skill: string;
  matchType: "exact" | "similar" | "none";
  relevanceScore: number; // 0-1
  requiredBy: string[]; // job IDs
}

export interface HighlightedSkillNode extends SkillNode {
  matchType?: "exact" | "similar" | "partial" | "none";
  relevanceScore?: number;
  matchedJobs?: string[];
  highlighted?: boolean;
}

/**
 * Calculate skill match score between user skills and job requirements
 */
export function calculateSkillMatch(
  userSkills: string[],
  jobSkills: string[]
): { matches: string[]; score: number } {
  const userSkillsLower = userSkills.map(s => s.toLowerCase().trim());
  const jobSkillsLower = jobSkills.map(s => s.toLowerCase().trim());

  const exactMatches = userSkillsLower.filter(us =>
    jobSkillsLower.some(js => js === us || js.includes(us) || us.includes(js))
  );

  const score = jobSkills.length > 0 ? exactMatches.length / jobSkills.length : 0;

  return { matches: exactMatches, score };
}

/**
 * Enhance skill nodes with job matching data
 */
export function highlightSkillsForJob(
  nodes: SkillNode[],
  job: JobRequirement
): HighlightedSkillNode[] {
  const allJobSkills = [
    ...job.requiredSkills,
    ...job.niceToHaveSkills,
    ...job.tools
  ].map(s => s.toLowerCase().trim());

  return nodes.map(node => {
    const skillLower = node.label.toLowerCase().trim();
    
    // Check for exact matches
    const isExactMatch = allJobSkills.some(js => 
      js === skillLower || js.includes(skillLower) || skillLower.includes(js)
    );

    // Check if it's a required skill
    const isRequired = job.requiredSkills.some(rs =>
      rs.toLowerCase().trim() === skillLower ||
      rs.toLowerCase().includes(skillLower) ||
      skillLower.includes(rs.toLowerCase())
    );

    // Check if it's nice-to-have
    const isNiceToHave = job.niceToHaveSkills.some(ns =>
      ns.toLowerCase().trim() === skillLower ||
      ns.toLowerCase().includes(skillLower) ||
      skillLower.includes(ns.toLowerCase())
    );

    let matchType: "exact" | "similar" | "partial" | "none" = "none";
    let relevanceScore = 0;

    if (isExactMatch) {
      matchType = "exact";
      relevanceScore = isRequired ? 1.0 : 0.7;
    } else if (isNiceToHave) {
      matchType = "partial";
      relevanceScore = 0.5;
    }

    return {
      ...node,
      matchType,
      relevanceScore,
      matchedJobs: matchType !== "none" ? [job.id] : [],
      highlighted: matchType !== "none"
    };
  });
}

/**
 * Highlight skills across multiple jobs
 */
export function highlightSkillsForMultipleJobs(
  nodes: SkillNode[],
  jobs: JobRequirement[]
): HighlightedSkillNode[] {
  const skillMatchMap = new Map<string, {
    matchType: "exact" | "similar" | "partial" | "none";
    relevanceScore: number;
    matchedJobs: string[];
  }>();

  // Process each job
  jobs.forEach(job => {
    const highlighted = highlightSkillsForJob(nodes, job);
    
    highlighted.forEach(node => {
      const existing = skillMatchMap.get(node.label);
      
      if (!existing || (node.relevanceScore || 0) > existing.relevanceScore) {
        skillMatchMap.set(node.label, {
          matchType: node.matchType || "none",
          relevanceScore: node.relevanceScore || 0,
          matchedJobs: [...(existing?.matchedJobs || []), ...(node.matchedJobs || [])]
        });
      }
    });
  });

  // Apply aggregated matches
  return nodes.map(node => {
    const match = skillMatchMap.get(node.label);
    return {
      ...node,
      matchType: match?.matchType || "none",
      relevanceScore: match?.relevanceScore || 0,
      matchedJobs: match?.matchedJobs || [],
      highlighted: (match?.relevanceScore || 0) > 0
    };
  });
}

/**
 * Generate color for skill based on match type
 */
export function getSkillMatchColor(matchType: "exact" | "similar" | "partial" | "none"): number {
  switch (matchType) {
    case "exact":
      return 0x4ade80; // Green - exact match
    case "similar":
      return 0xfbbf24; // Yellow - similar
    case "partial":
      return 0x60a5fa; // Blue - partial match
    case "none":
    default:
      return 0x9ca3af; // Gray - no match
  }
}

/**
 * Calculate skill gap for a job
 */
export function calculateSkillGap(
  userSkills: string[],
  job: JobRequirement
): {
  missingRequired: string[];
  missingNiceToHave: string[];
  matchedRequired: string[];
  matchedNiceToHave: string[];
  coverageScore: number;
} {
  const userSkillsLower = userSkills.map(s => s.toLowerCase().trim());

  const matchedRequired = job.requiredSkills.filter(rs =>
    userSkillsLower.some(us =>
      us === rs.toLowerCase().trim() ||
      us.includes(rs.toLowerCase()) ||
      rs.toLowerCase().includes(us)
    )
  );

  const missingRequired = job.requiredSkills.filter(rs =>
    !matchedRequired.includes(rs)
  );

  const matchedNiceToHave = job.niceToHaveSkills.filter(ns =>
    userSkillsLower.some(us =>
      us === ns.toLowerCase().trim() ||
      us.includes(ns.toLowerCase()) ||
      ns.toLowerCase().includes(us)
    )
  );

  const missingNiceToHave = job.niceToHaveSkills.filter(ns =>
    !matchedNiceToHave.includes(ns)
  );

  // Coverage score weights required skills more heavily
  const requiredWeight = 0.7;
  const niceToHaveWeight = 0.3;

  const requiredCoverage = job.requiredSkills.length > 0
    ? matchedRequired.length / job.requiredSkills.length
    : 1;

  const niceToHaveCoverage = job.niceToHaveSkills.length > 0
    ? matchedNiceToHave.length / job.niceToHaveSkills.length
    : 1;

  const coverageScore = 
    requiredCoverage * requiredWeight + 
    niceToHaveCoverage * niceToHaveWeight;

  return {
    missingRequired,
    missingNiceToHave,
    matchedRequired,
    matchedNiceToHave,
    coverageScore
  };
}

/**
 * Rank jobs by skill match
 */
export function rankJobsBySkillMatch(
  userSkills: string[],
  jobs: JobRequirement[]
): Array<JobRequirement & { matchScore: number; coverageScore: number }> {
  return jobs
    .map(job => {
      const { score } = calculateSkillMatch(
        userSkills,
        [...job.requiredSkills, ...job.niceToHaveSkills]
      );
      const { coverageScore } = calculateSkillGap(userSkills, job);

      return {
        ...job,
        matchScore: score,
        coverageScore
      };
    })
    .sort((a, b) => b.coverageScore - a.coverageScore);
}

/**
 * Get recommended skills to learn based on job targets
 */
export function getRecommendedSkills(
  userSkills: string[],
  targetJobs: JobRequirement[],
  maxRecommendations = 10
): Array<{ skill: string; demandCount: number; priority: "high" | "medium" | "low" }> {
  const skillDemand = new Map<string, number>();

  // Count how many target jobs require each skill
  targetJobs.forEach(job => {
    [...job.requiredSkills, ...job.niceToHaveSkills].forEach(skill => {
      const normalized = skill.toLowerCase().trim();
      skillDemand.set(normalized, (skillDemand.get(normalized) || 0) + 1);
    });
  });

  // Filter out skills user already has
  const userSkillsLower = userSkills.map(s => s.toLowerCase().trim());
  const missingSkills = Array.from(skillDemand.entries())
    .filter(([skill]) => !userSkillsLower.some(us => 
      us === skill || us.includes(skill) || skill.includes(us)
    ))
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxRecommendations);

  // Categorize by priority
  const maxDemand = Math.max(...missingSkills.map(s => s[1]));
  
  return missingSkills.map(([skill, count]) => {
    let priority: "high" | "medium" | "low" = "low";
    const demandRatio = count / maxDemand;

    if (demandRatio >= 0.7) priority = "high";
    else if (demandRatio >= 0.4) priority = "medium";

    return {
      skill,
      demandCount: count,
      priority
    };
  });
}

/**
 * Semantic skill matching using embeddings (requires embeddingsClustering)
 */
export async function findSemanticSkillMatches(
  userSkills: string[],
  jobSkills: string[],
  threshold = 0.75
): Promise<Array<{ userSkill: string; jobSkill: string; similarity: number }>> {
  const matches: Array<{ userSkill: string; jobSkill: string; similarity: number }> = [];

  for (const jobSkill of jobSkills) {
    try {
      const similar = await findSimilarSkills(jobSkill, userSkills, 3);
      
      similar.forEach(s => {
        if (s.similarity >= threshold) {
          matches.push({
            userSkill: s.skill,
            jobSkill,
            similarity: s.similarity
          });
        }
      });
    } catch (error) {
      console.error(`Error finding semantic matches for ${jobSkill}:`, error);
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}
