import type { NextApiRequest, NextApiResponse } from 'next';
import { getTalentStoryPayload } from '../../lib/services/exportService';
import { htmlToPdfBuffer } from '../../lib/services/pdfService';
import { saveExportHistory } from '../../lib/services/historyService';
import { storageAdapter } from '../../lib/services/storageAdapter';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, formatOptions } = req.body;

  try {
    const payload = await getTalentStoryPayload(userId, formatOptions);
    const html = renderTemplate('resume', payload, formatOptions);
    const pdfBuffer = await htmlToPdfBuffer(html, formatOptions);
    const filename = `talentstory_${userId}_${Date.now()}.pdf`;
    const fileUrl = await storageAdapter.saveBuffer(pdfBuffer, filename);
    
    await saveExportHistory({ userId, format: 'pdf', filename, fileUrl, settings: formatOptions });
    
    res.status(200).json({ fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Export failed' });
  }
}

function renderTemplate(templateName: string, payload: any, options: any) {
  // Implement the logic to render the HTML template with the provided payload and options
  return ''; // Return the rendered HTML as a string
}