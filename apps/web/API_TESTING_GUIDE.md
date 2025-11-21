# Story API Endpoints - Testing Guide

This guide covers all API endpoints for Sprint 2.4 (Narratives, Context & Stories feature).

## Prerequisites

1. **Run the database migration**:
   ```bash
   # In Supabase SQL Editor, run:
   # sql/migrations/20251121_create_stories_tables.sql
   ```

2. **Environment variables** (`.env.local`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_key
   ```

3. **Authenticated user**: Login via `/login` and get session cookie.

---

## Endpoints

### 1. POST /api/stories - Create Story

**Request**:
```json
POST /api/stories
Content-Type: application/json

{
  "experience_id": "uuid-of-experience",
  "skill_ids": ["skill-uuid-1", "skill-uuid-2"],
  "title": "Migration to Microservices",
  "situation": "Legacy monolith causing issues...",
  "task": "My goal was to modernize..."
}
```

**Response** (201):
```json
{
  "story": {
    "id": "story-uuid",
    "experience_id": "exp-uuid",
    "situation": "Legacy monolith...",
    "task": "My goal was...",
    "action": null,
    "result": null,
    "full_story": null,
    "ai_generated": false,
    "metrics": null,
    "title": "Migration to Microservices",
    "tags": null,
    "is_draft": true,
    "relevance_score": null,
    "job_match_scores": null,
    "created_at": "2025-01-15T...",
    "updated_at": "2025-01-15T..."
  }
}
```

**Errors**:
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: User doesn't own the experience
- `404 Not Found`: Experience doesn't exist
- `400 Bad Request`: Invalid input (e.g., malformed UUID)

---

### 2. GET /api/stories/:id - Fetch Story

**Request**:
```
GET /api/stories/story-uuid-here
```

**Response** (200):
```json
{
  "story": {
    "id": "story-uuid",
    "experience_id": "exp-uuid",
    "situation": "...",
    "task": "...",
    "action": "...",
    "result": "...",
    "full_story": "...",
    "ai_generated": true,
    "metrics": {
      "numbers": ["60%", "$1.2M", "10,000 users"],
      "keywords": ["optimization", "cost savings", "leadership"]
    },
    "title": "...",
    "tags": ["cloud", "migration"],
    "is_draft": false,
    "created_at": "...",
    "updated_at": "...",
    
    "experience": {
      "id": "exp-uuid",
      "title": "Senior Engineer",
      "company": "Acme Corp",
      "start_date": "2020-01-01",
      "end_date": "2023-12-31"
    },
    
    "skills": [
      { "id": "skill-uuid-1", "skill": "React" },
      { "id": "skill-uuid-2", "skill": "Node.js" }
    ],
    
    "versions": [
      {
        "id": "version-uuid",
        "story_id": "story-uuid",
        "version_number": 1,
        "situation": "...",
        "task": "...",
        "action": "...",
        "result": "...",
        "change_summary": "Initial version",
        "created_by_ai": false,
        "created_at": "..."
      }
    ]
  }
}
```

---

### 3. PATCH /api/stories/:id - Update Story

**Request**:
```json
PATCH /api/stories/story-uuid-here
Content-Type: application/json

{
  "situation": "Updated situation text...",
  "action": "I implemented a new approach...",
  "is_draft": false,
  "autosave": false
}
```

**Response** (200):
```json
{
  "story": {
    "id": "story-uuid",
    "situation": "Updated situation text...",
    "action": "I implemented a new approach...",
    "is_draft": false,
    // ... other fields
  }
}
```

**Notes**:
- `autosave: true` → No version snapshot created (for debounced auto-saves)
- `autosave: false` → Creates version snapshot with "Manual save" summary
- `skill_ids` → Updates story-skill links (deletes old, inserts new)

---

### 4. POST /api/stories/generate - AI Generation

**Request**:
```json
POST /api/stories/generate
Content-Type: application/json

{
  "experience_id": "uuid-of-experience",
  "bullets": [
    "Led migration from monolith to microservices for 50+ services",
    "Reduced deployment time by 60% with CI/CD automation",
    "Saved $200K annually in infrastructure costs",
    "Mentored 5 junior engineers on cloud architecture"
  ],
  "notes": "Focus on leadership and cost savings",
  "skill_ids": ["kubernetes-uuid", "aws-uuid"]
}
```

**Response** (201):
```json
{
  "story_id": "new-story-uuid",
  "situation": "Our company was operating a legacy monolithic application serving 10,000+ users with frequent deployment bottlenecks and escalating infrastructure costs...",
  "task": "I was tasked with architecting and leading the migration to a microservices architecture while maintaining zero downtime and mentoring the team through the transition.",
  "action": "I designed a phased migration strategy for 50+ services, implemented comprehensive CI/CD pipelines with automated testing and deployment, and conducted weekly training sessions for 5 junior engineers on cloud-native patterns and Kubernetes orchestration.",
  "result": "Reduced deployment time by 60%, eliminated downtime incidents, saved the company $200K annually in infrastructure costs, and successfully upskilled the entire engineering team to independently manage cloud deployments.",
  "full_story": "Our company was operating a legacy monolithic application serving 10,000+ users with frequent deployment bottlenecks. I was tasked with leading the migration to microservices architecture. I designed a phased strategy for 50+ services, implemented CI/CD automation, and mentored 5 engineers on cloud practices. This reduced deployment time by 60%, eliminated downtime, and saved $200K annually.",
  "metrics": {
    "numbers": ["50+", "60%", "$200K", "5", "10,000+"],
    "keywords": ["leadership", "microservices", "cost savings", "mentoring", "CI/CD", "Kubernetes"]
  }
}
```

**Notes**:
- Uses OpenAI GPT-4 (`gpt-4o` model)
- Story is saved with `ai_generated: true` and `is_draft: false`
- Initial version created with `created_by_ai: true`
- Linked to skills if `skill_ids` provided

---

### 5. POST /api/stories/version - Create Version

**Request**:
```json
POST /api/stories/version
Content-Type: application/json

{
  "story_id": "uuid-of-story",
  "change_summary": "Refined action section with more technical details"
}
```

**Response** (201):
```json
{
  "version": {
    "id": "version-uuid",
    "story_id": "story-uuid",
    "version_number": 3,
    "situation": "...",
    "task": "...",
    "action": "...",
    "result": "...",
    "full_story": "...",
    "metrics": { ... },
    "change_summary": "Refined action section with more technical details",
    "created_by_ai": false,
    "created_at": "2025-01-15T..."
  }
}
```

**Notes**:
- Version number auto-incremented via database trigger
- Captures current story state at time of snapshot

---

### 6. GET /api/stories/by-experience/:expId - List Stories

**Request**:
```
GET /api/stories/by-experience/experience-uuid-here
```

**Response** (200):
```json
{
  "stories": [
    {
      "id": "story-uuid-1",
      "experience_id": "exp-uuid",
      "situation": "...",
      "task": "...",
      "action": "...",
      "result": "...",
      "full_story": "...",
      "ai_generated": true,
      "metrics": { ... },
      "title": "Cloud Migration Story",
      "is_draft": false,
      "created_at": "...",
      "updated_at": "...",
      "skills": [
        { "id": "skill-1", "skill": "AWS" },
        { "id": "skill-2", "skill": "Kubernetes" }
      ]
    },
    {
      "id": "story-uuid-2",
      // ... another story
    }
  ]
}
```

**Notes**:
- Ordered by `updated_at DESC` (most recent first)
- Includes linked skills for each story

---

### 7. DELETE /api/stories/:id - Delete Story

**Request**:
```
DELETE /api/stories/story-uuid-here
```

**Response** (200):
```json
{
  "success": true
}
```

**Notes**:
- Cascade deletes versions and skill links (handled by database)
- Cannot be undone (hard delete)

---

## Testing Workflow

### 1. Create Empty Story (Manual Entry)
```bash
curl -X POST http://localhost:3000/api/stories \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "experience_id": "your-exp-uuid",
    "title": "Test Story"
  }'
