# 🎯 Sprint 2.5: Quick Implementation Reference

This is your **go-to** reference for implementing Sprint 2.5. All code is ready to copy-paste.

---

## 🚀 Quick Start (5 Steps)

### Step 1: Setup Directories & Dependencies (5 min)
```bat
cd d:\0_AI_Projects\0_careersie\apps\web
scripts\setup-sprint-2.5.bat
```

### Step 2: Update Environment (2 min)
Add to `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

### Step 3: Database Migration (3 min)
Add to `schema.prisma` then run migration:
```bash
npx prisma migrate dev --name add_export_history
```

### Step 4: Copy All Code Files (30 min)
Copy files from sections below into correct directories

### Step 5: Test (10 min)
```bash
pnpm dev
# Navigate to dashboard and test export
```

**Total Time: ~50 minutes**

---

## 📦 Package.json Updates

Add these dependencies (or run setup script):

```json
{
  "dependencies": {
    "puppeteer": "^22.0.0",
    "handlebars": "^4.7.8",
    "docx": "^8.5.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/puppeteer": "^7.0.4",
    "@types/handlebars": "^4.1.0"
  }
}
```

---

## 🗄️ Database Schema Addition

Add to your `schema.prisma`:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

```prisma
model ExportHistory {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  format     String   // 'pdf' | 'docx' | 'linkedin' | 'seek' | 'text'
  filename   String
  fileUrl    String   @map("file_url")
  settings   Json?
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([createdAt(sort: Desc)])
  @@map("export_history")
}
```

Then run:
```bash
npx prisma migrate dev --name add_export_history
npx prisma generate
```

---

## 📁 Directory Structure

All files must be created in these exact locations:

```
apps/web/
├── src/
│   ├── services/                          ← Create 7 files here
│   │   ├── exportService.ts
│   │   ├── pdfService.ts
│   │   ├── templateRenderer.ts
│   │   ├── textFormatters.ts
│   │   ├── docxService.ts
│   │   ├── historyService.ts
│   │   └── storageService.ts
│   ├── templates/export/                  ← Create 2 files here
│   │   ├── ats-template.html
│   │   └── ats-template.css
│   └── components/export/                 ← Create 2 files here
│       ├── ExportModal.tsx
│       └── ExportHistory.tsx
├── app/api/export/                        ← Create 6 route files here
│   ├── pdf/route.ts
│   ├── docx/route.ts
│   ├── linkedin/route.ts
│   ├── seek/route.ts
│   ├── text/route.ts
│   └── history/route.ts
└── public/exports/                        ← Keep empty (for generated files)
```

---

## 💻 Complete Code Files

### Core Services (7 Files)

All service files go in: `src/services/`

Refer to **SPRINT_2.5_IMPLEMENTATION_GUIDE.md** for complete code listings of:
1. exportService.ts (200 lines)
2. pdfService.ts (100 lines)
3. templateRenderer.ts (80 lines)
4. textFormatters.ts (250 lines)
5. docxService.ts (150 lines)
6. historyService.ts (80 lines)
7. storageService.ts (100 lines)

### API Routes (6 Files)

All route files go in: `app/api/export/{format}/route.ts`

Similar structure for all:
```typescript
// Example: app/api/export/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTalentStoryPayload } from '@/services/exportService';
import { generatePdfFromPayload } from '@/services/pdfService';
// ... rest of implementation
```

### Templates (2 Files)

1. **ats-template.html** - ATS-compliant resume layout
2. **ats-template.css** - Print-optimized styles

Both go in: `src/templates/export/`

### Components (2 Files)

1. **ExportModal.tsx** - Main export UI
2. **ExportHistory.tsx** - History display

Both go in: `src/components/export/`

---

## ⚡ Implementation Priority

### Phase 1: Critical Path (Must implement first)
1. ✅ exportService.ts
2. ✅ storageService.ts  
3. ✅ historyService.ts
4. ✅ Templates (HTML + CSS)

### Phase 2: Export Engines
5. ✅ templateRenderer.ts
6. ✅ pdfService.ts
7. ✅ docxService.ts
8. ✅ textFormatters.ts

### Phase 3: API Layer
9. ✅ All 6 API routes

### Phase 4: Frontend
10. ✅ ExportModal.tsx
11. ✅ ExportHistory.tsx

---

## 🧪 Quick Test Commands

### Test PDF Export
```bash
curl -X POST http://localhost:3000/api/export/pdf \
  -H "Content-Type: application/json" \
  -d '{"formatOptions":{"theme":"ats","includeStories":true}}'
