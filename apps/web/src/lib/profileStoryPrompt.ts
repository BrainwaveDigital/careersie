/**
 * ProfileStory Prompt Configuration
 * 
 * Allows users to customize their TalentStory generation with:
 * - Tone selection
 * - Focus skills
 * - Section toggles
 * - Story type
 * - Custom instructions
 */

export interface ProfileStoryPrompt {
  // Tone of the story
  tone: 
    | "professional"     // Corporate, polished
    | "personal"         // Warm, authentic, first-person feel
    | "creative"         // Bold, unique, artistic
    | "executive"        // High-level, strategic, leadership-focused
    | "analytical"       // Data-driven, metrics-focused
    | "conversational"   // Friendly, approachable
    | "academic";        // Scholarly, research-oriented

  // Skills to emphasize in the story
  focusSkills?: string[];

  // Which sections to include in the generated story
  includeSections: {
    summary: boolean;          // Narrative summary paragraph
    skillThemes: boolean;      // Grouped skill clusters
    timeline: boolean;         // Chronological career journey
    strengths: boolean;        // Unique superpowers
    highlights: boolean;       // Standout achievements
    careerPaths: boolean;      // Recommended directions
    mediaShowcase: boolean;    // Featured media/portfolio items
  };

  // Type of story to generate
  storyType: 
    | "full"           // Complete 6-section story
    | "summary"        // Brief overview only
    | "skills"         // Skills-focused narrative
    | "project"        // Project-centered story
    | "role-specific"; // Tailored for a specific job

  // Target role for role-specific stories
  targetRole?: string;

  // Additional custom instructions from the user
  customPrompt?: string;

  // Media items to explicitly feature in the story
  media?: {
    url: string;
    caption?: string;
    type?: "image" | "video" | "portfolio" | "document";
  }[];

  // Length preference
  length?: "short" | "medium" | "detailed";
}

/**
 * Default prompt configuration
 * Used when user doesn't specify preferences
 */
export const DEFAULT_PROMPT_CONFIG: ProfileStoryPrompt = {
  tone: "professional",
  includeSections: {
    summary: true,
    skillThemes: true,
    timeline: true,
    strengths: true,
    highlights: true,
    careerPaths: true,
    mediaShowcase: false,
  },
  storyType: "full",
  length: "medium",
};

/**
 * Tone descriptions for UI
 */
export const TONE_DESCRIPTIONS = {
  professional: "Polished and corporate-appropriate",
  personal: "Warm and authentic, with personal touches",
  creative: "Bold, unique, and artistic expression",
  executive: "Strategic and leadership-focused",
  analytical: "Data-driven with metrics and results",
  conversational: "Friendly and approachable",
  academic: "Scholarly with research emphasis",
};

/**
 * Story type descriptions for UI
 */
export const STORY_TYPE_DESCRIPTIONS = {
  full: "Complete career story with all sections",
  summary: "Brief professional overview",
  skills: "Focus on technical and soft skills",
  project: "Highlight key projects and achievements",
  "role-specific": "Tailored for a specific job application",
};
