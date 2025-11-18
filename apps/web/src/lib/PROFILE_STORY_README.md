# Profile Story Normalization Layer

## Overview

The Profile Story Normalization Layer provides a standardized way to work with talent/profile data across the Careersie platform. It converts data from various sources (database, parsed CVs, manual input) into a single, consistent `ProfileStoryInput` format.

## Why Normalization?

- **Consistency**: All profile data follows the same structure regardless of source
- **Type Safety**: Full TypeScript support with clear interfaces
- **Flexibility**: Easy to add new data sources or fields
- **Maintainability**: Single source of truth for data structure
- **AI-Ready**: Clean format for LLM processing and CV generation

## Core Interface

```typescript
interface ProfileStoryInput {
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
```

## Files Structure

```
src/lib/
├── profileStoryTypes.ts       # TypeScript interfaces
├── profileStoryNormalizer.ts  # Normalization functions
└── profileStoryService.ts     # Service layer with examples
```

## Usage Examples

### 1. Fetch and Normalize Profile Data

```typescript
import { getProfileStory } from '@/lib/profileStoryService';

// Get normalized profile data
const profileStory = await getProfileStory(profileId);

if (profileStory) {
  console.log('Name:', profileStory.personalInfo.name);
  console.log('Skills:', profileStory.skills);
  console.log('Experience:', profileStory.experience);
}
```

### 2. Normalize Parsed CV Data

```typescript
import { createProfileStoryFromCV } from '@/lib/profileStoryService';

// After parsing a CV
const parsedData = await parseCV(file);
const profileStory = createProfileStoryFromCV(parsedData);
```

### 3. Merge CV with Existing Profile

```typescript
import { mergeCVWithProfile } from '@/lib/talentStoryService';

// Update profile with new CV data, keeping existing reflection/media
const updatedStory = await mergeCVWithProfile(profileId, parsedCVData);
```

### 4. Validate Data

```typescript
import { getProfileStoryErrors } from '@/lib/profileStoryService';

const { isValid, errors } = getProfileStoryErrors(profileStory);

if (!isValid) {
  console.error('Validation errors:', errors);
}
```

### 5. Format for AI Processing

```typescript
import { formatProfileStoryForAI } from '@/lib/profileStoryService';

// Convert to markdown format for LLM
const markdown = formatProfileStoryForAI(profileStory);
```

## Direct Normalization Functions

### From Database

```typescript
import { normalizeProfileData } from '@/lib/profileStoryNormalizer';

const profileStory = normalizeProfileData(
  profile,
  experiences,
  education,
  skills,
  media,
  reflection
);
```

### From Parsed CV

```typescript
import { normalizeParsedCV } from '@/lib/profileStoryNormalizer';

const profileStory = normalizeParsedCV(parsedCVData);
```

### Merge Multiple Sources

```typescript
import { mergeProfileStory } from '@/lib/profileStoryNormalizer';

const merged = mergeProfileStory(
  baseProfileStory,
  { skills: additionalSkills },
  { careerGoals: goalsFromReflection }
);
```

## Integration Points

### 1. Profile Page
Display normalized data:
```typescript
const profileStory = await getProfileStory(profileId);
// Use profileStory.experience, profileStory.education, etc.
```

### 2. CV Generation
```typescript
const profileStory = await getProfileStory(profileId);
const cvMarkdown = formatProfileStoryForAI(profileStory);
// Send to AI for CV generation
```

### 3. CV Upload/Parsing
```typescript
// After parsing
const profileStory = createProfileStoryFromCV(parsedData);

// Validate before saving
const { isValid, errors } = getProfileStoryErrors(profileStory);
if (isValid) {
  // Save to database
}
```

### 4. Profile Updates
```typescript
// Merge new data with existing
const existingStory = await getProfileStory(profileId);
const updated = mergeProfileStory(existingStory, {
  skills: newSkills,
  summary: newSummary
});
```

## Data Transformation Examples

### Experience with Responsibilities

```typescript
// Input: Description text
"Led team of 5 developers\nImplemented CI/CD pipeline\nReduced deployment time by 50%"

// Output: Structured data
{
  title: "Senior Developer",
  company: "Tech Corp",
  startDate: "2020-01",
  endDate: "2023-12",
  responsibilities: [
    "Led team of 5 developers",
    "Implemented CI/CD pipeline",
    "Reduced deployment time by 50%"
  ]
}
```

### Media Normalization

```typescript
// Input: Database media record
{
  file_type: "image",
  storage_path: "profile/image.jpg",
  title: "Portfolio Screenshot",
  publicUrl: "https://..."
}

// Output: ProfileStoryInput media
{
  type: "image",
  url: "https://...",
  caption: "Portfolio Screenshot"
}
```

### Career Goals from Reflection

```typescript
// Input: Reflection data
{
  career_goals: ["Become a tech lead", "Launch startup"],
  long_term_vision: "Build products that matter"
}

// Output: Merged goals
careerGoals: [
  "Become a tech lead",
  "Launch startup",
  "Build products that matter"
]
```

## Validation Rules

The normalization layer includes validation:

- **Required**: `personalInfo.name`, `skills[]`, `experience[]`
- **Experience**: Each must have `title`, `company`, `startDate`
- **Skills**: At least one skill required
- **Type Safety**: All fields must match interface types

```typescript
const errors = validateProfileStory(profileStory);
// Returns: ["Name is required", "At least one skill is required", ...]
```

## Extension Points

### Adding New Fields

1. Update `ProfileStoryInput` interface in `profileStoryTypes.ts`
2. Update normalization functions in `profileStoryNormalizer.ts`
3. Update merge logic if needed

### Adding New Data Sources

Create a new normalization function:

```typescript
export function normalizeLinkedInData(linkedInProfile: any): ProfileStoryInput {
  return {
    personalInfo: { name: linkedInProfile.fullName, ... },
    skills: linkedInProfile.skills,
    // ... map other fields
  };
}
```

## Best Practices

1. **Always use normalization functions** - Don't manually construct `ProfileStoryInput`
2. **Validate before saving** - Use `validateProfileStory()`
3. **Merge thoughtfully** - Use `mergeProfileStory()` to combine sources
4. **Handle missing data** - All optional fields should have fallbacks
5. **Type everything** - Leverage TypeScript for safety

## Testing

```typescript
// Example test
const mockProfile = { full_name: "John Doe", ... };
const mockExperiences = [{ title: "Developer", ... }];
const mockSkills = [{ skill: "TypeScript" }];

const result = normalizeProfileData(
  mockProfile,
  mockExperiences,
  [],
  mockSkills,
  [],
  undefined
);

expect(result.personalInfo.name).toBe("John Doe");
expect(result.skills).toContain("TypeScript");
```

## Future Enhancements

- [ ] Add `projects` normalization from database
- [ ] Support for portfolio URLs as media type
- [ ] Extract achievements from experience descriptions using AI
- [ ] Add caching layer for frequently accessed profiles
- [ ] Support for LinkedIn/GitHub profile imports
- [ ] Add data enrichment from external APIs

## API Reference

See inline documentation in:
- `profileStoryTypes.ts` - Interface definitions
- `profileStoryNormalizer.ts` - Core functions
- `profileStoryService.ts` - Service layer examples
