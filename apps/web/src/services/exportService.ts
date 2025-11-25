import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface ExportOptions {
  theme?: 'light' | 'dark' | 'ats';
  includeStories?: boolean;
  includeAchievements?: boolean;
  includeMedia?: boolean;
  pageSize?: 'A4' | 'Letter';
  fontSize?: 'small' | 'medium' | 'large';
}

export interface TalentStoryPayload {
  user: {
    id: string;
    name: string;
    email: string;
    title?: string;
    location?: string;
    summary?: string;
    phone?: string;
    linkedin?: string;
    portfolio?: string;
  };
  stories: Array<{
    id: string;
    title: string;
    fullStory: string;
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
    highlights?: string[];
    skills?: string[];
    experience: {
      id: string;
      title: string;
      company: string;
      location?: string;
      dateRange: string;
      startDate?: string;
      endDate?: string;
      currentRole?: boolean;
    };
  }>;
  skills: string[];
  education?: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    year?: string;
  }>;
  options: ExportOptions;
}

/**
 * Fetches and aggregates TalentStory data for export
 */
export async function getTalentStoryPayload(
  userId: string,
  options: ExportOptions = {}
): Promise<TalentStoryPayload> {
  try {
    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;

    // Fetch stories with experiences
    const { data: stories, error: storiesError } = await supabaseServer
      .from('stories')
      .select(`
        *,
        experience:experiences(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (storiesError) throw storiesError;

    // Fetch skills
    const { data: skills, error: skillsError } = await supabaseServer
      .from('skills')
      .select('name')
      .eq('user_id', userId);

    if (skillsError) throw skillsError;

    // Fetch education
    const { data: education } = await supabaseServer
      .from('education')
      .select('*')
      .eq('user_id', userId)
      .order('end_date', { ascending: false });

    // Fetch certifications
    const { data: certifications } = await supabaseServer
      .from('certifications')
      .select('*')
      .eq('user_id', userId)
      .order('issue_date', { ascending: false });

    // Transform data
    const transformedStories = (stories || []).map((story) => ({
      id: story.id,
      title: story.title || '',
      fullStory: story.full_story || '',
      situation: story.situation,
      task: story.task,
      action: story.action,
      result: story.result,
      highlights: story.highlights || [],
      skills: story.skills || [],
      experience: {
        id: story.experience?.id || '',
        title: story.experience?.title || '',
        company: story.experience?.company || '',
        location: story.experience?.location,
        dateRange: formatDateRange(
          story.experience?.start_date,
          story.experience?.end_date,
          story.experience?.current_role
        ),
        startDate: story.experience?.start_date,
        endDate: story.experience?.end_date,
        currentRole: story.experience?.current_role,
      },
    }));

    return {
      user: {
        id: userId,
        name: profile.full_name || profile.name || 'Unknown',
        email: profile.email || '',
        title: profile.title,
        location: profile.location,
        summary: profile.summary,
        phone: profile.phone,
        linkedin: profile.linkedin_url,
        portfolio: profile.portfolio_url,
      },
      stories: transformedStories,
      skills: (skills || []).map((s) => s.name),
      education: (education || []).map((e) => ({
        degree: e.degree,
        institution: e.institution,
        year: e.end_date ? new Date(e.end_date).getFullYear().toString() : undefined,
      })),
      certifications: (certifications || []).map((c) => ({
        name: c.name,
        issuer: c.issuer,
        year: c.issue_date ? new Date(c.issue_date).getFullYear().toString() : undefined,
      })),
      options,
    };
  } catch (error) {
    console.error('Error fetching TalentStory payload:', error);
    throw new Error('Failed to fetch TalentStory data');
  }
}

function formatDateRange(
  startDate?: string,
  endDate?: string,
  isCurrent?: boolean
): string {
  if (!startDate) return '';
  
  const start = new Date(startDate).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  
  if (isCurrent) return `${start} - Present`;
  
  if (!endDate) return start;
  
  const end = new Date(endDate).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  
  return `${start} - ${end}`;
}

/**
 * Extract bullet points from full story text
 */
export function extractBulletsFromStory(story: string, maxBullets = 4): string[] {
  const lines = story.split('\n').filter((line) => line.trim());
  const bullets: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      bullets.push(trimmed.replace(/^[•\-*]\s*/, ''));
    }
  }
  
  return bullets.slice(0, maxBullets);
}
