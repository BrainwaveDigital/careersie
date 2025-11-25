# Sprint 2.5: Export in Multiple Formats - Implementation Guide

## Overview
This sprint implements a complete multi-format export engine for TalentStory, supporting PDF, DOCX, LinkedIn, Seek, and plain text formats.

## Prerequisites
- Node.js 18+ installed
- pnpm package manager
- Supabase project with service role key
- Prisma CLI installed

---

## Step 1: Directory Structure Setup

Create the following directory structure in `apps/web`:

```
apps/web/
├── src/
│   ├── services/
│   │   ├── exportService.ts
│   │   ├── pdfService.ts
│   │   ├── templateRenderer.ts
│   │   ├── textFormatters.ts
│   │   ├── docxService.ts
│   │   ├── historyService.ts
│   │   └── storageService.ts
│   ├── templates/
│   │   └── export/
│   │       ├── ats-template.html
│   │       └── ats-template.css
│   └── components/
│       └── export/
│           ├── ExportModal.tsx
│           └── ExportHistory.tsx
├── app/
│   └── api/
│       └── export/
│           ├── pdf/
│           │   └── route.ts
│           ├── docx/
│           │   └── route.ts
│           ├── linkedin/
│           │   └── route.ts
│           ├── seek/
│           │   └── route.ts
│           ├── text/
│           │   └── route.ts
│           └── history/
│               └── route.ts
└── public/
    └── exports/
        └── .gitkeep
```

### Manual Directory Creation (Windows)

Run these commands in Command Prompt from `apps/web` directory:

```bat
mkdir src\services
mkdir src\templates\export
mkdir src\components\export
mkdir app\api\export\pdf
mkdir app\api\export\docx
mkdir app\api\export\linkedin
mkdir app\api\export\seek
mkdir app\api\export\text
mkdir app\api\export\history
mkdir public\exports
```

---

## Step 2: Install Dependencies

From `apps/web` directory:

```bash
pnpm add puppeteer handlebars docx date-fns
pnpm add -D @types/puppeteer @types/handlebars
```

---

## Step 3: Database Migration

### 3.1 Update Prisma Schema

Add to your `schema.prisma` file:

```prisma
model ExportHistory {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  format     String   // 'pdf' | 'docx' | 'linkedin' | 'seek' | 'text'
  filename   String
  fileUrl    String   @map("file_url")
  settings   Json?    // export options used
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([createdAt(sort: Desc)])
  @@map("export_history")
}
```

### 3.2 Run Migration

```bash
npx prisma migrate dev --name add_export_history
```

---

## Step 4: Environment Variables

Add to your `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
EXPORT_STORAGE_PATH=./public/exports
EXPORT_CLEANUP_DAYS=30
```

---

## Step 5: Implementation Files

The complete implementation files are provided below. Create each file in the specified location:

### Service Files (src/services/)

1. **exportService.ts** - Core data aggregation service
2. **pdfService.ts** - Puppeteer PDF generation
3. **templateRenderer.ts** - Handlebars template engine
4. **textFormatters.ts** - LinkedIn/Seek/Text formatters
5. **docxService.ts** - DOCX document generation
6. **historyService.ts** - Export history tracking
7. **storageService.ts** - File storage management

### API Routes (app/api/export/)

1. **pdf/route.ts** - PDF export endpoint
2. **docx/route.ts** - DOCX export endpoint
3. **linkedin/route.ts** - LinkedIn text export
4. **seek/route.ts** - Seek format export
5. **text/route.ts** - Plain text export
6. **history/route.ts** - Export history listing

### Templates (src/templates/export/)

1. **ats-template.html** - ATS-friendly PDF template
2. **ats-template.css** - ATS PDF styling

### Frontend Components (src/components/export/)

1. **ExportModal.tsx** - Export UI modal
2. **ExportHistory.tsx** - Export history display

---

## Step 6: Integration Points

### Add Export Button to Dashboard

```typescript
// In your dashboard page
import { ExportModal } from '@/components/export/ExportModal';
import { ExportHistory } from '@/components/export/ExportHistory';
import { useState } from 'react';

export default function DashboardPage() {
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  return (
    <div>
      {/* Your existing dashboard content */}
      
      <button onClick={() => setExportModalOpen(true)}>
        Export TalentStory
      </button>
      
      <ExportModal 
        isOpen={exportModalOpen} 
        onClose={() => setExportModalOpen(false)} 
      />
      
      <ExportHistory />
    </div>
  );
}
```

---

## Step 7: Testing

### 7.1 Start Development Server

```bash
pnpm dev
```

