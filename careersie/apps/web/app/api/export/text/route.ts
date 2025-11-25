import type { NextApiRequest, NextApiResponse } from 'next';
import { getTalentStoryPayload } from '../../lib/services/exportService';
import { formatAsPlainText } from '../../lib/services/textFormatters';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.body;
    const payload = await getTalentStoryPayload(userId);
    const plainText = formatAsPlainText(payload);
    
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(plainText);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
}