
import winston from 'winston';
import path from 'path';

// Allow only a specific level
const levelFilter = (level: string) =>
  winston.format((info) => {
    return info.level === level ? info : false;
  })();

// JSON log format with optional meta
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    // Construct JSON object
    const log: Record<string, any> = {
      timestamp,
      level,
      message,
      ...meta, // spread extra fields like mobile, event, service
    };
    return JSON.stringify(log);
  })
);

const logger = winston.createLogger({
  format: logFormat,
  transports: [
    // INFO → only info
    new winston.transports.File({
      filename: path.join('logs', 'info.log'),
      format: winston.format.combine(levelFilter('info'), logFormat),
    }),

    // ERROR → only error
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      format: winston.format.combine(levelFilter('error'), logFormat),
    }),
  ],
});

// Console only in dev
// if (env.NODE_ENV !== 'production') {
//   logger.add(
//     new winston.transports.Console({
//       format: winston.format.combine(
//         winston.format.colorize(),
//         winston.format.simple()
//       ),
//     })
//   );
// }

// Helper functions allow meta data like service, event, mobile etc.
export const logInfo = (message: string, meta: Record<string, any> = {}) =>
  logger.info(message, meta);

export const logError = (message: string, meta: Record<string, any> = {}) =>
  logger.error(message, meta);

export default logger;
