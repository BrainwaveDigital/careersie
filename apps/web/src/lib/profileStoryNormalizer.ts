/**
 * Normalization Layer for Profile Story
 * 
 * Converts data from various sources (database, parsed CV, manual input)
 * into the standardized ProfileStoryInput format.
 */

import type {
  ProfileStoryInput,
  ProfileData,
  ExperienceData,
  EducationData,
  SkillData,
  MediaData,
  ReflectionData,
} from './profileStoryTypes';

/**
 * Normalize profile data from Supabase into ProfileStoryInput format
 */
export function normalizeProfileData(
  profile: ProfileData,
  experiences: ExperienceData[],
  education: EducationData[],
  skills: SkillData[],
  media: MediaData[],
  reflection?: ReflectionData
): ProfileStoryInput {
  return {
    personalInfo: {
      name: profile.full_name || 'Unknown',
      title: profile.headline,
      location: profile.location,
    },
    summary: profile.summary,
    skills: skills.map((s) => s.skill),
    experience: normalizeExperiences(experiences),
    education: normalizeEducation(education),
    media: normalizeMedia(media),
    careerGoals: normalizeCareerGoals(reflection),
  };
}

/**
 * Normalize experience data
 */
function normalizeExperiences(
  experiences: ExperienceData[]
): ProfileStoryInput['experience'] {
  return experiences
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    .map((exp) => ({
      title: exp.title || 'Unknown Position',
      company: exp.company || 'Unknown Company',
      startDate: exp.start_date || '',
      endDate: exp.is_current ? undefined : exp.end_date,
      responsibilities: exp.description
        ? parseResponsibilities(exp.description)
        : undefined,
      achievements: undefined, // Can be extracted from description if needed
    }));
}

/**
 * Parse responsibilities from description text
 * Splits by bullet points, newlines, or common delimiters
 */
function parseResponsibilities(description: string): string[] {
  // Split by bullet points, dashes, or newlines
  const lines = description
    .split(/[\n•\-\*]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.length > 1 ? lines : [description];
}

/**
 * Normalize education data
 */
function normalizeEducation(
  education: EducationData[]
): ProfileStoryInput['education'] {
  return education.map((edu) => ({
    institution: edu.school || 'Unknown Institution',
    degree: edu.degree
      ? edu.field_of_study
        ? `${edu.degree} in ${edu.field_of_study}`
        : edu.degree
      : 'Unknown Degree',
    year: edu.end_year || edu.start_year,
  }));
}

/**
 * Normalize media data
 */
function normalizeMedia(media: MediaData[]): ProfileStoryInput['media'] {
  return media
    .filter((m) => m.file_type === 'image' || m.file_type === 'video')
    .map((m) => ({
      type: m.file_type === 'image' ? 'image' : 'video',
      url: m.publicUrl || '',
      caption: m.title || m.description,
    }));
}

/**
 * Normalize career goals from reflection data
 */
function normalizeCareerGoals(
  reflection?: ReflectionData
): string[] | undefined {
  if (!reflection) return undefined;

  const goals: string[] = [];

  // Handle career_goals (can be string or array)
  if (reflection.career_goals) {
    if (Array.isArray(reflection.career_goals)) {
      goals.push(...reflection.career_goals);
    } else if (typeof reflection.career_goals === 'string') {
      goals.push(reflection.career_goals);
    }
  }

  // Add long-term vision if available
  if (reflection.long_term_vision) {
    goals.push(reflection.long_term_vision);
  }

  return goals.length > 0 ? goals : undefined;
}

/**
 * Normalize parsed CV data from the parsing service
 */
export function normalizeParsedCV(parsedData: any): ProfileStoryInput {
  return {
    personalInfo: {
      name: parsedData.full_name || parsedData.name || 'Unknown',
      title: parsedData.headline || parsedData.title,
      location: parsedData.location,
    },
    summary: parsedData.summary,
    skills:
      parsedData.skills?.map((s: any) =>
        typeof s === 'string' ? s : s.skill || s.name
      ) || [],
    experience:
      parsedData.experiences?.map((exp: any) => ({
        title: exp.title || exp.role || 'Unknown Position',
        company: exp.company || 'Unknown Company',
        startDate: exp.start_date || exp.startDate || '',
        endDate: exp.is_current ? undefined : exp.end_date || exp.endDate,
        responsibilities: exp.description
          ? parseResponsibilities(exp.description)
          : undefined,
        achievements: exp.achievements,
      })) || [],
    education:
      parsedData.education?.map((edu: any) => ({
        institution: edu.school || edu.institution || 'Unknown Institution',
        degree: edu.degree || 'Unknown Degree',
        year: edu.end_year || edu.year,
      })) || [],
    media: undefined, // Media not typically in parsed CV
    careerGoals: undefined, // Goals not in CV, comes from reflection
  };
}

/**
 * Merge multiple ProfileStoryInput objects
 * Useful for combining parsed CV data with profile data
 */
export function mergeProfileStory(
  base: ProfileStoryInput,
  ...sources: Partial<ProfileStoryInput>[]
): ProfileStoryInput {
  const merged = { ...base };

  for (const source of sources) {
    // Merge personal info
    if (source.personalInfo) {
      merged.personalInfo = {
        ...merged.personalInfo,
        ...source.personalInfo,
      };
    }

    // Use source summary if available
    if (source.summary) {
      merged.summary = source.summary;
    }

    // Merge and deduplicate skills
    if (source.skills) {
      const allSkills = [...merged.skills, ...source.skills];
      merged.skills = Array.from(new Set(allSkills));
    }

    // Merge experiences
    if (source.experience) {
      merged.experience = [...merged.experience, ...source.experience];
    }

    // Merge education
    if (source.education) {
      merged.education = [
        ...(merged.education || []),
        ...source.education,
      ];
    }

    // Merge media
    if (source.media) {
      merged.media = [...(merged.media || []), ...source.media];
    }

    // Merge career goals
    if (source.careerGoals) {
      merged.careerGoals = [
        ...(merged.careerGoals || []),
        ...source.careerGoals,
      ];
    }
  }

  return merged;
}

/**
 * Validate ProfileStoryInput data
 * Returns array of validation errors, empty if valid
 */
export function validateProfileStory(data: ProfileStoryInput): string[] {
  const errors: string[] = [];

  // Required fields
  if (!data.personalInfo.name || data.personalInfo.name === 'Unknown') {
    errors.push('Name is required');
  }

  if (!data.skills || data.skills.length === 0) {
    errors.push('At least one skill is required');
  }

  if (!data.experience || data.experience.length === 0) {
    errors.push('At least one work experience is required');
  }

  // Validate experience entries
  data.experience.forEach((exp, index) => {
    if (!exp.title || exp.title === 'Unknown Position') {
      errors.push(`Experience ${index + 1}: Title is required`);
    }
    if (!exp.company || exp.company === 'Unknown Company') {
      errors.push(`Experience ${index + 1}: Company is required`);
    }
    if (!exp.startDate) {
      errors.push(`Experience ${index + 1}: Start date is required`);
    }
  });

  return errors;
}
