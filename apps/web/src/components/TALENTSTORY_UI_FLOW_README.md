# 🎨 TalentStory Builder - Complete 7-Step UI Flow

## Overview

The **TalentStory Builder** provides a complete, user-friendly interface for applicants to generate personalized TalentStory narratives from their CV and customization preferences.

## 🎯 User Journey

### **Step 1: Upload CV & Media**
📍 **Component:** `CVUploadPanel.tsx`

**Features:**
- 📄 **Drag & Drop CV Upload**
  - Supports PDF and DOCX formats
  - Auto-parsing via `/api/parsing/upload`
  - Visual progress feedback
  
- 🎨 **Optional Media Upload**
  - Images (screenshots, photos)
  - Videos (demo reels, presentations)
  - Documents (PDFs, portfolios)
  - Portfolio links (GitHub, Behance, etc.)
  - Add captions to each media item

**UI Elements:**
- Drag-and-drop zone with hover effects
- File upload progress indicators
- Media gallery with thumbnails
- Caption input for each media item
- "Continue to Customization →" button (enabled after CV parsed)

---

### **Step 2: Choose Tone**
📍 **Component:** `TalentStoryCustomizationPanel.tsx`

**7 Tone Options:**
1. 💼 **Professional** - Formal, business-focused
2. 👤 **Personal** - Warm, relatable storytelling
3. 🎨 **Creative** - Expressive, imaginative
4. 🏢 **Executive** - Leadership-oriented
5. 📊 **Analytical** - Data-driven, precise
6. 💬 **Conversational** - Friendly, approachable
7. 🎓 **Academic** - Scholarly, research-focused

**UI Elements:**
- Visual tone selection grid (2x4 or 4x2 responsive)
- Active tone highlighted with pink gradient border
- Each card shows tone name + description

---

### **Step 3: Choose Story Type**
📍 **Component:** `TalentStoryCustomizationPanel.tsx`

**5 Story Types:**
1. 📖 **Full ProfileStory** - Comprehensive narrative
2. 📝 **Short Summary** - Concise overview
3. 🎯 **Skill-Focused** - Technical skills highlight
4. 🚀 **Project Highlight Story** - Key projects showcase
5. 🎭 **Role-Specific Story** - Tailored for target role

**UI Elements:**
- 3-column grid of story type buttons
- Icons + descriptions for each type
- Active type highlighted

---

### **Step 4: Select Focus Skills**
📍 **Component:** `TalentStoryCustomizationPanel.tsx` (Advanced Options)

**Features:**
- Comma-separated skill input
- Examples: "React, TypeScript, Leadership"
- Skills emphasized in generated narrative

**UI Elements:**
- Text input with placeholder examples
- Inside collapsible "Advanced Options" section

---

### **Step 5: Toggle Sections**
📍 **Component:** `TalentStoryCustomizationPanel.tsx` (Advanced Options)

**7 Configurable Sections:**
- ✅ **Summary** - Professional overview
- ✅ **Skills Themes** - Skill categorization
- ✅ **Timeline** - Career journey
- ✅ **Strengths** - Core competencies
- ✅ **Highlights** - Key achievements
- ✅ **Career Paths** - Future directions
- ☐ **Media Showcase** - Portfolio items (off by default)

**UI Elements:**
- Checkbox grid (2 columns on mobile, 3+ on desktop)
- Each checkbox labeled with section name
- Inside "Advanced Options" section

---

### **Step 6: Add Custom Prompt**
📍 **Component:** `TalentStoryCustomizationPanel.tsx` (Advanced Options)

**Features:**
- Free-text instructions for AI
- Examples:
  - "Highlight my Agile BA experience"
  - "Focus on international work and leadership"
  - "Emphasize my transition from dev to product management"

**UI Elements:**
- Textarea (4 rows)
- Placeholder with example instructions
- Inside "Advanced Options" section

---

### **Step 7: Generate TalentStory**
📍 **Component:** `TalentStoryCustomizationPanel.tsx` + `TalentStoryBuilder.tsx`

**Generation Flow:**
1. User clicks "🚀 Generate TalentStory"
2. API call to `/api/talent-story/generate` with:
   - `promptConfig` (tone, type, sections, etc.)
   - User's profile data (from CV parsing)
3. OpenAI GPT-4o generates markdown narrative
4. Story saved to `talent_stories` table
5. Story displayed in preview step

**Preview Features:**
- Markdown rendering (prose styling)
- Action buttons:
  - 🔄 **Regenerate** - Go back to customize
  - 📋 **Copy** - Copy markdown to clipboard
  - ⬇️ **Download** - Save as `.md` file
  - 💾 **Save to Profile** - Persist to database
  - 🔗 **Share TalentStory** - Generate shareable link

---

## 📁 File Structure

```
apps/web/
├─ app/
│  └─ talent-story/
│     └─ builder/
│        └─ page.tsx              # Main page route
│
├─ src/
│  └─ components/
│     ├─ CVUploadPanel.tsx        # Step 1: Upload CV & Media
│     ├─ TalentStoryCustomizationPanel.tsx  # Steps 2-6: Customization
│     └─ TalentStoryBuilder.tsx   # Orchestrator (all 7 steps)
│
├─ lib/
│  ├─ talentStoryEngine.ts        # OpenAI generation logic
│  └─ profileStoryPrompt.ts       # Config interfaces & defaults
│
└─ app/api/
   └─ talent-story/
      └─ generate/
         └─ route.ts               # POST /api/talent-story/generate
```

