import type { NextApiRequest, NextApiResponse } from 'next';
import { listExportHistory } from '../../../lib/services/historyService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      const history = await listExportHistory(userId as string);
      res.status(200).json(history);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch export history' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}