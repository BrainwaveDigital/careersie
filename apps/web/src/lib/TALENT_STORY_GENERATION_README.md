# TalentStory Generation System

## Overview

The TalentStory system transforms structured profile data into beautifully written narrative stories using OpenAI. It creates book-like career profiles that tell someone's professional journey in an engaging way.

## Architecture

```
┌─────────────────────┐
│  Profile Data       │
│  (Database/CV)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ProfileStoryInput  │ ← Normalization Layer
│  (Standardized)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  TalentStory Engine │ ← OpenAI GPT-4o
│  (Narrative Gen)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  talent_stories     │ ← Database Storage
│  (Versioned)        │
└─────────────────────┘
```

## Components

### 1. ProfileStoryInput Interface
**File**: `src/lib/profileStoryTypes.ts`

Standardized data structure for all profile data:
```typescript
interface ProfileStoryInput {
  personalInfo: { name, title?, location? }
  summary?: string
  skills: string[]
  experience: [...]
  projects?: [...]
  education?: [...]
  media?: [...]
  careerGoals?: string[]
}
```

### 2. TalentStory Engine
**File**: `src/lib/talentStoryEngine.ts`

OpenAI-powered narrative generation:
- `generateTalentStory(input, model?)` - Generate new story
- `regenerateTalentStory(input, previousStory?, model?)` - Regenerate with updates
- `getSystemPrompt()` - View system prompt

**System Prompt Structure:**
1. Narrative Summary (1-2 paragraphs)
2. Skill Themes (3-5 clusters)
3. Career Timeline (chronological)
4. Strengths & Superpowers (5-7 items)
5. Career Highlights (3-5 standout projects)
6. Recommended Career Directions (3-5 paths)

### 3. Database Schema
**File**: `sql/migrations/20251118_create_talent_stories_up.sql`

```sql
talent_stories {
  id: UUID
  user_id: UUID (references auth.users)
  story: TEXT (markdown)
  data: JSONB (source ProfileStoryInput)
  model: VARCHAR(50)
  version: INTEGER
  is_active: BOOLEAN
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

**Features:**
- Version tracking for regeneration
- JSONB storage of source data
- RLS policies (user-owned access)
- Automatic timestamps
- Active story tracking

### 4. API Endpoints
**File**: `app/api/talent-story/generate/route.ts`

#### POST `/api/talent-story/generate`
Generate new TalentStory for authenticated user.

**Request:**
```json
{
  "profileId": "uuid (optional)",
  "model": "gpt-4o (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "story": {
    "id": "uuid",
    "story": "markdown content",
    "data": { /* ProfileStoryInput */ },
    "created_at": "timestamp"
  }
}
```

#### GET `/api/talent-story/generate`
Retrieve active TalentStory for authenticated user.

**Response:**
```json
{
  "success": true,
  "story": { /* full story object */ }
}
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd apps/web
pnpm install
```

This will install `openai` package (v4.75.0).

### 2. Configure Environment Variables
Add to `apps/web/.env.local`:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

Get your API key from: https://platform.openai.com/api-keys

### 3. Run Database Migration
```sql
-- Apply the migration in Supabase SQL Editor
-- File: sql/migrations/20251118_create_talent_stories_up.sql
```

Or via CLI:
```bash
supabase db push
```

### 4. Verify Setup
Check that:
- ✅ `openai` package is installed
- ✅ `OPENAI_API_KEY` is in `.env.local`
- ✅ `talent_stories` table exists in database
- ✅ RLS policies are enabled

## Usage Examples

### Generate TalentStory from Profile

```typescript
// In your component or API route
import { getProfileStory } from '@/lib/profileStoryService';
import { generateTalentStory } from '@/lib/talentStoryEngine';
import { supabaseServer } from '@/lib/supabase';

async function generateStory(userId: string) {
  // 1. Get profile ID
  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  // 2. Get normalized data
  const profileStory = await getProfileStory(profile.id);

  // 3. Generate narrative
  const story = await generateTalentStory(profileStory);

  // 4. Save to database
  const { data } = await supabaseServer
    .from('talent_stories')
    .insert({
      user_id: userId,
      story,
      data: profileStory,
    })
    .select()
    .single();

  return data;
}
```

### Call from Frontend

```typescript
// Client-side component
async function handleGenerate() {
  const response = await fetch('/api/talent-story/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o', // optional
    }),
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Story generated:', result.story);
  }
}
```

### Retrieve Active Story

```typescript
// Get user's current TalentStory
const response = await fetch('/api/talent-story/generate');
const { story } = await response.json();

