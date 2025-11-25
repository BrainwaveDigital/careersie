import fs from 'fs/promises';
import path from 'path';

const EXPORTS_DIR = path.join(process.cwd(), 'public', 'exports');

/**
 * Ensure exports directory exists
 */
async function ensureExportsDir(): Promise<void> {
  try {
    await fs.access(EXPORTS_DIR);
  } catch {
    await fs.mkdir(EXPORTS_DIR, { recursive: true });
  }
}

/**
 * Save buffer to local storage
 * @returns Public URL path
 */
export async function saveBuffer(
  buffer: Buffer,
  filename: string,
  userId: string
): Promise<string> {
  await ensureExportsDir();

  const userDir = path.join(EXPORTS_DIR, userId);
  
  try {
    await fs.access(userDir);
  } catch {
    await fs.mkdir(userDir, { recursive: true });
  }

  const filePath = path.join(userDir, filename);
  await fs.writeFile(filePath, buffer);

  // Return public URL
  return `/exports/${userId}/${filename}`;
}

/**
 * Delete old export files (cleanup job)
 */
export async function cleanupOldExports(daysOld = 30): Promise<void> {
  try {
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;

    const users = await fs.readdir(EXPORTS_DIR);

    for (const userId of users) {
      const userDir = path.join(EXPORTS_DIR, userId);
      const files = await fs.readdir(userDir);

      for (const file of files) {
        const filePath = path.join(userDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          console.log(`Deleted old export: ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up old exports:', error);
  }
}
