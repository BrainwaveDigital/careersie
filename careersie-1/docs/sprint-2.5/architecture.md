# Architecture of the Export System

## Overview

The export system for TalentStory is designed to provide users with reliable exports of their profiles in multiple formats, including PDF, DOCX, LinkedIn text, Seek text, and plain text. The architecture is structured to ensure scalability, maintainability, and ease of use.

## High-Level Architecture

```
Client (React)
  └─ Export UI / Preview → calls → Export API

Backend (Next.js / Express)
  ├─ /api/export/pdf      -> Puppeteer pipeline
  ├─ /api/export/docx     -> docx.js pipeline
  ├─ /api/export/linkedin  -> LinkedIn text formatter
  ├─ /api/export/seek      -> Seek text formatter
  ├─ /api/export/text      -> plain text formatter
  ├─ /api/export/history    -> log & fetch export history (Prisma)
  └─ services/
      ├─ exportService.ts   (aggregates user data)
      ├─ pdfService.ts      (handles PDF generation)
      ├─ docxService.ts     (handles DOCX generation)
      ├─ textFormatters.ts   (formats LinkedIn and Seek text)
      └─ historyService.ts   (manages export history)

Database (Postgres + Prisma)
  ├─ User (existing)
  ├─ Story (existing)
  ├─ Experience (existing)
  └─ ExportHistory (new)

Storage
  ├─ Local / S3 (for generated files)
```

## Components

### Client Side

- **Export UI**: A React-based interface that allows users to select export formats, configure settings, and preview their exports.
- **Export Modal**: A component that provides options for selecting the export format and settings.
- **Export History**: A component that displays the user's previous exports and allows for re-downloads.

### Backend Side

- **API Routes**: Each export format has a dedicated API route that processes requests and generates the corresponding file.
  - `/api/export/pdf`: Generates PDF files using Puppeteer.
  - `/api/export/docx`: Generates DOCX files using docx.js.
  - `/api/export/linkedin`: Formats user data for LinkedIn.
  - `/api/export/seek`: Formats user data for Seek.
  - `/api/export/text`: Returns plain text exports.
  - `/api/export/history`: Logs and retrieves export history.

- **Services**: 
  - **Export Service**: Aggregates user data and prepares it for export.
  - **PDF Service**: Handles the conversion of HTML templates to PDF.
  - **DOCX Service**: Generates DOCX files from user data.
  - **Text Formatters**: Contains functions for formatting data into LinkedIn and Seek formats.
  - **History Service**: Manages the logging and retrieval of export history.

### Database

- **ExportHistory Model**: A new model added to track export activities, including user ID, format, filename, file URL, and settings used during export.

### Storage

- **File Storage**: Generated files can be stored locally or in cloud storage (e.g., S3) for scalability and accessibility.

## Conclusion

This architecture provides a robust framework for exporting user profiles in various formats, ensuring that the system is efficient, user-friendly, and compliant with industry standards. The separation of concerns between the client and server, along with the use of services and a structured database model, allows for easy maintenance and future enhancements.