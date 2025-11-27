# Sprint 2.4 - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Run Database Migration
```sql
-- In Supabase SQL Editor, execute:
-- File: sql/migrations/20251121_create_stories_tables.sql

-- This creates:
-- ✓ stories table
-- ✓ story_versions table  
-- ✓ story_skills table
-- ✓ Auto-versioning trigger
-- ✓ RLS policies
```

### Step 2: Start Dev Server
```bash
cd d:\0_Careersie
turbo dev
```

### Step 3: Test the Feature
1. Open `http://localhost:3000/story-test`
2. Get your Experience ID from Supabase:
   ```sql
   SELECT id, title FROM experiences 
   WHERE profile_id = (
     SELECT id FROM profiles 
     WHERE user_id = auth.uid()
   );
   ```
3. Enter the Experience ID in the test page
4. Click "Open Modal" to create a story

---

## 📚 Component Library

### AddStoryModal
Create stories with AI or manual entry:
```tsx
import { AddStoryModal } from '@/components/AddStoryModal';

<AddStoryModal
  experienceId="uuid"
  experienceTitle="Senior Engineer"
  onClose={() => setOpen(false)}
  onSuccess={(storyId) => console.log(storyId)}
/>
```

### StoryList
Display all stories for an experience:
```tsx
import { StoryList } from '@/components/StoryList';

<StoryList
  experienceId="uuid"
  experienceTitle="Senior Engineer"
  onEditStory={(id) => openEditor(id)}
/>
```

### StoryEditor
Rich text editor with autosave:
```tsx
import { StoryEditor } from '@/components/StoryEditor';

<StoryEditor
  storyId="uuid"
  onSave={(story) => console.log(story)}
  onClose={() => setOpen(false)}
/>
```

### StoryCard
Display individual story:
```tsx
import { StoryCard } from '@/components/StoryCard';

<StoryCard
  story={storyData}
  onEdit={(id) => openEditor(id)}
  onDelete={(id) => deleteStory(id)}
/>
```

### VersionHistory
View and restore versions:
```tsx
import { VersionHistory } from '@/components/VersionHistory';

<VersionHistory
  storyId="uuid"
  open={showVersions}
  onClose={() => setOpen(false)}
  onRestore={(version) => restore(version)}
/>
```

---

## 🔌 API Endpoints

### Create Story (Manual)
```bash
POST /api/stories
{
  "experience_id": "uuid",
  "title": "Cloud Migration",
  "situation": "...",
  "task": "..."
}
```

### Generate Story (AI)
```bash
POST /api/stories/generate
{
  "experience_id": "uuid",
  "bullets": [
    "Led migration for 50+ services",
    "Reduced costs by 60%"
  ]
}
```

### Update Story (Autosave)
```bash
PATCH /api/stories/:id
{
  "situation": "Updated text...",
  "autosave": true  # Don't create version
}
```

### List Stories
```bash
GET /api/stories/by-experience/:expId
```

### Version Snapshot
```bash
POST /api/stories/version
{
  "story_id": "uuid",
  "change_summary": "Final draft"
}
```

---

## 🎯 Key Features

✅ **Two Creation Modes**
- AI: Bullet points → GPT-4 generates STAR story
- Manual: Guided STAR section inputs

✅ **Rich Text Editor**
- TipTap with 4 separate editors (S.T.A.R.)
- 2.5-second debounced autosave
- Character count per section

✅ **Version Control**
- Auto-incrementing version numbers
- Manual snapshots with change summaries
- Restore previous versions

✅ **Metrics Highlighting**
- AI extracts numbers (60%, $1.2M, 10K users)
- Badge display in cards
- JSONB storage for flexibility

✅ **Security**
- RLS policies enforce ownership
- All endpoints verify user access
- Zod validation on all inputs

---

## 📖 Documentation

- **Full Implementation**: `SPRINT_2.4_IMPLEMENTATION.md`
- **API Testing**: `apps/web/API_TESTING_GUIDE.md`
- **Test Page**: `http://localhost:3000/story-test`

---

## 🐛 Troubleshooting

**Problem**: "Unauthorized" error
- **Fix**: Make sure you're logged in at `/login`

**Problem**: "Experience not found"
- **Fix**: Verify Experience ID exists and belongs to your user

**Problem**: AI generation fails
- **Fix**: Check `OPENAI_API_KEY` in `.env.local`

**Problem**: Autosave not working
- **Fix**: Check browser console for errors, verify Story ID is valid

**Problem**: Version numbers not incrementing
- **Fix**: Ensure database trigger was created in migration

---

## 🎨 Customization

### Change Autosave Delay
```tsx
// In StoryEditor.tsx
const AUTOSAVE_DELAY = 5000; // Change from 2500ms to 5000ms
```

### Customize STAR Prompts
```tsx
// In storyTypes.ts
export const DEFAULT_STAR_TEMPLATE = {
  situation: {
    prompt: "Your custom prompt...",
    // ...
  }
}
```

### Modify AI Generation Prompt
```tsx
// In apps/web/app/api/stories/generate/route.ts
const STAR_SYSTEM_PROMPT = `Your custom system prompt...`;
```

---

## 📦 Files Reference

**Database:**
- `sql/migrations/20251121_create_stories_tables.sql`

**Types & Validation:**
- `apps/web/src/lib/storyTypes.ts`
- `apps/web/src/lib/storyValidation.ts`

**API Routes:**
- `apps/web/app/api/stories/route.ts`
- `apps/web/app/api/stories/[id]/route.ts`
- `apps/web/app/api/stories/generate/route.ts`
- `apps/web/app/api/stories/version/route.ts`
- `apps/web/app/api/stories/by-experience/[expId]/route.ts`

**Components:**
- `apps/web/src/components/AddStoryModal.tsx`
- `apps/web/src/components/StoryEditor.tsx`
- `apps/web/src/components/StoryCard.tsx`
- `apps/web/src/components/StoryList.tsx`
- `apps/web/src/components/VersionHistory.tsx`

**Test:**
- `apps/web/app/story-test/page.tsx`

---

## ✨ What's Next?

Sprint 2.4 is **100% complete**! You can now:

1. **Integrate into Profile Builder**
   - Add `<StoryList>` to experience sections
   - Show story count badges

2. **Integrate into TalentStory**
   - Display stories in resume-like format
   - Filter stories by relevance

3. **Add to Dashboard**
   - Show recent stories
   - Draft completion prompts

4. **Build Sprint 2.5** (if planned)
   - Story export to PDF
   - Story templates library
   - Collaboration features

---

**Happy Coding! 🎉**
