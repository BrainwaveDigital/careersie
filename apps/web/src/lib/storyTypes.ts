/**
 * Story Types for Sprint 2.4 - Narratives, Context & Stories
 * 
 * STAR-format narrative stories for work experiences with AI generation,
 * versioning, and metrics highlighting.
 */

export interface Story {
  id: string;
  experience_id: string;
  created_at: string;
  updated_at: string;
  
  // STAR content
  situation: string | null;
  task: string | null;
  action: string | null;
  result: string | null;
  full_story: string | null;
  
  // Metadata
  ai_generated: boolean;
  metrics: ImpactMetrics | null;
  title: string | null;
  tags: string[] | null;
  is_draft: boolean;
  
  // Scoring (Sprint 2.2 integration)
  relevance_score: number | null;
  job_match_scores: Record<string, number> | null;
}

export interface StoryVersion {
  id: string;
  story_id: string;
  created_at: string;
  version_number: number;
  
  // Content snapshot
  situation: string | null;
  task: string | null;
  action: string | null;
  result: string | null;
  full_story: string | null;
  metrics: ImpactMetrics | null;
  
  // Metadata
  change_summary: string | null;
  created_by_ai: boolean;
}

export interface StorySkill {
  id: string;
  story_id: string;
  skill_id: string;
  created_at: string;
}

export interface ImpactMetrics {
  numbers: string[]; // e.g., ["60%", "$1.2M", "3x faster"]
  keywords: string[]; // e.g., ["efficiency", "cost savings", "leadership"]
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateStoryRequest {
  experience_id: string;
  skill_ids?: string[];
  title?: string;
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
}

export interface UpdateStoryRequest {
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  full_story?: string;
  metrics?: ImpactMetrics;
  title?: string;
  tags?: string[];
  is_draft?: boolean;
  skill_ids?: string[];
  autosave?: boolean; // If true, don't create version snapshot
}

export interface GenerateStoryRequest {
  experience_id: string;
  bullets: string[]; // User-provided bullet points
  notes?: string; // Additional context
  skill_ids?: string[];
}

export interface GenerateStoryResponse {
  story_id: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  full_story: string;
  metrics: ImpactMetrics;
}

export interface CreateVersionRequest {
  story_id: string;
  change_summary?: string;
}

export interface StoryWithDetails extends Story {
  experience?: {
    id: string;
    title: string | null;
    company: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  skills?: Array<{
    id: string;
    skill: string;
  }>;
  versions?: StoryVersion[];
  latest_version?: StoryVersion;
}

// ============================================
// Frontend Component Props
// ============================================

export interface AddStoryModalProps {
  experienceId: string;
  experienceTitle: string;
  onClose: () => void;
  onSuccess: (storyId: string) => void;
}

export interface StoryEditorProps {
  storyId: string;
  initialContent?: Partial<Story>;
  onSave?: (story: Story) => void;
  onClose?: () => void;
}

export interface StoryDisplayProps {
  story: StoryWithDetails;
  showMetrics?: boolean;
  collapsed?: boolean;
  onEdit?: () => void;
}

export interface MetricsBadgeProps {
  metrics: ImpactMetrics;
  variant?: 'compact' | 'full';
}

export interface VersionCompareProps {
  story: Story;
  versionA: StoryVersion;
  versionB: StoryVersion;
}

// ============================================
// TipTap Editor Types
// ============================================

export interface EditorContent {
  html: string;
  json: any; // TipTap JSON format
  text: string;
}

export interface AutosaveStatus {
  status: 'saved' | 'saving' | 'unsaved' | 'error';
  lastSaved?: Date;
  error?: string;
}

// ============================================
// STAR Guidance/Templates
// ============================================

export interface STARTemplate {
  situation: {
    prompt: string;
    example: string;
    tips: string[];
  };
  task: {
    prompt: string;
    example: string;
    tips: string[];
  };
  action: {
    prompt: string;
    example: string;
    tips: string[];
  };
  result: {
    prompt: string;
    example: string;
    tips: string[];
  };
}

export const DEFAULT_STAR_TEMPLATE: STARTemplate = {
  situation: {
    prompt: "What was the context or challenge you faced?",
    example: "Our team was supporting a legacy system with frequent downtime affecting 10,000+ users.",
    tips: [
      "Describe the environment",
      "Include team size and scope",
      "Mention timeframe",
      "Explain why it mattered"
    ]
  },
  task: {
    prompt: "What was your specific responsibility or goal?",
    example: "I was tasked with modernizing the infrastructure while maintaining zero downtime during business hours.",
    tips: [
      "Focus on YOUR role",
      "State the objective clearly",
      "Mention constraints",
      "Include success criteria"
    ]
  },
  action: {
    prompt: "What specific actions did YOU take?",
    example: "I designed and implemented a blue-green deployment strategy, set up automated testing pipelines, and coordinated with 5 teams across 3 time zones.",
    tips: [
      "Use 'I' not 'we'",
      "Be specific about methods",
      "Mention tools/technologies",
      "Show leadership or initiative"
    ]
  },
  result: {
    prompt: "What was the measurable outcome?",
    example: "Reduced deployment time by 60%, eliminated downtime incidents, and saved the company $200K annually in infrastructure costs.",
    tips: [
      "Include numbers/percentages",
      "Show business impact",
      "Mention recognition received",
      "Use before/after comparisons"
    ]
  }
};
