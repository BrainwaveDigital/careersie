import { createClient } from '@supabase/supabase-js';
import type { ExportOptions } from './exportService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface ExportHistoryRecord {
  id: string;
  userId: string;
  format: string;
  filename: string;
  fileUrl: string;
  settings?: ExportOptions;
  createdAt: Date;
}

/**
 * Save export history record
 */
export async function saveExportHistory(params: {
  userId: string;
  format: string;
  filename: string;
  fileUrl: string;
  settings?: ExportOptions;
}): Promise<void> {
  const { error } = await supabaseServer
    .from('export_history')
    .insert({
      user_id: params.userId,
      format: params.format,
      filename: params.filename,
      file_url: params.fileUrl,
      settings: params.settings || {},
    });

  if (error) {
    console.error('Error saving export history:', error);
    throw new Error('Failed to save export history');
  }
}

/**
 * List export history for user
 */
export async function listExportHistory(userId: string): Promise<ExportHistoryRecord[]> {
  const { data, error } = await supabaseServer
    .from('export_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching export history:', error);
    throw new Error('Failed to fetch export history');
  }

  return (data || []).map((record) => ({
    id: record.id,
    userId: record.user_id,
    format: record.format,
    filename: record.filename,
    fileUrl: record.file_url,
    settings: record.settings as ExportOptions,
    createdAt: new Date(record.created_at),
  }));
}
