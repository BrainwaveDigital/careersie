import type { NextApiRequest, NextApiResponse } from 'next';
import { getTalentStoryPayload } from '../../lib/services/exportService';
import { formatAsLinkedIn } from '../../lib/services/textFormatters';
import { saveExportHistory } from '../../lib/services/historyService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.body;
    const payload = await getTalentStoryPayload(userId);
    const linkedInText = formatAsLinkedIn(payload.user, payload.stories);
    
    const filename = `linkedin_${userId}_${Date.now()}.txt`;
    const fileUrl = await saveToStorage(linkedInText, filename); // Implement saveToStorage function to handle file saving

    await saveExportHistory({ userId, format: 'linkedin', filename, fileUrl });
    res.status(200).json({ fileUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
}

async function saveToStorage(content: string, filename: string) {
  // Implement the logic to save the content to local storage or cloud storage
  // Return the file URL after saving
}