### 7.2 Test Each Export Format

1. Navigate to dashboard
2. Click "Export TalentStory"
3. Test each format:
   - PDF (ATS mode)
   - DOCX
   - LinkedIn text
   - Seek format
   - Plain text

### 7.3 Verify Export History

- Check that exports are logged
- Verify download links work
- Confirm files are stored in `public/exports/{userId}/`

---

## Step 8: Production Considerations

### 8.1 Puppeteer in Production

For Vercel deployment, consider:
- Use `puppeteer-core` with `@sparticuz/chromium`
- Or use external service like Gotenberg
- Increase function timeout to 30s+

### 8.2 Storage

For production, migrate from local storage to:
- Supabase Storage
- AWS S3
- Cloudflare R2

Update `storageService.ts` accordingly.

### 8.3 Rate Limiting

Add rate limiting to prevent abuse:

```typescript
// Add to API routes
const rateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

await rateLimiter.check(res, 10, 'EXPORT_LIMIT'); // 10 requests per minute
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  ┌──────────────┐              ┌──────────────┐        │
│  │ExportModal.tsx│─────────────▶│ExportHistory │        │
│  └──────────────┘              └──────────────┘        │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP POST/GET
                        ▼
┌─────────────────────────────────────────────────────────┐
│               Backend API Routes (Next.js)               │
│  /api/export/                                            │
│  ├── pdf/route.ts                                       │
│  ├── docx/route.ts                                      │
│  ├── linkedin/route.ts                                  │
│  ├── seek/route.ts                                      │
│  ├── text/route.ts                                      │
│  └── history/route.ts                                   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  Service Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ exportService│  │  pdfService  │  │ docxService  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │textFormatters│  │templateRender│  │historyService│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐                                       │
│  │storageService│                                       │
│  └──────────────┘                                       │
└───────────────────────┬───────────────┬─────────────────┘
                        │               │
                        ▼               ▼
              ┌──────────────┐  ┌──────────────┐
              │   Supabase   │  │ Local/Cloud  │
              │   Database   │  │   Storage    │
              └──────────────┘  └──────────────┘
```

---

## Key Features Implemented

✅ **PDF Export (ATS-compliant)**
- Single-column layout
- System fonts
- Print-optimized CSS
- Puppeteer rendering

✅ **DOCX Export**
- Word-compatible format
- Structured headings
- Bullet points
- Page breaks

✅ **LinkedIn Format**
- Profile-optimized text
- Bullet points (3-4 per role)
- Skills section
- Education & certifications

✅ **Seek Format (AU/NZ)**
- Role-first approach
- ATS keywords
- Measurable achievements
- Responsibilities breakdown

✅ **Plain Text**
- Clean formatting
- No special characters
- Universal compatibility

✅ **Export History**
- Track all exports
- Download links
- Format indicators
- Timestamp tracking

✅ **Storage Management**
- User-specific directories
- Automatic cleanup
- Public URL generation

---

## Troubleshooting

### Puppeteer Issues

**Problem:** Puppeteer fails to launch browser

**Solutions:**
1. Install Chromium: `pnpm add puppeteer` (full package)
2. Check system dependencies (Linux): `apt-get install -y chromium-browser`
3. Use docker container with Chromium preinstalled

### Template Not Found

**Problem:** `ENOENT: no such file or directory` for templates

**Solution:**
Verify template files exist at:
- `src/templates/export/ats-template.html`
- `src/templates/export/ats-template.css`

### Database Errors

**Problem:** `relation "export_history" does not exist`

**Solution:**
Run Prisma migration:
```bash
npx prisma migrate deploy
```

### Storage Permission Errors

**Problem:** Cannot write to `public/exports/`

**Solution:**
Ensure directory exists and has write permissions:
```bash
mkdir -p public/exports
chmod 755 public/exports
```

---

## Next Steps

Once Sprint 2.5 is complete, consider:

1. **Sprint 2.6**: Add email delivery of exports
2. **Sprint 2.7**: Create designer template (styled PDF)
3. **Sprint 2.8**: Add export scheduling/automation
4. **Sprint 2.9**: Implement export analytics
5. **Sprint 3.0**: Multi-language export support

---

## Support & Resources

- **Puppeteer Docs**: https://pptr.dev/
- **docx.js Docs**: https://docx.js.org/
- **Handlebars Docs**: https://handlebarsjs.com/
- **Supabase Storage**: https://supabase.com/docs/guides/storage

---

**Last Updated:** November 24, 2024  
**Sprint Version:** 2.5.0  
**Status:** Implementation Ready
