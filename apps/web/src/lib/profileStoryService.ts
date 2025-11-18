/**
 * Example Usage of Profile Story Normalization Layer
 * 
 * This file demonstrates how to use the normalization functions
 * to convert profile data into ProfileStoryInput format.
 */

import { supabaseClient } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  normalizeProfileData,
  normalizeParsedCV,
  mergeProfileStory,
  validateProfileStory,
} from './profileStoryNormalizer';
import type { ProfileStoryInput } from './profileStoryTypes';

/**
 * Fetch and normalize profile data from database
 * @param profileId - The profile ID to fetch
 * @param supabase - Optional Supabase client (defaults to browser client)
 */
export async function getProfileStory(
  profileId: string,
  supabase: SupabaseClient = supabaseClient
): Promise<ProfileStoryInput | null> {
  try {
    // Fetch all profile-related data in parallel
    const [
      profileRes,
      experiencesRes,
      educationRes,
      skillsRes,
      mediaRes,
      reflectionRes,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single(),
      supabase
        .from('experiences')
        .select('*')
        .eq('profile_id', profileId)
        .order('order_index', { ascending: true }),
      supabase
        .from('education')
        .select('*')
        .eq('profile_id', profileId)
        .order('start_year', { ascending: false }),
      supabase.from('skills').select('*').eq('profile_id', profileId),
      supabase
        .from('media_library')
        .select('*')
        .eq('profile_id', profileId),
      supabase
        .from('self_reflection')
        .select('*')
        .eq('profile_id', profileId)
        .single(),
    ]);

    if (profileRes.error || !profileRes.data) {
      console.error('Error fetching profile:', profileRes.error);
      return null;
    }

    // Get public URLs for media
    const mediaWithUrls = await Promise.all(
      (mediaRes.data || []).map(async (item: any) => {
        const { data: signedData } = await supabase.storage
          .from(item.storage_bucket)
          .createSignedUrl(item.storage_path, 3600);

        return {
          ...item,
          publicUrl: signedData?.signedUrl || null,
        };
      })
    );

    // Normalize into ProfileStoryInput format
    const profileStory = normalizeProfileData(
      profileRes.data,
      experiencesRes.data || [],
      educationRes.data || [],
      skillsRes.data || [],
      mediaWithUrls,
      reflectionRes.data || undefined
    );

    return profileStory;
  } catch (error) {
    console.error('Error getting profile story:', error);
    return null;
  }
}

/**
 * Create ProfileStoryInput from parsed CV data
 */
export function createProfileStoryFromCV(
  parsedCVData: any
): ProfileStoryInput {
  return normalizeParsedCV(parsedCVData);
}

/**
 * Merge parsed CV data with existing profile data
 * Useful when updating a profile with new CV data
 */
export async function mergeCVWithProfile(
  profileId: string,
  parsedCVData: any
): Promise<ProfileStoryInput | null> {
  // Get existing profile data
  const existingStory = await getProfileStory(profileId);
  if (!existingStory) return null;

  // Normalize new CV data
  const cvStory = normalizeParsedCV(parsedCVData);

  // Merge, preferring CV data for most fields but keeping reflection data
  const merged = mergeProfileStory(cvStory, {
    careerGoals: existingStory.careerGoals, // Keep existing goals
    media: existingStory.media, // Keep existing media
  });

  return merged;
}

/**
 * Validate and get errors for profile story data
 */
export function getProfileStoryErrors(
  data: ProfileStoryInput
): { isValid: boolean; errors: string[] } {
  const errors = validateProfileStory(data);
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Example: Convert profile data for AI processing or CV generation
 */
export function formatProfileStoryForAI(
  profileStory: ProfileStoryInput
): string {
  let formatted = `# ${profileStory.personalInfo.name}\n`;

  if (profileStory.personalInfo.title) {
    formatted += `${profileStory.personalInfo.title}\n`;
  }

  if (profileStory.personalInfo.location) {
    formatted += `Location: ${profileStory.personalInfo.location}\n`;
  }

  formatted += '\n## Summary\n';
  formatted += profileStory.summary || 'No summary provided';

  formatted += '\n\n## Skills\n';
  formatted += profileStory.skills.join(', ');

  formatted += '\n\n## Experience\n';
  profileStory.experience.forEach((exp) => {
    formatted += `\n### ${exp.title} at ${exp.company}\n`;
    formatted += `${exp.startDate} - ${exp.endDate || 'Present'}\n`;
    if (exp.responsibilities) {
      formatted += '\n**Responsibilities:**\n';
      exp.responsibilities.forEach((resp) => {
        formatted += `- ${resp}\n`;
      });
    }
    if (exp.achievements) {
      formatted += '\n**Achievements:**\n';
      exp.achievements.forEach((ach) => {
        formatted += `- ${ach}\n`;
      });
    }
  });

  if (profileStory.education && profileStory.education.length > 0) {
    formatted += '\n\n## Education\n';
    profileStory.education.forEach((edu) => {
      formatted += `\n### ${edu.degree}\n`;
      formatted += `${edu.institution}`;
      if (edu.year) {
        formatted += ` (${edu.year})`;
      }
      formatted += '\n';
    });
  }

  if (profileStory.careerGoals && profileStory.careerGoals.length > 0) {
    formatted += '\n\n## Career Goals\n';
    profileStory.careerGoals.forEach((goal) => {
      formatted += `- ${goal}\n`;
    });
  }

  return formatted;
}
