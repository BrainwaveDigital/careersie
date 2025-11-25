import type { NextApiRequest, NextApiResponse } from 'next';
import { getExportJobStatus } from '../../lib/services/exportService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jobId } = req.query;

  if (!jobId || Array.isArray(jobId)) {
    return res.status(400).json({ error: 'Invalid job ID' });
  }

  try {
    const status = await getExportJobStatus(jobId);
    res.status(200).json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve job status' });
  }
}