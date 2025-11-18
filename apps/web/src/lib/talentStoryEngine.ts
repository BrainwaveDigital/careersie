/**
 * TalentStory Engine
 * 
 * Uses OpenAI to transform structured profile data into a beautifully written narrative.
 * Outputs a book-like career profile with narrative summary, skill themes, timeline, etc.
 */

import OpenAI from "openai";
import { ProfileStoryInput } from "./profileStoryTypes";
import { ProfileStoryPrompt, DEFAULT_PROMPT_CONFIG } from "./profileStoryPrompt";

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * System prompt for TalentStory Engine
 * Defines the personality, format, and output structure
 */
const TALENT_STORY_SYSTEM_PROMPT = `You are the TalentStory Engine.

Your task is to transform structured user career data into a beautifully written, narrative TalentStory. The purpose is to create a visual, book-like career profile that tells someone's professional story in an engaging way.

Your output must include the following sections in this exact order:

## 1. Narrative Summary
Write 1–2 compelling paragraphs that tell the person's career story. Connect the dots between their experiences, skills, and aspirations. Make it personal and specific—avoid generic phrases.

## 2. Skill Themes
Group their skills into 3–5 thematic clusters (e.g., "Technical Excellence", "Leadership & Strategy", "Creative Problem-Solving"). For each theme, list 3-5 specific skills.

## 3. Career Timeline
Present their professional journey chronologically. For each role/milestone:
- Position and company
- Date range
- 2-3 key achievements or responsibilities (written as impact statements)

## 4. Strengths & Superpowers
Identify 5–7 unique strengths based on their experience and achievements. Write these as powerful, specific statements (e.g., "Transforms complex technical concepts into clear visual stories").

## 5. Career Highlights
Summarize 3–5 standout projects or achievements. Each should include:
- What they did
- The impact or outcome
- Why it matters

## 6. Recommended Career Directions
Based on their experience, skills, and stated goals, suggest 3–5 specific career paths or opportunities they're well-positioned for. Make these actionable and inspiring.

## Style Guidelines:
- Use a warm, professional tone
- Be specific—reference actual companies, skills, projects from their data
- Write in third person or use "their" perspective
- Avoid buzzwords and generic phrases like "results-driven" or "team player"
- Focus on impact and narrative arc
- Make it visual and engaging—this will be displayed as a beautiful story

## Format:
Use Markdown formatting with clear section headers (##). Use bullet points for lists, bold for emphasis where appropriate.`;

/**
 * Build a customized system prompt based on user preferences
 * 
 * @param promptConfig - User's customization preferences
 * @returns Tailored system prompt
 */
function buildCustomSystemPrompt(promptConfig: ProfileStoryPrompt): string {
  const { tone, includeSections, storyType, targetRole, length } = promptConfig;

  // Base introduction
  let prompt = `You are the TalentStory Engine.\n\n`;

  // Add tone guidance
  const toneGuidance: Record<ProfileStoryPrompt["tone"], string> = {
    professional: "Use a polished, corporate-appropriate tone. Be formal yet engaging.",
    personal: "Write with warmth and authenticity. Use a first-person feel and include personal touches.",
    creative: "Be bold and unique. Use vivid language and artistic expression.",
    executive: "Focus on strategic thinking and leadership. Use high-level, business-oriented language.",
    analytical: "Emphasize data, metrics, and measurable results. Be precise and fact-driven.",
    conversational: "Write in a friendly, approachable style as if talking to a colleague.",
    academic: "Use scholarly language with emphasis on research, publications, and academic contributions.",
  };

  prompt += `Tone: ${toneGuidance[tone]}\n\n`;

  // Add story type guidance
  if (storyType === "role-specific" && targetRole) {
    prompt += `Story Focus: This story is tailored for the role of "${targetRole}". Emphasize relevant skills, experiences, and achievements that align with this position.\n\n`;
  } else if (storyType === "skills") {
    prompt += `Story Focus: Emphasize technical and soft skills. Show how skills have been applied in real situations.\n\n`;
  } else if (storyType === "project") {
    prompt += `Story Focus: Center the narrative around key projects and their impact. Show problem-solving and results.\n\n`;
  } else if (storyType === "summary") {
    prompt += `Story Focus: Create a concise professional overview. Be brief but impactful.\n\n`;
  }

  // Add length guidance
  const lengthGuidance = {
    short: "Keep the story concise—aim for 500-800 words total.",
    medium: "Write a balanced story of 1000-1500 words.",
    detailed: "Write a comprehensive story of 1500-2500 words with rich detail.",
  };
  prompt += `Length: ${lengthGuidance[length || "medium"]}\n\n`;

  // Add sections to include
  prompt += `Your output must include the following sections:\n\n`;

  let sectionNumber = 1;

  if (includeSections.summary) {
    prompt += `## ${sectionNumber}. Narrative Summary\n`;
    prompt += `Write ${length === "short" ? "1 compelling paragraph" : "1–2 compelling paragraphs"} that tell the person's career story. Connect the dots between their experiences, skills, and aspirations. Make it personal and specific—avoid generic phrases.\n\n`;
    sectionNumber++;
  }

  if (includeSections.skillThemes) {
    prompt += `## ${sectionNumber}. Skill Themes\n`;
    prompt += `Group their skills into 3–5 thematic clusters (e.g., "Technical Excellence", "Leadership & Strategy"). For each theme, list 3-5 specific skills.\n\n`;
    sectionNumber++;
  }

  if (includeSections.timeline) {
    prompt += `## ${sectionNumber}. Career Timeline\n`;
    prompt += `Present their professional journey chronologically. For each role/milestone:\n`;
    prompt += `- Position and company\n`;
    prompt += `- Date range\n`;
    prompt += `- 2-3 key achievements or responsibilities (written as impact statements)\n\n`;
    sectionNumber++;
  }

  if (includeSections.strengths) {
    prompt += `## ${sectionNumber}. Strengths & Superpowers\n`;
    prompt += `Identify 5–7 unique strengths based on their experience and achievements. Write these as powerful, specific statements.\n\n`;
    sectionNumber++;
  }

  if (includeSections.highlights) {
    prompt += `## ${sectionNumber}. Career Highlights\n`;
    prompt += `Summarize 3–5 standout projects or achievements. Each should include:\n`;
    prompt += `- What they did\n`;
    prompt += `- The impact or outcome\n`;
    prompt += `- Why it matters\n\n`;
    sectionNumber++;
  }

  if (includeSections.careerPaths) {
    prompt += `## ${sectionNumber}. Recommended Career Directions\n`;
    prompt += `Based on their experience, skills, and stated goals, suggest 3–5 specific career paths or opportunities they're well-positioned for. Make these actionable and inspiring.\n\n`;
    sectionNumber++;
  }

  if (includeSections.mediaShowcase) {
    prompt += `## ${sectionNumber}. Media & Portfolio Showcase\n`;
    prompt += `Highlight their visual work, portfolios, or media content. Describe what each piece demonstrates about their capabilities.\n\n`;
    sectionNumber++;
  }

  // Style guidelines
  prompt += `## Style Guidelines:\n`;
  prompt += `- Be specific—reference actual companies, skills, projects from their data\n`;
  prompt += `- Avoid buzzwords and generic phrases\n`;
  prompt += `- Focus on impact and narrative arc\n`;
  prompt += `- Make it engaging and visual\n\n`;

  prompt += `## Format:\n`;
  prompt += `Use Markdown formatting with clear section headers (##). Use bullet points for lists, bold for emphasis where appropriate.`;

  return prompt;
}


