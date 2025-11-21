import { ParsedJobData } from './jobParser';

interface ProfileData {
  hard_skills?: string[];
  soft_skills?: string[];
  experience?: Array<{
    responsibilities?: string[];
    achievements?: string[];
  }>;
  seniority?: string;
}

interface ScoreBreakdown {
  hard_skills: number;
  soft_skills: number;
  responsibilities: number;
  keywords: number;
  seniority: number;
  overall: number;
}

interface MatchDetails {
  matched_hard_skills: string[];
  missing_hard_skills: string[];
  matched_soft_skills: string[];
  missing_soft_skills: string[];
  matched_keywords: string[];
  experience_alignment: string;
}

interface RelevanceScore {
  score_breakdown: ScoreBreakdown;
  match_details: MatchDetails;
}

/**
 * Calculate Jaccard similarity between two arrays
 */
function jaccardSimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 || arr2.length === 0) return 0;

  // Normalize to lowercase
  const set1 = new Set(arr1.map((s) => s.toLowerCase().trim()));
  const set2 = new Set(arr2.map((s) => s.toLowerCase().trim()));

  // Calculate intersection
  const intersection = new Set([...set1].filter((x) => set2.has(x)));

  // Calculate union
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Calculate cosine similarity between two text arrays
 */
function cosineSimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 || arr2.length === 0) return 0;

  // Create word frequency maps
  const freq1 = new Map<string, number>();
  const freq2 = new Map<string, number>();

  arr1.forEach((text) => {
    text
      .toLowerCase()
      .split(/\s+/)
      .forEach((word) => {
        freq1.set(word, (freq1.get(word) || 0) + 1);
      });
  });

  arr2.forEach((text) => {
    text
      .toLowerCase()
      .split(/\s+/)
      .forEach((word) => {
        freq2.set(word, (freq2.get(word) || 0) + 1);
      });
  });

  // Get all unique words
  const allWords = new Set([...freq1.keys(), ...freq2.keys()]);

  // Calculate dot product and magnitudes
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  allWords.forEach((word) => {
    const val1 = freq1.get(word) || 0;
    const val2 = freq2.get(word) || 0;
    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  });

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}

/**
 * Calculate keyword overlap score
 */
function keywordOverlap(profileKeywords: string[], jobKeywords: string[]): number {
  if (jobKeywords.length === 0) return 100;

  const profileSet = new Set(profileKeywords.map((k) => k.toLowerCase().trim()));
  const matchedCount = jobKeywords.filter((k) =>
    profileSet.has(k.toLowerCase().trim())
  ).length;

  return (matchedCount / jobKeywords.length) * 100;
}

/**
 * Calculate seniority alignment score
 */
function seniorityAlignment(profileSeniority: string, jobSeniority: string): number {
  const levels = ['junior', 'mid', 'senior', 'lead', 'principal', 'staff'];

  const normalize = (s: string) => {
    const lower = s.toLowerCase();
    if (lower.includes('junior') || lower.includes('entry')) return 'junior';
    if (lower.includes('mid') || lower.includes('intermediate')) return 'mid';
    if (lower.includes('senior')) return 'senior';
    if (lower.includes('lead')) return 'lead';
    if (lower.includes('principal') || lower.includes('staff')) return 'principal';
    return 'mid'; // default
  };

  const profileLevel = normalize(profileSeniority);
  const jobLevel = normalize(jobSeniority);

  const profileIdx = levels.indexOf(profileLevel);
  const jobIdx = levels.indexOf(jobLevel);

  // Perfect match
  if (profileIdx === jobIdx) return 100;

  // One level difference
  if (Math.abs(profileIdx - jobIdx) === 1) return 70;

  // Two levels difference
  if (Math.abs(profileIdx - jobIdx) === 2) return 40;

  // More than two levels
  return 20;
}

/**
 * Calculate comprehensive relevance score between profile and job
 */
