import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');
const INFO_DIR = path.join(LOGS_DIR, 'info');
const ERROR_DIR = path.join(LOGS_DIR, 'error');

export const LOG_RETENTION_DAYS = 7;
export const LOG_DIRS = { LOGS_DIR, INFO_DIR, ERROR_DIR };

const levelFilter = (level: string) =>
  winston.format((info) => (info.level === level ? info : false))();

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const log: Record<string, any> = {
      timestamp,
      level,
      message,
      ...meta,
    };
    return JSON.stringify(log);
  })
);

const dailyRotate = (dir: string, level: string) =>
  new winston.transports.DailyRotateFile({
    dirname: dir,
    filename: `${level}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,
    maxFiles: `${LOG_RETENTION_DAYS}d`,
    format: winston.format.combine(levelFilter(level), logFormat),
  });

const logger = winston.createLogger({
  format: logFormat,
  transports: [dailyRotate(INFO_DIR, 'info'), dailyRotate(ERROR_DIR, 'error')],
});

export const logInfo = (message: string, meta: Record<string, any> = {}) =>
  logger.info(message, meta);

export const logError = (message: string, meta: Record<string, any> = {}) =>
  logger.error(message, meta);

export default logger;