// Display markdown content
<ReactMarkdown>{story.story}</ReactMarkdown>
```

## Features

### ✅ Implemented
- [x] ProfileStoryInput interface (normalized data model)
- [x] TalentStory Engine with OpenAI integration
- [x] System prompt with 6-section output structure
- [x] Database schema with versioning
- [x] RLS policies for secure access
- [x] API endpoints (generate + retrieve)
- [x] Error handling and validation
- [x] Automatic version tracking

### 🚧 Future Enhancements
- [ ] PDF export of TalentStory
- [ ] Custom theming/styling options
- [ ] Multi-language support
- [ ] Voice narration
- [ ] Interactive timeline visualization
- [ ] Share link generation
- [ ] Story regeneration with style preservation
- [ ] A/B testing different prompts
- [ ] Analytics (views, shares, downloads)

## Configuration

### OpenAI Model Options
- **gpt-4o** (default) - Balanced cost/quality
- **gpt-4o-mini** - Faster, cheaper
- **gpt-4-turbo** - Higher quality, slower

Update model in API call:
```typescript
fetch('/api/talent-story/generate', {
  method: 'POST',
  body: JSON.stringify({ model: 'gpt-4o-mini' })
})
```

### Temperature Settings
Default: 0.7 (balance creativity with consistency)

Adjust in `talentStoryEngine.ts`:
```typescript
temperature: 0.7, // 0.0 = deterministic, 1.0 = creative
```

### Token Limits
Default: 3000 tokens (~2250 words)

Adjust in `talentStoryEngine.ts`:
```typescript
max_tokens: 3000,
```

## Error Handling

Common errors and solutions:

### 1. "OPENAI_API_KEY is missing"
**Solution**: Add to `.env.local` and restart dev server

### 2. "Name is required to generate TalentStory"
**Solution**: Ensure profile has `full_name` field populated

### 3. "At least one skill is required"
**Solution**: Add skills to profile before generating story

### 4. "talent_stories table does not exist"
**Solution**: Run database migration

### 5. OpenAI rate limit error
**Solution**: Wait a few seconds and retry, or upgrade API plan

## Testing

### Manual Test
1. Ensure user has complete profile (name, skills, experience)
2. Call generate endpoint
3. Verify story is created in database
4. Check story markdown is well-formatted

### Test Script (coming soon)
```bash
pnpm test:talent-story
```

## Cost Estimation

**GPT-4o Pricing (as of Nov 2024):**
- Input: $2.50 per 1M tokens
- Output: $10.00 per 1M tokens

**Typical Story Generation:**
- Input: ~2,000 tokens (profile data + prompt)
- Output: ~2,500 tokens (story)
- **Cost per story: ~$0.03**

For 1000 users generating 1 story each:
- Total cost: ~$30

## Security

### Environment Variables
- ✅ `OPENAI_API_KEY` is server-side only (not exposed to client)
- ✅ Never commit `.env.local` to git
- ✅ Use `.env.example` for team reference

### Database Security
- ✅ RLS policies restrict access to user's own stories
- ✅ Server-side API routes handle all database operations
- ✅ No direct database access from client

### API Protection
- ✅ All endpoints require authentication
- ✅ User can only generate stories for their own profile
- ✅ Rate limiting recommended (implement in future)

## Troubleshooting

### Story Quality Issues
1. Check if profile data is complete
2. Review system prompt in `talentStoryEngine.ts`
3. Try different temperature settings
4. Test with different models (gpt-4o vs gpt-4-turbo)

### Performance Issues
1. Use `gpt-4o-mini` for faster generation
2. Reduce `max_tokens` if stories are too long
3. Implement caching for frequently accessed stories

### Database Issues
1. Check RLS policies are enabled
2. Verify user has `SELECT` permission on `talent_stories`
3. Check database connection in Supabase dashboard

## Next Steps

1. **Install OpenAI package**: `pnpm install` in `apps/web`
2. **Add API key**: Copy from OpenAI dashboard to `.env.local`
3. **Run migration**: Apply SQL in Supabase dashboard
4. **Test endpoint**: Call `/api/talent-story/generate` from frontend
5. **Create UI**: Build TalentStory display page
6. **Add regeneration**: Allow users to update and regenerate stories

## Support

For issues or questions:
1. Check error logs in console
2. Review this documentation
3. Check OpenAI API status: https://status.openai.com
4. Verify Supabase connection: https://app.supabase.com

---

**Built with:**
- Next.js 16.0.1
- OpenAI API (GPT-4o)
- Supabase (PostgreSQL + Auth)
- TypeScript 5.9.2