/**
 * Generate a TalentStory narrative from structured profile data
 * 
 * @param input - Normalized profile data (ProfileStoryInput)
 * @param promptConfig - User's customization preferences (optional)
 * @param model - OpenAI model to use (default: gpt-4o)
 * @returns Generated TalentStory as markdown string
 */
export async function generateTalentStory(
  input: ProfileStoryInput,
  promptConfig: Partial<ProfileStoryPrompt> = {},
  model: string = "gpt-4o"
): Promise<string> {
  try {
    // Validate input
    if (!input.personalInfo.name) {
      throw new Error("Name is required to generate TalentStory");
    }

    if (!input.skills || input.skills.length === 0) {
      throw new Error("At least one skill is required to generate TalentStory");
    }

    if (!input.experience || input.experience.length === 0) {
      throw new Error("At least one experience is required to generate TalentStory");
    }

    // Merge with default config
    const config: ProfileStoryPrompt = {
      ...DEFAULT_PROMPT_CONFIG,
      ...promptConfig,
      includeSections: {
        ...DEFAULT_PROMPT_CONFIG.includeSections,
        ...promptConfig.includeSections,
      },
    };

    // Build customized system prompt
    const systemPrompt = buildCustomSystemPrompt(config);

    // Build user prompt with structured data
    let userPrompt = `Generate a TalentStory using the following data:\n\n`;
    userPrompt += `${JSON.stringify(input, null, 2)}\n\n`;

    // Add focus skills if specified
    if (config.focusSkills && config.focusSkills.length > 0) {
      userPrompt += `Focus Skills: Emphasize these skills in the narrative: ${config.focusSkills.join(", ")}\n\n`;
    }

    // Add media showcase if specified
    if (config.media && config.media.length > 0) {
      userPrompt += `Media to Feature:\n`;
      config.media.forEach((item, index) => {
        userPrompt += `${index + 1}. ${item.url}`;
        if (item.caption) userPrompt += ` - ${item.caption}`;
        userPrompt += `\n`;
      });
      userPrompt += `\n`;
    }

    // Add custom instructions if provided
    if (config.customPrompt) {
      userPrompt += `Additional Instructions: ${config.customPrompt}\n\n`;
    }

    userPrompt += `Important: Make this story personal and specific. Reference actual companies, projects, and achievements from the data.`;
    if (config.targetRole) {
      userPrompt += ` Tailor the narrative for the role of "${config.targetRole}".`;
    }

    // Call OpenAI API
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7, // Balance creativity with consistency
      max_tokens: config.length === "short" ? 1500 : config.length === "detailed" ? 4000 : 3000,
    });

    const story = response.choices[0]?.message?.content;

    if (!story) {
      throw new Error("OpenAI returned empty response");
    }

    return story;
  } catch (error) {
    console.error("Error generating TalentStory:", error);
    throw new Error(
      `Failed to generate TalentStory: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Regenerate TalentStory with updated data
 * Useful when user updates their profile or uploads new CV
 * 
 * @param input - Updated profile data
 * @param promptConfig - User's customization preferences (optional)
 * @param previousStory - Previous story for reference (optional)
 * @param model - OpenAI model to use
 * @returns Newly generated TalentStory
 */
export async function regenerateTalentStory(
  input: ProfileStoryInput,
  promptConfig: Partial<ProfileStoryPrompt> = {},
  previousStory?: string,
  model: string = "gpt-4o"
): Promise<string> {
  // For now, just generate fresh story
  // In future, could use previousStory to maintain tone/style
  return generateTalentStory(input, promptConfig, model);
}

/**
 * Get the system prompt (useful for testing/debugging)
 */
export function getSystemPrompt(): string {
  return TALENT_STORY_SYSTEM_PROMPT;
}
