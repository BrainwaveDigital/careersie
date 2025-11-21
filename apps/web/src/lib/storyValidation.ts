/**
 * Validation schemas for Story API endpoints
 * Using Zod for type-safe request validation
 */

import { z } from 'zod';

// ============================================
// Story CRUD Schemas
// ============================================

export const createStorySchema = z.object({
  experience_id: z.string().uuid('Invalid experience ID'),
  skill_ids: z.array(z.string().uuid()).optional(),
  title: z.string().max(255).optional(),
  situation: z.string().optional(),
  task: z.string().optional(),
  action: z.string().optional(),
  result: z.string().optional(),
});

export const updateStorySchema = z.object({
  situation: z.string().optional(),
  task: z.string().optional(),
  action: z.string().optional(),
  result: z.string().optional(),
  full_story: z.string().optional(),
  metrics: z.object({
    numbers: z.array(z.string()),
    keywords: z.array(z.string()),
  }).optional(),
  title: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
  is_draft: z.boolean().optional(),
  skill_ids: z.array(z.string().uuid()).optional(),
  autosave: z.boolean().optional().default(false),
});

export const generateStorySchema = z.object({
  experience_id: z.string().uuid('Invalid experience ID'),
  bullets: z.array(z.string().min(1, 'Bullet point cannot be empty'))
    .min(1, 'At least one bullet point required')
    .max(20, 'Maximum 20 bullet points'),
  notes: z.string().max(1000).optional(),
  skill_ids: z.array(z.string().uuid()).optional(),
});

export const createVersionSchema = z.object({
  story_id: z.string().uuid('Invalid story ID'),
  change_summary: z.string().max(500).optional(),
});

// ============================================
// Type Inference from Schemas
// ============================================

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
export type GenerateStoryInput = z.infer<typeof generateStorySchema>;
export type CreateVersionInput = z.infer<typeof createVersionSchema>;

// ============================================
// Validation Helper
// ============================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }
    return { success: false, error: 'Invalid request data' };
  }
}
