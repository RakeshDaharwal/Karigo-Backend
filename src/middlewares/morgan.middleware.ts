import morgan from 'morgan';
import { env } from '../config/env';
import { logInfo } from '../utils/logger.utils';

const getMorganFormat = () => {
  return env.NODE_ENV === 'production' ? 'combined' : 'tiny';
};

// Pipe HTTP request logs to the winston file logger instead of the console so
// the console stays readable for socket/chat logs. Requests are still recorded
// under logs/info.
export const morganRequestLogger = morgan(getMorganFormat(), {
  stream: { write: (message) => logInfo(message.trim()) },
});
