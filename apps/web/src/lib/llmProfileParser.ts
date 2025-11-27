import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

// Define the structured output schema for parsed profile data
export const profileParserSchema = z.object({
  profile: z.object({
    full_name: z.string().optional(),
    display_name: z.string().optional(),
    preferred_name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    headline: z.string().optional(),
    summary: z.string().optional(),
    about: z.string().optional(),
    location: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  experiences: z.array(z.object({
    title: z.string().optional(),
    company: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    institution: z.string().optional(),
    degree: z.string().optional(),
    field_of_study: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  skills: z.array(z.string()).optional(),
});

export type ParsedProfileData = z.infer<typeof profileParserSchema>;

const parser = StructuredOutputParser.fromZodSchema(profileParserSchema);

/**
 * Parse a CV/resume using GPT-4 and extract structured profile data
 */
export async function parseProfileFromText(cvText: string): Promise<ParsedProfileData> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const model = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.2,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const formatInstructions = parser.getFormatInstructions();

  const prompt = new PromptTemplate({
    template: `You are an expert CV/resume parser. Extract the following structured information from the provided CV/resume text. Be thorough and accurate.\n\nCV/Resume Text:\n{cv_text}\n\nExtract and categorize all relevant information.\n\n{format_instructions}`,
    inputVariables: ['cv_text'],
    partialVariables: { format_instructions: formatInstructions },
  });

  const input = await prompt.format({ cv_text: cvText });
  const response = await model.invoke(input);
  const parsedData = await parser.parse(response.content as string);
  return parsedData;
}
