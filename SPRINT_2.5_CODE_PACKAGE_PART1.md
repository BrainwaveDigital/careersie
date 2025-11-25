# Sprint 2.5: Complete Code Package
# All implementation files ready to copy-paste

This document contains ALL code files for Sprint 2.5. 
Follow the Implementation Guide for setup instructions.

---

## FILE: src/services/exportService.ts

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface ExportOptions {
  theme?: 'light' | 'dark' | 'ats';
  includeStories?: boolean;
  includeAchievements?: boolean;
  includeMedia?: boolean;
  pageSize?: 'A4' | 'Letter';
  fontSize?: 'small' | 'medium' | 'large';
}

export interface TalentStoryPayload {
  user: {
    id: string;
    name: string;
    email: string;
    title?: string;
    location?: string;
    summary?: string;
    phone?: string;
    linkedin?: string;
    portfolio?: string;
  };
  stories: Array<{
    id: string;
    title: string;
    fullStory: string;
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
    highlights?: string[];
    skills?: string[];
    experience: {
      id: string;
      title: string;
      company: string;
      location?: string;
      dateRange: string;
      startDate?: string;
      endDate?: string;
      currentRole?: boolean;
    };
  }>;
  skills: string[];
  education?: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    year?: string;
  }>;
  options: ExportOptions;
}

