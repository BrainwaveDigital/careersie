/**
 * ProfileStoryInput Interface
 * 
 * Normalized structure for all profile data across the platform.
 * This ensures consistent data format regardless of source (parsed CV, manual entry, etc.)
 */

export interface ProfileStoryInput {
  personalInfo: {
    name: string;
    title?: string;
    location?: string;
  };
  summary?: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    responsibilities?: string[];
    achievements?: string[];
  }[];
  projects?: {
    name: string;
    description?: string;
    impact?: string;
  }[];
  education?: {
    institution: string;
    degree: string;
    year?: string;
  }[];
  media?: {
    type: "image" | "video" | "portfolio";
    url: string;
    caption?: string;
  }[];
  careerGoals?: string[];
}

/**
 * Profile data from Supabase database
 */
export interface ProfileData {
  id: string;
  user_id: string;
  full_name?: string;
  headline?: string;
  location?: string;
  summary?: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface ExperienceData {
  id: string;
  profile_id: string;
  title?: string;
  company?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
  order_index?: number;
}

export interface EducationData {
  id: string;
  profile_id: string;
  school?: string;
  degree?: string;
  field_of_study?: string;
  start_year?: string;
  end_year?: string;
  description?: string;
}

export interface SkillData {
  id: string;
  profile_id: string;
  skill: string;
}

export interface MediaData {
  id: string;
  profile_id: string;
  file_name: string;
  file_type: 'image' | 'audio' | 'video';
  mime_type: string;
  storage_path: string;
  storage_bucket: string;
  title?: string;
  description?: string;
  publicUrl?: string;
}

export interface ReflectionData {
  id: string;
  profile_id: string;
  career_goals?: string | string[];
  long_term_vision?: string;
  career_motivations?: string | string[];
}