---

## 🎨 Design System

### **Glass Morphism (Gen-Z Aesthetic)**
- **Background:** `bg-gradient-to-br from-pink-950/40 via-purple-900/20 to-black`
- **Cards:** `.glass-card` with backdrop blur + pink/purple borders
- **Buttons:**
  - Primary: `from-pink-500 to-purple-600` gradient
  - Outline: `border-pink-500/30` with hover effects
- **Text:**
  - Headings: `text-white`
  - Body: `text-pink-300`
  - Hints: `text-pink-400/60`

### **Responsive Layout**
- Mobile: Single column, stacked sections
- Tablet: 2-column grids for tone/sections
- Desktop: 3-4 column grids, expanded advanced options

---

## 🔗 Integration Points

### **API Endpoints**
```typescript
// Step 1: Parse CV
POST /api/parsing/upload
Body: FormData (file: File)
Returns: { parsed: ProfileStoryInput }

// Step 7: Generate Story
POST /api/talent-story/generate
Body: { promptConfig: ProfileStoryPrompt }
Returns: { story: string, id: string }
```

### **Database Schema**
```sql
-- talent_stories table
CREATE TABLE talent_stories (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  story TEXT NOT NULL,              -- Generated markdown
  data JSONB NOT NULL,               -- Source ProfileStoryInput
  model VARCHAR(50) DEFAULT 'gpt-4o',
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## 🚀 Usage

### **Access the Builder**
```
Navigate to: http://localhost:3000/talent-story/builder
```

### **Testing Flow**
1. Upload a test CV (PDF or DOCX)
2. Wait for auto-parsing
3. Select "Professional" tone
4. Choose "Full ProfileStory"
5. Select "Medium" length
6. Open "Advanced Options"
7. Add focus skills: "React, TypeScript"
8. Toggle sections (enable "Media Showcase")
9. Add custom instruction: "Emphasize leadership"
10. Click "Generate TalentStory"
11. Wait for OpenAI response (~10-20 seconds)
12. View rendered story
13. Test Copy/Download/Share buttons

---

## ✅ Implementation Status

| Step | Feature | Status |
|------|---------|--------|
| 1 | CV Upload | ✅ Complete |
| 1 | Media Upload | ✅ Complete |
| 2 | Tone Selection | ✅ Complete |
| 3 | Story Type Selection | ✅ Complete |
| 3 | Length Selection | ✅ Complete |
| 4 | Focus Skills Input | ✅ Complete |
| 5 | Section Toggles | ✅ Complete |
| 6 | Custom Prompt | ✅ Complete |
| 7 | Generate Button | ✅ Complete |
| 7 | Preview Display | ✅ Complete |
| 7 | Copy/Download | ✅ Complete |
| 7 | Regenerate | ✅ Complete |

---

## 🎓 Next Steps

### **Phase 1: Deploy**
- [ ] Run database migration: `sql/migrations/20251118_create_talent_stories_up.sql`
- [ ] Set `OPENAI_API_KEY` in production environment
- [ ] Test end-to-end with real CV

### **Phase 2: Enhancements**
- [ ] Add preset configurations (save favorite settings)
- [ ] Preview multiple tones side-by-side before generating
- [ ] Integration with user profiles (auto-load CV from profile)
- [ ] Real-time character count for custom instructions
- [ ] Drag-and-drop reordering of sections

### **Phase 3: Sharing**
- [ ] Generate public share links (e.g., `careersie.com/story/abc123`)
- [ ] Embed codes for portfolio websites
- [ ] PDF export with custom branding
- [ ] Social media preview cards (Open Graph, Twitter Card)

---

## 📚 Related Documentation

- **Architecture:** `apps/web/src/lib/TALENT_STORY_GENERATION_README.md`
- **API Routes:** `apps/web/app/api/talent-story/generate/route.ts`
- **Prompt System:** `apps/web/src/lib/talentStoryEngine.ts`
- **Config Interface:** `apps/web/src/lib/profileStoryPrompt.ts`
- **Database Schema:** `sql/migrations/20251118_create_talent_stories_up.sql`

---

## 🐛 Troubleshooting

### **"Failed to parse CV"**
- Check file format (only PDF/DOCX supported)
- Ensure `/api/parsing/upload` endpoint is running
- Check Supabase connection for profile data

### **"Failed to generate story"**
- Verify `OPENAI_API_KEY` is set in `.env.local`
- Check OpenAI API quota/credits
- Inspect `/api/talent-story/generate` logs
- Ensure user is authenticated (Supabase auth)

### **Styles not appearing**
- Verify Tailwind CSS is configured
- Check `globals.css` imports `.glass-card` styles
- Ensure `prose` plugin is installed for markdown rendering

---

**Built with ❤️ using:**
- Next.js 16.0.1
- OpenAI GPT-4o
- Supabase Auth + Database
- Tailwind CSS + Glass Morphism
- TypeScript 5.9.2
