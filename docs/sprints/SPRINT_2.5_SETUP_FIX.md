# Sprint 2.5 Setup - Quick Fix Guide

## Issue 1: PowerShell Script Execution

**Problem:** PowerShell won't run scripts due to execution policy

**Solution:** Run these commands in PowerShell **as Administrator**:

```powershell
# Open PowerShell as Administrator, then run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Confirm with 'Y' when prompted
```

## Issue 2: Running .bat Files in PowerShell

**Problem:** PowerShell requires `.\` prefix for local scripts

**Solution:** Use one of these methods:

### Method 1: Use .\ prefix (PowerShell)
```powershell
cd d:\0_AI_Projects\0_careersie\apps\web\scripts
.\setup-sprint-2.5.bat
```

### Method 2: Use Command Prompt instead (Easier!)
```cmd
cd d:\0_AI_Projects\0_careersie\apps\web\scripts
setup-sprint-2.5.bat
```

### Method 3: Manual Setup (If scripts don't work)

Run these commands manually:

```powershell
# Navigate to web app
cd d:\0_AI_Projects\0_careersie\apps\web

# Create directories
New-Item -ItemType Directory -Path "src\services" -Force
New-Item -ItemType Directory -Path "src\templates\export" -Force
New-Item -ItemType Directory -Path "src\components\export" -Force
New-Item -ItemType Directory -Path "app\api\export\pdf" -Force
New-Item -ItemType Directory -Path "app\api\export\docx" -Force
New-Item -ItemType Directory -Path "app\api\export\linkedin" -Force
New-Item -ItemType Directory -Path "app\api\export\seek" -Force
New-Item -ItemType Directory -Path "app\api\export\text" -Force
New-Item -ItemType Directory -Path "app\api\export\history" -Force
New-Item -ItemType Directory -Path "public\exports" -Force

# Install dependencies
pnpm add puppeteer handlebars docx date-fns
pnpm add -D @types/puppeteer @types/handlebars

Write-Host "✓ Setup complete!" -ForegroundColor Green
```

## Issue 3: Running npx Commands

**Problem:** Same execution policy issue

**Solution:** Already fixed by step above, then run:

```powershell
# From: d:\0_AI_Projects\0_careersie\apps\web
npx prisma migrate dev --name add_export_history
```

---

## Complete Setup Steps (Copy-Paste Ready)

### Step 1: Fix PowerShell Execution Policy

**Open PowerShell as Administrator** (Right-click PowerShell → Run as Administrator):

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Press `Y` and Enter when prompted.

### Step 2: Create Directories Manually

**In regular PowerShell** (any window):

```powershell
cd d:\0_AI_Projects\0_careersie\apps\web

New-Item -ItemType Directory -Path "src\services" -Force
New-Item -ItemType Directory -Path "src\templates\export" -Force
New-Item -ItemType Directory -Path "src\components\export" -Force
New-Item -ItemType Directory -Path "app\api\export\pdf" -Force
New-Item -ItemType Directory -Path "app\api\export\docx" -Force
New-Item -ItemType Directory -Path "app\api\export\linkedin" -Force
New-Item -ItemType Directory -Path "app\api\export\seek" -Force
New-Item -ItemType Directory -Path "app\api\export\text" -Force
New-Item -ItemType Directory -Path "app\api\export\history" -Force
New-Item -ItemType Directory -Path "public\exports" -Force

Write-Host "✓ Directories created!" -ForegroundColor Green
```

### Step 3: Install Dependencies

```powershell
pnpm add puppeteer handlebars docx date-fns
pnpm add -D @types/puppeteer @types/handlebars
```

### Step 4: Database Migration

First, add the ExportHistory model to your schema.prisma:

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

```powershell
npx prisma migrate dev --name add_export_history
npx prisma generate
```

### Step 5: Add Environment Variable

Add to `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## ✅ Verification

After setup, verify directories exist:

```powershell
ls src\services
ls src\templates\export
ls src\components\export
ls app\api\export
ls public\exports
```

If all directories show (even if empty), you're ready to start implementing!

---

## 🚨 CRITICAL: pnpm Not Found After npm install -g pnpm

**Problem:** PowerShell doesn't recognize `pnpm` even after global install.

### ✅ Solution 1: Restart PowerShell (EASIEST - Try This First)

1. **Close PowerShell completely**
2. **Open a NEW PowerShell window**
3. **Test:** `pnpm --version`
4. If it works, continue with dependencies

### ✅ Solution 2: Use Monorepo Root (RECOMMENDED)

Instead of installing in `apps/web`, install from the ROOT:

```powershell
# Go to project root
cd d:\0_AI_Projects\0_careersie

# Add dependencies to workspace
# Edit apps/web/package.json manually and add:
```

**Add to `apps/web/package.json` dependencies:**
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

**Then install from ROOT:**
```powershell
cd d:\0_AI_Projects\0_careersie
npm install
# OR if pnpm is available after restart:
pnpm install
```

### ✅ Solution 3: Enable Corepack with Admin Rights (BEST LONG-TERM)

1. **Right-click PowerShell → Run as Administrator**
2. **Run:** `corepack enable`
3. **Close admin PowerShell**
4. **Open regular PowerShell**
5. **Test:** `pnpm --version` (should show 9.0.0)

### ✅ Solution 4: Skip Dependencies for Now (START CODING IMMEDIATELY)

You can actually **start implementing code files NOW** without installing dependencies:

1. ✅ Directories are already created
2. → Start creating service files (copy from CODE_PACKAGE_PART1.md)
3. → TypeScript won't compile yet, but you can write all the code
4. → Install dependencies later when you're ready to test
5. → Run `pnpm install` from root when ready

**This is actually the FASTEST way to make progress!**

---

## 🎯 RECOMMENDED PATH FORWARD

**Option A: Quick Start (If pnpm works after restart)**
```powershell
# Test if pnpm works now
pnpm --version

# If yes, install from ROOT:
cd d:\0_AI_Projects\0_careersie
pnpm install

# Then go to web app and verify
cd apps\web
ls node_modules | Select-String -Pattern "puppeteer"
```

**Option B: Manual Package.json + npm install (If pnpm still broken)**
1. Open `apps\web\package.json` in your editor
2. Add the 4 dependencies and 2 devDependencies (see Solution 2 above)
3. Save the file
4. Run from ROOT: `cd d:\0_AI_Projects\0_careersie; npm install`

**Option C: Start Coding Now (Dependencies Later)**
1. Skip dependencies entirely
2. Start implementing service files
3. Install dependencies when ready to test
4. This gets you making progress immediately!

---

## 🚀 Next Steps

1. **Choose your path** (A, B, or C above)
2. → Open `SPRINT_2.5_IMPLEMENTATION_STATUS.md`
3. → Start Day 1: Backend Foundation
4. → Begin implementing service files

---

**Current Status:**
- ✅ Directories created
- ⏳ Dependencies (in progress - use Option A, B, or C)
- ⏳ Ready to start coding

**Need Help?** Check SPRINT_2.5_QUICK_REFERENCE.md for troubleshooting.
