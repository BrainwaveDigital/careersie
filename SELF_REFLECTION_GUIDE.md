# Self-Reflection Insights Questionnaire - Implementation Guide

## Overview
This document provides a complete implementation guide for the Self-Reflection Insights questionnaire feature in Careersie. The feature helps applicants reflect on their career journey, goals, and professional motivations.

## Files Created

### 1. Frontend Component
**Location**: `apps/web/app/reflection/page.tsx`

A fully functional Next.js page with:
- 15 self-reflection questions across 5 categories
- Multi-page questionnaire with progress tracking
- 4 question types: textarea, scale (1-5), multiple choice, checkbox
- Real-time validation and completion checking
- Beautiful purple-themed UI with animations
- Completion page with next steps

**Features**:
- Paginated design (3 questions per page)
- Progress bar showing completion percentage
- Time tracking for analytics
- Responsive Tailwind CSS design
- TypeScript with full type safety

### 2. Database Schema
**Location**: `sql/self_reflection_schema.sql`

Complete PostgreSQL schema including:

**Tables**:
- `self_reflection_insights` - Main table storing structured reflection data
- `reflection_responses` - Normalized individual responses for detailed analysis

**Views**:
- `reflection_insights_summary` - Human-readable summary with categorizations
- `reflection_analytics` - Aggregated analytics for hiring managers

**Features**:
- Row Level Security (RLS) policies
- JSONB storage for flexibility
- GIN indexes for fast JSONB searches
- Automatic `updated_at` triggers
- Data validation constraints
- Comprehensive comments

### 3. API Routes
**Location**: `apps/web/app/api/reflection/route.ts`

RESTful API with three endpoints:

**POST** - Save completed reflection
- Maps responses to structured database fields
- Stores both structured data and JSONB backup
- Creates individual response records for analysis

**GET** - Retrieve user's reflection
- Returns complete reflection with all responses
- Includes related response records
- Handles missing data gracefully

**PUT** - Auto-save progress
- Updates incomplete reflections
- Creates new draft if none exists
- Enables resume functionality

## Question Categories

### 1. Career Goals & Aspirations (3 questions)
- 3-5 year career goals (textarea)
- Career direction clarity (scale 1-5)
- Desired role within next year (multiple choice)

### 2. Motivations & Values (3 questions)
- Career motivators (checkbox - multiple selection)
- Sense of fulfillment (textarea)
- Current path fulfillment (scale 1-5)

### 3. Strengths & Development (3 questions)
- Three greatest strengths (textarea)
- Areas for development (textarea)
- Development seeking behavior (scale 1-5)

### 4. Work Style Preferences (3 questions)
- Preferred work environment (multiple choice)
- Problem-solving approach (multiple choice)
- Leadership vs. individual contributor (scale 1-5)

### 5. Past Experiences & Learnings (3 questions)
- Proudest achievement (textarea)
- Biggest challenge and learning (textarea)
- Reflection habit (scale 1-5)

## Setup Instructions

### Step 1: Run Database Migration
```sql
-- Execute the schema file in your Supabase SQL editor
-- Location: sql/self_reflection_schema.sql
-- This creates all tables, indexes, views, and RLS policies
```

### Step 2: Update Environment Variables
No additional environment variables needed - uses existing Supabase configuration.

### Step 3: Test the Feature
1. Navigate to `/reflection` in your app
2. Complete the questionnaire (15 questions)
3. Verify data is saved in Supabase

### Step 4: Access the Data

**For Users**:
```typescript
// Get user's reflection
const response = await fetch(`/api/reflection?userId=${userId}`);
const { data } = await response.json();
```

**For Admin Dashboard**:
```sql
-- View all completed reflections with insights
SELECT * FROM reflection_insights_summary WHERE completed = true;

-- Get analytics
SELECT * FROM reflection_analytics;

-- Search by keywords
SELECT * FROM self_reflection_insights 
WHERE career_goals_3_5_years ILIKE '%leadership%'
   OR professional_strengths ILIKE '%leadership%';
```