export async function getTalentStoryPayload(
  userId: string,
  options: ExportOptions = {}
): Promise<TalentStoryPayload> {
  try {
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;

    const { data: stories, error: storiesError } = await supabaseServer
      .from('stories')
      .select(`
        *,
        experience:experiences(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (storiesError) throw storiesError;

    const { data: skills, error: skillsError } = await supabaseServer
      .from('skills')
      .select('name')
      .eq('user_id', userId);

    if (skillsError) throw skillsError;

    const { data: education } = await supabaseServer
      .from('education')
      .select('*')
      .eq('user_id', userId)
      .order('end_date', { ascending: false });

    const { data: certifications } = await supabaseServer
      .from('certifications')
      .select('*')
      .eq('user_id', userId)
      .order('issue_date', { ascending: false });

    const transformedStories = (stories || []).map((story: any) => ({
      id: story.id,
      title: story.title || '',
      fullStory: story.full_story || '',
      situation: story.situation,
      task: story.task,
      action: story.action,
      result: story.result,
      highlights: story.highlights || [],
      skills: story.skills || [],
      experience: {
        id: story.experience?.id || '',
        title: story.experience?.title || '',
        company: story.experience?.company || '',
        location: story.experience?.location,
        dateRange: formatDateRange(
          story.experience?.start_date,
          story.experience?.end_date,
          story.experience?.current_role
        ),
        startDate: story.experience?.start_date,
        endDate: story.experience?.end_date,
        currentRole: story.experience?.current_role,
      },
    }));

    return {
      user: {
        id: userId,
        name: profile.full_name || profile.name || 'Unknown',
        email: profile.email || '',
        title: profile.title,
        location: profile.location,
        summary: profile.summary,
        phone: profile.phone,
        linkedin: profile.linkedin_url,
        portfolio: profile.portfolio_url,
      },
      stories: transformedStories,
      skills: (skills || []).map((s: any) => s.name),
      education: (education || []).map((e: any) => ({
        degree: e.degree,
        institution: e.institution,
        year: e.end_date ? new Date(e.end_date).getFullYear().toString() : undefined,
      })),
      certifications: (certifications || []).map((c: any) => ({
        name: c.name,
        issuer: c.issuer,
        year: c.issue_date ? new Date(c.issue_date).getFullYear().toString() : undefined,
      })),
      options,
    };
  } catch (error) {
    console.error('Error fetching TalentStory payload:', error);
    throw new Error('Failed to fetch TalentStory data');
  }
}

function formatDateRange(
  startDate?: string,
  endDate?: string,
  isCurrent?: boolean
): string {
  if (!startDate) return '';
  
  const start = new Date(startDate).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  
  if (isCurrent) return `${start} - Present`;
  
  if (!endDate) return start;
  
  const end = new Date(endDate).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  
  return `${start} - ${end}`;
}

export function extractBulletsFromStory(story: string, maxBullets = 4): string[] {
  const lines = story.split('\n').filter((line) => line.trim());
  const bullets: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      bullets.push(trimmed.replace(/^[•\-*]\s*/, ''));
    }
  }
  
  return bullets.slice(0, maxBullets);
}
```

---

## FILE: src/services/pdfService.ts

```typescript
import puppeteer, { Browser, Page } from 'puppeteer';
import { renderTemplate } from './templateRenderer';
import type { TalentStoryPayload } from './exportService';

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  return browserInstance;
}

export async function htmlToPdfBuffer(
  html: string,
  options: {
    format?: 'A4' | 'Letter';
    printBackground?: boolean;
    margin?: { top?: string; bottom?: string; left?: string; right?: string };
  } = {}
): Promise<Buffer> {
  const browser = await getBrowser();
  let page: Page | null = null;

  try {
    page = await browser.newPage();
    
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await page.emulateMediaType('print');

    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      printBackground: options.printBackground ?? true,
      margin: options.margin || {
        top: '16mm',
        bottom: '16mm',
        left: '12mm',
        right: '12mm',
      },
      preferCSSPageSize: false,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  } finally {
    if (page) {
      await page.close();
    }
  }
}

export async function generatePdfFromPayload(
  payload: TalentStoryPayload,
  templateType: 'ats' | 'designer' = 'ats'
): Promise<Buffer> {
  const html = renderTemplate(templateType, payload);
  
  const pdfOptions = {
    format: payload.options.pageSize || 'A4',
    printBackground: templateType === 'designer',
    margin: {
      top: '16mm',
      bottom: '16mm',
      left: '12mm',
      right: '12mm',
    },
  } as const;

  return htmlToPdfBuffer(html, pdfOptions);
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
```

---

## FILE: src/services/templateRenderer.ts

```typescript
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import type { TalentStoryPayload } from './exportService';

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

function loadTemplate(templateName: string): HandlebarsTemplateDelegate {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  const templatePath = path.join(
    process.cwd(),
    'src',
    'templates',
    'export',
    `${templateName}.html`
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const compiled = Handlebars.compile(templateSource);
  
  templateCache.set(templateName, compiled);
  return compiled;
}

function loadTemplateCSS(templateName: string): string {
  const cssPath = path.join(
    process.cwd(),
    'src',
    'templates',
    'export',
    `${templateName}.css`
  );

  try {
    return fs.readFileSync(cssPath, 'utf-8');
  } catch {
    return '';
  }
}

Handlebars.registerHelper('formatDate', (date: string) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
});

Handlebars.registerHelper('stripHtml', (html: string) => {
  return html?.replace(/<[^>]*>/g, '') || '';
});

Handlebars.registerHelper('truncate', (text: string, length: number) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + '...';
});

export function renderTemplate(
  templateType: 'ats' | 'designer' | 'resume',
  payload: TalentStoryPayload
): string {
  const templateName = `${templateType}-template`;
  const template = loadTemplate(templateName);
  const css = loadTemplateCSS(templateName);

  const context = {
    ...payload,
    css,
    currentYear: new Date().getFullYear(),
  };

  return template(context);
}
```

---

## Continue reading next section...

**Note:** Due to message length limits, this file contains the first 3 service files. 
The complete package with all 20+ files is available in the SPRINT_2.5_COMPLETE_CODE.md file (to be created next).

To implement Sprint 2.5:
1. Follow SPRINT_2.5_IMPLEMENTATION_GUIDE.md for setup
2. Use this file for copying code
3. Refer to individual sections for each file

Total files to create:
- 7 Service files
- 6 API route files  
- 2 Template files (HTML + CSS)
- 2 Component files

All files follow the Careersie coding standards and integrate with existing Supabase infrastructure.
