// OpenAI Embeddings Integration for Semantic Skill Clustering
// Provides production-ready semantic clustering using OpenAI's text-embedding-3-small model

import OpenAI from "openai";
import type { SkillNode } from "@/components/Profile3DOrb";

// Initialize OpenAI client (lazy initialization)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured. Set OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY.");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Generate embeddings for an array of skill names
 * Uses OpenAI's text-embedding-3-small (1536 dimensions)
 */
export async function generateSkillEmbeddings(skills: string[]): Promise<number[][]> {
  if (skills.length === 0) return [];

  try {
    const client = getOpenAIClient();
    
    // Batch skills for efficient API usage (max 2048 texts per request)
    const batchSize = 100;
    const embeddings: number[][] = [];

    for (let i = 0; i < skills.length; i += batchSize) {
      const batch = skills.slice(i, i + batchSize);
      
      const response = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: batch,
        encoding_format: "float"
      });

      // Extract embeddings in order
      const batchEmbeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map(item => item.embedding);
      
      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    dotProduct += aVal * bVal;
    normA += aVal * aVal;
    normB += bVal * bVal;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

/**
 * K-means clustering with embeddings
 * More accurate than TF-IDF for semantic grouping
 */
export function kMeansWithEmbeddings(
  embeddings: number[][],
  k: number,
  maxIterations = 50,
  tolerance = 1e-4
): number[] {
  const n = embeddings.length;
  if (n === 0) return [];
  if (k >= n) return embeddings.map((_, i) => i);

  // Initialize centroids using k-means++
  const centroids: number[][] = [];
  const firstIdx = Math.floor(Math.random() * n);
  const firstEmbedding = embeddings[firstIdx];
  if (firstEmbedding) centroids.push([...firstEmbedding]);

  // K-means++ initialization for better convergence
  while (centroids.length < k) {
    const distances = embeddings.map(emb => {
      if (!emb) return 0;
      const minDist = Math.min(
        ...centroids.map(c => 1 - cosineSimilarity(emb, c))
      );
      return minDist * minDist;
    });

    const totalDist = distances.reduce((sum, d) => sum + d, 0);
    let rand = Math.random() * totalDist;
    
    for (let i = 0; i < distances.length; i++) {
      const dist = distances[i];
      if (dist === undefined) continue;
      rand -= dist;
      if (rand <= 0) {
        const emb = embeddings[i];
        if (emb) centroids.push([...emb]);
        break;
      }
    }
  }

  // Assignments
  let assignments = new Array(n).fill(0);
  let prevAssignments = new Array(n).fill(-1);
  let iteration = 0;

  while (iteration < maxIterations) {
    // Assign each point to nearest centroid
    let changed = false;
    for (let i = 0; i < n; i++) {
      const emb = embeddings[i];
      if (!emb) continue;

      let bestCluster = 0;
      let bestSimilarity = -Infinity;

      for (let c = 0; c < centroids.length; c++) {
        const centroid = centroids[c];
        if (!centroid) continue;
        const similarity = cosineSimilarity(emb, centroid);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestCluster = c;
        }
      }

      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    // Check convergence
    if (!changed) break;

    // Update centroids
    for (let c = 0; c < k; c++) {
      const clusterPoints = embeddings.filter((_, i) => assignments[i] === c);
      if (clusterPoints.length === 0) continue;

      const dim = clusterPoints[0]?.length || 0;
      const newCentroid = new Array(dim).fill(0);

      for (const point of clusterPoints) {
        for (let d = 0; d < dim; d++) {
          newCentroid[d] = (newCentroid[d] ?? 0) + (point[d] ?? 0);
        }
      }

      // Normalize
      const norm = Math.sqrt(newCentroid.reduce((sum, v) => sum + v * v, 0)) || 1;
      for (let d = 0; d < dim; d++) {
        newCentroid[d] = (newCentroid[d] ?? 0) / norm;
      }

      centroids[c] = newCentroid;
    }

    prevAssignments = [...assignments];
    iteration++;
  }

  return assignments;
}

/**
 * Cluster skills using OpenAI embeddings
 * Returns SkillNode array with semantic cluster IDs
 */
export async function clusterSkillsWithOpenAI(
  skills: string[],
  options: {
    numClusters?: number;
    weights?: number[];
    categories?: string[];
  } = {}
): Promise<SkillNode[]> {
  if (skills.length === 0) return [];

  const { numClusters, weights, categories } = options;
  const k = numClusters || Math.max(3, Math.min(8, Math.ceil(skills.length / 5)));

  try {
    // Generate embeddings
    console.log(`Generating embeddings for ${skills.length} skills...`);
    const embeddings = await generateSkillEmbeddings(skills);

    // Cluster using k-means
    console.log(`Clustering into ${k} groups...`);
    const clusterIds = kMeansWithEmbeddings(embeddings, k);

    // Create SkillNode objects
    const nodes: SkillNode[] = skills.map((skill, i) => ({
      id: `skill_${i}`,
      label: skill,
      category: categories?.[i] || "",
      weight: weights?.[i] || 1 + Math.random() * 2,
      clusterId: clusterIds[i] ?? 0
    }));

    console.log(`Clustered ${skills.length} skills into ${k} semantic groups`);
    return nodes;

  } catch (error) {
    console.error("Error clustering with OpenAI:", error);
    throw error;
  }
}

/**
 * Find similar skills based on embeddings
 * Useful for skill recommendations and job matching
 */
export async function findSimilarSkills(
  targetSkill: string,
  skillPool: string[],
  topK = 5
): Promise<Array<{ skill: string; similarity: number }>> {
  try {
    const allSkills = [targetSkill, ...skillPool];
    const embeddings = await generateSkillEmbeddings(allSkills);

    const targetEmbedding = embeddings[0];
    if (!targetEmbedding) return [];

    const similarities = skillPool.map((skill, i) => {
      const poolEmbedding = embeddings[i + 1];
      if (!poolEmbedding) return { skill, similarity: 0 };
      return {
        skill,
        similarity: cosineSimilarity(targetEmbedding, poolEmbedding)
      };
    });

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

  } catch (error) {
    console.error("Error finding similar skills:", error);
    return [];
  }
}

/**
 * Cache embeddings to avoid redundant API calls
 */
interface EmbeddingCache {
  [skill: string]: number[];
}

let embeddingCache: EmbeddingCache = {};

export function getCachedEmbedding(skill: string): number[] | undefined {
  return embeddingCache[skill.toLowerCase()];
}

export function setCachedEmbedding(skill: string, embedding: number[]): void {
  embeddingCache[skill.toLowerCase()] = embedding;
}

export function clearEmbeddingCache(): void {
  embeddingCache = {};
}

/**
 * Generate embeddings with caching
 */
export async function generateSkillEmbeddingsWithCache(skills: string[]): Promise<number[][]> {
  const results: number[][] = [];
  const uncachedSkills: string[] = [];
  const uncachedIndices: number[] = [];

  // Check cache first
  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    if (!skill) continue;
    
    const cached = getCachedEmbedding(skill);
    if (cached) {
      results[i] = cached;
    } else {
      uncachedSkills.push(skill);
      uncachedIndices.push(i);
    }
  }

  // Generate embeddings for uncached skills
  if (uncachedSkills.length > 0) {
    const newEmbeddings = await generateSkillEmbeddings(uncachedSkills);
    
    uncachedSkills.forEach((skill, idx) => {
      const embedding = newEmbeddings[idx];
      if (embedding) {
        const originalIdx = uncachedIndices[idx];
        if (originalIdx !== undefined) {
          results[originalIdx] = embedding;
          setCachedEmbedding(skill, embedding);
        }
      }
    });
  }

  return results;
}
