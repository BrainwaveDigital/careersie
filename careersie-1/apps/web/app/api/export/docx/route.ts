import type { NextApiRequest, NextApiResponse } from 'next';
import { generateDocx } from '../../../lib/services/docxService';
import { getTalentStoryPayload } from '../../../lib/services/exportService';
import { saveExportHistory } from '../../../lib/services/historyService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, formatOptions } = req.body;
    const payload = await getTalentStoryPayload(userId, formatOptions);
    const { filename, path } = await generateDocx(payload);
    
    await saveExportHistory({ userId, format: 'docx', filename, fileUrl: path, settings: formatOptions });
    res.status(200).json({ fileUrl: path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
}