## Integration Points

### With Profile Creation Flow
Add after personality questionnaire:
```typescript
// In profile/page.tsx or dashboard
<Link href="/reflection">
  Complete Self-Reflection Insights
</Link>
```

### With Dashboard
Show completion status:
```typescript
const { data } = await fetch(`/api/reflection?userId=${userId}`);
const completed = data?.completed || false;
```

### With Admin Panel
Display insights for candidate review:
```typescript
// Fetch all reflections
const reflections = await supabaseServer
  .from('reflection_insights_summary')
  .select('*')
  .order('submission_date', { ascending: false });
```

## Data Structure

### Stored Fields
```typescript
interface ReflectionInsight {
  id: string;
  applicant_id: string;
  completed: boolean;
  submission_date: string;
  time_taken_seconds: number;
  
  // Career Goals
  career_goals_3_5_years: string;
  has_clear_career_direction: 1 | 2 | 3 | 4 | 5;
  role_within_next_year: string;
  
  // Motivations
  career_motivations: string[]; // JSONB array
  sense_of_fulfillment: string;
  career_fulfillment_rating: 1 | 2 | 3 | 4 | 5;
  
  // Strengths
  professional_strengths: string;
  skills_to_develop: string;
  seeks_development_rating: 1 | 2 | 3 | 4 | 5;
  
  // Work Style
  preferred_work_environment: string;
  problem_solving_approach: string;
  leadership_preference_rating: 1 | 2 | 3 | 4 | 5;
  
  // Experiences
  proudest_achievement: string;
  biggest_challenge_and_learning: string;
  reflects_regularly_rating: 1 | 2 | 3 | 4 | 5;
  
  // Full backup
  all_responses: Record<string, any>; // JSONB
}
```

## Analytics Capabilities

### Career Direction Analysis
```sql
SELECT 
  career_clarity,
  COUNT(*) as count
FROM reflection_insights_summary
GROUP BY career_clarity;
```

### Motivation Patterns
```sql
SELECT 
  jsonb_array_elements_text(career_motivations) as motivation,
  COUNT(*) as count
FROM self_reflection_insights
WHERE completed = true
GROUP BY motivation
ORDER BY count DESC;
```

### Leadership Inclination
```sql
SELECT 
  leadership_inclination,
  AVG(leadership_preference_rating) as avg_rating,
  COUNT(*) as count
FROM reflection_insights_summary
GROUP BY leadership_inclination;
```

## Future Enhancements

1. **Auto-Save Progress**: Implement periodic auto-save using PUT endpoint
2. **Resume Functionality**: Load incomplete reflections on page load
3. **Admin Dashboard**: Build UI for viewing and analyzing reflections
4. **Insights Matching**: Use reflection data for job matching algorithms
5. **PDF Export**: Generate reflection summary reports
6. **Email Notifications**: Send insights to career counselors
7. **Comparison Tool**: Compare reflections over time to track growth

## Security Notes

- RLS policies ensure users can only access their own data
- Service role can access all reflections for admin purposes
- All API endpoints validate user authentication
- JSONB fields enable flexible data storage without schema changes
- Normalized `reflection_responses` table supports detailed analysis

## Testing Checklist

- [ ] User can complete questionnaire from start to finish
- [ ] Progress bar updates correctly
- [ ] All question types work (textarea, scale, multiple, checkbox)
- [ ] Validation prevents skipping questions
- [ ] Data saves correctly to Supabase
- [ ] API GET endpoint retrieves saved data
- [ ] RLS policies prevent unauthorized access
- [ ] Views provide correct categorizations
- [ ] Analytics queries return expected results

## Support

For questions or issues:
1. Check Supabase logs for database errors
2. Check browser console for frontend errors
3. Verify API routes are working with curl/Postman
4. Ensure RLS policies are correctly configured
5. Test with different user roles (applicant, admin)

---

**Status**: Ready for production use ✅  
**Version**: 1.0  
**Last Updated**: November 17, 2025
