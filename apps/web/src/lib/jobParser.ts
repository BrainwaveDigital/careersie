import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

// Define the structured output schema for parsed job data
const jobParserSchema = z.object({
  role: z.string().describe('The job title/role'),
  seniority: z.string().describe('Seniority level: Junior, Mid, Senior, Lead, Principal, etc.'),
  hard_skills: z.array(z.string()).describe('Technical skills required (e.g., Java, React, SQL)'),
  soft_skills: z.array(z.string()).describe('Soft skills (e.g., communication, leadership, teamwork)'),
  tools: z.array(z.string()).describe('Tools and technologies (e.g., Git, Docker, AWS)'),
  responsibilities: z.array(z.string()).describe('Key responsibilities and duties'),
  requirements: z.array(z.string()).describe('Required qualifications and experience'),
  keywords: z.array(z.string()).describe('Important keywords from the job description'),
  nice_to_have: z.array(z.string()).describe('Nice-to-have skills or qualifications'),
});

export type ParsedJobData = z.infer<typeof jobParserSchema>;

// Initialize the structured output parser
const parser = StructuredOutputParser.fromZodSchema(jobParserSchema);

/**
 * Parse a job description using GPT-4 and extract structured data
 */
export async function parseJobDescription(jobDescription: string): Promise<ParsedJobData> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Initialize the LLM
  const model = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.3,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Get format instructions from the parser
  const formatInstructions = parser.getFormatInstructions();

  // Create the prompt template
  const prompt = new PromptTemplate({
    template: `You are an expert job description analyzer. Parse the following job description and extract structured information.

Job Description:
{job_description}

Extract and categorize all relevant information. Be thorough and accurate.

{format_instructions}`,
    inputVariables: ['job_description'],
    partialVariables: { format_instructions: formatInstructions },
  });

  // Format the prompt with the job description
  const input = await prompt.format({ job_description: jobDescription });

  // Call the model
  const response = await model.invoke(input);

  // Parse the response
  const parsedData = await parser.parse(response.content as string);

  return parsedData;
}

/**
 * Extract keywords from a job description (simplified version)
 * This extracts unique keywords from the parsed data
 */
export function extractKeywords(parsedData: ParsedJobData): string[] {
  const allKeywords = [
    ...parsedData.hard_skills,
    ...parsedData.soft_skills,
    ...parsedData.tools,
    ...parsedData.keywords,
  ];

  // Remove duplicates and normalize
  const uniqueKeywords = Array.from(
    new Set(allKeywords.map((k) => k.toLowerCase().trim()))
  );

  return uniqueKeywords;
}
