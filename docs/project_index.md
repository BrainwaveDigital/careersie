# Careersie Project Index

This document provides a high-level summary of the Careersie project, covering all major sprints and features from Sprint 1 onward. Use this as your starting point for understanding the architecture, implementation phases, and documentation structure.

---

## 🏁 Sprint 1.x: Foundation & CV Parsing

- **Goal:** Establish the monorepo, set up Supabase (auth, storage, RLS), and implement CV parsing.
- **Key Features:**
  - Monorepo with Turborepo, pnpm, Next.js apps (`web`, `docs`)
  - Supabase integration for authentication and database
  - CV upload (PDF/DOCX), parsing via OpenAI GPT-4
  - Profile normalization (`ProfileStoryInput`)
- **Key Files:**
  - `src/lib/jobParser.ts` — CV parsing logic
  - `src/lib/parsedClient.ts` — Profile normalization
- **Docs:**  
  - [SPRINT_1.2_IMPLEMENTATION.md](sprints/SPRINT_1.2_IMPLEMENTATION.md)

---

## 🚀 Sprint 2.3: Enhancements & Performance

- **Goal:** Optimize performance and add optional features.
- **Key Features:**
  - OpenAI embeddings for semantic skill clustering
  - InstancedMesh rendering for 3D skill graphs
  - Job-specific skill highlighting
  - Performance improvements (draw calls, FPS, memory)
  - Enhanced UI/UX and accessibility
- **Docs:**  
  - [ENHANCEMENT-SUMMARY.md](ENHANCEMENT-SUMMARY.md)

---

## ✨ Sprint 2.4: TalentStory Generation

- **Goal:** Generate narrative TalentStories from structured profiles.
- **Key Features:**
  - Database schema for stories, versions, and skills (Supabase, RLS)
  - API endpoints for CRUD, AI generation, versioning
  - TipTap rich text editor with autosave
  - Metrics extraction and highlighting
  - Version history and restore
  - Modular UI components (AddStoryModal, StoryEditor, StoryCard, StoryList, VersionHistory)
- **Key Files:**
  - `apps/web/app/api/stories/*` — API routes
  - `apps/web/src/components/*` — UI components
  - `apps/web/src/lib/storyTypes.ts` — Type definitions
- **Docs:**  
  - [SPRINT_2.4_IMPLEMENTATION.md](sprints/SPRINT_2.4_IMPLEMENTATION.md)  
  - [SPRINT_2.4_QUICK_START.md](sprints/SPRINT_2.4_QUICK_START.md)  
  - [SPRINT_2.4_PROGRESS.md](sprints/SPRINT_2.4_PROGRESS.md)

---

## 🏆 Sprint 2.5: Multi-Format Export System

- **Goal:** Enable exporting TalentStories in multiple formats with export history.
- **Key Features:**
  - Export to PDF (ATS-compliant), DOCX, LinkedIn text, Seek format, and plain text
  - Export history tracking (database, API, UI)
  - Service layer for data aggregation, PDF/DOCX/text generation, template rendering, storage
  - API routes for each export format and history
  - React components for export modal and history
  - Automated setup scripts and comprehensive documentation
- **Key Files:**
  - `apps/web/src/services/` — 7 service files (exportService, pdfService, docxService, etc.)
  - `apps/web/app/api/export/` — 6 API route files
  - `apps/web/src/templates/export/` — HTML/CSS templates
  - `apps/web/src/components/export/` — ExportModal, ExportHistory
- **Docs:**  
  - [SPRINT_2.5_COMPLETE_SUMMARY.md](sprints/SPRINT_2.5_COMPLETE_SUMMARY.md)  
  - [SPRINT_2.5_QUICK_REFERENCE.md](sprints/SPRINT_2.5_QUICK_REFERENCE.md)  
  - [SPRINT_2.5_IMPLEMENTATION_GUIDE.md](sprints/SPRINT_2.5_IMPLEMENTATION_GUIDE.md)  
  - [SPRINT_2.5_IMPLEMENTATION_STATUS.md](sprints/SPRINT_2.5_IMPLEMENTATION_STATUS.md)  
  - [SPRINT_2.5_CODE_PACKAGE_PART1.md](sprints/SPRINT_2.5_CODE_PACKAGE_PART1.md)  
  - [SPRINT_2.5_INDEX.md](sprints/SPRINT_2.5_INDEX.md)

---

## 📚 Documentation Structure

- **Sprints:**  
  - `docs/sprints/` — Implementation, quick start, progress, and code reference for each sprint
- **Guides:**  
  - `docs/guides/` — Feature guides, LLM, and TalentStory documentation
- **Enhancements:**  
  - `docs/ENHANCEMENT-SUMMARY.md` — Optional features and performance improvements
- **Project Overview:**  
  - [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) — Architecture, features, and file index

---

## 🗂️ Key Implementation Patterns

- **Monorepo:** Turborepo, pnpm workspaces, shared packages (`@repo/ui`)
- **TypeScript:** Strict typing, interfaces, and generics throughout
- **Supabase:** Auth, RLS, storage, and versioned database schema
- **Next.js:** API routes, SSR/ISR, modular React components
- **Testing:** Manual and automated, with test pages and API guides
- **Export:** Multi-format, ATS-compliant, and user-friendly

---

## 🚦 Next Steps & Roadmap

- Sprint 2.6+: Email delivery, designer templates, export scheduling, analytics, multi-language support
- See [ENHANCEMENT-SUMMARY.md](ENHANCEMENT-SUMMARY.md) for future plans

---

**For detailed implementation, see the sprint documentation in `docs/sprints/`.**