```

### Test DOCX Export
```bash
curl -X POST http://localhost:3000/api/export/docx \
  -H "Content-Type: application/json" \
  -d '{"formatOptions":{"includeStories":true}}'
```

### Test Export History
```bash
curl http://localhost:3000/api/export/history
```

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module '@/services/exportService'"
**Fix:** Ensure `tsconfig.json` has path mapping:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: "Puppeteer browser not found"
**Fix:** Install full puppeteer (not puppeteer-core):
```bash
pnpm remove puppeteer-core
pnpm add puppeteer
```

### Issue: "Template not found"
**Fix:** Verify template files exist:
```bash
ls src/templates/export/ats-template.html
ls src/templates/export/ats-template.css
```

### Issue: "export_history table doesn't exist"
**Fix:** Run Prisma migration:
```bash
npx prisma migrate deploy
npx prisma generate
```

---

## 📊 Feature Checklist

Use this to track implementation:

### Backend Services
- [ ] exportService.ts - Data aggregation ✨
- [ ] pdfService.ts - PDF generation 📄
- [ ] templateRenderer.ts - Template engine 🎨
- [ ] textFormatters.ts - Text formatting 📝
- [ ] docxService.ts - DOCX generation 📋
- [ ] historyService.ts - History tracking 📜
- [ ] storageService.ts - File storage 💾

### API Routes
- [ ] /api/export/pdf
- [ ] /api/export/docx
- [ ] /api/export/linkedin
- [ ] /api/export/seek
- [ ] /api/export/text
- [ ] /api/export/history

### Templates
- [ ] ats-template.html
- [ ] ats-template.css

### Components
- [ ] ExportModal.tsx
- [ ] ExportHistory.tsx

### Integration
- [ ] Add export button to dashboard
- [ ] Test all formats
- [ ] Verify downloads work
- [ ] Check export history

---

## 🎯 Success Metrics

Your implementation is complete when:

✅ **All formats export successfully**
- PDF downloads as `.pdf`
- DOCX opens in Microsoft Word
- LinkedIn text copies to clipboard
- Seek text copies to clipboard
- Plain text is readable

✅ **Export history works**
- Exports are logged
- History displays correctly
- Download links function
- Timestamps are accurate

✅ **User experience is smooth**
- Export modal opens/closes
- Progress indicators show
- Success messages appear
- Errors are handled gracefully

---

## 🚢 Production Deployment Checklist

Before deploying to production:

### Environment
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to production env
- [ ] Set `NODE_ENV=production`
- [ ] Configure storage (S3 or Supabase Storage)

### Performance
- [ ] Add rate limiting to API routes
- [ ] Implement export queue for heavy loads
- [ ] Set up Puppeteer for serverless (if using Vercel)

### Security
- [ ] Verify authentication on all routes
- [ ] Sanitize user input in exports
- [ ] Scan uploaded files (if applicable)

### Monitoring
- [ ] Add error tracking (Sentry)
- [ ] Monitor PDF generation time
- [ ] Track export success/failure rates

---

## 📚 Additional Resources

### Documentation Files Created
1. **SPRINT_2.5_IMPLEMENTATION_GUIDE.md** - Full setup guide (10,000+ words)
2. **SPRINT_2.5_IMPLEMENTATION_STATUS.md** - Progress tracking
3. **SPRINT_2.5_CODE_PACKAGE_PART1.md** - Code reference
4. **This file** - Quick reference

### External Documentation
- [Puppeteer Docs](https://pptr.dev/)
- [docx.js Documentation](https://docx.js.org/)
- [Handlebars Guide](https://handlebarsjs.com/)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

## 🎉 You're Ready!

**Everything you need is prepared:**
- ✅ Setup scripts created
- ✅ Code examples provided
- ✅ Documentation complete
- ✅ Testing guide included
- ✅ Troubleshooting ready

**Next action:** Run `setup-sprint-2.5.bat` and start implementing!

**Estimated time:** 2-4 hours for complete implementation

**Questions?** Refer to SPRINT_2.5_IMPLEMENTATION_GUIDE.md for detailed explanations.

---

_Sprint 2.5: Export in Multiple Formats_  
_Status: Ready for Implementation_ ✅  
_Last Updated: November 24, 2024_