export function calculateRelevanceScore(
  profile: ProfileData,
  jobData: ParsedJobData
): RelevanceScore {
  // Extract profile data with defaults
  const profileHardSkills = profile.hard_skills || [];
  const profileSoftSkills = profile.soft_skills || [];
  const profileResponsibilities =
    profile.experience?.flatMap((exp) => exp.responsibilities || []) || [];
  const profileSeniority = profile.seniority || 'mid';

  // Calculate hard skills match (40% weight)
  const hardSkillsSimilarity = jaccardSimilarity(profileHardSkills, jobData.hard_skills);
  const hardSkillsScore = hardSkillsSimilarity * 100;

  const matchedHardSkills = profileHardSkills.filter((skill) =>
    jobData.hard_skills.some((js) => js.toLowerCase().includes(skill.toLowerCase()))
  );
  const missingHardSkills = jobData.hard_skills.filter(
    (skill) =>
      !profileHardSkills.some((ps) => ps.toLowerCase().includes(skill.toLowerCase()))
  );

  // Calculate soft skills match (20% weight)
  const softSkillsSimilarity = jaccardSimilarity(profileSoftSkills, jobData.soft_skills);
  const softSkillsScore = softSkillsSimilarity * 100;

  const matchedSoftSkills = profileSoftSkills.filter((skill) =>
    jobData.soft_skills.some((js) => js.toLowerCase().includes(skill.toLowerCase()))
  );
  const missingSoftSkills = jobData.soft_skills.filter(
    (skill) =>
      !profileSoftSkills.some((ps) => ps.toLowerCase().includes(skill.toLowerCase()))
  );

  // Calculate responsibilities match (20% weight)
  const responsibilitiesSimilarity = cosineSimilarity(
    profileResponsibilities,
    jobData.responsibilities
  );
  const responsibilitiesScore = responsibilitiesSimilarity * 100;

  // Calculate keyword density (10% weight)
  const allProfileKeywords = [
    ...profileHardSkills,
    ...profileSoftSkills,
    ...profileResponsibilities.join(' ').split(/\s+/),
  ];
  const keywordsScore = keywordOverlap(allProfileKeywords, jobData.keywords);

  const matchedKeywords = jobData.keywords.filter((kw) =>
    allProfileKeywords.some((pk) => pk.toLowerCase().includes(kw.toLowerCase()))
  );

  // Calculate seniority alignment (10% weight)
  const seniorityScore = seniorityAlignment(profileSeniority, jobData.seniority);

  // Calculate weighted overall score
  const overallScore = Math.round(
    hardSkillsScore * 0.4 +
      softSkillsScore * 0.2 +
      responsibilitiesScore * 0.2 +
      keywordsScore * 0.1 +
      seniorityScore * 0.1
  );

  return {
    score_breakdown: {
      hard_skills: Math.round(hardSkillsScore),
      soft_skills: Math.round(softSkillsScore),
      responsibilities: Math.round(responsibilitiesScore),
      keywords: Math.round(keywordsScore),
      seniority: Math.round(seniorityScore),
      overall: overallScore,
    },
    match_details: {
      matched_hard_skills: matchedHardSkills,
      missing_hard_skills: missingHardSkills,
      matched_soft_skills: matchedSoftSkills,
      missing_soft_skills: missingSoftSkills,
      matched_keywords: matchedKeywords,
      experience_alignment: responsibilitiesSimilarity > 0.7 ? 'high' : responsibilitiesSimilarity > 0.4 ? 'medium' : 'low',
    },
  };
}

/**
 * Reorder experience items by relevance to job
 */
export function reorderExperience(
  experience: Array<{ responsibilities?: string[]; [key: string]: any }>,
  jobResponsibilities: string[]
): Array<{ relevance: number; [key: string]: any }> {
  return experience
    .map((exp) => {
      const expResponsibilities = exp.responsibilities || [];
      const relevance = cosineSimilarity(expResponsibilities, jobResponsibilities);
      return {
        ...exp,
        relevance: Math.round(relevance * 100),
      };
    })
    .sort((a, b) => b.relevance - a.relevance);
}
