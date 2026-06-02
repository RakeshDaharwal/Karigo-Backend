import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { LOG_DIRS, LOG_RETENTION_DAYS, logInfo, logError } from './logger.utils';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const cleanDirectory = (dir: string) => {
  if (!fs.existsSync(dir)) return { scanned: 0, deleted: 0 };

  const cutoff = Date.now() - LOG_RETENTION_DAYS * MS_PER_DAY;
  const files = fs.readdirSync(dir);
  let deleted = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    } catch (err: any) {
      logError('logsCleanup: failed to process file', {
        file: filePath,
        error: err?.message,
      });
    }
  }

  return { scanned: files.length, deleted };
};

export const runLogsCleanup = () => {
  const info = cleanDirectory(LOG_DIRS.INFO_DIR);
  const error = cleanDirectory(LOG_DIRS.ERROR_DIR);
  logInfo('logsCleanup: completed', {
    retentionDays: LOG_RETENTION_DAYS,
    info,
    error,
  });
};

// Cron expression: every day at 12:00 PM (server local time).
export const startLogsCleanupCron = () => {
  cron.schedule('0 12 * * *', () => {
    try {
      runLogsCleanup();
    } catch (err: any) {
      logError('logsCleanup: cron run failed', { error: err?.message });
    }
  });

  logInfo('logsCleanup: cron scheduled', {
    schedule: '0 12 * * *',
    retentionDays: LOG_RETENTION_DAYS,
  });
};
