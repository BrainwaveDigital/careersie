// scripts/export-worker.js
import { getTalentStoryPayload } from '../apps/web/src/lib/services/exportService';
import { htmlToPdfBuffer } from '../apps/web/src/lib/services/pdfService';
import { generateDocx } from '../apps/web/src/lib/services/docxService';
import { formatAsLinkedIn, formatAsSeek } from '../apps/web/src/lib/services/textFormatters';
import { saveExportHistory } from '../apps/web/src/lib/services/historyService';
import { saveToStorage } from '../apps/web/src/lib/services/storageAdapter';

async function processExport(userId, format, options) {
  const payload = await getTalentStoryPayload(userId, options);
  let fileUrl;

  switch (format) {
    case 'pdf':
      const pdfBuffer = await htmlToPdfBuffer(payload.html, options);
      fileUrl = await saveToStorage(pdfBuffer, `export_${userId}.pdf`);
      break;
    case 'docx':
      const docxFile = await generateDocx(payload);
      fileUrl = await saveToStorage(docxFile.buffer, docxFile.filename);
      break;
    case 'linkedin':
      const linkedinText = formatAsLinkedIn(payload.user, payload.stories);
      fileUrl = await saveToStorage(Buffer.from(linkedinText), `export_${userId}.txt`);
      break;
    case 'seek':
      const seekText = formatAsSeek(payload.user, payload.stories);
      fileUrl = await saveToStorage(Buffer.from(seekText), `export_${userId}.txt`);
      break;
    case 'text':
      const plainText = payload.plainText; // Assume this is prepared in the payload
      fileUrl = await saveToStorage(Buffer.from(plainText), `export_${userId}.txt`);
      break;
    default:
      throw new Error('Unsupported export format');
  }

  await saveExportHistory({ userId, format, fileUrl, settings: options });
  return fileUrl;
}

export { processExport };