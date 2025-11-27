# Project Overview

This document provides a master overview of the Careersie project, its architecture, major features, and documentation structure.

## Structure
- `/docs/sprints/` — Sprint implementation, progress, and quick start guides
- `/docs/guides/` — Feature guides, LLM, and talent story documentation

## Key Features
- Next.js web application
- Supabase integration (auth, storage, RLS)
- PDF/CV parsing and profile normalization
- Talent story generation and self-reflection tools

## Documentation Index
- Sprints: See `/docs/sprints/`
- Guides: See `/docs/guides/`

## Key Documentation Files
- Sprint Implementation: `/docs/sprints/`
- Feature Guides: `/docs/guides/`
- Current Sprint: SPRINT_2.4 (stable)
- Broken Sprint: SPRINT_2.5 (DO NOT USE - schema.prisma issues)

## CV Parsing Implementation
- Location: `src/lib/jobParser.ts`
- Method: OpenAI GPT-4
- Sprint: 1.2
- See: `/docs/sprints/SPRINT_1.2_*` for details

## Critical Files
- CV Parsing: `src/lib/jobParser.ts`, `src/lib/parsedClient.ts`
- Profile Service: `src/lib/profileStoryService.ts`
- Database: Supabase (RLS enabled)
```

**3. Reset Copilot's context:**
```
1. Move all .md files into /docs structure
2. Close VS Code completely
3. Delete these cache folders:
   - `.vscode/` (if it exists)
   - `node_modules/.cache/` (if it exists)
4. Reopen VS Code
5. Open PROJECT_OVERVIEW.md first
6. Wait 2-3 minutes for indexing
7. Run: Ctrl+Shift+P > "Developer: Reload Window"
