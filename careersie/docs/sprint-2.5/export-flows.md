# Export Flows for Sprint 2.5

This document outlines the various export flows and processes for the TalentStory application, detailing how users can export their talent stories in multiple formats.

## Overview of Export Formats

The application supports the following export formats:
- PDF (ATS-friendly and styled)
- DOCX
- LinkedIn text
- Seek-optimized text
- Plain text

## Export Process Flow

### 1. User Initiates Export

- The user opens the export modal from the Profile page.
- The user selects the desired export format (PDF, DOCX, LinkedIn, Seek, or Plain text).
- The user configures any additional settings (e.g., include stories, ATS mode).

### 2. Frontend Handling

- The frontend component `ExportModal.tsx` captures the user's selections.
- Upon submission, the frontend sends a request to the corresponding API route based on the selected format.

### 3. API Route Processing

Each export format has a dedicated API route that processes the request:

#### PDF Export
- **Route:** `/api/export/pdf`
- **Service:** `pdfService.ts`
- **Process:**
  - Fetch user data using `exportService.ts`.
  - Render the HTML template using the fetched data.
  - Convert the HTML to PDF using Puppeteer.
  - Save the generated PDF and log the export in `ExportHistory`.

#### DOCX Export
- **Route:** `/api/export/docx`
- **Service:** `docxService.ts`
- **Process:**
  - Fetch user data.
  - Format the content into a DOCX-compatible structure.
  - Save the generated DOCX and log the export.

#### LinkedIn Export
- **Route:** `/api/export/linkedin`
- **Service:** `textFormatters.ts`
- **Process:**
  - Fetch user data.
  - Format the data according to LinkedIn's requirements.
  - Return the formatted text to the user.

#### Seek Export
- **Route:** `/api/export/seek`
- **Service:** `textFormatters.ts`
- **Process:**
  - Fetch user data.
  - Format the data to meet Seek's requirements.
  - Return the formatted text to the user.

#### Plain Text Export
- **Route:** `/api/export/text`
- **Service:** `textFormatters.ts`
- **Process:**
  - Fetch user data.
  - Strip HTML and return clean text.

### 4. Export History Logging

- Each export action is logged in the `ExportHistory` model.
- Users can retrieve their export history through the `/api/export/history` route.

### 5. User Notification

- Once the export is complete, the user is notified via the frontend.
- A download link is provided for the generated file.

## Conclusion

The export flows for Sprint 2.5 provide a comprehensive solution for users to generate and download their talent stories in various formats. Each export format is handled through dedicated API routes, ensuring a smooth and efficient process.