```

### 2. Generate Story with AI
```bash
curl -X POST http://localhost:3000/api/stories/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "experience_id": "your-exp-uuid",
    "bullets": [
      "Built feature X for 1000+ users",
      "Improved performance by 40%"
    ]
  }'
```

### 3. Update Story (Autosave)
```bash
curl -X PATCH http://localhost:3000/api/stories/story-uuid \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "situation": "Updated text...",
    "autosave": true
  }'
```

### 4. Create Version Snapshot
```bash
curl -X POST http://localhost:3000/api/stories/version \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "story_id": "story-uuid",
    "change_summary": "Final version before review"
  }'
```

### 5. List Stories
```bash
curl http://localhost:3000/api/stories/by-experience/exp-uuid \
  -H "Cookie: your-session-cookie"
```

---

## Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Invalid UUID, missing required fields, validation error |
| 401 | Unauthorized | Not logged in, expired session |
| 403 | Forbidden | User doesn't own the experience/story |
| 404 | Not Found | Experience or story doesn't exist |
| 500 | Internal Server Error | Database error, OpenAI API error |
| 502 | Bad Gateway | OpenAI service unavailable |

---

## RLS Security

All endpoints verify:
1. User is authenticated (`auth.uid()`)
2. User owns the profile → experience → story chain
3. Database RLS policies enforce server-side security

Even with direct Supabase client access, users cannot access others' stories due to RLS policies.

---

## Next Steps

After testing endpoints:
1. Implement frontend components (AddStoryModal, StoryEditor)
2. Integrate TipTap rich text editor
3. Add autosave debounce logic (2.5 seconds)
4. Build version comparison UI
5. Implement metrics highlighting
